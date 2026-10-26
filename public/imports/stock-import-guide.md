# Sri Sai Mobile ERP — prepare a stock import file

Give this document to another AI along with your original WhatsApp stock list.

## Copyable instruction for another AI

Convert my supplied stock list to UTF-8 CSV using exactly these headings:

sku,name,brand,variant,tracking,quantity,purchase_cost,retail_price,wholesale_price,party_code,imei1,imei2,serial_number,hsn,gst_rate

Preserve every supplied model, variant, supplier code, quantity and price. Never invent missing quantities, costs, supplier details, IMEIs or serials. Leave missing cells empty and list what I still need to supply. Use one product/variant per row. Give different RAM/storage/colour variants different SKUs. Keep the same SKU for the same model/variant on later receipts. Do not confuse RAM/storage like 8/128 with quantity or price. Use decimal numbers without currency signs or thousands separators. Tracking is exactly IMEI, Serial or Quantity. Output CSV only, with ordinary CSV quoting around cells containing commas or newlines. Do not add markdown fences to the CSV file.

For IMEI-tracked phones, put one IMEI 1 per physical unit in imei1, separated by semicolons. Optional imei2 values must be in the same order, one per unit if supplied. Keep identifiers as text so leading zeroes survive. For Serial tracking use serial_number in the same way. Quantity accessories do not need device identifiers. Never generate device identifiers. Ask me for real identifiers when receiving actual phones. If my list is only a model catalogue, leave the missing values blank; I will choose Models & prices only in the ERP.

## What each field means

| Heading | Meaning |
|---|---|
| sku | Unique product-variant code, e.g. SAM-A07-4-64-BLACK. Stable across receipts. |
| name | Model or accessory name. Required. |
| brand | Manufacturer / brand. |
| variant | RAM, storage and colour. |
| tracking | IMEI for phones, Serial for individually serialized stock, Quantity for ordinary accessories. |
| quantity | Whole units physically received; required in Receive stock mode. Never infer it from RAM/storage. |
| purchase_cost | Cost per unit, excluding any new calculations. Required for receiving. |
| retail_price | Counter selling price per unit. Required for receiving. |
| wholesale_price | Wholesale selling price per unit. Required for receiving. |
| party_code | Existing supplier code; may be left blank if a default supplier is chosen on the page. |
| imei1 | One valid 15-digit IMEI per phone, semicolon-separated. |
| imei2 | Optional second IMEI per phone, in the same order. |
| serial_number | One serial per unit for Serial tracking. |
| hsn | Verified product tax classification. Confirm with the accountant. |
| gst_rate | GST percentage, 0–100. Blank uses the displayed default of 18%; verify before use. |

## How to use the file

1. Save as `.csv` in UTF-8, not `.xlsx`. In Excel/Sheets export to CSV UTF-8.
2. Open Imports & exports → Import file and select the CSV.
3. Choose **Models & prices only** for a catalogue. Quantities will not enter available stock.
4. Choose **Receive stock** only for goods actually delivered. Enter the supplier code, supplier name if creating a new supplier, and the actual bill/delivery reference.
5. Review every row. Correct missing prices, quantities and identifiers. All errors must be fixed; the ERP does not silently skip bad rows.
6. Confirm import once. Duplicate handset identifiers and repeated receipt references are rejected.
7. Export a full shop backup. Records currently stay in this browser; this is not a shared database.

The supplied template contains clearly labelled DEMO rows. Its phone row intentionally has no quantity or IMEIs. It cannot be received until you provide them. Remove example rows before importing actual goods. Never copy demonstration identifiers into actual stock.

## WhatsApp paste format

Brand headings are supported, followed by model lines. Structured details use `| key: value`:

Samsung
A07 4/64 | qty: 2 | cost: 8500 | retail: 9999 | wholesale: 9200 | party: SUP01

This example has no IMEIs and cannot be received as phone stock until they are supplied. A plain list such as “A07 4/64” can create a catalogue model, but must not silently create saleable phones.

Max file size: 2 MB. Max rows: 1,000 per import. Mixed-supplier CSV rows must reference suppliers already created in Customers & Suppliers, unless using the one new default supplier configured on the import page.
