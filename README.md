# Sri Sai Mobile ERP — starter application

A Next.js + TypeScript mobile-shop workspace with warm-neutral surfaces, navy navigation and a restrained orange accent. This feature branch improves the existing ERP rather than replacing its modules.

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
- A server-checked shared shop PIN gate is implemented. Individual staff accounts and role enforcement are not implemented.
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


## Shop workspace redesign

- Task-first dashboard with today’s browser-local sales, available stock, low-stock records and recent sales / purchases.
- Grouped navigation, a collapsible administration section and global search across products, both IMEIs, device labels, customers, suppliers and invoices.
- First-visit welcome, optional nine-step guide, contextual screen navigation, manually completed checklist, browser-local progress and replay from Getting Started.
- Four **actual image-generated logo concepts**, labelled A–D in Shop Settings → Branding gallery. The owner selected **C**, which is applied to entry, sidebar, welcome and invoice headers. Original concept PNGs live in `public/branding/`.
- Purchase receipts retain supplier bill references, costs, quantities and dual identifiers. Exact-device supplier returns validate stock and supplier ownership.
- Demo checkout snapshots line totals, discounts, tax, both IMEIs and payment selection. A handset cannot appear twice or sell again after being marked sold.
- Customer-returned handsets enter **Under inspection** without increasing saleable stock. Explicit inspection can release the unit or mark it damaged. Refunds, credit notes and quantity-item returns remain unavailable.
- Browser storage hydration avoids overwriting saved records on first render; storage failures are visible.
- Small-screen tables display labelled rows rather than requiring wide horizontal scrolling.
- Repaired the malformed SQL foundation. A shared IMEI registry enforces uniqueness across both device columns using a primary key, with checksum constraints and transactional registry maintenance. **No schema was applied to Neon or any existing database.**

### Validation

```bash
npm ci
npm run typecheck
npm run lint
npm run test:schema
npm run build
npx playwright install chromium
npm run test:e2e
```

`test:schema` runs the complete schema in PGlite. Only `CREATE EXTENSION pgcrypto` is omitted because PGlite provides `gen_random_uuid()` but does not ship that extension. It checks valid dual IMEIs, invalid checksums, same-unit / cross-column duplicates and registry updates / deletion. It is not a live Neon migration or concurrency-load test.

The browser test starts the built application on 127.0.0.1:3100 and creates isolated demo data. Set `BASE_URL` to test a deployed preview, or `CHROMIUM_PATH` to use an existing browser binary. It checks onboarding, POS, invoice snapshots, stock consistency, returns, purchase receiving, search, module navigation, logo loading and mobile layouts. Screenshots go to ignored `test-results/`.

### Remaining production work

This remains a **single-browser demo** behind a shared PIN gate. There are no individual staff accounts, role-based authorization, API persistence, shared transactional stock ledger, multi-tab concurrency protection, external payment processing, Tally connector, refund posting or statutory invoice certification. Purchase history stores a receipt summary and unit references, not a complete immutable accounting purchase document. Stock movements are derived demo activity, not a database ledger. Existing saved records are preserved and not rewritten to new demo identifiers. Historical records may lack the newer payment / receipt fields.

No schema migration, production deployment or merge into `main` is part of this change. PR #1 was already merged before this redesign began; review the new feature-branch follow-up separately.


### Review follow-up

The setup guide now warns if progress cannot be saved and continues working in memory. Later successful saves clear the warning. Invalid stored guide steps and checklist entries are normalized before use. Browser checks simulate blocked guide storage, recovery and malformed saved progress.

IMEI schema tests assert the expected PostgreSQL SQLSTATE and constraint, verify both directions of cross-column duplication, replace a non-null IMEI, reuse the released identifier and confirm a conflicting update rolls back both the device and registry. These checks still run in PGlite, not against a live Neon database.


## Single-shop entry, imports and hands-on guide

This workspace is configured for **one shop**, with a server-checked shared PIN and an encrypted HttpOnly session cookie. Set `SHOP_PIN` and `SHOP_SESSION_SECRET` (at least 32 random characters) in server-only environment variables. Never use `NEXT_PUBLIC_` or commit actual secrets. For local HTTP only, set `SHOP_COOKIE_SECURE=false` in the ignored `.env.local`; omit that override on HTTPS deployments. Sessions expire after 12 hours; Lock shop destroys the cookie. Invalid attempts are throttled in memory per server instance. This is a basic shared shop gate, not staff identity, a distributed brute-force defence or full production access control.

- The existing workspace is now a client component rendered only after the server page validates the shop session. `/sign-in` and the session endpoint handle entry/lock; the PIN is not in the browser bundle.
- Imports & exports parses WhatsApp brand headings and labelled details, or UTF-8 CSV / plain text files up to 2 MB and 1,000 rows. Rows are editable and validated before a single explicit confirmation.
- Receiving requires a unique delivery reference, known supplier (or one explicitly named new default supplier), positive whole quantities, prices and exact valid device identifiers. Cross-row/cross-column duplicates reject the whole batch. Browser-save failure leaves existing state unchanged.
- Catalogue mode creates models only and never turns an identifier-free phone list into saleable stock. Missing values are not invented. Updating existing selling prices is an explicit checkbox; invoice snapshots remain unchanged.
- Current stock, devices, parties and invoice lines export as CSV. Tracked stock exports one row per available device so optional second IMEIs stay aligned. Full JSON backup includes all saved records/settings. Automatic JSON backup restore is not implemented.
- Logo C is applied. No image-generation output was replaced or fabricated; original candidate files remain available.
- The nine-step guide now outlines actual controls and uses a hand-pointer coach card. Its text, checklist and progress remain available on mobile, with replay/resume and contextual screen navigation.

Downloadable files in `public/imports/`: `stock-template.csv`, `stock-import-guide.md` (includes a copyable instruction for another AI), and `shop-user-guide.md` (complete plain-language counter guide). The template uses labelled demo records and intentionally omits phone identifiers.

Additional check: `npm run test:imports`. Browser checks now load the ignored local environment for the test PIN, test incorrect PIN / cross-origin rejection, WhatsApp receiving, catalogue safeguards, duplicate receipt prevention, file upload, backup contents, highlighted controls, invalid session rejection and locking. No actual PIN is stored in test source.

**Persistence remains browser-local.** No Neon/database environment was configured on the project during this implementation. Data does not sync between computers, clearing browser storage can remove it, and imports add to existing records rather than replacing or silently deleting them. Export regular backups. A complete shared transactional database, payment ledger, automatic refunds/credit notes and Tally remain production milestones, not completed integrations.
