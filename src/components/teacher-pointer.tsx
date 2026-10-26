"use client";
import { useEffect, useState } from "react";
export const teacherLessons = [
  {
    selector: '[data-tour="shop-name"]',
    say: "Start here: type your shop name. This name appears on every invoice. Then add the address and contact number below.",
  },
  {
    selector: ".heading-action .btn",
    say: "Click Add a party. Choose Supplier for someone you buy from, or Buyer for someone who buys from you. Give each supplier a unique code.",
  },
  {
    selector: ".heading-action .btn-primary",
    say: "Click Add product. Make a separate model for each RAM, storage and colour. Opening quantity is the number already on your shelf.",
  },
  {
    selector: ".form-layout select",
    say: "First choose the supplier here. Fill their bill number and date, then add products and the exact identifiers from the boxes you received.",
  },
  {
    selector: '[data-tour="scan-item"]',
    say: "Click this scan box. Scan a phone’s IMEI or type a code and press Enter. If you enter a model SKU, choose the actual handset from the list.",
  },
  {
    selector: ".toolbar .search-field",
    say: "Search either IMEI here. Check the status before selling or returning a handset. Under inspection is not available for sale.",
  },
  {
    selector: ".report-grid",
    say: "Open a report to download the saved records. These are browser-local totals. Payments, refunds and Tally are separate workflows, not automatically posted.",
  },
  {
    selector: '[data-tour="import-source"]',
    say: "Paste your WhatsApp list here, then click Read stock list. Review every row below. Party code, IMEI and serial are optional. Model-only lists create a catalogue; received phones without identifiers wait in Stock Manager until you identify and inspect them.",
  },
  {
    selector: '[data-tour="export-panel"]',
    say: "Click Full shop backup to save all records as JSON. Keep the file outside this browser. CSV exports help you review records or prepare data with another AI.",
  },
];
export default function TeacherPointer({
  active,
  step,
  screen,
}: {
  active: boolean;
  step: number;
  screen: string;
}) {
  const [box, setBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  useEffect(() => {
    if (!active) {
      setBox(null);
      return;
    }
    let frame = 0;
    const lesson = teacherLessons[step];
    if (!lesson) return;
    const locate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = document.querySelector<HTMLElement>(lesson.selector);
        if (!el) {
          setBox(null);
          return;
        }
        const r = el.getBoundingClientRect();
        setBox(
          r.width && r.height
            ? { left: r.left, top: r.top, width: r.width, height: r.height }
            : null,
        );
      });
    };
    const el = document.querySelector<HTMLElement>(lesson.selector);
    el?.scrollIntoView({
      block: window.innerWidth < 700 ? "start" : "center",
      behavior: "smooth",
    });
    locate();
    window.addEventListener("resize", locate);
    window.addEventListener("scroll", locate, true);
    const observer = new MutationObserver(locate);
    observer.observe(document.querySelector(".workspace") || document.body, {
      childList: true,
      subtree: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", locate);
      window.removeEventListener("scroll", locate, true);
      observer.disconnect();
    };
  }, [active, step, screen]);
  if (
    !active ||
    !box ||
    box.top > window.innerHeight ||
    box.top + box.height < 0
  )
    return null;
  const left = Math.max(12, Math.min(box.left, window.innerWidth - 700));
  const top =
    box.top + box.height + 145 < window.innerHeight
      ? box.top + box.height + 16
      : Math.max(105, box.top - 145);
  return (
    <div aria-hidden="true" className="teacher-overlay">
      <div
        className="teacher-spotlight"
        data-testid="teacher-highlight"
        style={{
          left: box.left - 5,
          top: box.top - 5,
          width: box.width + 10,
          height: box.height + 10,
        }}
      />
      <div className="teacher-coach" style={{ left, top }}>
        <span className="teacher-hand">☝️</span>
        <div>
          <strong>Let me show you · Step {step + 1}</strong>
          <p>{teacherLessons[step]?.say}</p>
        </div>
      </div>
    </div>
  );
}
