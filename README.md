# Sri Sai Mobile ERP — starter application

This repository is being bootstrapped as a Next.js + TypeScript application using the agreed Ink × Paper × Signal Red × Industrial Orange Neo-Brutalist UI.

## Build scope
- App shell and navigation for Dashboard, Retail POS, Wholesale Sales, Purchase In, Purchase Returns, Sales Returns, Products & Stock, Categories, IMEI & Serial Tracking, Barcode Management, Stock Movements, Dynamic Price Manager, Parties & Ledgers, Payments & Receipts, Invoices & Credit Notes, Reports, Tally Sync Center, Staff & Permissions, and Shop Settings.
- Explicitly labelled demo workflows and sample records only.
- Server-side PostgreSQL schema foundation.
- No live Tally or database state is claimed until the connector and credentials are configured.

## Start
- Node.js 20 or 22
- `npm install`
- Copy `.env.example` to `.env.local`
- Set `DATABASE_URL` to the Neon connection string only after provisioning Neon
- `npm run dev`

## Production blockers
Before entering real shop data, implement and test authentication, server-side RBAC, database-backed transactional stock movements, atomic invoice numbering, product-specific GST tax rules, persistent audit logs, backups, PDF generation and the authenticated Windows connector for TallyPrime. The local demo is not an accounting source of truth.
