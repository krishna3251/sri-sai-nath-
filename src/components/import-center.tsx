"use client";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileUp,
  MessageSquareText,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  amount,
  blankRow,
  columns,
  downloadText,
  parseCsv,
  parseWhatsApp,
  prepareImport,
  suggestedImportMode,
  toCsv,
  type ImportRow,
  type ImportContext,
  type ImportOptions,
} from "@/lib/stock-import";
const sample =
  "Samsung\nA07 4/64 | qty: 2 | cost: 8500 | retail: 9999 | wholesale: 9200 | party: SUP01\nAccessories\nUSB-C Cable | qty: 10 | cost: 50 | retail: 99 | wholesale: 70 | party: SUP01";
type Props = ImportContext & {
  invoices: any[];
  onCommit: (
    rows: ImportRow[],
    opts: ImportOptions,
  ) => { error?: string; message?: string };
  backup: () => void;
};
export default function ImportCenter(p: Props) {
  const [tab, setTab] = useState("paste"),
    [text, setText] = useState(""),
    [rows, setRows] = useState<ImportRow[]>([]),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [page, setPage] = useState(0);
  const [options, setOptions] = useState<ImportOptions>({
    mode: "receive",
    partyCode: "",
    supplierName: "",
    reference: "",
    updatePrices: false,
  });
  const result = useMemo(
    () => prepareImport(rows, p, options),
    [rows, p.products, p.devices, p.parties, options],
  );
  const change = (i: number, key: keyof ImportRow, value: string) => {
    setRows((a) => a.map((r, n) => (n === i ? { ...r, [key]: value } : r)));
    setMessage("");
  };
  function parse(value: string, csv = false) {
    try {
      const parsed = csv ? parseCsv(value) : parseWhatsApp(value);
      setRows(parsed);
      setOptions((o) => ({ ...o, mode: suggestedImportMode(parsed) }));
      setPage(0);
      setError("");
      setMessage("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function exportStock() {
    downloadText(
      "sri-sai-current-stock.csv",
      toCsv(
        p.products.flatMap((product) => {
          const units = p.devices.filter(
            (d) => d.productId === product.id && ["In stock", "Needs identification", "Under inspection"].includes(d.status),
          );
          const base = {
            device_status: "Available / catalogue",
            sku: product.sku,
            name: product.name,
            brand: product.brand,
            variant: product.variant,
            tracking: product.tracking,
            quantity: product.stock,
            purchase_cost: product.purchaseCost,
            retail_price: product.retailPrice,
            wholesale_price: product.wholesalePrice,
            party_code: product.supplierCode,
            imei1: "",
            imei2: "",
            serial_number: "",
            hsn: product.hsn,
            gst_rate: product.gstRate,
          };
          return product.tracking === "Quantity" || !units.length
            ? [base]
            : units.map((d) => ({
                ...base,
                device_status: d.status,
                quantity: 1,
                purchase_cost: d.purchaseCost,
                party_code: d.supplierCode,
                imei1: d.imei1,
                imei2: d.imei2,
                serial_number: d.serialNumber,
              }));
        }),
        [...columns, "device_status"],
      ),
    );
  }
  return (
    <section className="screen import-center">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR SHOP / MOVE DATA EASILY</span>
          <h1>Imports & exports</h1>
          <p>
            Paste your WhatsApp list, check every row, then add models or
            receive stock with identifiers now or later.
          </p>
        </div>
        <a
          className="btn btn-secondary"
          href="/imports/stock-import-guide.md"
          download
        >
          <Download size={15} /> File instructions for another AI
        </a>
      </div>
      <div className="import-intro">
        <span className="step-number">01 PASTE OR UPLOAD</span>
        <ArrowRight size={16} />
        <span className="step-number">02 REVIEW & CORRECT</span>
        <ArrowRight size={16} />
        <span className="step-number">03 CONFIRM IMPORT</span>
      </div>
      <div className="panel import-source" data-tour="import-source">
        <div className="panel-head">
          <div>
            <h3>Bring your stock list here</h3>
            <p>
              A forwarded stock list is a starting point. You stay in control of
              quantities, prices and handset identity.
            </p>
          </div>
          <div className="segmented">
            <button
              className={tab === "paste" ? "selected" : ""}
              onClick={() => setTab("paste")}
            >
              <MessageSquareText size={14} /> WhatsApp paste
            </button>
            <button
              className={tab === "file" ? "selected" : ""}
              onClick={() => setTab("file")}
            >
              <FileUp size={14} /> Import file
            </button>
          </div>
        </div>
        {tab === "paste" ? (
          <div className="import-source-body">
            <label className="field">
              Paste WhatsApp stock list
              <textarea
                rows={7}
                aria-label="Paste WhatsApp stock list"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  "Samsung\nA07 4/64 | qty: 2 | cost: 8500 | retail: 9999 | wholesale: 9200 | party: SUP01"
                }
              />
            </label>
            <div className="guide-actions">
              <button
                className="btn btn-primary"
                disabled={!text.trim()}
                onClick={() => parse(text)}
              >
                Read stock list <ArrowRight size={15} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setText(sample);
                  parse(sample);
                }}
              >
                Load clearly labelled example
              </button>
            </div>
            <p className="subtle-note">
              Brand headings and RAM/storage are recognized. A model-only list automatically selects catalogue mode. IMEI, serial and party code can be left blank. Prices marked @8500 or ₹8500 are read as purchase cost. For quantities and
              prices use “| qty: 2 | cost: 8500 | retail: 9999 | wholesale:
              9200”. Missing values stay blank.
            </p>
          </div>
        ) : (
          <div className="import-source-body">
            <label className="upload-zone">
              <FileUp size={28} />
              <strong>Choose a CSV or text file</strong>
              <span>UTF-8 CSV or WhatsApp .txt · up to 2 MB · 1,000 rows</span>
              <input
                aria-label="Stock import file"
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  if (f.size > 2_000_000) {
                    setError("Use a file smaller than 2 MB.");
                    return;
                  }
                  try {
                    parse(
                      await f.text(),
                      f.name.toLowerCase().endsWith(".csv"),
                    );
                  } catch {
                    setError(
                      "The file could not be read. Try a UTF-8 CSV or plain text file.",
                    );
                  }
                  e.target.value = "";
                }}
              />
            </label>
            <div className="guide-actions">
              <a
                className="btn btn-secondary"
                download
                href="/imports/stock-template.csv"
              >
                <Download size={15} /> Download CSV template
              </a>
              <a
                className="btn btn-secondary"
                download
                href="/imports/stock-import-guide.md"
              >
                How to prepare the file
              </a>
            </div>
            <p className="subtle-note">
              Excel / Google Sheets: export as CSV UTF-8. Native .xlsx files are
              not accepted.
            </p>
          </div>
        )}
      </div>
      <div className="panel import-options" data-tour="import-options">
        <div className="panel-head">
          <div>
            <span className="eyebrow">CHOOSE WHAT THIS LIST SHOULD DO</span>
            <h3>Products only, or stock received?</h3>
          </div>
        </div>
        <div className="import-mode-options">
          <label className={options.mode === "receive" ? "chosen" : ""}>
            <input
              type="radio"
              name="import-mode"
              checked={options.mode === "receive"}
              onChange={() => setOptions((o) => ({ ...o, mode: "receive" }))}
            />
            <span>
              <strong>Receive stock</strong>
              <small>
                Add physically received quantities. IMEI, serial and party code are optional at import. Unidentified units stay off the saleable shelf.
              </small>
            </span>
          </label>
          <label className={options.mode === "catalogue" ? "chosen" : ""}>
            <input
              type="radio"
              name="import-mode"
              checked={options.mode === "catalogue"}
              onChange={() => setOptions((o) => ({ ...o, mode: "catalogue" }))}
            />
            <span>
              <strong>Models & prices only</strong>
              <small>
                Create product variants. Listed quantities are NOT added to
                available stock.
              </small>
            </span>
          </label>
        </div>
        <div className="form-grid">
          <label className="field">
            Default supplier / party code (optional)
            <input
              list="supplier-codes"
              value={options.partyCode}
              onChange={(e) =>
                setOptions((o) => ({
                  ...o,
                  partyCode: e.target.value.toUpperCase(),
                }))
              }
              placeholder="SUP01"
            />
            <datalist id="supplier-codes">
              {p.parties
                .filter((x) => x.roles.includes("Supplier"))
                .map((x) => (
                  <option key={x.id} value={x.code}>
                    {x.name}
                  </option>
                ))}
            </datalist>
            <small>Leave blank if unknown. You can assign it later in Stock Manager. If supplied, the code must belong to a supplier.</small>
          </label>
          <label className="field">
            Supplier name (only for a new code)
            <input
              value={options.supplierName}
              onChange={(e) =>
                setOptions((o) => ({ ...o, supplierName: e.target.value }))
              }
              placeholder="Supplier business name"
            />
            <small>Creates the named supplier only when you confirm.</small>
          </label>
          <label className="field">
            Supplier bill / delivery reference
            <input
              value={options.reference}
              onChange={(e) =>
                setOptions((o) => ({ ...o, reference: e.target.value }))
              }
              placeholder="SUP01-BILL-001"
            />
            <small>
              Required for Receive stock. A saved reference cannot be received
              twice.
            </small>
          </label>
          <label className="guide-complete">
            <input
              type="checkbox"
              checked={options.updatePrices}
              onChange={(e) =>
                setOptions((o) => ({ ...o, updatePrices: e.target.checked }))
              }
            />
            Update selling prices of existing SKUs
            <br />
            (old invoice prices stay unchanged)
          </label>
        </div>
      </div>
      {error && (
        <p className="import-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <div className="import-success" role="status">
          <CheckCircle2 size={20} />
          {message}
        </div>
      )}
      {rows.length > 0 && (
        <div className="import-success" role="status">
          <CheckCircle2 size={20} />
          {suggestedImportMode(rows) === "catalogue"
            ? "Model-only list detected. No quantities or device identities are invented. You can add stock later."
            : `${result.pending} units need identification. They will be visible in Stock Manager but unavailable for billing until identified and inspected.`}
        </div>
      )}
      {rows.length > 0 && (
        <section className="panel import-review" data-tour="import-review">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CHECK BEFORE YOU SAVE</span>
              <h3>
                {rows.length} rows ·{" "}
                {options.mode === "catalogue"
                  ? "no stock will be added"
                  : result.received + " received · " + result.pending + " need identification"}
              </h3>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setRows((a) => [...a, blankRow()])}
            >
              <Plus size={14} />
              Add row
            </button>
          </div>
          <div className="import-row-list">
            {rows.slice(page * 25, page * 25 + 25).map((r, n) => {
              const i = page * 25 + n;
              return (
                <article className="import-row" key={i}>
                  <div className="import-row-title">
                    <strong>Row {i + 1}</strong>
                    <span>{r.sku || "SKU needed"}</span>
                    <button
                      className="icon-btn"
                      aria-label={"Remove row " + (i + 1)}
                      onClick={() => {
                        setRows((a) => a.filter((_, j) => j !== i));
                        setPage(0);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="import-row-fields">
                    {(
                      [
                        "name",
                        "brand",
                        "variant",
                        "sku",
                        "quantity",
                        "purchase_cost",
                        "retail_price",
                        "wholesale_price",
                        "party_code",
                      ] as const
                    ).map((key) => (
                      <label className="field" key={key}>
                        {
                          {
                            name: "Product name",
                            brand: "Brand",
                            variant: "RAM / storage / colour",
                            sku: "SKU",
                            quantity: "Quantity",
                            purchase_cost: "Purchase cost ₹",
                            retail_price: "Retail price ₹",
                            wholesale_price: "Wholesale price ₹",
                            party_code: "Party code (optional)",
                          }[key]
                        }
                        <input
                          aria-label={"Row " + (i + 1) + " " + key}
                          value={r[key]}
                          onChange={(e) => change(i, key, e.target.value)}
                        />
                      </label>
                    ))}
                    <label className="field">
                      Tracking
                      <select
                        aria-label={"Row " + (i + 1) + " tracking"}
                        value={r.tracking}
                        onChange={(e) => change(i, "tracking", e.target.value)}
                      >
                        <option value="">Choose tracking</option>
                        <option>IMEI</option>
                        <option>Serial</option>
                        <option>Quantity</option>
                      </select>
                    </label>
                    <label className="field">
                      GST %
                      <input
                        aria-label={"Row " + (i + 1) + " gst_rate"}
                        value={r.gst_rate}
                        onChange={(e) => change(i, "gst_rate", e.target.value)}
                        placeholder="18"
                      />
                    </label>
                    <label className="field">
                      HSN
                      <input
                        aria-label={"Row " + (i + 1) + " hsn"}
                        value={r.hsn}
                        onChange={(e) => change(i, "hsn", e.target.value)}
                      />
                    </label>
                    {r.tracking.toLowerCase() === "imei" ? (
                      (["imei1", "imei2"] as const).map((key) => (
                        <label className="field import-identifiers" key={key}>
                          {key === "imei1"
                            ? "IMEI 1 · optional at import"
                            : "IMEI 2 · optional, matching order"}
                          <textarea
                            rows={2}
                            aria-label={"Row " + (i + 1) + " " + key}
                            value={r[key]}
                            onChange={(e) => change(i, key, e.target.value)}
                            placeholder="Separate identifiers with semicolons"
                          />
                        </label>
                      ))
                    ) : r.tracking.toLowerCase() === "serial" ? (
                      <label className="field import-identifiers">
                        Serial numbers · optional at import
                        <textarea
                          aria-label={"Row " + (i + 1) + " serial_number"}
                          value={r.serial_number}
                          onChange={(e) =>
                            change(i, "serial_number", e.target.value)
                          }
                        />
                      </label>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {rows.length > 25 && (
            <div className="import-pagination">
              <button
                className="btn btn-secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous rows
              </button>
              <span>
                Page {page + 1} of {Math.ceil(rows.length / 25)}
              </span>
              <button
                className="btn btn-secondary"
                disabled={(page + 1) * 25 >= rows.length}
                onClick={() => setPage((p) => p + 1)}
              >
                Next rows
              </button>
            </div>
          )}
          {result.errors.length > 0 && !message && (
            <div className="import-validation" role="status">
              <strong>
                <AlertTriangle size={17} /> {result.errors.length} things to fix
                before importing
              </strong>
              <ul>
                {result.errors.slice(0, 30).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
              {result.errors.length > 30 && (
                <p>Additional issues appear as these rows are fixed.</p>
              )}
            </div>
          )}
          <div className="import-confirm">
            <p>
              {options.mode === "receive"
                ? "Confirm delivered quantities and purchase costs. Missing selling prices start at ₹0: set them before billing. Units without identifiers are saved as Needs identification and cannot be sold. Add real identifiers in Products & Stock → Phones & serials, then pass inspection in IMEI & Serial Tracking."
                : "Catalogue import adds product records only. Missing prices are zero until you set them; stock stays unchanged."}
              <br />
              <strong>
                Saved in this browser only. Export a backup after importing.
              </strong>
            </p>
            <button
              className="btn btn-primary"
              disabled={result.errors.length > 0 || !!message}
              onClick={() => {
                const response = p.onCommit(rows, options);
                setError(response.error || "");
                setMessage(response.message || "");
              }}
            >
              {options.mode === "receive"
                ? "Confirm & receive stock"
                : "Confirm catalogue import"}
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
      )}
      <section className="panel export-panel" data-tour="export-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">TAKE YOUR RECORDS WITH YOU</span>
            <h3>Exports & backup</h3>
          </div>
        </div>
        <div className="export-actions">
          <button className="btn btn-secondary" onClick={exportStock}>
            <Download size={16} />
            Current stock CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() =>
              downloadText("sri-sai-devices.csv", toCsv(p.devices))
            }
          >
            <Download size={16} />
            All device records CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() =>
              downloadText("sri-sai-parties.csv", toCsv(p.parties))
            }
          >
            <Download size={16} />
            Customers & suppliers CSV
          </button>
          <button
            className="btn btn-secondary"
            onClick={() =>
              downloadText(
                "sri-sai-invoices.csv",
                toCsv(
                  p.invoices.flatMap((inv) =>
                    inv.items.map((line: any) => ({
                      invoice: inv.number,
                      date: inv.date,
                      customer: inv.party,
                      payment: inv.paymentMethod,
                      ...line,
                    })),
                  ),
                ),
              )
            }
          >
            <Download size={16} />
            Invoice lines CSV
          </button>
          <button className="btn btn-dark" onClick={p.backup}>
            <Download size={16} />
            Full shop backup (JSON)
          </button>
        </div>
        <p className="branding-note">
          The full backup includes both IMEIs, invoices, suppliers and settings.
          Keep a copy outside this browser. CSV files are for review /
          conversion; do not receive an exported stock list again into the same
          shop.
        </p>
      </section>
    </section>
  );
}
