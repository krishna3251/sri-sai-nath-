"use client";
import { useMemo, useState } from "react";
import {
  Archive,
  ArrowRight,
  CheckSquare,
  Download,
  History,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Smartphone,
  X,
} from "lucide-react";
import type { Product, DeviceUnit, Party } from "@/lib/erp-types";
import type { StockAudit, StockCommand } from "@/lib/stock-operations";
import { downloadText, toCsv } from "@/lib/stock-import";
import { useDialogFocus } from "./guide";
type Props = {
  products: Product[];
  devices: DeviceUnit[];
  parties: Party[];
  audit: StockAudit[];
  search: string;
  setSearch: (s: string) => void;
  category: string;
  setCategory: (s: string) => void;
  addProduct: () => void;
  viewProduct: (id: string) => void;
  apply: (command: StockCommand) => { error?: string; message?: string };
};
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);
const statuses = [
  "In stock",
  "Sold",
  "Under inspection",
  "Damaged",
  "Removed",
  "Returned to supplier",
];
export default function StockManager(p: Props) {
  const [tab, setTab] = useState<"models" | "devices" | "history">("models"),
    [supplier, setSupplier] = useState("All"),
    [availability, setAvailability] = useState("Active"),
    [deviceStatus, setDeviceStatus] = useState("In stock"),
    [sort, setSort] = useState("name"),
    [selected, setSelected] = useState<string[]>([]),
    [command, setCommand] = useState<StockCommand | null>(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const modelById = useMemo(
    () => new Map(p.products.map((x) => [x.id, x])),
    [p.products],
  );
  const matchingDeviceModels = useMemo(
    () =>
      new Set(
        p.devices
          .filter((d) =>
            [d.imei1, d.imei2, d.serialNumber, d.barcode, d.supplierCode].some(
              (v) => v && v.toLowerCase().includes(p.search.toLowerCase()),
            ),
          )
          .map((d) => d.productId),
      ),
    [p.devices, p.search],
  );
  const models = useMemo(
    () =>
      p.products
        .filter(
          (x) =>
            (p.category === "All" || x.category === p.category) &&
            (supplier === "All" || x.supplierCode === supplier) &&
            (availability === "Archived"
              ? x.archived
              : availability === "All"
                ? true
                : availability === "Low stock"
                  ? !x.archived && x.stock <= 5
                  : !x.archived) &&
            ([x.name, x.sku, x.brand, x.variant, x.barcode, x.supplierCode]
              .join(" ")
              .toLowerCase()
              .includes(p.search.toLowerCase()) ||
              matchingDeviceModels.has(x.id)),
        )
        .sort((a, b) =>
          sort === "stock"
            ? a.stock - b.stock
            : sort === "retail"
              ? a.retailPrice - b.retailPrice
              : a.name.localeCompare(b.name) || a.sku.localeCompare(b.sku),
        ),
    [
      p.products,
      p.search,
      p.category,
      supplier,
      availability,
      sort,
      matchingDeviceModels,
    ],
  );
  const deviceRows = useMemo(
    () =>
      p.devices
        .filter((d) => {
          const model = modelById.get(d.productId);
          return (
            (deviceStatus === "All" || d.status === deviceStatus) &&
            (supplier === "All" || d.supplierCode === supplier) &&
            (p.category === "All" || model?.category === p.category) &&
            [
              d.imei1,
              d.imei2,
              d.serialNumber,
              d.barcode,
              d.supplierCode,
              model?.name,
              model?.sku,
              model?.variant,
            ]
              .join(" ")
              .toLowerCase()
              .includes(p.search.toLowerCase())
          );
        })
        .sort((a, b) =>
          sort === "cost"
            ? a.purchaseCost - b.purchaseCost
            : (modelById.get(a.productId)?.name || "").localeCompare(
                modelById.get(b.productId)?.name || "",
              ) || a.imei1.localeCompare(b.imei1),
        ),
    [
      p.devices,
      p.products,
      modelById,
      deviceStatus,
      supplier,
      p.category,
      p.search,
      sort,
    ],
  );
  const visibleIds = (tab === "models" ? models : deviceRows).map((x) => x.id);
  const picked = selected.filter((id) => visibleIds.includes(id));
  const allPicked =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const clear = () => {
    setSelected([]);
    setMessage("");
    setError("");
  };
  function open(action: StockCommand["action"], ids = picked) {
    setError("");
    setMessage("");
    setCommand({
      scope: tab === "models" ? "model" : "device",
      action,
      ids,
      reason: "",
    });
  }
  function exportSelected() {
    if (tab === "models")
      downloadText(
        "sri-sai-selected-models.csv",
        toCsv(models.filter((x) => picked.includes(x.id))),
      );
    else
      downloadText(
        "sri-sai-selected-devices.csv",
        toCsv(
          deviceRows
            .filter((x) => picked.includes(x.id))
            .map((d) => ({
              ...d,
              product: modelById.get(d.productId)?.name,
              sku: modelById.get(d.productId)?.sku,
            })),
        ),
      );
  }
  const select = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  return (
    <section className="screen stock-manager">
      <div className="page-heading">
        <div>
          <span className="eyebrow">STOCK MANAGER / YOUR SHOP FLOOR</span>
          <h1>Products & stock</h1>
          <p>
            Edit product details, choose exact phones, and keep a reason for
            every stock correction.
          </p>
        </div>
        <div className="heading-action">
          <button className="btn btn-primary" onClick={p.addProduct}>
            <Plus size={16} />
            Add product
          </button>
        </div>
      </div>
      <div
        className="stock-tabs"
        role="tablist"
        aria-label="Stock manager views"
      >
        {[
          { id: "models", name: "Product models", icon: Package },
          { id: "devices", name: "Phones & serials", icon: Smartphone },
          { id: "history", name: "Change history", icon: History },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => {
              setTab(t.id as typeof tab);
              clear();
            }}
          >
            <t.icon size={17} />
            {t.name}
            <span>
              {t.id === "models"
                ? p.products.filter((x) => !x.archived).length
                : t.id === "devices"
                  ? p.devices.length
                  : p.audit.length}
            </span>
          </button>
        ))}
      </div>
      {message && (
        <p className="stock-success" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="import-error" role="alert">
          {error}
        </p>
      )}
      {tab === "history" ? (
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CORRECTIONS SAVED IN THIS BROWSER</span>
              <h3>What changed, and why</h3>
            </div>
            <button
              className="btn btn-secondary"
              disabled={!p.audit.length}
              onClick={() =>
                downloadText(
                  "sri-sai-stock-change-history.csv",
                  toCsv(
                    p.audit.map((a) => ({
                      ...a,
                      before: JSON.stringify(a.before),
                      after: JSON.stringify(a.after),
                    })),
                  ),
                )
              }
            >
              <Download size={15} />
              Export history
            </button>
          </div>
          {p.audit.length ? (
            <div className="stock-history">
              {p.audit.slice(0, 150).map((a) => (
                <details key={a.id}>
                  <summary>
                    <span>
                      <strong>{a.label}</strong>
                      <small>
                        {a.scope === "model"
                          ? "Product model"
                          : "Physical device"}{" "}
                        · {a.action} · {new Date(a.at).toLocaleString("en-IN")}
                      </small>
                    </span>
                    <span>{a.reason}</span>
                    <ArrowRight size={15} />
                  </summary>
                  <div className="history-changes">
                    {Object.keys(a.after)
                      .filter(
                        (k) =>
                          JSON.stringify(a.before[k]) !==
                          JSON.stringify(a.after[k]),
                      )
                      .map((k) => (
                        <div key={k}>
                          <strong>
                            {(
                              {
                                supplierCode: "Party code",
                                purchaseCost: "Purchase cost",
                                retailPrice: "Retail price",
                                wholesalePrice: "Wholesale price",
                                imei1: "IMEI 1",
                                imei2: "IMEI 2",
                                serialNumber: "Serial number",
                                barcode: "Barcode",
                                stock: "Available quantity",
                                archived: "Archived",
                                gstRate: "GST %",
                                name: "Product name",
                                variant: "Variant",
                                sku: "SKU",
                              } as Record<string, string>
                            )[k] || k}
                          </strong>
                          <span>{String(a.before[k] ?? "—")}</span>
                          <ArrowRight size={13} />
                          <span>{String(a.after[k] ?? "—")}</span>
                        </div>
                      ))}
                  </div>
                </details>
              ))}
              {p.audit.length > 150 && (
                <p className="branding-note">
                  Showing the latest 150 changes. Export history for all
                  records.
                </p>
              )}
            </div>
          ) : (
            <div className="dashboard-empty">
              <History size={27} />
              <h3>No stock corrections yet</h3>
              <p>
                Edits, supplier corrections, removals and stock counts made here
                appear with before/after values.
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          <div className="panel stock-list-panel">
            <div className="toolbar">
              <label className="search-field">
                <Search size={16} />
                <input
                  aria-label="Search stock manager"
                  value={p.search}
                  onChange={(e) => {
                    p.setSearch(e.target.value);
                    setSelected([]);
                  }}
                  placeholder={
                    tab === "models"
                      ? "Model, variant, SKU or supplier code"
                      : "IMEI 1, IMEI 2, serial, model or party code"
                  }
                />
              </label>
              <select
                aria-label="Stock supplier filter"
                value={supplier}
                onChange={(e) => {
                  setSupplier(e.target.value);
                  setSelected([]);
                }}
              >
                <option value="All">All suppliers</option>
                {[
                  ...new Set(
                    [
                      ...p.products.map((x) => x.supplierCode),
                      ...p.devices.map((d) => d.supplierCode),
                    ].filter(Boolean),
                  ),
                ]
                  .sort()
                  .map((code) => (
                    <option key={code}>{code}</option>
                  ))}
              </select>
              <select
                aria-label="Stock category filter"
                value={p.category}
                onChange={(e) => {
                  p.setCategory(e.target.value);
                  setSelected([]);
                }}
              >
                <option value="All">All categories</option>
                {[...new Set(p.products.map((x) => x.category))]
                  .sort()
                  .map((c) => (
                    <option key={c}>{c}</option>
                  ))}
              </select>
              {tab === "models" ? (
                <select
                  aria-label="Stock availability filter"
                  value={availability}
                  onChange={(e) => {
                    setAvailability(e.target.value);
                    setSelected([]);
                  }}
                >
                  {["Active", "Low stock", "Archived", "All"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              ) : (
                <select
                  aria-label="Device status filter"
                  value={deviceStatus}
                  onChange={(e) => {
                    setDeviceStatus(e.target.value);
                    setSelected([]);
                  }}
                >
                  <option>All</option>
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              )}
              <select
                aria-label="Stock sort order"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="name">Sort: name</option>
                {tab === "models" ? (
                  <>
                    <option value="stock">Stock: low first</option>
                    <option value="retail">Retail: low first</option>
                  </>
                ) : (
                  <option value="cost">Cost: low first</option>
                )}
              </select>
              <button
                className="icon-btn"
                aria-label="Reset stock filters"
                onClick={() => {
                  p.setSearch("");
                  p.setCategory("All");
                  setSupplier("All");
                  setAvailability("Active");
                  setDeviceStatus("In stock");
                  setSort("name");
                  clear();
                }}
              >
                <SlidersHorizontal size={17} />
              </button>
            </div>
            <div className="stock-selection">
              <label>
                <input
                  type="checkbox"
                  aria-label="Select all visible stock rows"
                  checked={allPicked}
                  onChange={(e) =>
                    setSelected(e.target.checked ? visibleIds : [])
                  }
                />
                <strong>
                  {picked.length
                    ? picked.length + " selected in this view"
                    : visibleIds.length +
                      " matching " +
                      (tab === "models" ? "models" : "units")}
                </strong>
              </label>
              <div>
                <button
                  className="text-button"
                  disabled={!picked.length}
                  onClick={() => setSelected([])}
                >
                  Clear selection
                </button>
                <button
                  className="text-button"
                  disabled={!picked.length}
                  onClick={exportSelected}
                >
                  <Download size={14} />
                  Export selected
                </button>
                {tab === "models" && (
                  <button
                    className="text-button"
                    onClick={() =>
                      downloadText(
                        "sri-sai-stock-count-sheet.csv",
                        toCsv(
                          models.map((x) => ({
                            sku: x.sku,
                            product: x.name,
                            variant: x.variant,
                            tracking: x.tracking,
                            recorded_available: x.stock,
                            counted_quantity: "",
                            notes: "",
                          })),
                        ),
                      )
                    }
                  >
                    <Download size={14} />
                    Count sheet
                  </button>
                )}
              </div>
            </div>
            {picked.length > 0 && (
              <div className="stock-bulk-bar" data-testid="stock-bulk-bar">
                <CheckSquare size={20} />
                <strong>
                  {picked.length}{" "}
                  {tab === "models" ? "models" : "physical units"}
                </strong>
                <button
                  className="btn btn-secondary"
                  onClick={() => open("supplier")}
                >
                  Change party code
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => open("prices")}
                >
                  {tab === "models"
                    ? "Change selling prices"
                    : "Change unit cost"}
                </button>
                {tab === "models" ? (
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      open(availability === "Archived" ? "restore" : "archive")
                    }
                  >
                    <Archive size={14} />
                    {availability === "Archived"
                      ? "Restore models"
                      : "Archive models"}
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-secondary"
                      onClick={() => open("damage")}
                    >
                      Mark damaged
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => open("inspect")}
                    >
                      Send to inspection
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => open("remove")}
                    >
                      Remove from stock
                    </button>
                  </>
                )}
              </div>
            )}
            <div className="stock-table-wrap">
              <table className="stock-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    {(tab === "models"
                      ? [
                          "Model / SKU",
                          "Default party code",
                          "Available",
                          "Cost / selling prices",
                          "Actions",
                        ]
                      : [
                          "IMEI / serial",
                          "Model / variant",
                          "Party code",
                          "Unit cost",
                          "Status",
                          "Actions",
                        ]
                    ).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tab === "models"
                    ? models.map((x) => (
                        <tr
                          key={x.id}
                          className={picked.includes(x.id) ? "selected" : ""}
                        >
                          <td data-label="Select">
                            <input
                              aria-label={"Select model " + x.sku}
                              type="checkbox"
                              checked={picked.includes(x.id)}
                              onChange={() => select(x.id)}
                            />
                          </td>
                          <td data-label="Model">
                            <button
                              className="table-link"
                              onClick={() => p.viewProduct(x.id)}
                            >
                              <strong>{x.name}</strong>
                              <small>
                                {x.variant} · {x.sku}
                              </small>
                            </button>
                            {x.archived && (
                              <span className="stock-status">Archived</span>
                            )}
                          </td>
                          <td data-label="Default supplier">
                            <span className="code">
                              {x.supplierCode || "Unassigned"}
                            </span>
                            <small>For future receipts</small>
                          </td>
                          <td data-label="Available">
                            <strong>{x.stock}</strong>
                            <small>
                              {x.tracking === "Quantity"
                                ? "quantity managed"
                                : "exact units in stock"}
                            </small>
                          </td>
                          <td data-label="Prices">
                            <strong>{money(x.purchaseCost)} cost</strong>
                            <small>
                              Retail {money(x.retailPrice)} · Wholesale{" "}
                              {money(x.wholesalePrice)}
                            </small>
                          </td>
                          <td data-label="Actions">
                            <div className="stock-row-actions">
                              <button
                                className="btn btn-secondary"
                                onClick={() =>
                                  open(x.archived ? "restore" : "edit", [x.id])
                                }
                              >
                                {x.archived ? "Restore model" : "Edit model"}
                              </button>
                              {!x.archived && x.tracking === "Quantity" && (
                                <button
                                  className="text-button"
                                  onClick={() => open("adjust", [x.id])}
                                >
                                  Adjust quantity
                                </button>
                              )}
                              {!x.archived && (
                                <button
                                  className="text-button"
                                  onClick={() => open("archive", [x.id])}
                                >
                                  Archive
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    : deviceRows.map((d) => {
                        const model = modelById.get(d.productId);
                        return (
                          <tr
                            key={d.id}
                            className={picked.includes(d.id) ? "selected" : ""}
                          >
                            <td data-label="Select">
                              <input
                                aria-label={
                                  "Select device " +
                                  (d.imei1 || d.serialNumber || d.barcode)
                                }
                                type="checkbox"
                                checked={picked.includes(d.id)}
                                onChange={() => select(d.id)}
                              />
                            </td>
                            <td data-label="Identifiers">
                              <strong className="mono">
                                {d.imei1 || d.serialNumber || d.barcode}
                              </strong>
                              <small>
                                {d.imei2
                                  ? "IMEI 2: " + d.imei2
                                  : "Label: " + d.barcode}
                              </small>
                              {d.invoiceNumber && (
                                <small>Bill: {d.invoiceNumber}</small>
                              )}
                            </td>
                            <td data-label="Model">
                              <button
                                className="table-link"
                                onClick={() => p.viewProduct(d.productId)}
                              >
                                <strong>
                                  {model?.name || "Unknown model"}
                                </strong>
                                <small>
                                  {model?.variant} · {model?.sku}
                                </small>
                              </button>
                            </td>
                            <td data-label="Supplier">
                              <span className="code">
                                {d.supplierCode || "Unassigned"}
                              </span>
                              <small>
                                {d.receivingReference || "Opening / demo stock"}
                              </small>
                            </td>
                            <td data-label="Cost">{money(d.purchaseCost)}</td>
                            <td data-label="Status">
                              <span
                                className={
                                  "stock-status " +
                                  (d.status === "In stock" ? "available" : "")
                                }
                              >
                                {d.status}
                              </span>
                            </td>
                            <td data-label="Actions">
                              {d.status === "In stock" ? (
                                <button
                                  className="btn btn-secondary"
                                  onClick={() => open("edit", [d.id])}
                                >
                                  Edit handset
                                </button>
                              ) : (
                                <button
                                  className="text-button"
                                  onClick={() => p.viewProduct(d.productId)}
                                >
                                  View record
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                </tbody>
              </table>
            </div>
            {!visibleIds.length && (
              <div className="dashboard-empty">
                <Package size={26} />
                <h3>No stock matches these filters</h3>
                <p>
                  Try another IMEI, supplier or status. Removed phones remain
                  searchable under Removed.
                </p>
              </div>
            )}
            <div className="table-footer">
              {tab === "models"
                ? "A model is shared by identical variants. Phone quantities come from their individual units."
                : "One row is one physical unit. Removed records and their identifiers are retained."}
            </div>
          </div>
          <div className="notice-box">
            <History size={17} />
            <span>
              Every correction here needs a reason and is saved in this
              browser’s change history. Issued invoice snapshots stay unchanged.
              Back up your shop after important changes.
            </span>
          </div>
        </>
      )}
      {command && (
        <StockChangeDialog
          command={command}
          products={p.products}
          devices={p.devices}
          parties={p.parties}
          close={() => setCommand(null)}
          save={(cmd) => {
            const result = p.apply(cmd);
            if (result.error) return result.error;
            setMessage(result.message || "Stock change saved in this browser.");
            setCommand(null);
            setSelected([]);
            return "";
          }}
        />
      )}
    </section>
  );
}
function StockChangeDialog({
  command,
  products,
  devices,
  parties,
  close,
  save,
}: {
  command: StockCommand;
  products: Product[];
  devices: DeviceUnit[];
  parties: Party[];
  close: () => void;
  save: (command: StockCommand) => string;
}) {
  const model =
    command.scope === "model"
      ? products.find((p) => p.id === command.ids[0])
      : undefined;
  const device =
    command.scope === "device"
      ? devices.find((d) => d.id === command.ids[0])
      : undefined;
  const deviceModel = products.find((p) => p.id === device?.productId);
  const [product, setProduct] = useState<Partial<Product>>(
      model ? { ...model } : {},
    ),
    [unit, setUnit] = useState<Partial<DeviceUnit>>(
      device ? { ...device } : {},
    ),
    [code, setCode] = useState(
      model?.supplierCode || device?.supplierCode || "",
    ),
    [cost, setCost] = useState(""),
    [retail, setRetail] = useState(""),
    [wholesale, setWholesale] = useState(""),
    [quantity, setQuantity] = useState(String(model?.stock ?? 0)),
    [reason, setReason] = useState(""),
    [applyToUnits, setApplyToUnits] = useState(false),
    [error, setError] = useState("");
  useDialogFocus(true, close);
  const labels = {
    edit:
      command.scope === "model"
        ? "Edit product model"
        : "Edit physical handset",
    supplier: "Change supplier / party code",
    prices:
      command.scope === "model"
        ? "Update future selling prices"
        : "Correct unit purchase cost",
    adjust: "Count & adjust accessory stock",
    remove: "Remove selected phones from available stock",
    damage: "Mark selected units as damaged",
    inspect: "Send selected units for inspection",
    archive: "Archive product models",
    restore: "Restore product models",
  };
  const supplierField = (
    <label className="field">
      Supplier / party code
      <select
        aria-label="Edit supplier code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      >
        <option value="">Unassigned</option>
        {parties
          .filter((p) => p.roles.includes("Supplier") && p.code)
          .map((p) => (
            <option key={p.id} value={p.code}>
              {p.code} · {p.name}
            </option>
          ))}
      </select>
      <small>
        To use a new code, add the supplier in Customers & Suppliers first.
      </small>
    </label>
  );
  return (
    <div className="modal-backdrop">
      <section
        className="modal stock-edit-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-change-title"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              STOCK CORRECTION · {command.ids.length} RECORD(S)
            </span>
            <h2 id="stock-change-title">{labels[command.action]}</h2>
          </div>
          <button
            className="icon-btn"
            aria-label="Close stock editor"
            onClick={close}
          >
            <X size={19} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const cmd: StockCommand = {
              ...command,
              reason,
              supplierCode: code,
              applyToUnits,
            };
            if (command.action === "edit") {
              if (model) cmd.product = { ...product, supplierCode: code };
              else cmd.device = { ...unit, supplierCode: code };
            }
            if (command.action === "prices") {
              if (command.scope === "device")
                cmd.cost = cost.trim() === "" ? NaN : Number(cost);
              else {
                if (retail.trim() !== "") cmd.retail = Number(retail);
                if (wholesale.trim() !== "") cmd.wholesale = Number(wholesale);
              }
            }
            if (command.action === "adjust")
              cmd.quantity = quantity.trim() === "" ? NaN : Number(quantity);
            setError(save(cmd));
          }}
        >
          <div className="form-grid">
            {(command.ids.length > 1 ||
              ["remove", "damage", "inspect", "archive", "restore"].includes(
                command.action,
              )) && (
              <details
                className="stock-targets span-2"
                open={[
                  "remove",
                  "damage",
                  "inspect",
                  "archive",
                  "restore",
                ].includes(command.action)}
              >
                <summary>
                  Review {command.ids.length} selected{" "}
                  {command.scope === "device"
                    ? "physical units"
                    : "product models"}
                </summary>
                <ul>
                  {command.ids.map((id) => {
                    const target =
                      command.scope === "device"
                        ? devices.find((d) => d.id === id)
                        : products.find((p) => p.id === id);
                    if (!target)
                      return <li key={id}>Record no longer available</li>;
                    return (
                      <li key={id}>
                        {command.scope === "device" ? (
                          <>
                            <strong>
                              {(target as DeviceUnit).imei1 ||
                                (target as DeviceUnit).serialNumber ||
                                (target as DeviceUnit).barcode}
                            </strong>
                            <small>
                              {(target as DeviceUnit).imei2
                                ? "IMEI 2: " +
                                  (target as DeviceUnit).imei2 +
                                  " · "
                                : ""}
                              {target.supplierCode || "Unassigned"} ·{" "}
                              {target.status}
                            </small>
                          </>
                        ) : (
                          <>
                            <strong>
                              {(target as Product).name} ·{" "}
                              {(target as Product).sku}
                            </strong>
                            <small>{(target as Product).stock} available</small>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}

            {command.action === "edit" && model && (
              <>
                {(
                  ["name", "brand", "variant", "sku", "barcode", "hsn"] as const
                ).map((k) => (
                  <label className="field" key={k}>
                    {
                      {
                        name: "Product name",
                        brand: "Brand",
                        variant: "RAM / storage / colour",
                        sku: "SKU",
                        barcode: "Model barcode",
                        hsn: "HSN",
                      }[k]
                    }
                    <input
                      aria-label={"Edit model " + k}
                      required={k === "name" || k === "sku"}
                      value={String(product[k] ?? "")}
                      onChange={(e) =>
                        setProduct((p) => ({ ...p, [k]: e.target.value }))
                      }
                    />
                  </label>
                ))}
                <label className="field">
                  Category
                  <select
                    value={product.category}
                    onChange={(e) =>
                      setProduct((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    {[
                      ...new Set([
                        ...products.map((p) => p.category),
                        "Smartphones",
                        "Keypad phones",
                        "Accessories",
                      ]),
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
                {(
                  [
                    "purchaseCost",
                    "retailPrice",
                    "wholesalePrice",
                    "gstRate",
                  ] as const
                ).map((k) => (
                  <label className="field" key={k}>
                    {
                      {
                        purchaseCost: "Default purchase cost ₹",
                        retailPrice: "Retail price ₹",
                        wholesalePrice: "Wholesale price ₹",
                        gstRate: "GST %",
                      }[k]
                    }
                    <input
                      aria-label={"Edit model " + k}
                      required
                      type="number"
                      step="any"
                      min="0"
                      max={k === "gstRate" ? 100 : undefined}
                      value={Number.isFinite(product[k]) ? product[k] : ""}
                      onChange={(e) =>
                        setProduct((p) => ({
                          ...p,
                          [k]:
                            e.target.value === ""
                              ? NaN
                              : Number(e.target.value),
                        }))
                      }
                    />
                  </label>
                ))}
              </>
            )}
            {command.action === "edit" && device && (
              <>
                <div className="stock-edit-summary span-2">
                  <strong>
                    {deviceModel?.name} · {deviceModel?.variant}
                  </strong>
                  <p>
                    {device.invoiceNumber
                      ? "This unit has invoice history. Its IMEI / serial identity is locked; supplier and current cost corrections are recorded separately."
                      : "Correct an input mistake only after checking the actual box. Identifiers must remain unique across all records."}
                  </p>
                </div>
                {(deviceModel?.tracking === "IMEI"
                  ? (["imei1", "imei2"] as const)
                  : (["serialNumber"] as const)
                ).map((k) => (
                  <label className="field" key={k}>
                    {k === "imei1"
                      ? "IMEI 1"
                      : k === "imei2"
                        ? "IMEI 2 (optional)"
                        : "Serial number"}
                    <input
                      aria-label={"Edit handset " + k}
                      readOnly={!!device.invoiceNumber}
                      value={unit[k] || ""}
                      onChange={(e) =>
                        setUnit((u) => ({ ...u, [k]: e.target.value }))
                      }
                    />
                  </label>
                ))}
                <label className="field">
                  Internal barcode / label
                  <input
                    aria-label="Edit handset barcode"
                    value={unit.barcode || ""}
                    onChange={(e) =>
                      setUnit((u) => ({ ...u, barcode: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  Unit purchase cost ₹
                  <input
                    aria-label="Edit handset purchaseCost"
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={
                      Number.isFinite(unit.purchaseCost)
                        ? unit.purchaseCost
                        : ""
                    }
                    onChange={(e) =>
                      setUnit((u) => ({
                        ...u,
                        purchaseCost:
                          e.target.value === "" ? NaN : Number(e.target.value),
                      }))
                    }
                  />
                </label>
              </>
            )}
            {(command.action === "supplier" || command.action === "edit") &&
              supplierField}
            {command.scope === "model" &&
              (command.action === "supplier" || command.action === "edit") && (
                <label className="guide-complete">
                  <input
                    type="checkbox"
                    checked={applyToUnits}
                    onChange={(e) => setApplyToUnits(e.target.checked)}
                  />
                  Also correct the supplier of this model’s currently available
                  units. Sold, removed and returned units stay unchanged.
                </label>
              )}
            {command.action === "prices" &&
              (command.scope === "device" ? (
                <label className="field">
                  New unit purchase cost ₹
                  <input
                    aria-label="Bulk unit cost"
                    required
                    type="number"
                    min="0"
                    step="any"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </label>
              ) : (
                <>
                  <label className="field">
                    New retail price ₹
                    <input
                      aria-label="Bulk retail price"
                      type="number"
                      min="0"
                      step="any"
                      value={retail}
                      onChange={(e) => setRetail(e.target.value)}
                    />
                    <small>
                      Leave blank to keep each model’s retail price.
                    </small>
                  </label>
                  <label className="field">
                    New wholesale price ₹
                    <input
                      aria-label="Bulk wholesale price"
                      type="number"
                      min="0"
                      step="any"
                      value={wholesale}
                      onChange={(e) => setWholesale(e.target.value)}
                    />
                    <small>
                      Leave blank to keep each model’s wholesale price.
                    </small>
                  </label>
                </>
              ))}
            {command.action === "adjust" && (
              <label className="field span-2">
                Actual counted quantity
                <input
                  aria-label="Counted stock quantity"
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
                <small>
                  This sets the available count for quantity-managed
                  accessories. Phones must be received or removed as exact
                  devices.
                </small>
              </label>
            )}
            {["remove", "damage", "inspect", "archive", "restore"].includes(
              command.action,
            ) && (
              <div className="stock-edit-summary span-2">
                <p>
                  {command.action === "remove"
                    ? "These exact available handsets will leave saleable stock. Their records and IMEIs are kept; removal is not a sale, refund or supplier return."
                    : command.action === "damage"
                      ? "These exact units will be unavailable for sale. Use the inspection workflow before returning them to stock."
                      : command.action === "inspect"
                        ? "These removed or damaged units will enter Under inspection, not available stock. Complete inspection in IMEI & Serial Tracking before selling."
                        : command.action === "archive"
                          ? "Only models with no available stock can be archived. Their bills and device history stay intact. You can restore the model later."
                          : "Restoring makes the product model visible again. It does not add stock."}
                </p>
                <strong>
                  {command.ids.length}{" "}
                  {command.scope === "device" ? "physical unit(s)" : "model(s)"}{" "}
                  affected
                </strong>
              </div>
            )}
            <label className="field span-2">
              Reason for this change
              <textarea
                aria-label="Stock change reason"
                required
                minLength={3}
                maxLength={500}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Example: supplier code corrected from the delivery bill"
              />
              <small>Saved with before/after values in Change history.</small>
            </label>
            {error && (
              <p className="import-error span-2" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
            <button
              type="submit"
              className={
                "btn " +
                (command.action === "remove" ? "btn-danger" : "btn-primary")
              }
            >
              Confirm stock change
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
