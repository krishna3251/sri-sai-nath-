"use client";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Check, HelpCircle, X } from "lucide-react";
export function useDialogFocus(active: boolean, close: () => void) {
  const closer = useRef(close);
  closer.current = close;
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        ),
      ).filter((el) => el.getClientRects().length);
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closer.current();
      }
      if (e.key === "Tab") {
        const elements = focusable();
        if (!elements.length) {
          e.preventDefault();
          return;
        }
        const first = elements[0],
          last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [active]);
}
export const guideSteps = [
  {
    title: "Set up your shop",
    screen: "Shop Settings",
    text: "Enter your shop name, address and contact details for the invoice header. GSTIN is optional for this demo; use only your verified registration. Set an invoice prefix under Invoices, such as SSM.",
    tip: "The prefix helps you recognize your shop’s bills. Production numbering needs a database.",
  },
  {
    title: "Add suppliers & customers",
    screen: "Parties & Ledgers",
    text: "A supplier is a business you buy goods from. A customer buys from you. Add both from Customers & Suppliers. Use a unique supplier code to connect incoming stock to the right business.",
    tip: "Walk-in Customer is available at checkout. You do not need a customer record for every counter sale.",
  },
  {
    title: "Add product models",
    screen: "Products & Stock",
    text: "Create one product for each model, RAM, storage and colour combination. SKU identifies that variant. Each physical phone has its own IMEI 1 and optional IMEI 2. Ten phones of one model need ten device records.",
    tip: "Choose Quantity for ordinary accessories. IMEI and Serial tracking require one identifier per unit. Opening stock can be zero.",
  },
  {
    title: "Receive a purchase",
    screen: "Purchase In",
    text: "Select the supplier, enter their bill number and date, then add products, quantities and costs. For phones, paste one IMEI 1 per line and IMEI 2 in the same order. Match quantities to goods actually received.",
    tip: "Receive stock only after checking the delivery. Duplicate identifiers and invalid IMEI check digits are rejected.",
  },
  {
    title: "Create your first sale",
    screen: "Retail POS",
    text: "Choose a customer or Walk-in Customer. Scan an IMEI, serial or barcode, then press Enter. A model SKU opens the exact-unit selector. Check price, discount, tax and payment method before creating the demo invoice.",
    tip: "USB keyboard scanners work like typing a code and pressing Enter. Each phone can appear only once in the bill.",
  },
  {
    title: "Find & check stock",
    screen: "IMEI & Serial Tracking",
    text: "Search either IMEI to find the physical handset. In stock means available for sale; Sold means it has left stock. Customer returns enter Under inspection and stay unavailable until inspected.",
    tip: "Products & Stock shows available quantity by model. A low-stock alert means five or fewer units remain.",
  },
  {
    title: "Review bills & accounts",
    screen: "Reports",
    text: "Invoices keeps demo sales and purchase references. Reports exports browser-local records. Payments and staff permissions are previews. Neon database storage and TallyPrime are not connected; no external voucher or payment is sent.",
    tip: "Use this prototype with demo data only. Local records do not sync across devices and are not a reliable backup.",
  },
];
type Props = { go: (screen: string) => void; screen: string };
export function Guide({ go, screen }: Props) {
  const [ready, setReady] = useState(false),
    [welcome, setWelcome] = useState(false),
    [open, setOpen] = useState(false),
    [step, setStep] = useState(0),
    [done, setDone] = useState<number[]>([]),
    [saveError, setSaveError] = useState(false);
  useDialogFocus(welcome, () => setWelcome(false));
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ssm-guide-v1");
      if (raw) {
        const saved = JSON.parse(raw);
        setStep(
          Number.isInteger(saved.step) &&
            saved.step >= 0 &&
            saved.step < guideSteps.length
            ? saved.step
            : 0,
        );
        setDone(
          Array.isArray(saved.done)
            ? [
                ...new Set<number>(
                  saved.done.filter(
                    (n: unknown): n is number =>
                      typeof n === "number" &&
                      Number.isInteger(n) &&
                      n >= 0 &&
                      n < guideSteps.length,
                  ),
                ),
              ]
            : [],
        );
      } else setWelcome(true);
    } catch {
      setWelcome(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready && !welcome)
      try {
        localStorage.setItem("ssm-guide-v1", JSON.stringify({ step, done }));
        setSaveError(false);
      } catch {
        setSaveError(true);
      }
  }, [ready, welcome, step, done]);
  useEffect(() => {
    const restart = () => {
      setOpen(true);
      setWelcome(false);
    };
    const replay = () => {
      setStep(0);
      setOpen(true);
      setWelcome(false);
      go(guideSteps[0].screen);
    };
    window.addEventListener("ssm-help", restart);
    window.addEventListener("ssm-restart", replay);
    return () => {
      window.removeEventListener("ssm-help", restart);
      window.removeEventListener("ssm-restart", replay);
    };
  }, []);
  function visit(n: number) {
    setStep(n);
    go(guideSteps[n].screen);
  }
  return (
    <>
      {saveError && !open && (
        <p className="guide-storage-warning" role="status">
          Setup progress couldn’t be saved. You can keep using the guide, but
          progress may reset when you reload.
        </p>
      )}
      {welcome && (
        <div className="modal-backdrop">
          <section
            className="welcome-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
          >
            <button
              className="icon-btn close-welcome"
              aria-label="Skip welcome"
              onClick={() => setWelcome(false)}
            >
              <X size={20} />
            </button>
            <span className="guide-emblem">
              SS<span>.</span>
            </span>
            <span className="eyebrow">YOUR SHOP. SIMPLIFIED.</span>
            <h2 id="welcome-title">
              Welcome to
              <br />
              Sri Sai Mobile ERP
            </h2>
            <p>
              Manage your stock, phone IMEIs, purchases, sales, and billing from
              one place. Follow this quick setup guide to get started.
            </p>
            <div className="welcome-features">
              <span>01 · Set up your shop</span>
              <span>02 · Receive stock</span>
              <span>03 · Create a bill</span>
            </div>
            <div className="guide-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setWelcome(false);
                  setOpen(true);
                  visit(step);
                }}
              >
                Start Setup <ArrowRight size={16} />
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setWelcome(false)}
              >
                Explore Demo
              </button>
            </div>
            <small>
              Demo records stay in this browser. You can replay the guide from
              Help.
            </small>
          </section>
        </div>
      )}
      <button
        className="help-fab"
        onClick={() => {
          setOpen(!open);
          setWelcome(false);
        }}
      >
        <HelpCircle size={18} />
        <span>{open ? "Close guide" : "Help & setup"}</span>
      </button>
      {open && (
        <aside
          className="guide-panel"
          role="region"
          aria-label="Shop setup guide"
        >
          <div className="panel-head">
            <div>
              <span className="eyebrow">GETTING STARTED</span>
              <h3>Your shop setup guide</h3>
            </div>
            <button
              className="icon-btn"
              aria-label="Close guide"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="guide-body">
            {saveError && (
              <p className="guide-storage-warning" role="status">
                Setup progress couldn’t be saved. You can keep using the guide,
                but progress may reset when you reload.
              </p>
            )}
            <p>{done.length} of 7 steps marked complete</p>
            <progress max={7} value={done.length} />
            <ol className="guide-checklist">
              {guideSteps.map((s, i) => (
                <li key={s.title}>
                  <button
                    aria-current={step === i ? "step" : undefined}
                    className={step === i ? "current" : ""}
                    onClick={() => visit(i)}
                  >
                    <span>
                      {done.includes(i) ? <Check size={13} /> : i + 1}
                    </span>
                    {s.title}
                  </button>
                </li>
              ))}
            </ol>
            <span className="eyebrow">STEP {step + 1} OF 7</span>
            <h2>{guideSteps[step].title}</h2>
            <p>{guideSteps[step].text}</p>
            <div className="guide-tip">{guideSteps[step].tip}</div>
            <button
              className="btn btn-secondary"
              onClick={() => go(guideSteps[step].screen)}
            >
              {screen === guideSteps[step].screen
                ? "You’re on this screen"
                : "Open this screen"}{" "}
              <ArrowRight size={14} />
            </button>
            <label className="guide-complete">
              <input
                type="checkbox"
                checked={done.includes(step)}
                onChange={(e) =>
                  setDone((d) =>
                    e.target.checked
                      ? [...d, step]
                      : d.filter((n) => n !== step),
                  )
                }
              />{" "}
              I’ve completed this step
            </label>
            <div className="guide-actions">
              <button
                className="btn btn-secondary"
                disabled={step === 0}
                onClick={() => visit(step - 1)}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => (step < 6 ? visit(step + 1) : setOpen(false))}
              >
                {step < 6 ? "Next step" : "Finish guide"}{" "}
                <ArrowRight size={14} />
              </button>
            </div>
            <button className="text-button" onClick={() => setOpen(false)}>
              Skip for now · resume from Help
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
export function GettingStarted({ go }: { go: (s: string) => void }) {
  return (
    <section className="screen">
      <div className="page-heading">
        <div>
          <span className="eyebrow">HELP & SUPPORT</span>
          <h1>A clear start for your shop.</h1>
          <p>Follow the setup guide, or jump to the task you need.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => window.dispatchEvent(new Event("ssm-restart"))}
        >
          Restart guided tour
        </button>
      </div>
      <div className="help-grid">
        {guideSteps.map((s, i) => (
          <button
            key={s.title}
            className="help-card"
            onClick={() => go(s.screen)}
          >
            <span className="step-number">0{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <span className="text-button">
              Open screen <ArrowRight size={15} />
            </span>
          </button>
        ))}
      </div>
      <section className="panel glossary">
        <h3>Shop terms, in plain language</h3>
        <dl>
          <dt>SKU</dt>
          <dd>
            Your code for a model and variant; shared by every unit of that
            product.
          </dd>
          <dt>IMEI</dt>
          <dd>
            A 15-digit phone identifier. Dual-SIM phones may have two; both
            belong to one unit.
          </dd>
          <dt>HSN / GST</dt>
          <dd>
            Product classification and tax rate. Confirm these with your
            accountant.
          </dd>
          <dt>Wholesale</dt>
          <dd>
            Business-to-business pricing; retail is your counter selling price.
          </dd>
          <dt>Under inspection</dt>
          <dd>
            A customer-returned device held out of available stock until you
            check it.
          </dd>
        </dl>
      </section>
    </section>
  );
}
export function BrandingGallery() {
  const [background, setBackground] = useState("light");
  return (
    <section>
      <div className="panel-head">
        <div>
          <span className="eyebrow">BRAND EXPLORATION · NO LOGO SELECTED</span>
          <h3>Four directions. Your choice.</h3>
        </div>
        <select
          aria-label="Logo preview background"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
        >
          <option value="light">Light surface</option>
          <option value="dark">Dark surface</option>
        </select>
      </div>
      <p className="branding-note">
        Generated concept previews. The application keeps temporary text
        branding until you choose. Dark-surface previews use a light holding
        panel to preserve contrast.
      </p>
      <div className={"branding-grid " + background}>
        {[
          ["a", "Premium SS Monogram"],
          ["b", "Mobile & Inventory"],
          ["c", "Modern Business Identity"],
          ["d", "Minimal Wordmark"],
        ].map(([id, name]) => (
          <article className="branding-card" key={id}>
            <div className="branding-label">
              <strong>{id.toUpperCase()}</strong>
              <h3>{name}</h3>
            </div>
            <a
              href={"/branding/logo-option-" + id + ".png"}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={"/branding/logo-option-" + id + ".png"}
                alt={
                  "Option " + id.toUpperCase() + ": Sri Sai Mobile ERP " + name
                }
              />
            </a>
            <div className="brand-context">
              <small>SIDEBAR · DASHBOARD · INVOICE</small>
              <div className="brand-mini-sidebar">
                <span className="brand-lockup">
                  <img
                    src={"/branding/logo-option-" + id + ".png"}
                    alt={"Option " + id.toUpperCase() + " sidebar preview"}
                  />
                </span>
                <span>Dashboard</span>
                <span>New sale</span>
              </div>
              <div className="brand-mini-invoice">
                <span className="brand-lockup">
                  <img
                    src={"/branding/logo-option-" + id + ".png"}
                    alt={
                      "Option " + id.toUpperCase() + " invoice header preview"
                    }
                  />
                </span>
                <small>DEMO INVOICE · SSM-00001</small>
              </div>
              <p>Concept preview only · not applied</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
