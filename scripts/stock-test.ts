import assert from "node:assert/strict";
import {
  applyStockCommand,
  type StockCommand,
} from "../src/lib/stock-operations";
import type { Product, DeviceUnit, Party } from "../src/lib/erp-types";
import { makeDemoImei } from "../src/lib/identifiers";
const phone: Product = {
  id: "p",
  name: "Test phone",
  brand: "Test",
  category: "Smartphones",
  variant: "8/128",
  sku: "QA-PHONE",
  barcode: "",
  supplierCode: "A",
  purchaseCost: 100,
  wholesalePrice: 150,
  retailPrice: 200,
  stock: 2,
  tracking: "IMEI",
  hsn: "8517",
  gstRate: 18,
  status: "In stock",
};
const cable: Product = {
  ...phone,
  id: "a",
  name: "Test cable",
  sku: "QA-CABLE",
  tracking: "Quantity",
  stock: 5,
};
const device = (
  id: string,
  n: number,
  status: DeviceUnit["status"] = "In stock",
): DeviceUnit => ({
  id,
  productId: "p",
  imei1: makeDemoImei(n),
  imei2: makeDemoImei(n + 100),
  serialNumber: "",
  barcode: "LABEL-" + id,
  supplierCode: "A",
  purchaseCost: 100,
  status,
  receivedAt: "2026-10-01",
});
const parties: Party[] = ["A", "B"].map((code) => ({
  id: code,
  code,
  name: "Supplier " + code,
  phone: "",
  city: "",
  gstin: "",
  roles: ["Supplier"],
  receivable: 0,
  payable: 0,
}));
const ctx = {
  products: [phone, cable],
  devices: [
    device("1", 1),
    device("2", 2),
    { ...device("3", 3, "Sold"), invoiceNumber: "BILL-1" },
  ],
  parties,
  cart: [],
};
const change = (cmd: Partial<StockCommand>) =>
  applyStockCommand(ctx, {
    scope: "device",
    ids: ["1", "2"],
    action: "supplier",
    reason: "Corrected from delivery bill",
    supplierCode: "B",
    ...cmd,
  });
let r = change({});
assert.deepEqual(
  r.devices.map((d) => d.supplierCode),
  ["B", "B", "A"],
);
assert.equal(r.products[0].stock, 2);
assert.equal(r.audit.length, 2);
assert.equal(ctx.devices[0].supplierCode, "A");
r = change({ scope: "model", ids: ["p"], applyToUnits: false });
assert.equal(r.products[0].supplierCode, "B");
assert.equal(r.devices[0].supplierCode, "A");
r = change({ scope: "model", ids: ["p"], applyToUnits: true });
assert.deepEqual(
  r.devices.map((d) => d.supplierCode),
  ["B", "B", "A"],
);
r = change({ action: "remove" });
assert.equal(r.products[0].stock, 0);
assert.deepEqual(
  r.devices.map((d) => d.status),
  ["Removed", "Removed", "Sold"],
);
assert.equal(r.devices[0].imei2, ctx.devices[0].imei2);
assert.equal(ctx.products[0].stock, 2);
assert.throws(
  () => change({ action: "remove", ids: ["1", "3"] }),
  /Only available/,
);
assert.equal(ctx.devices[0].status, "In stock");
const held = applyStockCommand(
  { ...ctx, products: r.products, devices: r.devices },
  {
    scope: "device",
    ids: ["1"],
    action: "inspect",
    reason: "Found during physical count",
  },
);
assert.equal(held.devices[0].status, "Under inspection");
assert.equal(held.products[0].stock, 0);
assert.throws(
  () => change({ scope: "model", ids: ["p"], action: "adjust", quantity: 10 }),
  /exact units/,
);
r = change({ scope: "model", ids: ["a"], action: "adjust", quantity: 3 });
assert.equal(r.products[1].stock, 3);
assert.throws(
  () => change({ scope: "model", ids: ["a"], action: "adjust", quantity: -1 }),
  /whole number/,
);
assert.throws(
  () => change({ scope: "model", ids: ["p"], action: "archive" }),
  /Remove or reconcile/,
);
const zero = applyStockCommand(ctx, {
  scope: "model",
  ids: ["a"],
  action: "adjust",
  quantity: 0,
  reason: "Counted no cables on shelf",
});
const archived = applyStockCommand(
  { ...ctx, products: zero.products },
  {
    scope: "model",
    ids: ["a"],
    action: "archive",
    reason: "Discontinued accessory",
  },
);
assert.equal(archived.products[1].archived, true);
const restored = applyStockCommand(
  { ...ctx, products: archived.products },
  {
    scope: "model",
    ids: ["a"],
    action: "restore",
    reason: "Model available again",
  },
);
assert.equal(restored.products[1].archived, false);
assert.equal(restored.products[1].stock, 0);
assert.throws(
  () =>
    change({
      action: "edit",
      ids: ["1"],
      device: { imei2: ctx.devices[1].imei1 },
    }),
  /already assigned/,
);
assert.throws(
  () =>
    change({
      action: "edit",
      ids: ["1"],
      device: { imei1: "123456789012345" },
    }),
  /valid, distinct/,
);
assert.throws(
  () => change({ action: "edit", ids: ["3"], device: { purchaseCost: 50 } }),
  /Only available/,
);
assert.throws(
  () =>
    applyStockCommand(
      { ...ctx, cart: [{ productId: "p", deviceId: "1", qty: 1 }] },
      {
        scope: "device",
        action: "remove",
        ids: ["1"],
        reason: "Count correction",
      },
    ),
  /current bill/,
);
assert.throws(() => change({ reason: "" }), /Explain the change/);
assert.throws(() => change({ supplierCode: "MISSING" }), /known supplier/);
const afterSale = {
  ...ctx,
  devices: [
    { ...ctx.devices[0], invoiceNumber: "OLD-BILL" },
    ...ctx.devices.slice(1),
  ],
};
assert.throws(
  () =>
    applyStockCommand(afterSale, {
      scope: "device",
      action: "edit",
      ids: ["1"],
      reason: "Corrected box",
      device: { imei1: makeDemoImei(900) },
    }),
  /invoice history/,
);
r = change({
  scope: "model",
  ids: ["p"],
  action: "edit",
  product: {
    name: "Corrected model",
    retailPrice: 300,
    stock: 999,
    tracking: "Quantity",
  },
});
assert.equal(r.products[0].name, "Corrected model");
assert.equal(r.products[0].stock, 2);
assert.equal(r.products[0].tracking, "IMEI");
assert.equal(r.devices[0].purchaseCost, 100);
r = change({ action: "damage" });
assert.equal(r.products[0].stock, 0);
assert.equal(r.devices[0].status, "Damaged");
r = change({ action: "prices", cost: 199 });
assert.equal(r.devices[0].purchaseCost, 199);
assert.equal(r.devices[1].purchaseCost, 199);
assert.equal(r.products[0].purchaseCost, 100);
assert.throws(
  () =>
    change({
      scope: "model",
      ids: ["p"],
      action: "edit",
      product: { sku: "QA-CABLE" },
    }),
  /SKU is already used/,
);
console.log(
  "PASS model/device edits, supplier scope, batch atomicity, removal history, inspection holds, archive/restore, quantity guards, IMEI uniqueness and bill locks.",
);
