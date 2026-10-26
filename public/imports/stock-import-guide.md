# Sri Sai Mobile ERP — prepare a stock import file

Give this document to another AI along with your original WhatsApp stock list.

## Copyable instruction for another AI

Convert my supplied stock list to UTF-8 CSV using exactly these headings:

sku,name,brand,variant,tracking,quantity,purchase_cost,retail_price,wholesale_price,party_code,imei1,imei2,serial_number,hsn,gst_rate

Preserve every supplied model, variant, supplier code, quantity and price. Never invent missing quantities, costs, supplier details, IMEIs or serials. Leave missing cells empty and list what I still need to supply. Use one product/variant per row. Give different RAM/storage/colour variants different SKUs. Keep the same SKU for the same model/variant on later receipts. Do not confuse RAM/storage like 8/128 with quantity or price. Use decimal numbers without currency signs or thousands separators. Tracking is exactly IMEI, Serial or Quantity. Output CSV only, with ordinary CSV quoting around cells containing commas or newlines. Do not add markdown fences to the CSV file.

For IMEI-tracked phones, put one IMEI 1 per physical unit in imei1, separated by semicolons. Optional imei2 values must be in the same order, one per unit if supplied. Keep identifiers as text so leading zeroes survive. For Serial tracking use serial_number in the same way. Quantity accessories do not need device identifiers. Never generate device identifiers. IMEI, serial number and party code are optional at import. Units without primary identifiers are saved as Needs identification, excluded from saleable stock, and given only an internal tracking label. Never invent device identifiers. If my list is only a model catalogue, leave the missing values blank; I will choose Models & prices only in the ERP.

## What each field means

| Heading | Meaning |
|---|---|
| sku | Unique product-variant code, e.g. SAM-A07-4-64-BLACK. Stable across receipts. |
| name | Model or accessory name. Required. |
| brand | Manufacturer / brand. |
| variant | RAM, storage and colour. |
| tracking | IMEI for phones, Serial for individually serialized stock, Quantity for ordinary accessories. |
| quantity | Whole units physically received; required in Receive stock mode. Never infer it from RAM/storage. |
| purchase_cost | Cost per unit. Required when receiving quantities, optional for catalogue models. |
| retail_price | Counter selling price per unit. Optional; blank starts at zero for new products. Set before billing. |
| wholesale_price | Wholesale selling price per unit. Optional; blank starts at zero for new products. Set before billing. |
| party_code | Optional. Leave blank even without a default supplier. Assign later in Stock Manager. If supplied, use a known supplier code or create the default supplier by name. |
| imei1 | Optional at import. If supplied, valid 15-digit IMEIs, semicolon-separated. Missing units need identification before sale. |
| imei2 | Optional second IMEI per phone, in the same order. |
| serial_number | Optional at import. Missing units need identification before sale. |
| hsn | Verified product tax classification. Confirm with the accountant. |
| gst_rate | GST percentage, 0–100. Blank uses the displayed default of 18%; verify before use. |

## How to use the file

1. Save as `.csv` in UTF-8, not `.xlsx`. In Excel/Sheets export to CSV UTF-8.
2. Open Imports & exports → Import file and select the CSV.
3. Choose **Models & prices only** for a catalogue. Quantities will not enter available stock.
4. Choose **Receive stock** only for goods actually delivered. Enter the actual bill/delivery reference. Supplier code is optional. Purchase cost and quantity are required; selling prices may be set later.
5. Review every row. Correct quantities and costs. Identifiers are optional now; invalid or duplicate identifiers are still rejected. All errors must be fixed; the ERP does not silently skip bad rows.
6. Confirm import once. Duplicate handset identifiers and repeated receipt references are rejected.
7. Export a full shop backup. Records currently stay in this browser; this is not a shared database.

The supplied template contains clearly labelled DEMO rows. Its phone row intentionally has no quantity or IMEIs. It is a model-only catalogue until you enter quantities and purchase costs. Remove example rows before importing actual goods. Never copy demonstration identifiers into actual stock.

## WhatsApp paste format

Brand headings are supported, followed by model lines. Structured details use `| key: value`:

Samsung
A07 4/64 | qty: 2 | cost: 8500 | retail: 9999 | wholesale: 9200 | party: SUP01

This example imports two units as Needs identification. They are not available to bill. A plain list such as “A07 4/64” can create a catalogue model, but must not silently create saleable phones.

Max file size: 2 MB. Max rows: 1,000 per import. Mixed-supplier CSV rows must reference suppliers already created in Customers & Suppliers, unless using the one new default supplier configured on the import page.

## Finish unidentified stock

1. Products & Stock → Phones & serials → filter **Needs identification**.
2. Choose **Add identifiers**. Enter real IMEI 1 (IMEI 2 if present) or serial number, check cost and optionally assign supplier. Save with a reason.
3. The unit moves to **Under inspection**. Go to IMEI & Serial Tracking, check the physical phone, then choose **Inspection passed**.
4. Only then does it count as available and appear in the handset selector for a sale. Do not import the same goods again to add their IMEIs.

A file without any quantities automatically selects Models & prices only. Blank quantity never becomes one unit. For a mixed list, split model-only rows and received rows into separate imports. No supplier balance is created for an unassigned supplier.

WhatsApp cost shorthand: `A07 4/64 @8500` or `A07 4/64 ₹8500` reads 8500 as purchase cost. Enter quantity explicitly (`| qty: 2`). Unlabelled trailing numbers are not guessed as costs or quantities. Preview and edit every row before saving. WhatsApp is paste/text import, not an automatic WhatsApp account connection.
