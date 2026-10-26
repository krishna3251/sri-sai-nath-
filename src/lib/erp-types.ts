export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  variant: string;
  sku: string;
  barcode: string;
  imei?: string;
  supplierCode: string;
  purchaseCost: number;
  wholesalePrice: number;
  retailPrice: number;
  stock: number;
  tracking: "IMEI" | "Quantity" | "Serial";
  hsn: string;
  gstRate: number;
  status: string;
};
export type PurchaseRecord = {
  id: string;
  number: string;
  date: string;
  supplier: string;
  kind: string;
  total: number;
  qty: number;
};
export type ReturnRecord = {
  id: string;
  invoice: string;
  deviceId: string;
  date: string;
  name: string;
};
export type DeviceUnit = {
  id: string;
  productId: string;
  imei1: string;
  imei2: string;
  serialNumber: string;
  barcode: string;
  supplierCode: string;
  purchaseCost: number;
  status:
    | "In stock"
    | "Sold"
    | "Returned to supplier"
    | "Damaged"
    | "Under inspection";
  receivedAt: string;
  receivingReference?: string;
  invoiceNumber?: string;
};
export type Party = {
  id: string;
  code: string;
  name: string;
  phone: string;
  gstin: string;
  roles: string[];
  city: string;
  receivable: number;
  payable: number;
};
