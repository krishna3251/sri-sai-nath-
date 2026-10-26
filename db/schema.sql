-- Sri Sai Mobile ERP PostgreSQL schema foundation
-- Review, apply to a test database, and validate migration order before real use.
-- No sample business records are seeded by this file.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE party_role AS ENUM ('supplier', 'buyer');
CREATE TYPE product_tracking AS ENUM ('imei', 'serial', 'quantity');
CREATE TYPE stock_movement_kind AS ENUM (
  'opening', 'purchase_receipt', 'sale_issue', 'purchase_return',
  'sales_return', 'adjustment', 'damage', 'transfer_in', 'transfer_out'
);
CREATE TYPE invoice_kind AS ENUM (
  'retail_sale', 'wholesale_sale', 'purchase', 'purchase_return',
  'sales_return', 'credit_note', 'debit_note'
);
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'cancelled', 'voided');
CREATE TYPE sync_status AS ENUM ('pending', 'processing', 'synced', 'failed', 'needs_review');

CREATE TABLE parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_code text UNIQUE,
  display_name text NOT NULL,
  phone text,
  email text,
  gstin text,
  billing_address text,
  city text,
  state_code text,
  roles party_role[] NOT NULL DEFAULT ARRAY['buyer']::party_role[],
  opening_receivable numeric(14,2) NOT NULL DEFAULT 0 CHECK (opening_receivable >= 0),
  opening_payable numeric(14,2) NOT NULL DEFAULT 0 CHECK (opening_payable >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX parties_name_search_idx ON parties USING gin (to_tsvector('simple', display_name));
CREATE INDEX parties_gstin_idx ON parties(gstin) WHERE gstin IS NOT NULL;

CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  parent_id uuid REFERENCES product_categories(id),
  default_tracking product_tracking NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  brand text,
  category_id uuid REFERENCES product_categories(id),
  variant text,
  unit_name text NOT NULL DEFAULT 'pcs',
  tracking product_tracking NOT NULL,
  hsn text,
  gst_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (gst_rate >= 0 AND gst_rate <= 100),
  default_wholesale_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (default_wholesale_price >= 0),
  default_retail_price numeric(14,2) NOT NULL DEFAULT 0 CHECK (default_retail_price >= 0),
  barcode text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_name_search_idx ON products USING gin (to_tsvector('simple', name));
CREATE INDEX products_barcode_idx ON products(barcode) WHERE barcode IS NOT NULL;

CREATE TABLE product_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  price_type text NOT NULL CHECK (price_type IN ('wholesale', 'retail')),
  old_price numeric(14,2) NOT NULL CHECK (old_price >= 0),
  new_price numeric(14,2) NOT NULL CHECK (new_price >= 0),
  reason text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_price_history_product_date_idx ON product_price_history(product_id, changed_at DESC);

CREATE TABLE purchase_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES parties(id),
  supplier_bill_number text,
  bill_date date NOT NULL,
  document_status invoice_status NOT NULL DEFAULT 'draft',
  currency text NOT NULL DEFAULT 'INR',
  taxable_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (taxable_total >= 0),
  tax_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  grand_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  amount_paid numeric(14,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz
);
CREATE INDEX purchase_documents_supplier_date_idx ON purchase_documents(supplier_id, bill_date DESC);

CREATE TABLE purchase_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES purchase_documents(id),
  product_id uuid NOT NULL REFERENCES products(id),
  quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
  unit_cost numeric(14,2) NOT NULL CHECK (unit_cost >= 0),
  discount_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  taxable_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (taxable_amount >= 0),
  tax_rate numeric(5,2) NOT NULL DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  tax_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0)
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  imei_1 text UNIQUE,
  imei_2 text UNIQUE,
  serial_number text UNIQUE,
  barcode text UNIQUE,
  purchase_line_id uuid REFERENCES purchase_lines(id),
  supplier_id uuid REFERENCES parties(id),
  purchase_cost numeric(14,2) NOT NULL DEFAULT 0 CHECK (purchase_cost >= 0),
  device_status text NOT NULL DEFAULT 'in_stock'
    CHECK (device_status IN ('in_stock','reserved','sold','returned_to_supplier','returned_by_customer','damaged','under_inspection','needs_identification','removed')),
  current_invoice_line_id uuid,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (imei_1 IS NOT NULL OR imei_2 IS NOT NULL OR serial_number IS NOT NULL OR barcode IS NOT NULL),
  CHECK (imei_1 IS NULL OR imei_1 ~ '^[0-9]{15}$'),
  CHECK (imei_2 IS NULL OR imei_2 ~ '^[0-9]{15}$'),
  CONSTRAINT devices_distinct_imeis CHECK (imei_1 IS NULL OR imei_2 IS NULL OR imei_1 <> imei_2)
);
CREATE INDEX devices_product_status_idx ON devices(product_id, device_status);
CREATE INDEX devices_supplier_idx ON devices(supplier_id);

-- One unique registry for both IMEI columns. The primary key handles concurrent writes.
-- This is an unapplied foundation; use reviewed migrations for an existing database.
CREATE TABLE device_imei_registry (
 imei text PRIMARY KEY,
 device_id uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE
);
CREATE FUNCTION valid_imei(value text) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE total integer := 0; digit integer; pos integer;
BEGIN
 IF value !~ '^[0-9]{15}$' THEN RETURN false; END IF;
 FOR pos IN 1..15 LOOP
   digit := substring(value FROM pos FOR 1)::integer;
   IF pos % 2 = 0 THEN digit := digit * 2; IF digit > 9 THEN digit := digit - 9; END IF; END IF;
   total := total + digit;
 END LOOP;
 RETURN total % 10 = 0;
END;
$$;
ALTER TABLE devices ADD CONSTRAINT devices_imei_1_checksum CHECK (imei_1 IS NULL OR valid_imei(imei_1));
ALTER TABLE devices ADD CONSTRAINT devices_imei_2_checksum CHECK (imei_2 IS NULL OR valid_imei(imei_2));
CREATE FUNCTION maintain_device_imei_registry() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 DELETE FROM device_imei_registry WHERE device_id = NEW.id;
 IF NEW.imei_1 IS NOT NULL THEN INSERT INTO device_imei_registry(imei, device_id) VALUES (NEW.imei_1,NEW.id); END IF;
 IF NEW.imei_2 IS NOT NULL THEN INSERT INTO device_imei_registry(imei, device_id) VALUES (NEW.imei_2,NEW.id); END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER devices_imei_cross_column_unique AFTER INSERT OR UPDATE OF imei_1, imei_2 ON devices
FOR EACH ROW EXECUTE FUNCTION maintain_device_imei_registry();

CREATE TABLE sales_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  financial_year text NOT NULL,
  invoice_kind invoice_kind NOT NULL,
  buyer_id uuid REFERENCES parties(id),
  source_purchase_id uuid REFERENCES purchase_documents(id),
  invoice_date date NOT NULL DEFAULT CURRENT_DATE,
  document_status invoice_status NOT NULL DEFAULT 'draft',
  price_mode text NOT NULL DEFAULT 'inclusive' CHECK (price_mode IN ('inclusive','exclusive')),
  supply_type text NOT NULL CHECK (supply_type IN ('intra_state','inter_state')),
  supplier_gstin text,
  buyer_gstin text,
  place_of_supply_state_code text,
  taxable_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (taxable_total >= 0),
  cgst_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (cgst_total >= 0),
  sgst_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (sgst_total >= 0),
  igst_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (igst_total >= 0),
  discount_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  rounding_adjustment numeric(8,2) NOT NULL DEFAULT 0,
  grand_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  amount_paid numeric(14,2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  issued_at timestamptz,
  CHECK (
    (supply_type = 'intra_state' AND igst_total = 0)
    OR
    (supply_type = 'inter_state' AND cgst_total = 0 AND sgst_total = 0)
  )
);
CREATE INDEX sales_invoices_date_idx ON sales_invoices(invoice_date DESC);
CREATE INDEX sales_invoices_buyer_date_idx ON sales_invoices(buyer_id, invoice_date DESC);

CREATE TABLE sales_invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES sales_invoices(id),
  product_id uuid REFERENCES products(id),
  device_id uuid REFERENCES devices(id),
  description_snapshot text NOT NULL,
  sku_snapshot text,
  hsn_snapshot text,
  imei_snapshot text,
  imei_2_snapshot text,
  serial_snapshot text,
  barcode_snapshot text,
  quantity numeric(14,3) NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  taxable_amount numeric(14,2) NOT NULL CHECK (taxable_amount >= 0),
  tax_rate numeric(5,2) NOT NULL CHECK (tax_rate >= 0 AND tax_rate <= 100),
  cgst_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (cgst_amount >= 0),
  sgst_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (sgst_amount >= 0),
  igst_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (igst_amount >= 0),
  total_amount numeric(14,2) NOT NULL CHECK (total_amount >= 0)
);
CREATE INDEX sales_invoice_lines_invoice_idx ON sales_invoice_lines(invoice_id);
CREATE INDEX sales_invoice_lines_device_idx ON sales_invoice_lines(device_id);

CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  device_id uuid REFERENCES devices(id),
  movement_kind stock_movement_kind NOT NULL,
  quantity_delta numeric(14,3) NOT NULL CHECK (quantity_delta <> 0),
  purchase_line_id uuid REFERENCES purchase_lines(id),
  invoice_line_id uuid REFERENCES sales_invoice_lines(id),
  party_id uuid REFERENCES parties(id),
  reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX stock_movements_product_date_idx ON stock_movements(product_id, created_at DESC);
CREATE INDEX stock_movements_device_date_idx ON stock_movements(device_id, created_at DESC) WHERE device_id IS NOT NULL;

CREATE TABLE payment_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  party_id uuid NOT NULL REFERENCES parties(id),
  payment_direction text NOT NULL CHECK (payment_direction IN ('receipt','supplier_payment')),
  payment_method text NOT NULL CHECK (payment_method IN ('cash','upi','bank_transfer','cheque','other')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference_number text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE payment_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payment_entries(id),
  invoice_id uuid NOT NULL REFERENCES sales_invoices(id),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  UNIQUE(payment_id, invoice_id)
);

CREATE TABLE accounting_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_kind text NOT NULL,
  source_id uuid NOT NULL,
  target_system text NOT NULL DEFAULT 'tallyprime',
  sync_status sync_status NOT NULL DEFAULT 'pending',
  idempotency_key text NOT NULL UNIQUE,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  tally_voucher_id text,
  last_error text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(source_kind, source_id, target_system)
);
CREATE INDEX accounting_sync_queue_pending_idx ON accounting_sync_queue(sync_status, requested_at);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_events_entity_idx ON audit_events(entity_type, entity_id, created_at DESC);
