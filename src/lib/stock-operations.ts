import type { Product, DeviceUnit, Party } from "./erp-types";
import { isValidImei } from "./identifiers";
export type StockAudit = {
  id: string;
  at: string;
  scope: "model" | "device";
  targetId: string;
  label: string;
  action: string;
  reason: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
};
export type StockCommand = {
  scope: "model" | "device";
  ids: string[];
  action:
    | "edit"
    | "supplier"
    | "prices"
    | "adjust"
    | "remove"
    | "damage"
    | "inspect"
    | "archive"
    | "restore";
  reason: string;
  product?: Partial<Product>;
  device?: Partial<DeviceUnit>;
  supplierCode?: string;
  cost?: number;
  retail?: number;
  wholesale?: number;
  quantity?: number;
  applyToUnits?: boolean;
};
export type StockContext = {
  products: Product[];
  devices: DeviceUnit[];
  parties: Party[];
  cart: { productId: string; deviceId?: string; qty: number }[];
};
export function applyStockCommand(ctx: StockContext, command: StockCommand) {
  const fail = (message: string): never => {
    throw Error(message);
  };
  const reason = command.reason.trim();
  if (reason.length < 3 || reason.length > 500)
    fail("Explain the change in 3–500 characters.");
  const ids = [...new Set(command.ids)];
  if (!ids.length) fail("Select at least one record.");
  const products = ctx.products.map((p) => ({ ...p })),
    devices = ctx.devices.map((d) => ({ ...d }));
  const audit: StockAudit[] = [];
  const touched = new Set<string>();
  const supplier = (raw: string | undefined) => {
    const code = (raw || "").trim().toUpperCase();
    if (
      code &&
      !ctx.parties.some(
        (p) => p.roles.includes("Supplier") && p.code.toUpperCase() === code,
      )
    )
      fail(
        "Choose a known supplier code. Add a new supplier in Customers & Suppliers first.",
      );
    return code;
  };
  const price = (value: unknown, label: string) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
      fail(label + " must be zero or a positive number.");
    return value as number;
  };
  const record = (
    scope: "model" | "device",
    before: Product | DeviceUnit,
    after: Product | DeviceUnit,
    label: string,
  ) => {
    audit.push({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      scope,
      targetId: before.id,
      label,
      action: command.action,
      reason,
      before: { ...before },
      after: { ...after },
    });
  };
  if (command.scope === "model") {
    if (command.action === "edit" && ids.length !== 1)
      fail("Edit one product model at a time.");
    for (const id of ids) {
      const p = products.find((p) => p.id === id);
      if (!p) fail("A selected product no longer exists. Refresh the list.");
      const model = p!;
      const before = { ...model };
      if (model.archived && command.action !== "restore")
        fail("Restore an archived model before editing it.");
      if (command.action === "edit") {
        const patch = command.product || {};
        const name = (patch.name ?? model.name).trim(),
          sku = (patch.sku ?? model.sku).trim().toUpperCase(),
          barcode = (patch.barcode ?? model.barcode).trim();
        if (!name || !sku) fail("Product name and SKU are required.");
        if (
          products.some(
            (x) =>
              x.id !== id &&
              (x.sku.toUpperCase() === sku || x.barcode.toUpperCase() === sku),
          ) ||
          devices.some((d) =>
            [d.imei1, d.imei2, d.serialNumber, d.barcode].some(
              (v) => v && v.toUpperCase() === sku,
            ),
          )
        )
          fail(
            "This SKU is already used by another model or device identifier.",
          );
        if (
          barcode &&
          (products.some(
            (x) =>
              x.id !== id &&
              (x.barcode.toUpperCase() === barcode.toUpperCase() ||
                x.sku.toUpperCase() === barcode.toUpperCase()),
          ) ||
            devices.some((d) =>
              [d.imei1, d.imei2, d.serialNumber, d.barcode].some(
                (v) => v && v.toUpperCase() === barcode.toUpperCase(),
              ),
            ))
        )
          fail("This barcode is already used by another record.");
        const gst = patch.gstRate ?? model.gstRate;
        if (!Number.isFinite(gst) || gst < 0 || gst > 100)
          fail("GST must be between 0 and 100.");
        Object.assign(model, {
          name,
          sku,
          barcode,
          brand: (patch.brand ?? model.brand).trim(),
          variant: (patch.variant ?? model.variant).trim(),
          category: patch.category ?? model.category,
          hsn: (patch.hsn ?? model.hsn).trim(),
          gstRate: gst,
          purchaseCost: price(
            patch.purchaseCost ?? model.purchaseCost,
            "Purchase cost",
          ),
          retailPrice: price(
            patch.retailPrice ?? model.retailPrice,
            "Retail price",
          ),
          wholesalePrice: price(
            patch.wholesalePrice ?? model.wholesalePrice,
            "Wholesale price",
          ),
          supplierCode: supplier(patch.supplierCode ?? model.supplierCode),
        });
      } else if (command.action === "supplier")
        model.supplierCode = supplier(command.supplierCode);
      else if (command.action === "prices") {
        if (command.retail === undefined && command.wholesale === undefined)
          fail("Enter at least one selling price.");
        if (command.retail !== undefined)
          model.retailPrice = price(command.retail, "Retail price");
        if (command.wholesale !== undefined)
          model.wholesalePrice = price(command.wholesale, "Wholesale price");
      } else if (command.action === "adjust") {
        if (model.tracking !== "Quantity")
          fail(
            "Phone / serial stock comes from exact units. Select handsets to remove, or receive them with identifiers.",
          );
        if (!Number.isInteger(command.quantity) || command.quantity! < 0)
          fail("Counted quantity must be a whole number of zero or more.");
        const pending = ctx.cart
          .filter((l) => l.productId === id)
          .reduce((n, l) => n + l.qty, 0);
        if (command.quantity! < pending)
          fail(
            "The current bill uses more units than this count. Clear or correct the bill first.",
          );
        model.stock = command.quantity!;
        model.status =
          model.stock === 0
            ? "Out of stock"
            : model.stock <= 5
              ? "Low stock"
              : "In stock";
      } else if (command.action === "archive") {
        if (
          model.stock !== 0 ||
          devices.some((d) => d.productId === id && ["In stock", "Needs identification"].includes(d.status))
        )
          fail(
            "Remove or reconcile available stock before archiving this model.",
          );
        if (ctx.cart.some((l) => l.productId === id))
          fail("Remove this model from the current bill before archiving.");
        model.archived = true;
      } else if (command.action === "restore") {
        if (!model.archived) fail("This model is already active.");
        model.archived = false;
      } else fail("This action is not supported for product models.");
      record("model", before, model, model.name + " · " + model.sku);
      if (
        command.applyToUnits &&
        (command.action === "supplier" || command.action === "edit")
      ) {
        for (const d of devices.filter(
          (d) => d.productId === id && d.status === "In stock",
        )) {
          if (ctx.cart.some((l) => l.deviceId === d.id))
            fail(
              "An affected handset is in the current bill. Remove it from the bill before changing its supplier.",
            );
          const previous = { ...d };
          d.supplierCode = model.supplierCode;
          record("device", previous, d, d.imei1 || d.serialNumber || d.barcode);
        }
      }
    }
  } else {
    if (command.action === "edit" && ids.length !== 1)
      fail("Edit one physical device at a time.");
    for (const id of ids) {
      const found = devices.find((d) => d.id === id);
      if (!found) fail("A selected device no longer exists. Refresh the list.");
      const d = found!;
      const model = products.find((p) => p.id === d.productId);
      if (!model) fail("This device has no product model.");
      const before = { ...d };
      if (ctx.cart.some((l) => l.deviceId === id))
        fail(
          "A selected handset is in the current bill. Remove it from the bill before changing stock.",
        );
      if (command.action === "inspect") {
        if (d.status !== "Removed" && d.status !== "Damaged")
          fail(
            "Only removed or damaged devices can be sent to inspection from here.",
          );
        if (model!.archived)
          fail(
            "Restore the product model before sending this unit to inspection.",
          );
        d.status = "Under inspection";
      } else {
        if (d.status !== "In stock" && d.status !== "Needs identification")
          fail(
            "Only available handsets can be edited, removed or marked damaged. Sold / returned records remain read-only.",
          );
        if (command.action === "supplier")
          d.supplierCode = supplier(command.supplierCode);
        else if (command.action === "prices")
          d.purchaseCost = price(command.cost, "Unit purchase cost");
        else if (command.action === "remove") d.status = "Removed";
        else if (command.action === "damage") d.status = "Damaged";
        else if (command.action === "edit") {
          const patch = command.device || {};
          const first = (patch.imei1 ?? d.imei1).trim(),
            second = (patch.imei2 ?? d.imei2).trim(),
            serial = (patch.serialNumber ?? d.serialNumber).trim(),
            barcode = (patch.barcode ?? d.barcode).trim();
          if (
            d.invoiceNumber &&
            (first !== d.imei1 ||
              second !== d.imei2 ||
              serial !== d.serialNumber)
          )
            fail(
              "This unit has an invoice history. Its device identity cannot be rewritten here.",
            );
          if (
            model!.tracking === "IMEI" &&
            (!isValidImei(first) ||
              (second && !isValidImei(second)) ||
              first === second)
          )
            fail(
              "Use valid, distinct 15-digit IMEIs with correct check digits.",
            );
          if (model!.tracking === "Serial" && !serial)
            fail("Enter a serial number for this unit.");
          const values = [first, second, serial, barcode]
            .filter(Boolean)
            .map((v) => v.toUpperCase());
          if (
            devices.some(
              (other) =>
                other.id !== id &&
                [
                  other.imei1,
                  other.imei2,
                  other.serialNumber,
                  other.barcode,
                ].some((v) => v && values.includes(v.toUpperCase())),
            )
          )
            fail(
              "A device identifier is already assigned to another handset, including a removed or sold one.",
            );
          if (
            products.some((p) =>
              [p.sku, p.barcode].some(
                (v) => v && values.includes(v.toUpperCase()),
              ),
            )
          )
            fail("A device identifier conflicts with a model SKU or barcode.");
          if (d.status === "Needs identification") d.status = "Under inspection";
          Object.assign(d, {
            imei1: first,
            imei2: second,
            serialNumber: serial,
            barcode,
            purchaseCost: price(
              patch.purchaseCost ?? d.purchaseCost,
              "Unit purchase cost",
            ),
            supplierCode: supplier(patch.supplierCode ?? d.supplierCode),
          });
        } else fail("This action is not supported for devices.");
      }
      touched.add(d.productId);
      record("device", before, d, d.imei1 || d.serialNumber || d.barcode);
    }
  }
  for (const p of products) {
    if (touched.has(p.id) && p.tracking !== "Quantity") {
      p.stock = devices.filter(
        (d) => d.productId === p.id && d.status === "In stock",
      ).length;
      p.status =
        p.stock === 0
          ? "Out of stock"
          : p.stock <= 5
            ? "Low stock"
            : "In stock";
    }
  }
  return { products, devices, audit };
}
