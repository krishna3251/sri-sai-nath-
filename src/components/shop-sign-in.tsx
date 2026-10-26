"use client";
import { useState } from "react";
import { LockKeyhole, ArrowRight, Eye, EyeOff } from "lucide-react";
export default function SignIn({ configured }: { configured: boolean }) {
  const [pin, setPin] = useState(""),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <main className="shop-entry">
      <section className="shop-entry-story">
        <div className="chosen-logo">
          <img src="/branding/logo-option-c.png" alt="Sri Sai Mobile ERP" />
        </div>
        <span className="eyebrow">ONE SHOP. ONE SIMPLE WORKSPACE.</span>
        <h1>
          Open your shop.
          <br />
          Keep everything in order.
        </h1>
        <p>
          Stock, suppliers, IMEIs and billing — together, with a guide whenever
          you need one.
        </p>
        <div className="entry-steps">
          <span>01 Receive stock</span>
          <span>02 Choose the handset</span>
          <span>03 Create the bill</span>
        </div>
      </section>
      <form
        className="shop-entry-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const r = await fetch("/api/shop-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ pin }),
            });
            const d = await r.json();
            if (!r.ok) {
              setError(d.error || "Could not open the shop. Try again.");
              return;
            }
            window.location.assign("/");
          } catch {
            setError("Connection failed. Check your connection and try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="entry-lock">
          <LockKeyhole size={25} />
        </div>
        <span className="eyebrow">SRI SAI MOBILE ERP</span>
        <h2>Welcome back</h2>
        <p>Enter the shop PIN to open your workspace.</p>
        <label className="field">
          Shop PIN
          <div className="pin-field">
            <input
              required
              autoFocus
              type={show ? "text" : "password"}
              inputMode="numeric"
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={64}
            />
            <button
              type="button"
              className="icon-btn"
              aria-label={show ? "Hide PIN" : "Show PIN"}
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {(!configured || error) && (
          <p className="entry-error" role="alert">
            {!configured
              ? "Shop access is not configured on this server yet. Ask the owner to configure the shop PIN and session secret."
              : error}
          </p>
        )}
        <button
          className="btn btn-primary"
          disabled={!configured || busy}
          type="submit"
        >
          {busy ? "Opening your shop…" : "Open shop"}
          <ArrowRight size={16} />
        </button>
        <small>
          Shared access for this shop. Locks automatically after 12 hours. Use
          “Lock shop” when leaving the counter.
        </small>
      </form>
    </main>
  );
}
