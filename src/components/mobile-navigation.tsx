"use client";
import { FileUp, LayoutDashboard, Menu, Package, ShoppingCart } from "lucide-react";

type Destination = "Dashboard" | "Retail POS" | "Products & Stock" | "Imports & exports";
const shortcuts = [
  { screen: "Dashboard", label: "Home", icon: LayoutDashboard },
  { screen: "Retail POS", label: "Sale", icon: ShoppingCart },
  { screen: "Products & Stock", label: "Stock", icon: Package },
  { screen: "Imports & exports", label: "Import", icon: FileUp },
] as const;

export default function MobileNavigation({ screen, navigate, openMenu, menuOpen, itemCount, total }: {
  screen: string;
  navigate: (destination: Destination) => void;
  openMenu: () => void;
  menuOpen: boolean;
  itemCount: number;
  total: string;
}) {
  const selling = screen === "Retail POS" || screen === "Wholesale Sales";
  return (
    <>
      {selling && itemCount > 0 && (
        <div className="mobile-bill-shortcut" aria-label="Current bill summary">
          <div><small>{itemCount} {itemCount === 1 ? "item" : "items"} in bill</small><strong>{total}</strong></div>
          <a className="btn btn-primary" href="#checkout-summary" onClick={(event) => {
            event.preventDefault();
            const checkout = document.getElementById("checkout-summary");
            checkout?.focus({ preventScroll: true });
            checkout?.scrollIntoView({ block: "start", behavior: "instant" });
          }}>Review bill</a>
        </div>
      )}
      <nav className="mobile-task-nav" aria-label="Quick shop navigation">
        {shortcuts.map(({ screen: destination, label, icon: Icon }) => {
          const active = screen === destination || (destination === "Retail POS" && selling);
          return (
            <button key={destination} aria-label={label} aria-current={active ? "page" : undefined} onClick={() => navigate(destination)}>
              <Icon size={20} aria-hidden="true" /><span>{label}</span>
            </button>
          );
        })}
        <button aria-label="All shop modules" aria-controls="shop-navigation" aria-expanded={menuOpen} onClick={openMenu}>
          <Menu size={20} aria-hidden="true" /><span>More</span>
        </button>
      </nav>
    </>
  );
}
