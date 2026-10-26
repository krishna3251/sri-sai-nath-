import Papa from "papaparse";
import type { Product, DeviceUnit, Party } from "./erp-types";
import { isValidImei, splitIdentifiers } from "./identifiers";
export const columns = [
  "sku",
  "name",
  "brand",
  "variant",
  "tracking",
  "quantity",
  "purchase_cost",
  "retail_price",
  "wholesale_price",
  "party_code",
  "imei1",
  "imei2",
  "serial_number",
  "hsn",
  "gst_rate",
] as const;
export type ImportRow = Record<(typeof columns)[number], string>;
export type ImportMode = "catalogue" | "receive";
export const blankRow = (): ImportRow =>
  Object.fromEntries(columns.map((k) => [k, ""])) as ImportRow;
export function parseCsv(text: string): ImportRow[] {
  if (text.length > 2_000_000) throw Error("Use a file smaller than 2 MB.");
  const result = Papa.parse<Record<string, string>>(
    text.replace(/^\uFEFF/, ""),
    {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim().toLowerCase(),
    },
  );
  if (result.errors.length)
    throw Error("CSV format: " + result.errors[0].message);
  if (!result.meta.fields?.includes("name"))
    throw Error(
      "The CSV needs a name column. Download the template for the exact headings.",
    );
  if (result.data.length > 1000)
    throw Error("Import no more than 1,000 rows at once.");
  return result.data.map((r) => ({
    ...blankRow(),
    ...Object.fromEntries(columns.map((k) => [k, String(r[k] ?? "").trim()])),
  }));
}
export function parseWhatsApp(text: string): ImportRow[] {
  if (text.length > 2_000_000) throw Error("Paste less than 2 MB of text.");
  let brand = "";
  const rows: ImportRow[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw
      .replace(/\*/g, "")
      .replace(/^\s*[•●\-]\s*/, "")
      .trim();
    if (!line) continue;
    if (
      /^(vivo|oneplus|realme|oppo|iqoo|moto|motorola|poco|mi|xiaomi|redmi|samsung|nothing|google|itel|infinix|lava|hmd|nokia|apple|accessories)\s*:?$/i.test(
        line,
      )
    ) {
      brand = line.replace(/:$/, "");
      continue;
    }
    const parts = line.split("|").map((v) => v.trim());
    const r = blankRow();
    r.name = parts.shift() || "";
    r.brand = brand;
    r.tracking = brand.toLowerCase() === "accessories" ? "Quantity" : "IMEI";
    const aliases: Record<string, keyof ImportRow> = {
      qty: "quantity",
      cost: "purchase_cost",
      price: "retail_price",
      retail: "retail_price",
      wholesale: "wholesale_price",
      party: "party_code",
      supplier: "party_code",
      serial: "serial_number",
      gst: "gst_rate",
    };
    for (const part of parts) {
      const m = part.match(/^([\w ]+)\s*[:=]\s*(.*)$/);
      if (!m) continue;
      const key =
        aliases[m[1].trim().toLowerCase()] || m[1].trim().toLowerCase();
      if (columns.includes(key as keyof ImportRow))
        r[key as keyof ImportRow] = m[2].trim();
    }
    const variant = r.name.match(/\b\d+\s*\/\s*\d+\s*(?:gb|tb)?\b/i);
    if (!r.variant && variant) {
      r.variant = variant[0];
      r.name = r.name.replace(variant[0], "").trim();
    }
    const qty = r.name.match(/(?:\s+[x×]\s*(\d+)|\s+qty\s*[:=]\s*(\d+))\s*$/i);
    if (qty) {
      r.quantity = qty[1] || qty[2];
      r.name = r.name.slice(0, qty.index).trim();
    }
    if (!r.brand) {
      const first = r.name.split(" ")[0];
      if (
        /^(vivo|oneplus|realme|oppo|iqoo|moto|poco|redmi|samsung|nothing|google|itel|infinix|lava|hmd|nokia|apple)$/i.test(
          first,
        )
      )
        r.brand = first;
    }
    r.sku =
      r.sku ||
      [r.brand, r.name, r.variant]
        .join("-")
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 64);
    rows.push(r);
  }
  if (rows.length > 1000)
    throw Error("Import no more than 1,000 rows at once.");
  return rows;
}
export const amount = (v: string) =>
  v.trim() === "" ? null : Number(v.replace(/[₹,\s]/g, ""));
export type ImportContext = {
  products: Product[];
  devices: DeviceUnit[];
  parties: Party[];
};
export type ImportOptions = {
  mode: ImportMode;
  partyCode: string;
  supplierName: string;
  reference: string;
  updatePrices: boolean;
};
export function prepareImport(
  rows: ImportRow[],
  ctx: ImportContext,
  options: ImportOptions,
) {
  const products = ctx.products.map((p) => ({ ...p })),
    devices = [...ctx.devices],
    parties = [...ctx.parties];
  const errors: string[] = [];
  let received = 0,
    created = 0,
    updated = 0,
    totalCost = 0;
  const ids = new Set(
    devices.flatMap((d) =>
      [d.imei1, d.imei2, d.serialNumber]
        .filter(Boolean)
        .map((x) => x.toUpperCase()),
    ),
  );
  const defaultCode = options.partyCode.trim().toUpperCase();
  if (!rows.length) errors.push("Add at least one row.");
  if (options.mode === "receive" && !options.reference.trim())
    errors.push(
      "Enter a supplier bill / delivery reference before receiving stock.",
    );
  if (
    defaultCode &&
    options.supplierName.trim() &&
    !parties.some((p) => p.code.toUpperCase() === defaultCode)
  ) {
    parties.push({
      id: crypto.randomUUID(),
      code: defaultCode,
      name: options.supplierName.trim(),
      phone: "",
      gstin: "",
      city: "",
      roles: ["Supplier"],
      receivable: 0,
      payable: 0,
    });
  }
  rows.forEach((r, index) => {
    const issue = (message: string) =>
      errors.push(`Row ${index + 1}: ${message}`);
    const sku = r.sku.trim().toUpperCase(),
      tracking = r.tracking.trim().toLowerCase();
    const track =
      tracking === "quantity"
        ? "Quantity"
        : tracking === "serial"
          ? "Serial"
          : tracking === "imei"
            ? "IMEI"
            : null;
    const cost = amount(r.purchase_cost),
      retail = amount(r.retail_price),
      wholesale = amount(r.wholesale_price),
      gst = amount(r.gst_rate) ?? 18;
    const qty = amount(r.quantity);
    if (!r.name.trim() || !sku) {
      issue("Product name and SKU are required.");
      return;
    }
    if (!track) {
      issue("Tracking must be IMEI, Serial or Quantity.");
      return;
    }
    if (
      [cost, retail, wholesale].some(
        (v) => v !== null && (!Number.isFinite(v) || v < 0),
      ) ||
      !Number.isFinite(gst) ||
      gst < 0 ||
      gst > 100
    ) {
      issue("Use non-negative prices and GST from 0 to 100.");
      return;
    }
    let p = products.find((p) => p.sku.toUpperCase() === sku);
    if (p?.archived) {
      issue(
        "Restore this archived SKU in Stock Manager before receiving or updating it.",
      );
      return;
    }
    if (
      p &&
      (p.name.trim().toLowerCase() !== r.name.trim().toLowerCase() ||
        (p.variant &&
          r.variant &&
          p.variant.trim().toLowerCase() !== r.variant.trim().toLowerCase()))
    ) {
      issue(
        "This SKU belongs to another model / variant. Correct the SKU before importing.",
      );
      return;
    }
    if (p && p.tracking !== track) {
      issue(
        "This SKU already uses " +
          p.tracking +
          " tracking. Use its existing tracking or a different SKU.",
      );
      return;
    }
    const code = (r.party_code || defaultCode).trim().toUpperCase();
    if (
      options.mode === "receive" &&
      (!code ||
        !parties.some(
          (p) => p.code.toUpperCase() === code && p.roles.includes("Supplier"),
        ))
    ) {
      issue(
        "Select an existing supplier code, or enter the default supplier name to create it.",
      );
      return;
    }
    if (
      options.mode === "receive" &&
      (!Number.isInteger(qty) || qty === null || qty <= 0)
    ) {
      issue("Quantity is missing or is not a positive whole number.");
      return;
    }
    if (
      options.mode === "receive" &&
      (cost === null || retail === null || wholesale === null)
    ) {
      issue("Fill purchase cost, retail price and wholesale price.");
      return;
    }
    const first = splitIdentifiers(r.imei1),
      second = splitIdentifiers(r.imei2),
      serial = splitIdentifiers(r.serial_number);
    if (options.mode === "receive" && track !== "Quantity") {
      const primary = track === "IMEI" ? first : serial;
      if (primary.length !== qty) {
        issue(
          `Enter exactly ${qty} ${track === "IMEI" ? "IMEI 1 values" : "serial numbers"}; separate them with semicolons.`,
        );
        return;
      }
      if (
        track === "IMEI" &&
        (first.some((v) => !isValidImei(v)) ||
          second.some((v) => !isValidImei(v)))
      ) {
        issue("Each IMEI must have 15 digits and a valid checksum.");
        return;
      }
      if (track === "IMEI" && second.length && second.length !== qty) {
        issue(
          "IMEI 2 must be empty or contain one value per phone, in matching order.",
        );
        return;
      }
      const all = track === "IMEI" ? [...first, ...second] : serial;
      if (
        new Set(all.map((x) => x.toUpperCase())).size !== all.length ||
        all.some((x) => ids.has(x.toUpperCase()))
      ) {
        issue(
          "Duplicate device identifier found, including IMEI 1 / IMEI 2 across rows.",
        );
        return;
      }
      all.forEach((x) => ids.add(x.toUpperCase()));
    }
    if (!p) {
      p = {
        id: crypto.randomUUID(),
        name: r.name.trim(),
        sku,
        brand: r.brand.trim(),
        category: track === "Quantity" ? "Accessories" : "Smartphones",
        variant: r.variant.trim(),
        barcode: "",
        supplierCode: code,
        purchaseCost: cost ?? 0,
        retailPrice: retail ?? 0,
        wholesalePrice: wholesale ?? 0,
        tracking: track,
        stock: 0,
        hsn: r.hsn.trim() || (track === "Quantity" ? "8504" : "8517"),
        gstRate: gst,
        status: "Out of stock",
      };
      products.push(p);
      created++;
    } else updated++;
    if (options.updatePrices) {
      if (retail !== null) p.retailPrice = retail;
      if (wholesale !== null) p.wholesalePrice = wholesale;
    }
    if (options.mode === "receive") {
      const count = qty!;
      p.stock += count;
      p.purchaseCost = cost!;
      p.status = p.stock <= 5 ? "Low stock" : "In stock";
      received += count;
      totalCost += count * cost!;
      if (track !== "Quantity")
        for (let i = 0; i < count; i++)
          devices.push({
            id: crypto.randomUUID(),
            productId: p.id,
            imei1: track === "IMEI" ? first[i] : "",
            imei2: track === "IMEI" ? second[i] || "" : "",
            serialNumber: track === "Serial" ? serial[i] : "",
            barcode: "SSM-" + crypto.randomUUID(),
            supplierCode: code,
            purchaseCost: cost!,
            status: "In stock",
            receivedAt: new Date().toLocaleDateString("en-CA", {
              timeZone: "Asia/Kolkata",
            }),
            receivingReference: options.reference.trim(),
          });
    }
  });
  return {
    products,
    devices,
    parties,
    errors,
    received,
    created,
    updated,
    totalCost,
  };
}
export function toCsv(
  rows: Record<string, unknown>[],
  fields?: readonly string[],
) {
  const safe = rows.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [
        k,
        typeof v === "string" && /^[=+\-@\t\r]/.test(v) ? "'" + v : v,
      ]),
    ),
  );
  return Papa.unparse(safe, { columns: fields ? [...fields] : undefined });
}
export function downloadText(
  name: string,
  text: string,
  type = "text/csv;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
