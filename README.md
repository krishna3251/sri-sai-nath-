# Sri Sai Mobile ERP — starter application

A Next.js + TypeScript application with the agreed Ink × Paper × Signal Red × Industrial Orange Neo-Brutalist visual system.

## Preview
Vercel preview for the initial working UI build:
https://sri-sai-nath-7eev6juep-krishna3251s-projects.vercel.app

## Screens included
- Dashboard
- Retail POS and Wholesale Sales
- Purchase In, Purchase Returns and Sales Returns
- Products & Stock, Categories, IMEI & Serial Tracking, Barcode Management and Stock Movements
- Dynamic Price Manager
- Parties & Ledgers
- Payments & Receipts
- Invoices & Credit Notes
- Reports
- Tally Sync Center
- Staff & Permissions
- Shop Settings

## What works in this prototype
- Responsive navigation and screen layouts
- Browser-local demo product and party records
- **Unit-level phone tracking:** each physical phone has its own record, IMEI 1, optional IMEI 2, internal device label, purchase cost and status
- Add-product and purchase-in flows require one IMEI 1 per phone in stock; IMEI 2 is optional and can be entered in the same order
- IMEI 1 and IMEI 2 can both be scanned to find the same physical phone; scanning a model SKU opens a picker so the cashier must select the exact handset
- Sales attach the selected device IDs / IMEIs to the demo invoice and mark those units sold; supplier returns can identify the exact unit
- Device registry search, status filters and CSV export for IMEI 1 / IMEI 2 / serial / internal label
- Duplicate IMEIs are rejected in the browser demo; PostgreSQL schema includes format checks plus cross-column uniqueness enforcement
- Browser-local price editing, stock adjustments, invoice preview and CSV exports
- PostgreSQL schema starter in `db/schema.sql`

## Setup locally
Requires Node.js 20 or 22.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `DATABASE_URL` to the Neon connection string only after provisioning Neon. Do not expose it in client code or `NEXT_PUBLIC_*` variables.

## Important limitations
This is a prototype, not production-ready accounting software:
- Demo data is saved to the current browser's localStorage. It does not sync across computers and is not a durable source of truth.
- The PostgreSQL schema is an initial design only. The UI's device records are still stored in this browser's localStorage; database-backed API routes, migrations and transactional persistence are not wired.
- The sample catalog includes generated demo identifiers. They are illustrative only and must never be treated as real handset inventory.
- Authentication and server-side authorization/role enforcement are not implemented.
- Tally sync is a design/status screen; no connector or vouchers are sent to TallyPrime.
- Barcode label generation and physical printer testing are not implemented.
- Invoice/tax behavior and statutory particulars must be reviewed and tested before real tax invoices are issued.

Do not enter real customer financial records until database persistence, authentication, permissions, audit history and tested backups are ready.

## Production milestones
1. Provision Neon and apply reviewed database migrations.
2. Implement server-only database access, transactional stock ledger, atomic invoice numbering and immutable issued invoice snapshots.
3. Add authentication, server-side role enforcement, audit events and backup/restore tests.
4. Implement and test barcode generation, device/IMEI uniqueness and A4/thermal print layouts.
5. Build the secure outbound Windows connector for TallyPrime; test duplicate-safe voucher imports and reconciliation in a separate company.
6. Validate GST/HSN and invoice obligations with your accountant.
