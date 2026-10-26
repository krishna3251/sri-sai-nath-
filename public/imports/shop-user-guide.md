# Sri Sai Mobile ERP — a practical guide for the counter

This workspace is for one shop. You do not need to understand accounting software to learn the everyday tasks.

## 1. Open the shop

Enter the shop PIN supplied by the owner. Press Open shop. The session lasts up to 12 hours. Use Lock shop when leaving the counter. Locking does not delete stock or bills. The PIN is shared shop access, not separate staff accounts.

On a first visit choose Start Setup. The guide highlights the actual control with an orange outline and a pointing hand. Read “Here’s what to do”, use the control, then mark the step complete and press Next step. You can close the guide and return from Help & setup. Getting Started has the full checklist and Restart guided tour.

## 2. Know these three things

- Product model: one specific variant, such as a phone with 8 GB RAM, 128 GB storage and black colour.
- SKU: your stable code for that model/variant. All identical units share the SKU.
- Device / IMEI: one physical handset. Each phone has its own IMEI 1 and sometimes IMEI 2. Both IMEIs identify the same phone; they are not two units.

A box of ten identical phones is one product model plus ten device records. A quantity-managed cable can simply have quantity ten.

## 3. Set up the shop once

Open Shop Settings. Enter the shop name, address and contact number. Add only a verified GSTIN if applicable. In Invoices choose a prefix such as SSM. Review tax defaults with your accountant. Your selected logo is C, the business tiles identity.

## 4. Add a supplier or customer

Open Customers & Suppliers and click Add a party. A supplier sells goods to you; a buyer/customer buys from you. Use a unique supplier code such as SUP01. Add a recognizable business name. You can choose Walk-in Customer at the counter instead of creating a record for every buyer.

## 5. Turn a WhatsApp list into records

Open Imports & exports → WhatsApp paste.

Paste the list, then press Read stock list. The site recognizes brand headings and RAM/storage. It does not guess prices, quantities or device identifiers.

For a clear list use this pattern:

Samsung
A07 4/64 | qty: 2 | cost: 8500 | retail: 9999 | wholesale: 9200 | party: SUP01

Review the rows below. Check the SKU, variant, quantity, per-unit purchase cost, retail price, wholesale price and party code.

Choose the right action:

- Models & prices only: suitable for a supplier’s price list or a list without IMEIs. Creates product models; adds no available stock. Missing prices remain zero until set.
- Receive stock: use only after goods physically arrive. Enter a bill/delivery reference, supplier code and every required identifier. Each tracked unit needs its own IMEI/serial. All errors must be fixed before confirmation.

Enter a default supplier code for blank row codes. If the supplier is new, enter its name too. For mixed-supplier rows, create the other suppliers first. Confirm once after checking. Reusing the same receipt reference is blocked. Duplicate IMEIs are rejected even if one appears in IMEI 1 and another in IMEI 2.

Importing adds to existing records; it does not replace the stock list. Review any example/demo records already in the browser before entering actual shop records. Existing demo data is never silently deleted.

## 6. Ask another AI to prepare an import file

Download File instructions for another AI from Imports & exports. Give that document and the original list to your AI. It explains every CSV heading and explicitly forbids invented values. Download CSV template for an example.

Use CSV UTF-8, not a native Excel .xlsx file. Maximum size: 2 MB. Maximum rows: 1,000. Upload in Import file, review, correct errors, then confirm. The template’s phone row intentionally has no IMEIs and cannot be received as saleable stock.

## 7. Receive goods manually

Open Purchase In. Select the supplier, fill in their bill number and date, and add product lines. Enter actual quantities and unit costs. For phones paste one IMEI 1 per phone; optional IMEI 2 values must be in the same order. For serialized accessories enter serial numbers. Quantity-managed accessories need no IMEI. Press Save purchase only when everything matches the physical delivery.

## 8. Make a counter bill

Open New Sale. Choose Walk-in Customer or a saved customer. Click the scan box, scan an IMEI/device label/accessory barcode and press Enter. A keyboard USB scanner usually sends Enter itself.

If you enter a model SKU, choose the exact available handset from the selector. Verify both IMEIs against the box. Check the quantity, agreed price, discount, tax display and payment method. Save demo sale & preview creates a browser-local invoice and marks selected phones Sold. The same handset cannot be added twice or sold while unavailable.

Review the invoice before printing. Its prices and identifiers are snapshots and do not change when future selling prices change. Payment selection is a local invoice note; it does not process a payment or post to Tally. The present invoice/tax workflow is still a prototype and needs review before issuing statutory invoices.

## 9. Check a phone or stock count

Products & Stock shows available quantity by model. Click a model to inspect its individual handsets, suppliers, costs and references. IMEI & Serial Tracking searches individual phones by either IMEI, serial or internal label. Use global search at the top for products, device identifiers, customers, suppliers and invoice numbers.

In stock = available. Sold = already billed. Under inspection = a customer return that must not yet be sold. Returned to supplier = removed from available stock. Low-stock alerts mean five units or fewer.

## 10. Handle returns carefully

Customer return: open Sales Returns, find the original invoice and select the exact handset. Receive for inspection keeps it out of available stock. Inspect it in IMEI & Serial Tracking. Choose Inspection passed only if it is fit for sale, or Mark damaged otherwise. Refunds, credit notes and quantity-item customer returns are not connected in the current version.

Supplier return: open Purchase Returns, choose the correct supplier and enter a unique reference. Enter the exact available handset/serial and quantity. The supplier must match that unit. Confirm the physical unit you are sending back.

## 11. Change prices

Open Price Manager. Retail is the counter price; wholesale is the business selling price. Edit and save the relevant values. Issued local invoice snapshots keep their old prices. In imports, Update selling prices of existing SKUs is an explicit choice; leave it unchecked if the list should only receive stock.

## 12. Export and protect your records

Open Imports & exports → Exports & backup. Download current stock, all device records, parties or invoice lines as CSV. Download Full shop backup for all saved record sets and settings as JSON. Save that file outside the browser after important updates. CSV stock exports can repeat a tracked SKU once per available device so both IMEIs remain aligned. Do not receive an exported stock list back into the same shop.

The current app stores records in this browser, not a connected database. Another computer or cleared browser storage will not show the same records. The backup is an export; automatic JSON restore is not connected. Keep the file for recovery/conversion rather than assuming it has been synchronized online.

## What is not connected yet

There is no shared Neon persistence, cross-device stock ledger, individual staff authorization, external payment ledger, automatic refunds/credit notes or Tally connector. Reports describe saved local records; sample balances are labelled as sample. A successful local import or invoice is not proof of an external accounting entry.

If a storage warning appears, stop relying on automatic saves, keep the tab open and export a backup. The guide itself remains usable even when its checklist cannot be saved.
