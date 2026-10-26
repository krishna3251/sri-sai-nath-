import assert from "node:assert/strict";
import {
  parseWhatsApp,
  parseCsv,
  prepareImport,
  toCsv,
  suggestedImportMode,
} from "../src/lib/stock-import";
import { makeDemoImei } from "../src/lib/identifiers";
const empty = { products: [], devices: [], parties: [] };
const opts = {
  mode: "receive" as const,
  partyCode: "SUP01",
  supplierName: "Test supplier",
  reference: "TEST-001",
  updatePrices: false,
};
const rows = parseWhatsApp(
  "Samsung\nA07 4/64 | qty: 2 | cost: 8500 | retail: 9999 | wholesale: 9200",
);
assert.equal(rows[0].variant, "4/64");
assert.equal(rows[0].quantity, "2");
assert.equal(rows[0].purchase_cost, "8500");
assert.equal(parseWhatsApp("Samsung\nA07 4/64")[0].quantity, "");
let result = prepareImport(rows, empty, opts);
assert.deepEqual(result.errors, []);
assert.equal(result.pending, 2);
assert.equal(result.products[0].stock, 0);
assert.ok(result.devices.every((d) => d.status === "Needs identification" && !d.imei1));
assert.deepEqual(empty, { products: [], devices: [], parties: [] });
rows[0].imei1 = [makeDemoImei(900000), makeDemoImei(900001)].join(";");
rows[0].imei2 = [makeDemoImei(900002), makeDemoImei(900003)].join(";");
result = prepareImport(rows, empty, opts);
assert.deepEqual(result.errors, []);
assert.equal(result.received, 2);
assert.equal(result.products[0].stock, 2);
assert.equal(result.devices[1].imei2, makeDemoImei(900003));
assert.ok(
  prepareImport(rows, result, opts).errors.some((x) => x.includes("Duplicate")),
);
const dup = structuredClone(rows);
dup[0].imei2 = makeDemoImei(900000) + ";" + makeDemoImei(900004);
assert.ok(
  prepareImport(dup, empty, opts).errors.some((x) => x.includes("Duplicate")),
);
const catalogue = prepareImport(parseWhatsApp("Samsung\nA07 4/64"), empty, {
  ...opts,
  mode: "catalogue",
});
assert.deepEqual(catalogue.errors, []);
assert.equal(catalogue.products[0].stock, 0);
assert.equal(catalogue.devices.length, 0);
const accessory = parseCsv(
  "sku,name,tracking,quantity,purchase_cost,retail_price,wholesale_price\nCABLE,USB Cable,Quantity,10,50,99,70",
);
assert.equal(prepareImport(accessory, empty, opts).received, 10);
assert.throws(() => parseCsv("sku,brand\nx,y"), /name column/);
assert.throws(() => parseCsv('name,sku\n"bad,unterminated'), /CSV format/);
assert.match(toCsv([{ name: "=1+1" }]), /'=1\+1/);
console.log(
  "PASS WhatsApp/CSV parsing, missing quantity/IMEI safeguards, catalogue-only mode, atomic preview, dual IMEIs, duplicates, accessories and safe CSV exports.",
);

const optional = { ...opts, partyCode: "", supplierName: "" };
const pendingRows = parseWhatsApp("Samsung\nPending phone 8/128 | qty: 2 | cost: 100");
const pending = prepareImport(pendingRows, empty, optional);
assert.deepEqual(pending.errors, []);
assert.equal(pending.pending, 2);
assert.equal(pending.parties.length, 0);
assert.equal(pending.devices[0].supplierCode, "");
assert.equal(pending.products[0].stock, 0);
assert.equal(suggestedImportMode(parseCsv("sku,name,tracking\nPHONE,Phone,IMEI")), "catalogue");
assert.equal(suggestedImportMode(pendingRows), "receive");
pendingRows[0].imei1 = makeDemoImei(910000);
const partial = prepareImport(pendingRows, empty, optional);
assert.deepEqual(partial.errors, []);
assert.equal(partial.pending, 1);
assert.equal(partial.products[0].stock, 1);
pendingRows[0].imei1 = "123";
assert.ok(prepareImport(pendingRows, empty, optional).errors.some((e) => e.includes("checksum")));
const serialRows = parseWhatsApp("Serial device | tracking: Serial | qty: 2 | cost: 10");
assert.equal(prepareImport(serialRows, empty, optional).pending, 2);
serialRows[0].serial_number = "SER-1;ser-1";
assert.ok(prepareImport(serialRows, empty, optional).errors.some((e) => e.includes("Duplicate")));
assert.equal(parseWhatsApp("Samsung\nA07 4/64 @8,500")[0].purchase_cost, "8500");
console.log("PASS optional supplier/IMEI/serial, pending counts, partial identification, catalogue detection, malformed and duplicate identifiers.");
