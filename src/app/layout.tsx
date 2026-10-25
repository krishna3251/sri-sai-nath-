import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sri Sai Mobile ERP",
  description: "Wholesale and retail operations, inventory and billing",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
