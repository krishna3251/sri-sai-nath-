"use client";
import StockManager from "@/components/stock-manager";
import {
  applyStockCommand,
  type StockCommand,
  type StockAudit,
} from "@/lib/stock-operations";
import ImportCenter from "@/components/import-center";
import {
  prepareImport,
  downloadText,
  type ImportRow,
  type ImportOptions,
} from "@/lib/stock-import";
import type {
  Product,
  DeviceUnit,
  Party,
  PurchaseRecord,
  ReturnRecord,
} from "@/lib/erp-types";
import {
  luhnCheckDigit,
  makeDemoImei,
  isValidImei,
  splitIdentifiers,
} from "@/lib/identifiers";
import {
  Guide,
  GettingStarted,
  BrandingGallery,
  useDialogFocus,
} from "@/components/guide";
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Barcode,
  Bell,
  Boxes,
  Building2,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  ScanBarcode,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
  UserRound,
  UserRoundPlus,
  Users,
  Wallet,
  X,
  Zap,
  SlidersHorizontal,
} from "lucide-react";

type Screen =
  | "Imports & exports"
  | "Getting Started"
  | "Dashboard"
  | "Retail POS"
  | "Wholesale Sales"
  | "Purchase In"
  | "Purchase Returns"
  | "Sales Returns"
  | "Products & Stock"
  | "Categories"
  | "IMEI & Serial Tracking"
  | "Barcode Management"
  | "Stock Movements"
  | "Dynamic Price Manager"
  | "Parties & Ledgers"
  | "Payments & Receipts"
  | "Invoices & Credit Notes"
  | "Reports"
  | "Tally Sync Center"
  | "Staff & Permissions"
  | "Shop Settings";
type Line = {
  productId: string;
  deviceId?: string;
  qty: number;
  unitPrice: number;
  discount: number;
};
type Invoice = {
  id: string;
  number: string;
  type: string;
  party: string;
  date: string;
  total: number;
  taxable: number;
  tax: number;
  status: string;
  paid: number;
  paymentMethod?: string;
  priceMode?: string;
  items: {
    name: string;
    productId?: string;
    discount?: number;
    lineTotal?: number;
    qty: number;
    price: number;
    imei?: string;
    imei1?: string;
    imei2?: string;
    serialNumber?: string;
    deviceBarcode?: string;
    deviceId?: string;
  }[];
};
const seedProducts: Product[] = [
  {
    id: "p1",
    name: "Nova X5",
    brand: "Nova",
    category: "Smartphones",
    variant: "8 GB / 128 GB · Midnight",
    sku: "PH-NVX5-128",
    barcode: "8901000001011",
    supplierCode: "3355",
    purchaseCost: 18500,
    wholesalePrice: 19200,
    retailPrice: 20999,
    stock: 7,
    tracking: "IMEI",
    hsn: "8517",
    gstRate: 18,
    status: "In stock",
  },
  {
    id: "p2",
    name: "Nova X5",
    brand: "Nova",
    category: "Smartphones",
    variant: "8 GB / 128 GB · Silver",
    sku: "PH-NVX5-128-S",
    barcode: "8901000001012",
    supplierCode: "3355",
    purchaseCost: 18400,
    wholesalePrice: 19100,
    retailPrice: 20499,
    stock: 5,
    tracking: "IMEI",
    hsn: "8517",
    gstRate: 18,
    status: "In stock",
  },
  {
    id: "p3",
    name: "Orion A2",
    brand: "Orion",
    category: "China phones",
    variant: "4 GB / 64 GB · Black",
    sku: "PH-ORA2-64",
    barcode: "8901000001020",
    supplierCode: "KVMT",
    purchaseCost: 3900,
    wholesalePrice: 4300,
    retailPrice: 4999,
    stock: 12,
    tracking: "IMEI",
    hsn: "8517",
    gstRate: 18,
    status: "In stock",
  },
  {
    id: "p4",
    name: "Classic K1",
    brand: "Classic",
    category: "Keypad phones",
    variant: "Dual SIM · Black",
    sku: "KP-CLK1",
    barcode: "8901000001030",
    supplierCode: "3355",
    purchaseCost: 980,
    wholesalePrice: 1120,
    retailPrice: 1299,
    stock: 18,
    tracking: "IMEI",
    hsn: "8517",
    gstRate: 18,
    status: "In stock",
  },
  {
    id: "p5",
    name: "33W Fast Charger",
    brand: "PowerUp",
    category: "Accessories",
    variant: "USB-C · White",
    sku: "AC-CHG-33W",
    barcode: "8901000002001",
    supplierCode: "KVMT",
    purchaseCost: 240,
    wholesalePrice: 290,
    retailPrice: 399,
    stock: 43,
    tracking: "Quantity",
    hsn: "8504",
    gstRate: 18,
    status: "In stock",
  },
  {
    id: "p6",
    name: "USB-C Data Cable",
    brand: "PowerUp",
    category: "Accessories",
    variant: "1 metre · Black",
    sku: "AC-CBL-C1",
    barcode: "8901000002002",
    supplierCode: "KVMT",
    purchaseCost: 48,
    wholesalePrice: 65,
    retailPrice: 99,
    stock: 8,
    tracking: "Quantity",
    hsn: "8544",
    gstRate: 18,
    status: "Low stock",
  },
  {
    id: "p7",
    name: "Wireless Earbuds",
    brand: "SoundBit",
    category: "Accessories",
    variant: "EB-02 · White",
    sku: "AC-EB-02",
    barcode: "8901000002003",
    supplierCode: "3355",
    purchaseCost: 520,
    wholesalePrice: 630,
    retailPrice: 799,
    stock: 25,
    tracking: "Serial",
    hsn: "8518",
    gstRate: 18,
    status: "In stock",
  },
  {
    id: "p8",
    name: "Neckband N3",
    brand: "SoundBit",
    category: "Accessories",
    variant: "Bluetooth · Black",
    sku: "AC-NB-N3",
    barcode: "8901000002004",
    supplierCode: "KVMT",
    purchaseCost: 360,
    wholesalePrice: 450,
    retailPrice: 599,
    stock: 3,
    tracking: "Quantity",
    hsn: "8518",
    gstRate: 18,
    status: "Low stock",
  },
];
const seedParties: Party[] = [
  {
    id: "party1",
    code: "3355",
    name: "Delhi Mobile Distributors",
    phone: "Demo contact",
    gstin: "",
    roles: ["Supplier"],
    city: "Delhi",
    receivable: 0,
    payable: 128500,
  },
  {
    id: "party2",
    code: "KVMT",
    name: "KVMT Accessories Hub",
    phone: "Demo contact",
    gstin: "",
    roles: ["Supplier", "Buyer"],
    city: "Hyderabad",
    receivable: 8400,
    payable: 22600,
  },
  {
    id: "party3",
    code: "",
    name: "City Telecom",
    phone: "Demo contact",
    gstin: "",
    roles: ["Buyer"],
    city: "Hyderabad",
    receivable: 18500,
    payable: 0,
  },
  {
    id: "party4",
    code: "",
    name: "Mobile Point",
    phone: "Demo contact",
    gstin: "",
    roles: ["Buyer"],
    city: "Secunderabad",
    receivable: 0,
    payable: 0,
  },
];
const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
function buildDemoDevices(source: Product[]): DeviceUnit[] {
  let seq = 1;
  return source.flatMap((p) => {
    if (p.tracking === "Quantity") return [];
    return Array.from({ length: Math.max(0, Math.floor(p.stock)) }, (_, i) => {
      const n = seq++;
      return {
        id: "demo-device-" + p.id + "-" + (i + 1),
        productId: p.id,
        imei1: p.tracking === "IMEI" ? makeDemoImei(n) : "",
        imei2: p.tracking === "IMEI" ? makeDemoImei(n + 100000) : "",
        serialNumber:
          p.tracking === "Serial"
            ? "DEMO-" +
              p.sku.replace(/[^A-Z0-9]/gi, "").slice(0, 8) +
              "-" +
              String(i + 1).padStart(4, "0")
            : "",
        barcode:
          "SSM-" +
          p.sku.replace(/[^A-Z0-9]/gi, "").slice(0, 10) +
          "-" +
          String(i + 1).padStart(4, "0"),
        supplierCode: p.supplierCode || "",
        purchaseCost: p.purchaseCost,
        status: "In stock" as const,
        receivedAt: "2026-10-01",
      };
    });
  });
}
const seedDevices = buildDemoDevices(seedProducts);
function lineKey(line: Line) {
  return line.deviceId || line.productId;
}
const groups: {
  title: string;
  items: { label: Screen; icon: any; shortcut?: string }[];
}[] = [
  {
    title: "HOME",
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
      { label: "Getting Started", icon: CheckCircle2 },
    ],
  },
  {
    title: "DAILY OPERATIONS",
    items: [
      { label: "Retail POS", icon: ScanBarcode, shortcut: "F2" },
      { label: "Wholesale Sales", icon: ShoppingCart },
      { label: "Purchase In", icon: PackagePlus, shortcut: "F4" },
      { label: "Purchase Returns", icon: RotateCcw },
      { label: "Sales Returns", icon: ArrowDownLeft },
    ],
  },
  {
    title: "INVENTORY",
    items: [
      { label: "Products & Stock", icon: Boxes },
      { label: "Imports & exports", icon: Download },
      { label: "Categories", icon: Archive },
      { label: "IMEI & Serial Tracking", icon: Barcode },
      { label: "Barcode Management", icon: ScanBarcode },
      { label: "Stock Movements", icon: ArrowLeftRight },
      { label: "Dynamic Price Manager", icon: Tag },
    ],
  },
  {
    title: "BUSINESS",
    items: [
      { label: "Parties & Ledgers", icon: Users },
      { label: "Payments & Receipts", icon: Wallet },
      { label: "Invoices & Credit Notes", icon: Receipt },
      { label: "Reports", icon: Activity },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { label: "Tally Sync Center", icon: Calculator },
      { label: "Staff & Permissions", icon: ShieldCheck },
      { label: "Shop Settings", icon: Settings },
    ],
  },
];
const screenLabel = (s: Screen) =>
  (
    ({
      "Retail POS": "New Sale",
      "Parties & Ledgers": "Customers & Suppliers",
      "Dynamic Price Manager": "Price Manager",
      "Tally Sync Center": "Accounting / Tally",
      "Invoices & Credit Notes": "Invoices",
    }) as Partial<Record<Screen, string>>
  )[s] || s;
function Btn({
  children,
  onClick,
  kind = "primary",
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  kind?: "primary" | "secondary" | "dark" | "danger";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={"btn btn-" + kind}
    >
      {children}
    </button>
  );
}
function Status({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "good" | "warn" | "bad" | "neutral" | "orange";
}) {
  return (
    <span className={"status status-" + tone}>
      <i />
      {children}
    </span>
  );
}
function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action && <div className="heading-action">{action}</div>}
    </div>
  );
}
function Metric({
  label,
  value,
  detail,
  tone = "ink",
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "ink" | "orange" | "red" | "paper";
  icon: any;
}) {
  return (
    <div className={"metric metric-" + tone}>
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <Package size={28} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Children.map(children, (row) => {
            if (
              !isValidElement<{ children?: React.ReactNode }>(row) ||
              row.type !== "tr"
            )
              return row;
            return cloneElement(
              row,
              {},
              Children.map(row.props.children, (cell, index) =>
                isValidElement<{ "data-label"?: string }>(cell)
                  ? cloneElement(cell, {
                      "data-label": headers[index] || "Actions",
                    })
                  : cell,
              ),
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  const [hydrated, setHydrated] = useState(false),
    [storageError, setStorageError] = useState("");
  const [stockAudit, setStockAudit] = useState<StockAudit[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]),
    [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [purchaseMode, setPurchaseMode] = useState<
    "Purchase In" | "Purchase Returns"
  >("Purchase In");
  const [screen, setScreen] = useState<Screen>("Dashboard"),
    [mobileNav, setMobileNav] = useState(false);
  const [products, setProducts] = useState<Product[]>(seedProducts),
    [devices, setDevices] = useState<DeviceUnit[]>(seedDevices),
    [parties, setParties] = useState<Party[]>(seedParties),
    [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cart, setCart] = useState<Line[]>([]),
    [search, setSearch] = useState(""),
    [scanCode, setScanCode] = useState(""),
    [customer, setCustomer] = useState("Walk-in Customer");
  const [saleMode, setSaleMode] = useState<"Retail" | "Wholesale">("Retail"),
    [priceMode, setPriceMode] = useState<"inclusive" | "exclusive">(
      "inclusive",
    ),
    [saleType, setSaleType] = useState<"intra" | "inter">("intra");
  const [notice, setNotice] = useState(""),
    [modal, setModal] = useState<
      "product" | "party" | "invoice" | "payment" | null
    >(null),
    [selectedProduct, setSelectedProduct] = useState<string | null>(null),
    [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null),
    [devicePickerProductId, setDevicePickerProductId] = useState<string | null>(
      null,
    );
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({}),
    [bulkPct, setBulkPct] = useState("0"),
    [category, setCategory] = useState("All"),
    [partySearch, setPartySearch] = useState(""),
    [showCustomer, setShowCustomer] = useState(false),
    [productSearch, setProductSearch] = useState(""),
    [manualPrice, setManualPrice] = useState("");
  const [purchaseParty, setPurchaseParty] = useState("3355"),
    [purchaseLines, setPurchaseLines] = useState<
      {
        productId: string;
        qty: number;
        cost: number;
        imei1s?: string;
        imei2s?: string;
        serialNumbers?: string;
      }[]
    >([]),
    [purchaseSearch, setPurchaseSearch] = useState(""),
    [purchaseBill, setPurchaseBill] = useState(""),
    [purchaseDate, setPurchaseDate] = useState(today());
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    category: "Smartphones",
    variant: "",
    barcode: "",
    sku: "",
    imei1s: "",
    imei2s: "",
    serialNumbers: "",
    supplierCode: "",
    purchaseCost: "",
    wholesalePrice: "",
    retailPrice: "",
    stock: "1",
    gstRate: "18",
    hsn: "8517",
    tracking: "IMEI" as Product["tracking"],
  });
  const [newParty, setNewParty] = useState({
    code: "",
    name: "",
    phone: "",
    gstin: "",
    city: "Hyderabad",
    roles: ["Buyer"],
  });
  const [settings, setSettings] = useState({
    shopName: "SRI SAI MOBILE",
    address: "Shop address · demo, update in Settings",
    gstin: "",
    phone: "",
    invoicePrefix: "SSM",
    defaultGst: 18,
  });
  const [payParty, setPayParty] = useState(""),
    [payAmount, setPayAmount] = useState(""),
    [payMethod, setPayMethod] = useState("Cash");
  const scanRef = useRef<HTMLInputElement>(null);
  useDialogFocus(!!modal || !!selectedProduct, () => {
    setModal(null);
    setSelectedProduct(null);
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ssm-erp-demo-v1");
      if (raw) {
        const d = JSON.parse(raw);
        if (d.products) {
          setProducts(d.products);
          setDevices(
            Array.isArray(d.devices) ? d.devices : buildDemoDevices(d.products),
          );
        }
        if (d.parties) setParties(d.parties);
        if (Array.isArray(d.purchases)) setPurchases(d.purchases);
        if (Array.isArray(d.returns)) setReturns(d.returns);
        if (Array.isArray(d.stockAudit)) setStockAudit(d.stockAudit);
        if (d.invoices) setInvoices(d.invoices);
        if (d.settings) setSettings((s) => ({ ...s, ...d.settings }));
      }
    } catch {
      setStorageError(
        "Saved demo records could not be read. Changes will not overwrite the saved copy. Export or recover your data before continuing.",
      );
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated || storageError) return;
    try {
      localStorage.setItem(
        "ssm-erp-demo-v1",
        JSON.stringify({
          products,
          devices,
          parties,
          invoices,
          settings,
          purchases,
          returns,
          stockAudit,
        }),
      );
    } catch {
      setStorageError(
        "This browser could not save your changes. Keep this tab open and export your records.",
      );
    }
  }, [
    products,
    devices,
    parties,
    invoices,
    settings,
    purchases,
    returns,
    stockAudit,
    hydrated,
    storageError,
  ]);
  useEffect(() => {
    if (screen === "Retail POS" || screen === "Wholesale Sales")
      setTimeout(() => scanRef.current?.focus(), 80);
  }, [screen]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        setScreen("Retail POS");
      }
      if (e.key === "Escape") {
        setModal(null);
        setSelectedProduct(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const cartDetails = useMemo(
    () =>
      cart
        .map((l) => {
          const p = products.find((x) => x.id === l.productId);
          if (!p) return null;
          const device = l.deviceId
            ? devices.find((d) => d.id === l.deviceId)
            : undefined;
          const gross = Math.max(0, l.qty * l.unitPrice - l.discount);
          const taxable =
            priceMode === "inclusive" ? gross / (1 + p.gstRate / 100) : gross;
          const tax = (taxable * p.gstRate) / 100;
          return {
            ...l,
            p,
            device,
            imei1: device?.imei1 || "",
            imei2: device?.imei2 || "",
            serialNumber: device?.serialNumber || "",
            deviceBarcode: device?.barcode || "",
            gross,
            taxable,
            tax,
            total: priceMode === "inclusive" ? gross : taxable + tax,
          };
        })
        .filter(Boolean) as any[],
    [cart, products, devices, priceMode],
  );
  const subtotal = cartDetails.reduce((s: number, l: any) => s + l.gross, 0),
    taxable = cartDetails.reduce((s: number, l: any) => s + l.taxable, 0),
    tax = cartDetails.reduce((s: number, l: any) => s + l.tax, 0),
    total =
      Math.round(
        cartDetails.reduce((s: number, l: any) => s + l.total, 0) * 100,
      ) / 100;
  const filteredProducts = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      ([
        p.name,
        p.brand,
        p.variant,
        p.sku,
        p.barcode,
        p.imei || "",
        p.supplierCode,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
        devices.some(
          (d) =>
            d.productId === p.id &&
            [d.imei1, d.imei2, d.serialNumber, d.barcode].some(
              (v) => v && v.toLowerCase().includes(search.toLowerCase()),
            ),
        )),
  );
  const filteredParties = parties.filter((p) =>
    [p.code, p.name, p.phone, p.gstin]
      .join(" ")
      .toLowerCase()
      .includes(partySearch.toLowerCase()),
  );
  function notify(s: string) {
    setNotice(s);
    setTimeout(() => setNotice(""), 3200);
  }
  function addCart(p: Product, deviceId?: string) {
    if (p.archived) {
      notify(
        "This product model is archived. Restore it in Products & Stock before selling.",
      );
      return;
    }
    if (p.stock <= 0) {
      notify("Out of stock.");
      return;
    }
    if (p.tracking === "IMEI" || p.tracking === "Serial") {
      const unit = devices.find(
        (d) =>
          d.id === deviceId && d.productId === p.id && d.status === "In stock",
      );
      if (!unit) {
        setDevicePickerProductId(p.id);
        notify("Choose the exact in-stock device, or scan its IMEI / serial.");
        return;
      }
      if (cart.some((x) => x.deviceId === unit.id)) {
        notify("That physical device is already in this bill.");
        return;
      }
      setCart((c) => [
        ...c,
        {
          productId: p.id,
          deviceId: unit.id,
          qty: 1,
          unitPrice: saleMode === "Retail" ? p.retailPrice : p.wholesalePrice,
          discount: 0,
        },
      ]);
      setDevicePickerProductId(null);
      notify("Added " + p.name + " · " + (unit.imei1 || unit.serialNumber));
      return;
    }
    const old = cart.find((x) => x.productId === p.id && !x.deviceId);
    setCart((c) =>
      old
        ? c.map((x) =>
            x.productId === p.id && !x.deviceId
              ? { ...x, qty: Math.min(p.stock, x.qty + 1) }
              : x,
          )
        : [
            ...c,
            {
              productId: p.id,
              qty: 1,
              unitPrice:
                saleMode === "Retail" ? p.retailPrice : p.wholesalePrice,
              discount: 0,
            },
          ],
    );
    notify("Added " + p.name);
  }
  function scan(raw: string) {
    const code = raw.trim();
    if (!code) return;
    const unit = devices.find((d) =>
      [d.imei1, d.imei2, d.serialNumber, d.barcode].some(
        (v) => v && v.toLowerCase() === code.toLowerCase(),
      ),
    );
    if (unit) {
      const p = products.find((x) => x.id === unit.productId);
      if (unit.status !== "In stock") {
        notify("This unit is marked " + unit.status.toLowerCase() + ".");
        setScanCode("");
        scanRef.current?.focus();
        return;
      }
      if (p) addCart(p, unit.id);
      setScanCode("");
      scanRef.current?.focus();
      return;
    }
    const p = products.find(
      (x) =>
        x.barcode.toLowerCase() === code.toLowerCase() ||
        x.sku.toLowerCase() === code.toLowerCase(),
    );
    if (!p) {
      notify("Device IMEI, serial, barcode or product SKU not found.");
      setScanCode("");
      scanRef.current?.focus();
      return;
    }
    if (p.tracking === "Quantity") addCart(p);
    else {
      setDevicePickerProductId(p.id);
      notify(
        "Model found. Select the exact phone / serial unit before billing.",
      );
    }
    setScanCode("");
    scanRef.current?.focus();
  }
  function updateLine(id: string, patch: Partial<Line>) {
    setCart((c) => c.map((x) => (lineKey(x) === id ? { ...x, ...patch } : x)));
  }
  function issueInvoice() {
    if (!cartDetails.length) {
      notify("Scan at least one item.");
      return;
    }
    for (const l of cartDetails) {
      if (
        !Number.isInteger(l.qty) ||
        l.qty <= 0 ||
        !Number.isFinite(l.unitPrice) ||
        l.unitPrice < 0 ||
        !Number.isFinite(l.discount) ||
        l.discount < 0 ||
        l.discount > l.qty * l.unitPrice
      ) {
        notify("Check quantity, price and discount before billing.");
        return;
      }
      if (l.p.archived) {
        notify("Restore the archived product model before selling it.");
        return;
      }
      if (l.p.stock < l.qty) {
        notify("Insufficient stock for " + l.p.name);
        return;
      }
      if (
        (l.p.tracking === "IMEI" || l.p.tracking === "Serial") &&
        (l.qty !== 1 || !l.device || l.device.status !== "In stock")
      ) {
        notify("Choose one available physical unit for " + l.p.name);
        return;
      }
    }
    const inv: Invoice = {
      id: crypto.randomUUID(),
      number:
        settings.invoicePrefix +
        "-" +
        String(invoices.length + 1).padStart(5, "0"),
      type: saleMode === "Retail" ? "Retail Sale" : "Wholesale Sale",
      party: customer,
      date: today(),
      total,
      taxable,
      tax,
      status: "DEMO · NOT SYNCED",
      paid: paymentMethod === "Credit / Udhaar" ? 0 : total,
      paymentMethod,
      priceMode,
      items: cartDetails.map((l: any) => ({
        name: l.p.name,
        productId: l.p.id,
        discount: l.discount,
        lineTotal: l.total,
        qty: l.qty,
        price: l.unitPrice,
        imei: l.imei1 || l.serialNumber || "",
        imei1: l.imei1 || "",
        imei2: l.imei2 || "",
        serialNumber: l.serialNumber || "",
        deviceBarcode: l.deviceBarcode || "",
        deviceId: l.device?.id,
      })),
    };
    setInvoices((a) => [inv, ...a]);
    setDevices((a) =>
      a.map((d) =>
        cartDetails.some((l: any) => l.device?.id === d.id)
          ? { ...d, status: "Sold", invoiceNumber: inv.number }
          : d,
      ),
    );
    setProducts((a) =>
      a.map((p) => {
        const qty = cartDetails
          .filter((x: any) => x.p.id === p.id)
          .reduce((n: number, x: any) => n + x.qty, 0);
        return qty
          ? {
              ...p,
              stock: Math.max(0, p.stock - qty),
              status:
                p.stock - qty <= 0
                  ? "Out of stock"
                  : p.stock - qty <= 2
                    ? "Low stock"
                    : "In stock",
            }
          : p;
      }),
    );
    setSelectedInvoice(inv);
    setCart([]);
    setDevicePickerProductId(null);
    setScreen("Invoices & Credit Notes");
    setModal("invoice");
    notify(
      "Demo invoice created locally. Device IMEIs are attached; no Tally voucher was sent.",
    );
  }
  function saveProduct() {
    if (!newProduct.name.trim() || !newProduct.sku.trim()) {
      notify("Product name and SKU are required.");
      return;
    }
    if (
      products.some(
        (p) => p.sku.toUpperCase() === newProduct.sku.trim().toUpperCase(),
      )
    ) {
      notify(
        "That SKU already exists. Use a unique SKU for this model or variant.",
      );
      return;
    }
    if (
      newProduct.barcode.trim() &&
      products.some((p) => p.barcode === newProduct.barcode.trim())
    ) {
      notify("That product barcode is already assigned.");
      return;
    }
    if (
      !Number.isInteger(Number(newProduct.stock)) ||
      Number(newProduct.stock) < 0 ||
      [
        newProduct.purchaseCost,
        newProduct.wholesalePrice,
        newProduct.retailPrice,
      ].some((v) => !Number.isFinite(Number(v)) || Number(v) < 0) ||
      !Number.isFinite(Number(newProduct.gstRate)) ||
      Number(newProduct.gstRate) < 0 ||
      Number(newProduct.gstRate) > 100
    ) {
      notify(
        "Use a whole stock quantity, non-negative prices, and GST between 0 and 100.",
      );
      return;
    }
    const qty = Number(newProduct.stock);
    const imei1s = splitIdentifiers(newProduct.imei1s),
      imei2s = splitIdentifiers(newProduct.imei2s),
      serials = splitIdentifiers(newProduct.serialNumbers);
    const existingIds = new Set(
      devices.flatMap((d) =>
        [d.imei1, d.imei2, d.serialNumber].filter(Boolean),
      ),
    );
    if (newProduct.tracking === "IMEI") {
      if (imei1s.length !== qty) {
        notify("Enter exactly one IMEI 1 for each phone in opening stock.");
        return;
      }
      if (imei1s.some((v) => !isValidImei(v))) {
        notify("Each IMEI must be 15 digits with a valid check digit.");
        return;
      }
      if (imei2s.length && imei2s.length !== qty) {
        notify("If IMEI 2 is entered, enter one for each phone.");
        return;
      }
      if (imei2s.some((v) => !isValidImei(v))) {
        notify("Each IMEI 2 must be 15 digits with a valid check digit.");
        return;
      }
      const all = [...imei1s, ...imei2s];
      if (
        new Set(all).size !== all.length ||
        all.some((v) => existingIds.has(v))
      ) {
        notify(
          "Duplicate IMEI detected. Every IMEI 1 / IMEI 2 must be unique across all devices.",
        );
        return;
      }
    }
    if (newProduct.tracking === "Serial") {
      if (serials.length !== qty) {
        notify(
          "Enter exactly one serial number for each unit in opening stock.",
        );
        return;
      }
      if (
        new Set(serials).size !== serials.length ||
        serials.some((v) => existingIds.has(v))
      ) {
        notify("Serial numbers must be unique.");
        return;
      }
    }
    const productId = crypto.randomUUID();
    const p: Product = {
      id: productId,
      name: newProduct.name.trim(),
      brand: newProduct.brand.trim(),
      category: newProduct.category,
      variant: newProduct.variant.trim(),
      sku: newProduct.sku.trim().toUpperCase(),
      barcode: newProduct.barcode.trim() || "SSM" + Date.now(),
      supplierCode: newProduct.supplierCode.toUpperCase(),
      purchaseCost: +newProduct.purchaseCost || 0,
      wholesalePrice: +newProduct.wholesalePrice || 0,
      retailPrice: +newProduct.retailPrice || 0,
      stock: qty,
      gstRate: +newProduct.gstRate || 0,
      tracking: newProduct.tracking,
      hsn: newProduct.hsn,
      status: qty > 2 ? "In stock" : qty > 0 ? "Low stock" : "Out of stock",
    };
    const created: DeviceUnit[] =
      newProduct.tracking === "IMEI"
        ? imei1s.map((imei1, i) => ({
            id: crypto.randomUUID(),
            productId,
            imei1,
            imei2: imei2s[i] || "",
            serialNumber: "",
            barcode:
              "SSM-" +
              p.sku.replace(/[^A-Z0-9]/gi, "").slice(0, 8) +
              "-" +
              Date.now().toString().slice(-6) +
              "-" +
              String(i + 1).padStart(2, "0"),
            supplierCode: p.supplierCode,
            purchaseCost: p.purchaseCost,
            status: "In stock",
            receivedAt: today(),
          }))
        : newProduct.tracking === "Serial"
          ? serials.map((serialNumber, i) => ({
              id: crypto.randomUUID(),
              productId,
              imei1: "",
              imei2: "",
              serialNumber,
              barcode:
                "SSM-" +
                p.sku.replace(/[^A-Z0-9]/gi, "").slice(0, 8) +
                "-" +
                Date.now().toString().slice(-6) +
                "-" +
                String(i + 1).padStart(2, "0"),
              supplierCode: p.supplierCode,
              purchaseCost: p.purchaseCost,
              status: "In stock",
              receivedAt: today(),
            }))
          : [];
    setProducts((a) => [p, ...a]);
    setDevices((a) => [...created, ...a]);
    setModal(null);
    setNewProduct({
      name: "",
      brand: "",
      category: "Smartphones",
      variant: "",
      barcode: "",
      sku: "",
      imei1s: "",
      imei2s: "",
      serialNumbers: "",
      supplierCode: "",
      purchaseCost: "",
      wholesalePrice: "",
      retailPrice: "",
      stock: "1",
      gstRate: "18",
      hsn: "8517",
      tracking: "IMEI",
    });
    notify(
      "Product and individual unit identifiers added to this browser demo.",
    );
  }
  function saveParty() {
    if (
      newParty.code.trim() &&
      parties.some(
        (p) => p.code.toUpperCase() === newParty.code.trim().toUpperCase(),
      )
    ) {
      notify("That customer / supplier code is already in use.");
      return;
    }
    if (!newParty.name.trim()) {
      notify("Party name is required.");
      return;
    }
    setParties((a) => [
      {
        ...newParty,
        id: crypto.randomUUID(),
        code: newParty.code.trim().toUpperCase(),
        receivable: 0,
        payable: 0,
      },
      ...a,
    ]);
    setModal(null);
    setNewParty({
      code: "",
      name: "",
      phone: "",
      gstin: "",
      city: "Hyderabad",
      roles: ["Buyer"],
    });
    notify("Party added to this browser demo.");
  }
  function savePrices() {
    const changes = Object.entries(priceEdits).filter(
      ([, v]) => v.trim() !== "" && Number.isFinite(+v) && +v >= 0,
    );
    if (!changes.length) {
      notify("No valid price edits.");
      return;
    }
    setProducts((a) =>
      a.map((p) => {
        const r = changes.find(([k]) => k === p.id + ":retail"),
          w = changes.find(([k]) => k === p.id + ":wholesale");
        return {
          ...p,
          ...(r ? { retailPrice: +r[1] } : {}),
          ...(w ? { wholesalePrice: +w[1] } : {}),
        };
      }),
    );
    setPriceEdits({});
    notify(
      "Price changes saved to this browser only; invoices retain their recorded values.",
    );
  }
  function bulkAdjust() {
    const pct = Number(bulkPct);
    if (!pct || !Number.isFinite(pct) || pct < -100) {
      notify("Enter a non-zero percentage of at least -100%.");
      return;
    }
    setProducts((a) =>
      a.map((p) => ({
        ...p,
        retailPrice: Math.round(p.retailPrice * (1 + pct / 100) * 100) / 100,
      })),
    );
    setBulkPct("0");
    notify("Demo retail prices adjusted by " + pct + "%.");
  }
  function savePurchase() {
    if (!purchaseLines.length) {
      notify("Add at least one line.");
      return;
    }
    const isReturn = screen === "Purchase Returns";
    if (
      !parties.some(
        (p) =>
          p.roles.includes("Supplier") && (p.code || p.id) === purchaseParty,
      )
    ) {
      notify("Select a valid supplier before receiving goods.");
      return;
    }
    if (!purchaseBill.trim() || !purchaseDate) {
      notify(
        "Enter the supplier bill number and date to keep a receiving reference.",
      );
      return;
    }
    if (
      purchaseLines.some(
        (l) =>
          !Number.isInteger(l.qty) ||
          l.qty <= 0 ||
          !Number.isFinite(l.cost) ||
          l.cost < 0,
      )
    ) {
      notify(
        "Each quantity must be a positive whole number and cost must be zero or more.",
      );
      return;
    }
    if (
      purchases.some(
        (p) =>
          p.supplier === purchaseParty &&
          p.number === purchaseBill.trim() &&
          p.kind === (isReturn ? "Supplier return" : "Purchase"),
      )
    ) {
      notify("This supplier bill is already recorded in the demo.");
      return;
    }

    const existingIds = new Set(
      devices.flatMap((d) =>
        [d.imei1, d.imei2, d.serialNumber].filter(Boolean),
      ),
    );
    const added: DeviceUnit[] = [];
    const returnedIds: string[] = [];
    for (const l of purchaseLines) {
      const p = products.find((x) => x.id === l.productId);
      if (!p) {
        notify("A product line is no longer in the catalogue.");
        return;
      }
      if (p.tracking === "IMEI") {
        const first = splitIdentifiers(l.imei1s || ""),
          second = splitIdentifiers(l.imei2s || "");
        if (first.length !== l.qty) {
          notify("Enter one IMEI 1 per phone in each purchase line.");
          return;
        }
        if (first.some((v) => !isValidImei(v))) {
          notify("Each IMEI 1 must be 15 digits with a valid check digit.");
          return;
        }
        if (second.length && second.length !== l.qty) {
          notify("If you enter IMEI 2, enter one for each phone.");
          return;
        }
        if (second.some((v) => !isValidImei(v))) {
          notify("Each IMEI 2 must be 15 digits with a valid check digit.");
          return;
        }
        if (!isReturn) {
          const all = [...first, ...second];
          if (
            new Set(all).size !== all.length ||
            all.some((v) => existingIds.has(v))
          ) {
            notify(
              "Duplicate IMEI found. Check the device identifiers before receiving stock.",
            );
            return;
          }
          all.forEach((v) => existingIds.add(v));
          first.forEach((imei1, i) =>
            added.push({
              id: crypto.randomUUID(),
              productId: p.id,
              imei1,
              imei2: second[i] || "",
              serialNumber: "",
              barcode:
                "SSM-" +
                p.sku.replace(/[^A-Z0-9]/gi, "").slice(0, 8) +
                "-" +
                crypto.randomUUID().slice(0, 8).toUpperCase(),
              supplierCode: purchaseParty,
              purchaseCost: l.cost,
              status: "In stock",
              receivedAt: purchaseDate,
              receivingReference: purchaseBill.trim(),
            }),
          );
        } else {
          for (const code of first) {
            const unit = devices.find(
              (d) =>
                d.productId === p.id &&
                (d.imei1 === code || d.imei2 === code) &&
                d.status === "In stock",
            );
            if (!unit || unit.supplierCode !== purchaseParty) {
              notify(
                "Supplier return IMEI not found as an in-stock unit: " + code,
              );
              return;
            }
            if (returnedIds.includes(unit.id)) {
              notify("The same device is listed twice in this return.");
              return;
            }
            returnedIds.push(unit.id);
          }
        }
      } else if (p.tracking === "Serial") {
        const serials = splitIdentifiers(l.serialNumbers || "");
        if (serials.length !== l.qty) {
          notify("Enter one serial number per unit for " + p.name + ".");
          return;
        }
        if (
          !isReturn &&
          (new Set(serials).size !== serials.length ||
            serials.some((v) => existingIds.has(v)))
        ) {
          notify("Duplicate serial number found.");
          return;
        }
        if (!isReturn) serials.forEach((v) => existingIds.add(v));
        if (isReturn) {
          for (const code of serials) {
            const unit = devices.find(
              (d) =>
                d.productId === p.id &&
                d.serialNumber === code &&
                d.status === "In stock",
            );
            if (!unit || unit.supplierCode !== purchaseParty) {
              notify("Supplier return serial not found in stock: " + code);
              return;
            }
            if (returnedIds.includes(unit.id)) {
              notify("The same device is listed twice in this return.");
              return;
            }
            returnedIds.push(unit.id);
          }
        } else
          serials.forEach((serialNumber, i) =>
            added.push({
              id: crypto.randomUUID(),
              productId: p.id,
              imei1: "",
              imei2: "",
              serialNumber,
              barcode:
                "SSM-" +
                p.sku.replace(/[^A-Z0-9]/gi, "").slice(0, 8) +
                "-" +
                crypto.randomUUID().slice(0, 8).toUpperCase(),
              supplierCode: purchaseParty,
              purchaseCost: l.cost,
              status: "In stock",
              receivedAt: purchaseDate,
              receivingReference: purchaseBill.trim(),
            }),
          );
      } else if (isReturn && p.stock < l.qty) {
        notify(
          "Cannot return more units than are in stock for " + p.name + ".",
        );
        return;
      }
    }
    if (isReturn) {
      setDevices((a) =>
        a.map((d) =>
          returnedIds.includes(d.id)
            ? { ...d, status: "Returned to supplier" }
            : d,
        ),
      );
      setProducts((a) =>
        a.map((p) => {
          const qty = purchaseLines
            .filter((l) => l.productId === p.id)
            .reduce((n, l) => n + l.qty, 0);
          return qty
            ? {
                ...p,
                stock: Math.max(0, p.stock - qty),
                status:
                  p.stock - qty <= 0
                    ? "Out of stock"
                    : p.stock - qty <= 2
                      ? "Low stock"
                      : "In stock",
              }
            : p;
        }),
      );
      notify(
        "Demo supplier return recorded; exact device units were removed from saleable stock.",
      );
    } else {
      setDevices((a) => [...added, ...a]);
      setProducts((a) =>
        a.map((p) => {
          const line = purchaseLines
            .filter((l) => l.productId === p.id)
            .reduce((best, l) => (l.cost > 0 ? l : best), null as any);
          const qty = purchaseLines
            .filter((l) => l.productId === p.id)
            .reduce((n, l) => n + l.qty, 0);
          return qty
            ? {
                ...p,
                stock: p.stock + qty,
                purchaseCost: line ? line.cost : p.purchaseCost,
                status: p.stock + qty <= 2 ? "Low stock" : "In stock",
              }
            : p;
        }),
      );
      notify(
        "Demo purchase received with individual IMEI / serial records; no accounting voucher was posted.",
      );
    }
    setPurchases((a) => [
      {
        id: crypto.randomUUID(),
        number: purchaseBill.trim(),
        date: purchaseDate,
        supplier: purchaseParty,
        kind: isReturn ? "Supplier return" : "Purchase",
        total: purchaseLines.reduce((n, l) => n + l.qty * l.cost, 0),
        qty: purchaseLines.reduce((n, l) => n + l.qty, 0),
      },
      ...a,
    ]);
    setPurchaseLines([]);
    setPurchaseBill("");
  }
  function returnDevice(inv: Invoice, deviceId: string) {
    const device = devices.find((d) => d.id === deviceId);
    const line = inv.items.find((l) => l.deviceId === deviceId);
    if (
      !line ||
      !device ||
      device.status !== "Sold" ||
      device.invoiceNumber !== inv.number ||
      returns.some((r) => r.deviceId === deviceId && r.invoice === inv.number)
    ) {
      notify("This device is not eligible for return against this invoice.");
      return;
    }
    if (
      !window.confirm(
        "Receive this exact handset into inspection? It will stay unavailable for sale. No refund or credit note will be issued.",
      )
    )
      return;
    setDevices((a) =>
      a.map((d) =>
        d.id === deviceId ? { ...d, status: "Under inspection" } : d,
      ),
    );
    setReturns((a) => [
      {
        id: crypto.randomUUID(),
        invoice: inv.number,
        deviceId,
        date: today(),
        name: line.name,
      },
      ...a,
    ]);
    notify(
      "Returned handset saved locally under inspection. No refund or credit note recorded.",
    );
  }
  function inspectDevice(id: string, saleable: boolean) {
    const unit = devices.find(
      (d) => d.id === id && d.status === "Under inspection",
    );
    if (!unit) return;
    if (saleable && products.find((p) => p.id === unit.productId)?.archived) {
      notify(
        "Restore this product model in Stock Manager before releasing the unit for sale.",
      );
      return;
    }
    if (
      !window.confirm(
        saleable
          ? "Confirm inspection passed and return this handset to available stock?"
          : "Mark this inspected handset as damaged and keep it out of available stock?",
      )
    )
      return;
    setDevices((a) =>
      a.map((d) =>
        d.id === id ? { ...d, status: saleable ? "In stock" : "Damaged" } : d,
      ),
    );
    if (saleable)
      setProducts((a) =>
        a.map((p) =>
          p.id === unit.productId ? { ...p, stock: p.stock + 1 } : p,
        ),
      );
    notify(
      saleable
        ? "Inspection passed. Unit available in this browser demo."
        : "Unit marked damaged in this browser demo.",
    );
  }
  function csv(which: "products" | "invoices" | "devices") {
    const rows =
      which === "products"
        ? [
            [
              "SKU",
              "Product",
              "Category",
              "Barcode",
              "Tracked unit count",
              "Supplier",
              "Stock",
              "Cost",
              "Wholesale",
              "Retail",
              "GST",
            ],
            ...products.map((p) => [
              p.sku,
              p.name,
              p.category,
              p.barcode,
              devices.filter((d) => d.productId === p.id).length,
              p.supplierCode,
              p.stock,
              p.purchaseCost,
              p.wholesalePrice,
              p.retailPrice,
              p.gstRate,
            ]),
          ]
        : which === "devices"
          ? [
              [
                "Product",
                "SKU",
                "IMEI 1",
                "IMEI 2",
                "Serial",
                "Device barcode",
                "Status",
                "Supplier",
                "Purchase cost",
                "Invoice",
              ],
              ...devices.map((d) => {
                const p = products.find((x) => x.id === d.productId);
                return [
                  p?.name || "Unknown",
                  p?.sku || "",
                  d.imei1,
                  d.imei2,
                  d.serialNumber,
                  d.barcode,
                  d.status,
                  d.supplierCode,
                  d.purchaseCost,
                  d.invoiceNumber || "",
                ];
              }),
            ]
          : [
              [
                "Invoice",
                "Date",
                "Type",
                "Party",
                "Taxable",
                "GST",
                "Total",
                "Status",
              ],
              ...invoices.map((i) => [
                i.number,
                i.date,
                i.type,
                i.party,
                i.taxable,
                i.tax,
                i.total,
                i.status,
              ]),
            ];
    const text = rows
      .map((r) =>
        r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","),
      )
      .join("\r\n");
    const u = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = u;
    a.download = "sri-sai-" + which + "-demo.csv";
    a.click();
    URL.revokeObjectURL(u);
    notify("CSV exported.");
  }
  const go = (s: Screen) => {
    if (
      (s === "Purchase In" || s === "Purchase Returns") &&
      s !== purchaseMode
    ) {
      if (
        purchaseLines.length &&
        !window.confirm(
          "Changing between receiving and supplier returns clears this unsaved purchase draft. Continue?",
        )
      )
        return;
      setPurchaseLines([]);
      setPurchaseBill("");
      setPurchaseMode(s);
    }

    if (s === "Retail POS" || s === "Wholesale Sales")
      setSaleMode(s === "Retail POS" ? "Retail" : "Wholesale");
    setScreen(s);
    setSearch("");
    setMobileNav(false);
  };
  function commitStockChange(command: StockCommand) {
    if (storageError)
      return {
        error:
          "Browser storage has an error. Export your existing records before making stock changes.",
      };
    try {
      const next = applyStockCommand(
        { products, devices, parties, cart },
        command,
      );
      const nextAudit = [...next.audit].reverse().concat(stockAudit);
      localStorage.setItem(
        "ssm-erp-demo-v1",
        JSON.stringify({
          products: next.products,
          devices: next.devices,
          parties,
          invoices,
          settings,
          purchases,
          returns,
          stockAudit: nextAudit,
        }),
      );
      setProducts(next.products);
      setDevices(next.devices);
      setStockAudit(nextAudit);
      return {
        message: `Saved ${next.audit.length} stock change(s) in this browser. Issued invoices are unchanged.`,
      };
    } catch (e) {
      return {
        error:
          e instanceof Error
            ? e.message
            : "The stock change could not be saved. No records were changed.",
      };
    }
  }
  function commitImport(rows: ImportRow[], options: ImportOptions) {
    if (storageError)
      return {
        error:
          "Browser storage has an error. Export / recover your existing records before importing.",
      };
    if (
      options.mode === "receive" &&
      purchases.some(
        (p) =>
          p.number.toLowerCase() === options.reference.trim().toLowerCase(),
      )
    )
      return {
        error:
          "That bill / delivery reference is already recorded. Use a unique reference for a genuinely new delivery.",
      };
    const result = prepareImport(rows, { products, devices, parties }, options);
    if (result.errors.length) return { error: result.errors.join(" ") };
    if (
      !window.confirm(
        options.mode === "receive"
          ? `Receive ${result.received} units against ${options.reference}? Check the actual delivery before confirming.`
          : `Save ${result.created} new product models? Catalogue mode does not add stock.`,
      )
    )
      return {};
    const nextPurchases =
      options.mode === "receive"
        ? [
            {
              id: crypto.randomUUID(),
              number: options.reference.trim(),
              date: today(),
              supplier: options.partyCode.trim() || "Multiple / row suppliers",
              kind: "Purchase",
              total: result.totalCost,
              qty: result.received,
            },
            ...purchases,
          ]
        : purchases;
    try {
      localStorage.setItem(
        "ssm-erp-demo-v1",
        JSON.stringify({
          products: result.products,
          devices: result.devices,
          parties: result.parties,
          invoices,
          settings,
          purchases: nextPurchases,
          returns,
          stockAudit,
        }),
      );
    } catch {
      return {
        error:
          "The import could not be saved. No stock was changed. Free browser storage and try again.",
      };
    }
    setProducts(result.products);
    setDevices(result.devices);
    setParties(result.parties);
    setPurchases(nextPurchases);
    return {
      message: `Saved in this browser: ${result.created} new models, ${result.updated} matching rows updated, ${result.received} units received. Export a backup now.`,
    };
  }
  function backupShop() {
    downloadText(
      "sri-sai-shop-backup-" + today() + ".json",
      JSON.stringify(
        {
          format: "sri-sai-shop-backup",
          version: 1,
          exportedAt: new Date().toISOString(),
          products,
          devices,
          parties,
          invoices,
          settings,
          purchases,
          returns,
          stockAudit,
        },
        null,
        2,
      ),
      "application/json",
    );
    notify("Shop backup downloaded. Keep a copy outside this browser.");
  }
  const render = () => {
    switch (screen) {
      case "Imports & exports":
        return (
          <ImportCenter
            products={products}
            devices={devices}
            parties={parties}
            invoices={invoices}
            onCommit={commitImport}
            backup={backupShop}
          />
        );
      case "Getting Started":
        return <GettingStarted go={(s) => go(s as Screen)} />;
      case "Dashboard":
        return (
          <Dashboard
            products={products}
            invoices={invoices}
            go={go}
            notify={notify}
            purchases={purchases}
            openProduct={setSelectedProduct}
            openInvoice={(i: Invoice) => {
              setSelectedInvoice(i);
              setModal("invoice");
            }}
            addProduct={() => setModal("product")}
          />
        );
      case "Retail POS":
      case "Wholesale Sales":
        return (
          <POS
            screen={screen}
            go={go}
            products={products}
            devices={devices}
            devicePickerProductId={devicePickerProductId}
            setDevicePickerProductId={setDevicePickerProductId}
            cart={cart}
            setCart={setCart}
            details={cartDetails}
            scanCode={scanCode}
            setScanCode={setScanCode}
            scanRef={scanRef}
            scan={scan}
            customer={customer}
            setCustomer={setCustomer}
            parties={parties}
            saleMode={saleMode}
            setSaleMode={setSaleMode}
            priceMode={priceMode}
            setPriceMode={setPriceMode}
            saleType={saleType}
            setSaleType={setSaleType}
            subtotal={subtotal}
            taxable={taxable}
            tax={tax}
            total={total}
            addCart={addCart}
            updateLine={updateLine}
            issueInvoice={issueInvoice}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            notify={notify}
          />
        );
      case "Products & Stock":
        return (
          <StockManager
            products={products}
            devices={devices}
            parties={parties}
            audit={stockAudit}
            search={search}
            setSearch={setSearch}
            category={category}
            setCategory={setCategory}
            addProduct={() => setModal("product")}
            viewProduct={setSelectedProduct}
            apply={commitStockChange}
          />
        );
      case "Categories":
        return (
          <Categories products={products} setCategory={setCategory} go={go} />
        );
      case "Dynamic Price Manager":
        return (
          <PriceManager
            products={products}
            edits={priceEdits}
            setEdits={setPriceEdits}
            save={savePrices}
            pct={bulkPct}
            setPct={setBulkPct}
            bulkAdjust={bulkAdjust}
          />
        );
      case "Parties & Ledgers":
        return (
          <Parties
            parties={filteredParties}
            search={partySearch}
            setSearch={setPartySearch}
            setModal={setModal}
          />
        );
      case "IMEI & Serial Tracking":
        return (
          <Identifiers
            products={products}
            devices={devices}
            inspectDevice={inspectDevice}
            csv={() => csv("devices")}
          />
        );
      case "Barcode Management":
        return <Barcodes products={products} notify={notify} />;
      case "Purchase In":
      case "Purchase Returns":
        return (
          <Purchases
            screen={screen}
            go={go}
            products={products}
            parties={parties}
            supplier={purchaseParty}
            setSupplier={setPurchaseParty}
            lines={purchaseLines}
            setLines={setPurchaseLines}
            q={purchaseSearch}
            setQ={setPurchaseSearch}
            billNo={purchaseBill}
            setBillNo={setPurchaseBill}
            billDate={purchaseDate}
            setBillDate={setPurchaseDate}
            save={savePurchase}
            records={purchases}
          />
        );
      case "Sales Returns":
        return (
          <Returns
            invoices={invoices}
            devices={devices}
            returns={returns}
            onReturn={returnDevice}
          />
        );
      case "Stock Movements":
        return (
          <Movements
            stockAudit={stockAudit}
            products={products}
            invoices={invoices}
            purchases={purchases}
            returns={returns}
          />
        );
      case "Payments & Receipts":
        return (
          <Payments
            parties={parties}
            invoices={invoices}
            open={() => setModal("payment")}
          />
        );
      case "Invoices & Credit Notes":
        return (
          <Invoices
            invoices={invoices}
            selected={selectedInvoice}
            setSelected={setSelectedInvoice}
            csv={() => csv("invoices")}
          />
        );
      case "Reports":
        return (
          <Reports
            products={products}
            invoices={invoices}
            exportProducts={() => csv("products")}
            exportInvoices={() => csv("invoices")}
          />
        );
      case "Tally Sync Center":
        return <Tally />;
      case "Staff & Permissions":
        return <Staff />;
      case "Shop Settings":
        return (
          <SettingsPage
            settings={settings}
            setSettings={setSettings}
            notify={notify}
          />
        );
      default:
        return (
          <Dashboard
            products={products}
            invoices={invoices}
            go={go}
            notify={notify}
          />
        );
    }
  };
  return (
    <div className="app-shell">
      {mobileNav && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={"sidebar " + (mobileNav ? "sidebar-open" : "")}>
        <div className="brand">
          <div className="chosen-logo sidebar-logo">
            <img
              src="/branding/logo-option-c.png"
              alt="Sri Sai Mobile ERP logo C"
            />
          </div>
          <div>
            <strong>SRI SAI</strong>
            <small>MOBILE ERP</small>
          </div>
          <button
            className="icon-btn sidebar-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          >
            <X size={17} />
          </button>
        </div>
        <div className="sidebar-scroll">
          {groups.map((g) => (
            <details
              className="nav-group"
              key={g.title}
              open={
                g.title !== "ADMINISTRATION" ||
                g.items.some((i) => i.label === screen)
              }
            >
              <summary className="nav-label">
                {g.title}
                <ChevronDown size={12} />
              </summary>
              {g.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    data-tour={
                      "nav-" + item.label.toLowerCase().replace(/[^a-z]+/g, "-")
                    }
                    onClick={() => go(item.label)}
                    className={
                      "nav-item " + (screen === item.label ? "active" : "")
                    }
                  >
                    <Icon size={17} />
                    <span>{screenLabel(item.label)}</span>
                    {item.shortcut && <kbd>{item.shortcut}</kbd>}
                  </button>
                );
              })}
            </details>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="connection-dot">
            <i /> BROWSER STORAGE
          </div>
          <div className="user-card">
            <div className="avatar">K</div>
            <div className="user-copy">
              <strong>Owner / Admin</strong>
              <small>Single-shop access</small>
            </div>
            <MoreHorizontal size={18} />
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>
          <div className="crumb">
            <span>WORKSPACE</span>
            <ChevronRight size={14} />
            <strong>{screenLabel(screen)}</strong>
          </div>
          <div className="top-actions">
            <button
              className="btn btn-secondary lock-shop"
              onClick={async () => {
                try {
                  const r = await fetch("/api/shop-session", {
                    method: "DELETE",
                  });
                  if (!r.ok) throw Error();
                  window.location.assign("/sign-in");
                } catch {
                  notify(
                    "Could not lock the shop. Check your connection and try again.",
                  );
                }
              }}
            >
              <ShieldCheck size={15} />
              Lock shop
            </button>
            <GlobalSearch
              products={products}
              devices={devices}
              parties={parties}
              invoices={invoices}
              onProduct={setSelectedProduct}
              onParty={(q: string) => {
                go("Parties & Ledgers");
                setPartySearch(q);
              }}
              onInvoice={(i: Invoice) => {
                setSelectedInvoice(i);
                setModal("invoice");
              }}
            />
            <button
              className="icon-btn"
              onClick={() =>
                notify("Notifications will appear when real data is connected.")
              }
              aria-label="Notifications"
            >
              <Bell size={17} />
            </button>
            <div className="top-avatar">K</div>
          </div>
        </header>
        <div className="demo-banner">
          <span className="demo-dot" />
          <strong>Demo workspace</strong>
          <span>
            Saved in this browser only · example stock & identifiers · no server
            or Tally connection
          </span>
          <button onClick={() => go("Getting Started")}>
            Getting started <ArrowRight size={13} />
          </button>
        </div>
        {storageError && (
          <div className="storage-error" role="alert">
            {storageError}
          </div>
        )}
        <div className="workspace" data-tour="workspace">
          {hydrated ? (
            render()
          ) : (
            <p role="status">Loading your shop workspace…</p>
          )}
        </div>
      </main>
      {hydrated && <Guide screen={screen} go={(s) => go(s as Screen)} />}
      {notice && (
        <div className="toast" role="status" aria-live="polite">
          <CheckCircle2 size={17} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          kind={modal}
          close={() => setModal(null)}
          settings={settings}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          saveProduct={saveProduct}
          newParty={newParty}
          setNewParty={setNewParty}
          saveParty={saveParty}
          selectedInvoice={selectedInvoice}
          notify={notify}
          parties={parties}
          payParty={payParty}
          setPayParty={setPayParty}
          payAmount={payAmount}
          setPayAmount={setPayAmount}
          payMethod={payMethod}
          setPayMethod={setPayMethod}
        />
      )}
      {selectedProduct && (
        <ProductDrawer
          product={products.find((p) => p.id === selectedProduct)}
          devices={devices}
          close={() => setSelectedProduct(null)}
        />
      )}
      <div className="print-only">
        {selectedInvoice && (
          <InvoicePrint invoice={selectedInvoice} settings={settings} />
        )}
      </div>
    </div>
  );
}

function GlobalSearch({
  products,
  devices,
  parties,
  invoices,
  onProduct,
  onParty,
  onInvoice,
}: any) {
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        ref.current?.focus();
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const q = query.trim().toLowerCase();
  const rows = q
    ? [
        ...products
          .filter((p: Product) =>
            [p.name, p.sku, p.barcode, p.brand, p.variant]
              .join(" ")
              .toLowerCase()
              .includes(q),
          )
          .map((p: Product) => ({
            key: p.id,
            title: p.name + " · " + p.variant,
            detail: "Product · " + p.sku,
            action: () => onProduct(p.id),
          })),
        ...devices
          .filter((d: DeviceUnit) =>
            [d.imei1, d.imei2, d.serialNumber, d.barcode].some((v) =>
              v.toLowerCase().includes(q),
            ),
          )
          .map((d: DeviceUnit) => ({
            key: d.id,
            title: d.imei1 || d.serialNumber,
            detail:
              "Device · " +
              d.status +
              " · " +
              (products.find((p: Product) => p.id === d.productId)?.name || ""),
            action: () => onProduct(d.productId),
          })),
        ...parties
          .filter((p: Party) =>
            [p.name, p.phone, p.code].join(" ").toLowerCase().includes(q),
          )
          .map((p: Party) => ({
            key: p.id,
            title: p.name,
            detail: p.roles.join(" / ") + " · " + p.code,
            action: () => onParty(p.name),
          })),
        ...invoices
          .filter((i: Invoice) =>
            [i.number, i.party].join(" ").toLowerCase().includes(q),
          )
          .map((i: Invoice) => ({
            key: i.id,
            title: i.number,
            detail: "Invoice · " + i.party,
            action: () => onInvoice(i),
          })),
      ].slice(0, 12)
    : [];
  return (
    <div
      className="global-search-wrap"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label className="global-search">
        <Search size={16} />
        <input
          ref={ref}
          aria-label="Global search"
          aria-expanded={open && !!q}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && rows.length) {
              rows[0].action();
              setOpen(false);
              setQuery("");
            }
          }}
          placeholder="Product, IMEI, customer, bill…"
        />
        <kbd>/</kbd>
      </label>
      {open && q && (
        <div
          className="search-results"
          role="region"
          aria-label="Search results"
        >
          <small>
            {rows.length ? "Matching records" : "No matching records"}
          </small>
          {rows.map((r) => (
            <button
              key={r.key}
              onClick={() => {
                r.action();
                setOpen(false);
                setQuery("");
              }}
            >
              <strong>{r.title}</strong>
              <span>{r.detail}</span>
              <ArrowRight size={14} />
            </button>
          ))}
          {!rows.length && (
            <p>
              Try a model name, SKU, either IMEI, supplier or invoice number.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
function Dashboard({
  products,
  invoices,
  go,
  purchases = [],
  openProduct,
  openInvoice,
  addProduct,
}: any) {
  products = products.filter((p: Product) => !p.archived);
  const salesToday = invoices.filter((i: Invoice) => i.date === today());
  const sold = salesToday.reduce((n: number, i: Invoice) => n + i.total, 0);
  const units = products.reduce((n: number, p: Product) => n + p.stock, 0);
  const low = products.filter((p: Product) => p.stock <= 5);
  const activity = [
    ...invoices.map((i: Invoice) => ({
      id: i.id,
      date: i.date,
      title: i.number,
      detail: i.party,
      kind: i.type,
      total: i.total,
      action: () => openInvoice?.(i),
    })),
    ...purchases.map((p: PurchaseRecord) => ({
      id: p.id,
      date: p.date,
      title: p.number,
      detail: "Supplier " + p.supplier,
      kind: p.kind,
      total: p.total,
      action: () =>
        go(p.kind === "Purchase" ? "Purchase In" : "Purchase Returns"),
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);
  return (
    <div className="screen">
      <Heading
        eyebrow="SRI SAI MOBILE · SHOP OVERVIEW"
        title={<>Your shop, at a glance.</>}
        description="Stock, billing and the next thing that needs your attention."
        action={
          <Btn kind="secondary" onClick={() => go("Getting Started")}>
            <CheckCircle2 size={16} /> Setup guide
          </Btn>
        }
      />
      <div className="task-bar" data-tour="daily-actions">
        {[
          {
            title: "New sale",
            detail: "Bill a customer",
            icon: ScanBarcode,
            action: () => go("Retail POS"),
          },
          {
            title: "Purchase in",
            detail: "Receive supplier stock",
            icon: PackagePlus,
            action: () => go("Purchase In"),
          },
          {
            title: "Find a device",
            detail: "Look up an IMEI",
            icon: Barcode,
            action: () => go("IMEI & Serial Tracking"),
          },
          {
            title: "Add product",
            detail: "Create a model or accessory",
            icon: Plus,
            action: () => addProduct?.(),
          },
        ].map((a) => (
          <button key={a.title} onClick={a.action}>
            <span className="task-icon">
              <a.icon size={21} />
            </span>
            <span>
              <strong>{a.title}</strong>
              <small>{a.detail}</small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))}
      </div>
      <div className="section-heading">
        <h2>Today’s overview</h2>
        <span className="date-chip">
          <Clock3 size={14} /> {today()} · Demo
        </span>
      </div>
      <div className="metric-grid" data-tour="stock-overview">
        <Metric
          label="Today’s demo sales"
          value={money(sold)}
          detail={salesToday.length + " browser-local sales"}
          icon={Receipt}
          tone="orange"
        />
        <Metric
          label="Available stock"
          value={String(units)}
          detail={products.length + " product variants"}
          icon={Boxes}
        />
        <div onClick={() => go("Products & Stock")}>
          <Metric
            label="Low-stock models"
            value={String(low.length)}
            detail="Five units or fewer · review stock"
            icon={AlertTriangle}
            tone="red"
          />
        </div>
        <Metric
          label="Customer amounts due"
          value="Not connected"
          detail="Live balances require a verified ledger"
          icon={Wallet}
        />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">RECENT ACTIVITY</span>
              <h3>Sales & purchases</h3>
            </div>
            <button
              className="text-button"
              onClick={() => go("Invoices & Credit Notes")}
            >
              All invoices <ArrowRight size={14} />
            </button>
          </div>
          {activity.length ? (
            <div className="activity-list">
              {activity.map((a) => (
                <button key={a.id} onClick={a.action}>
                  <span className="activity-icon">
                    {a.kind === "Purchase" ? (
                      <PackagePlus size={18} />
                    ) : (
                      <Receipt size={18} />
                    )}
                  </span>
                  <span>
                    <strong>{a.title}</strong>
                    <small>
                      {a.kind} · {a.detail} · {a.date}
                    </small>
                  </span>
                  <strong>{money(a.total)}</strong>
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">
              <Receipt size={28} />
              <h3>Your first bill starts here</h3>
              <p>
                Receive stock, choose a device, then make a demo sale.
                <br />
                Your recent transactions will appear here.
              </p>
              <Btn onClick={() => go("Retail POS")}>
                Create a demo sale <ArrowRight size={15} />
              </Btn>
            </div>
          )}
          <div className="panel-footnote">
            Demo activity only. No payment or accounting vouchers sent.
          </div>
        </section>
        <section className="panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">STOCK WATCH</span>
              <h3>Running low</h3>
            </div>
            <span className="count-badge">{low.length}</span>
          </div>
          <div className="stock-alerts">
            {low.length ? (
              low.map((p: Product) => (
                <button
                  className="stock-alert"
                  key={p.id}
                  onClick={() => openProduct?.(p.id)}
                >
                  <div className="product-glyph">
                    {p.category === "Accessories" ? "AC" : "PH"}
                  </div>
                  <div className="stock-alert-copy">
                    <strong>{p.name}</strong>
                    <small>{p.variant}</small>
                  </div>
                  <div className="stock-remaining">
                    <strong>{p.stock}</strong>
                    <small>available</small>
                  </div>
                  <ChevronRight size={15} />
                </button>
              ))
            ) : (
              <Empty
                title="Stock levels look good"
                detail="Models with five units or fewer appear here."
              />
            )}
          </div>
          <button className="full-button" onClick={() => go("Purchase In")}>
            Receive more stock <ArrowRight size={15} />
          </button>
        </section>
      </div>
      <section className="setup-callout">
        <div className="task-icon">
          <CheckCircle2 size={22} />
        </div>
        <div>
          <span className="eyebrow">NEW TO THE SHOP WORKSPACE?</span>
          <h3>Learn one everyday task at a time.</h3>
          <p>
            A nine-step guide to your shop, products, purchases and first sale.
          </p>
        </div>
        <Btn
          kind="secondary"
          onClick={() => window.dispatchEvent(new Event("ssm-help"))}
        >
          Continue setup <ArrowRight size={15} />
        </Btn>
      </section>
    </div>
  );
}

function POS(p: any) {
  const [q, setQ] = useState(""),
    [manual, setManual] = useState(""),
    [showCustomer, setShowCustomer] = useState(false);
  const list = p.products
    .filter((x: Product) => !x.archived)
    .filter(
      (x: Product) =>
        [x.name, x.sku, x.barcode, x.imei || "", x.brand]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase()) ||
        p.devices.some(
          (d: DeviceUnit) =>
            d.productId === x.id &&
            [d.imei1, d.imei2, d.serialNumber, d.barcode].some(
              (v) => v && v.toLowerCase().includes(q.toLowerCase()),
            ),
        ),
    )
    .slice(0, 8);
  return (
    <div className="screen">
      <Heading
        eyebrow="COUNTER / FAST BILLING"
        title={
          <>
            New <em>sale</em>
          </>
        }
        description="Choose a customer, scan an item, and review the bill."
        action={
          <div className="segmented">
            <button
              className={p.saleMode === "Retail" ? "selected" : ""}
              onClick={() => {
                p.setSaleMode("Retail");
                p.go("Retail POS");
              }}
            >
              Retail
            </button>
            <button
              className={p.saleMode === "Wholesale" ? "selected" : ""}
              onClick={() => {
                p.setSaleMode("Wholesale");
                p.go("Wholesale Sales");
              }}
            >
              Wholesale
            </button>
          </div>
        }
      />
      <div className="pos-layout">
        <section className="pos-main">
          <div className="scan-panel">
            <div className="scan-title">
              <div>
                <span className="eyebrow">01 / SCAN TO ADD</span>
                <strong>Barcode or IMEI</strong>
              </div>
              <Status tone="good">Scanner ready</Status>
            </div>
            <form
              className="scan-form"
              data-tour="scan-item"
              onSubmit={(e) => {
                e.preventDefault();
                p.scan(p.scanCode);
              }}
            >
              <ScanBarcode size={23} />
              <input
                ref={p.scanRef}
                value={p.scanCode}
                onChange={(e) => p.setScanCode(e.target.value)}
                placeholder="Scan barcode, IMEI or type code…"
                autoComplete="off"
              />
              <kbd>ENTER ↵</kbd>
              <button
                className="scan-add"
                type="submit"
                aria-label="Add scanned item"
              >
                <ArrowRight size={19} />
              </button>
            </form>
            <div className="scan-meta">
              <span>USB scanners behave like keyboards</span>
              <button onClick={() => setShowCustomer(!showCustomer)}>
                <UserRound size={14} /> {p.customer} <ChevronDown size={14} />
              </button>
            </div>
            {showCustomer && (
              <div className="customer-picker">
                <select
                  value={p.customer}
                  onChange={(e) => p.setCustomer(e.target.value)}
                >
                  <option>Walk-in Customer</option>
                  {p.parties
                    .filter((x: Party) => x.roles.includes("Buyer"))
                    .map((x: Party) => (
                      <option key={x.id}>{x.name}</option>
                    ))}
                </select>
                <button onClick={() => setShowCustomer(false)}>
                  <Check size={15} /> Done
                </button>
              </div>
            )}
          </div>
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow">02 / CURRENT INVOICE</span>
              <h2>
                Items{" "}
                <span className="subtle-count">
                  {p.cart.length.toString().padStart(2, "0")}
                </span>
              </h2>
            </div>
            <button
              className="text-button"
              onClick={() => p.setCart([])}
              disabled={!p.cart.length}
            >
              Clear bill <Trash2 size={14} />
            </button>
          </div>
          <div className="panel cart-panel">
            {p.details.length ? (
              <Table
                headers={[
                  "Product",
                  "Qty",
                  "Unit price",
                  "Discount",
                  "Line total",
                  "",
                ]}
              >
                {p.details.map((l: any) => (
                  <tr key={l.deviceId || l.productId}>
                    <td>
                      <strong>{l.p.name}</strong>
                      <small>
                        {l.p.sku}
                        {l.imei1 ? " · IMEI 1 " + l.imei1 : ""}
                        {l.imei2 ? " · IMEI 2 " + l.imei2 : ""}
                        {l.serialNumber ? " · Serial " + l.serialNumber : ""}
                      </small>
                    </td>
                    <td>
                      <div className="qty-control">
                        <button
                          onClick={() =>
                            p.updateLine(l.deviceId || l.productId, {
                              qty: Math.max(1, l.qty - 1),
                            })
                          }
                          disabled={Boolean(l.deviceId)}
                        >
                          −
                        </button>
                        <span>{l.qty}</span>
                        <button
                          onClick={() =>
                            p.updateLine(l.deviceId || l.productId, {
                              qty: l.qty + 1,
                            })
                          }
                          disabled={
                            l.p.tracking !== "Quantity" || l.qty >= l.p.stock
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        className="inline-money"
                        type="number"
                        min="0"
                        value={l.unitPrice}
                        onChange={(e) =>
                          p.updateLine(l.deviceId || l.productId, {
                            unitPrice: Math.max(0, +e.target.value),
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="inline-money"
                        type="number"
                        min="0"
                        value={l.discount}
                        onChange={(e) =>
                          p.updateLine(l.deviceId || l.productId, {
                            discount: Math.max(0, +e.target.value),
                          })
                        }
                      />
                    </td>
                    <td className="numeric">
                      <strong>{money(l.total)}</strong>
                    </td>
                    <td>
                      <button
                        className="mini-icon danger-hover"
                        onClick={() =>
                          p.setCart((c: Line[]) =>
                            c.filter(
                              (x) =>
                                (x.deviceId || x.productId) !==
                                (l.deviceId || l.productId),
                            ),
                          )
                        }
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </Table>
            ) : (
              <div className="scan-empty">
                <div className="scan-box">
                  <ScanBarcode size={34} />
                </div>
                <strong>Ready for the first scan.</strong>
                <span>
                  Scan a phone's IMEI or an accessory barcode to start.
                </span>
              </div>
            )}
          </div>
          <div className="manual-entry panel">
            <div>
              <span className="eyebrow">QUICK PRICE / MANUAL ITEM</span>
              <strong>Manual price entry</strong>
              <small>
                Select a product first to retain stock traceability.
              </small>
            </div>
            <div className="manual-controls">
              <label>
                <span>Agreed price ₹</span>
                <input
                  type="number"
                  min="0"
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  placeholder="0.00"
                />
              </label>
              <Btn
                kind="secondary"
                onClick={() => {
                  if (Number(manual) > 0 && p.details.length) {
                    p.updateLine(
                      p.details[p.details.length - 1].deviceId ||
                        p.details[p.details.length - 1].productId,
                      { unitPrice: Number(manual) },
                    );
                    setManual("");
                  } else
                    p.notify(
                      "Scan or select a product before applying a price.",
                    );
                }}
              >
                <Pencil size={15} /> Apply price
              </Btn>
            </div>
          </div>
          <div className="catalog-panel">
            <div className="panel-head">
              <div>
                <span className="eyebrow">03 / QUICK CATALOGUE</span>
                <h3>Or pick a product</h3>
              </div>
              <label className="mini-search">
                <Search size={14} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Find model or SKU"
                />
              </label>
            </div>
            <div className="product-pick-grid">
              {list.map((x: Product) => (
                <button
                  className="product-pick"
                  key={x.id}
                  onClick={() =>
                    x.tracking === "Quantity"
                      ? p.addCart(x)
                      : p.setDevicePickerProductId(x.id)
                  }
                  disabled={x.stock <= 0}
                >
                  <span className="product-pick-art">
                    {x.category === "Accessories" ? "AC" : "PH"}
                  </span>
                  <span className="pick-info">
                    <strong>{x.name}</strong>
                    <small>
                      {x.variant} · {x.stock} in stock
                    </small>
                    <b>
                      {money(
                        p.saleMode === "Retail"
                          ? x.retailPrice
                          : x.wholesalePrice,
                      )}
                    </b>
                  </span>
                  <Plus size={17} />
                </button>
              ))}
            </div>
            {p.devicePickerProductId &&
              (() => {
                const chosen = p.products.find(
                  (x: Product) => x.id === p.devicePickerProductId,
                );
                if (!chosen) return null;
                const available = p.devices.filter(
                  (d: DeviceUnit) =>
                    d.productId === chosen.id && d.status === "In stock",
                );
                return (
                  <div className="device-picker">
                    <div className="device-picker-head">
                      <div>
                        <span className="eyebrow">SELECT EXACT UNIT</span>
                        <strong>
                          {chosen.name} · {available.length} available
                        </strong>
                        <small>
                          Choose the handset physically in front of you. The
                          selected IMEI will be attached to the sale.
                        </small>
                      </div>
                      <button
                        className="mini-icon"
                        onClick={() => p.setDevicePickerProductId(null)}
                        aria-label="Close device picker"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {available.length ? (
                      <div className="device-picker-list">
                        {available.map((d: DeviceUnit) => (
                          <button
                            type="button"
                            className="device-picker-row"
                            key={d.id}
                            disabled={p.cart.some(
                              (l: Line) => l.deviceId === d.id,
                            )}
                            onClick={() => p.addCart(chosen, d.id)}
                          >
                            <span>
                              <strong>{d.imei1 || d.serialNumber}</strong>
                              <small>
                                {d.imei2
                                  ? "IMEI 2: " + d.imei2
                                  : "Serial: " + (d.serialNumber || "—")}{" "}
                                · Label {d.barcode}
                              </small>
                            </span>
                            <span className="device-picker-add">
                              <Plus size={15} /> Add
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        title="No units available"
                        detail="Receive stock or check the device status."
                      />
                    )}
                  </div>
                );
              })()}
          </div>
        </section>
        <aside className="checkout-panel" data-tour="checkout">
          <div className="checkout-head">
            <span className="eyebrow">04 / CHECKOUT</span>
            <span className="invoice-id">DRAFT / LOCAL</span>
          </div>
          <div className="checkout-customer">
            <div className="avatar avatar-paper">
              {p.customer.slice(0, 1) || "W"}
            </div>
            <div>
              <strong>{p.customer}</strong>
              <small>Customer / buyer</small>
            </div>
            <button
              className="mini-icon"
              onClick={() => setShowCustomer(!showCustomer)}
            >
              <Pencil size={14} />
            </button>
          </div>
          <div className="price-mode">
            <span>Price entry</span>
            <div className="segmented small">
              <button
                className={p.priceMode === "inclusive" ? "selected" : ""}
                onClick={() => p.setPriceMode("inclusive")}
              >
                GST included
              </button>
              <button
                className={p.priceMode === "exclusive" ? "selected" : ""}
                onClick={() => p.setPriceMode("exclusive")}
              >
                + GST
              </button>
            </div>
          </div>
          <div className="price-mode">
            <span>Supply type</span>
            <div className="segmented small">
              <button
                className={p.saleType === "intra" ? "selected" : ""}
                onClick={() => p.setSaleType("intra")}
              >
                Intra-state
              </button>
              <button
                className={p.saleType === "inter" ? "selected" : ""}
                onClick={() => p.setSaleType("inter")}
              >
                Inter-state
              </button>
            </div>
          </div>
          <div className="summary-lines">
            <div>
              <span>Items subtotal</span>
              <strong>{money(p.subtotal)}</strong>
            </div>
            <div>
              <span>Taxable value</span>
              <strong>{money(p.taxable)}</strong>
            </div>
            <div>
              <span>
                {p.saleType === "intra" ? "CGST + SGST" : "IGST"} amount
              </span>
              <strong>{money(p.tax)}</strong>
            </div>
          </div>
          <div className="grand-total">
            <span>AMOUNT DUE</span>
            <strong>{money(p.total)}</strong>
            <small>
              {p.priceMode === "inclusive"
                ? "Includes configured GST"
                : "Tax added to taxable value"}
            </small>
          </div>
          <div className="checkout-meta">
            <label>
              Payment method (demo record)
              <select
                value={p.paymentMethod}
                onChange={(e) => p.setPaymentMethod(e.target.value)}
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Bank transfer</option>
                <option>Credit / Udhaar</option>
              </select>
            </label>
          </div>
          <Btn onClick={p.issueInvoice} disabled={!p.cart.length}>
            <Receipt size={17} /> Save demo sale & preview
          </Btn>
          <p className="checkout-foot">
            <ShieldCheck size={14} /> Demo only · not persisted to server or
            Tally.
          </p>
        </aside>
      </div>
    </div>
  );
}

function PriceManager({
  products,
  edits,
  setEdits,
  save,
  pct,
  setPct,
  bulkAdjust,
}: any) {
  const [q, setQ] = useState("");
  const list = products.filter((p: Product) =>
    [p.name, p.sku, p.supplierCode, p.brand]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <div className="screen">
      <Heading
        eyebrow="PRICING / OWNER CONTROLS"
        title={
          <>
            Prices don't <em>stand still.</em>
          </>
        }
        description="Update current prices; historical invoice values stay untouched."
        action={
          <Btn onClick={save}>
            <Check size={16} /> Save changes ({Object.keys(edits).length})
          </Btn>
        }
      />
      <div className="price-banner">
        <div className="price-banner-icon">
          <Tag size={22} />
        </div>
        <div>
          <strong>One update. Future bills only.</strong>
          <p>
            Price edits affect new sales. Completed invoices retain their
            original values.
          </p>
        </div>
        <Status tone="good">Demo editing</Status>
      </div>
      <div className="bulk-panel">
        <div>
          <span className="eyebrow">BULK ADJUSTMENT / DEMO</span>
          <h3>Adjust retail prices</h3>
          <p>Apply a percentage adjustment to the browser demo price list.</p>
        </div>
        <div className="bulk-controls">
          <label>
            Change by %
            <input
              type="number"
              step=".5"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
          </label>
          <Btn kind="dark" onClick={bulkAdjust}>
            Apply adjustment <ArrowUpRight size={15} />
          </Btn>
        </div>
      </div>
      <div className="panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product or supplier"
            />
          </label>
          <span className="subtle-note">
            <History size={15} /> Persistent audit needs database setup.
          </span>
        </div>
        <Table
          headers={[
            "Product",
            "Supplier",
            "Purchase cost",
            "Wholesale",
            "Retail",
            "Margin",
          ]}
        >
          {list.map((p: Product) => {
            const r = Number(edits[p.id + ":retail"] ?? p.retailPrice),
              w = Number(edits[p.id + ":wholesale"] ?? p.wholesalePrice);
            return (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <small>
                    {p.sku} · {p.variant}
                  </small>
                </td>
                <td>
                  <span className="code">{p.supplierCode || "—"}</span>
                </td>
                <td>{money(p.purchaseCost)}</td>
                <td>
                  <label className="price-edit">
                    <span>₹</span>
                    <input
                      type="number"
                      min="0"
                      value={
                        edits[p.id + ":wholesale"] ?? String(p.wholesalePrice)
                      }
                      onChange={(e) =>
                        setEdits((old: Record<string, string>) => ({
                          ...old,
                          [p.id + ":wholesale"]: e.target.value,
                        }))
                      }
                    />
                  </label>
                </td>
                <td>
                  <label className="price-edit price-edit-main">
                    <span>₹</span>
                    <input
                      type="number"
                      min="0"
                      value={edits[p.id + ":retail"] ?? String(p.retailPrice)}
                      onChange={(e) =>
                        setEdits((old: Record<string, string>) => ({
                          ...old,
                          [p.id + ":retail"]: e.target.value,
                        }))
                      }
                    />
                  </label>
                </td>
                <td>
                  <span
                    className={r < p.purchaseCost ? "negative" : "positive"}
                  >
                    {r < p.purchaseCost
                      ? "Below cost"
                      : money(r - p.purchaseCost)}
                  </span>
                </td>
              </tr>
            );
          })}
        </Table>
        <div className="table-footer">
          {list.length} products · {Object.keys(edits).length} edited fields{" "}
          <button className="text-button" onClick={() => setEdits({})}>
            Discard edits
          </button>
        </div>
      </div>
    </div>
  );
}
function Parties({ parties, search, setSearch, setModal }: any) {
  const [tab, setTab] = useState("All");
  const list = parties.filter(
    (p: Party) => tab === "All" || p.roles.includes(tab),
  );
  return (
    <div className="screen">
      <Heading
        eyebrow="BUSINESS / PARTY DIRECTORY"
        title={
          <>
            Know every <em>party.</em>
          </>
        }
        description="One master record for suppliers, buyers and combined trading partners."
        action={
          <Btn onClick={() => setModal("party")}>
            <UserRoundPlus size={16} /> Add party
          </Btn>
        }
      />
      <div className="inventory-metrics">
        <div>
          <span>All parties</span>
          <strong>{parties.length.toString().padStart(2, "0")}</strong>
        </div>
        <div>
          <span>Suppliers</span>
          <strong>
            {parties.filter((p: Party) => p.roles.includes("Supplier")).length}
          </strong>
        </div>
        <div>
          <span>Buyers</span>
          <strong>
            {parties.filter((p: Party) => p.roles.includes("Buyer")).length}
          </strong>
        </div>
      </div>
      <div className="panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, phone or GSTIN"
            />
          </label>
          <div className="segmented">
            {["All", "Supplier", "Buyer"].map((t) => (
              <button
                key={t}
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Table
          headers={[
            "Party code",
            "Party",
            "Roles",
            "Contact",
            "GSTIN",
            "Receivable",
            "Payable",
          ]}
        >
          {list.map((p: Party) => (
            <tr key={p.id}>
              <td>
                <span className="code">{p.code || "—"}</span>
              </td>
              <td>
                <strong>{p.name}</strong>
                <small>{p.city}</small>
              </td>
              <td>
                <div className="tag-list">
                  {p.roles.map((r) => (
                    <span className="category-tag" key={r}>
                      {r}
                    </span>
                  ))}
                </div>
              </td>
              <td>{p.phone}</td>
              <td className="mono">{p.gstin || "Not set"}</td>
              <td className="numeric">{money(p.receivable)}</td>
              <td className="numeric">{money(p.payable)}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
function Categories({ products, setCategory, go }: any) {
  const data = [
    ["Smartphones", "PH", "Individual IMEI tracking"],
    ["China phones", "CN", "Dedicated catalogue category"],
    ["Keypad phones", "KP", "Individual device records"],
    ["Accessories", "AC", "Bulk quantities or unique serials"],
  ];
  return (
    <div className="screen">
      <Heading
        eyebrow="INVENTORY / TAXONOMY"
        title={
          <>
            Everything has <em>a place.</em>
          </>
        }
        description="Organize the catalogue around how your shop trades."
      />
      <div className="category-grid">
        {data.map((d, i) => {
          const list = products.filter((p: Product) => p.category === d[0]);
          return (
            <div className="category-card" key={d[0]}>
              <div className="category-card-top">
                <span className="category-letters">{d[1]}</span>
                <span className="category-index">0{i + 1} / 04</span>
              </div>
              <h3>{d[0]}</h3>
              <p>{d[2]}</p>
              <div className="category-stats">
                <div>
                  <strong>{list.length}</strong>
                  <span>Records</span>
                </div>
                <div>
                  <strong>
                    {list.reduce((s: number, p: Product) => s + p.stock, 0)}
                  </strong>
                  <span>Units</span>
                </div>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setCategory(d[0]);
                  go("Products & Stock");
                }}
              >
                Open category <ArrowRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="notice-box">
        <AlertTriangle size={17} />
        <span>Verify HSN and tax profiles before issuing real invoices.</span>
      </div>
    </div>
  );
}
function Identifiers({
  products,
  devices,
  inspectDevice,
  csv,
}: {
  products: Product[];
  devices: DeviceUnit[];
  inspectDevice: (id: string, saleable: boolean) => void;
  csv: () => void;
}) {
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("All");
  const list = devices.filter(
    (d) =>
      (filter === "All" || d.status === filter) &&
      (() => {
        const p = products.find((x) => x.id === d.productId);
        return [
          d.imei1,
          d.imei2,
          d.serialNumber,
          d.barcode,
          d.supplierCode,
          p?.name || "",
          p?.brand || "",
          p?.variant || "",
          p?.sku || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q.toLowerCase());
      })(),
  );
  return (
    <div className="screen">
      {devices.some((d: DeviceUnit) => d.status === "Under inspection") && (
        <section className="panel inspection-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">CUSTOMER RETURNS · NOT FOR SALE</span>
              <h3>Awaiting inspection</h3>
            </div>
          </div>
          {devices
            .filter((d: DeviceUnit) => d.status === "Under inspection")
            .map((d: DeviceUnit) => (
              <div className="return-line" key={d.id}>
                <div>
                  <strong>
                    {products.find((p: Product) => p.id === d.productId)?.name}
                  </strong>
                  <small>
                    {d.imei1 || d.serialNumber} · Original bill{" "}
                    {d.invoiceNumber}
                  </small>
                </div>
                <div className="guide-actions">
                  <Btn
                    kind="secondary"
                    onClick={() => inspectDevice(d.id, false)}
                  >
                    Mark damaged
                  </Btn>
                  <Btn onClick={() => inspectDevice(d.id, true)}>
                    Inspection passed
                  </Btn>
                </div>
              </div>
            ))}
        </section>
      )}
      <Heading
        eyebrow="INVENTORY / TRACEABILITY"
        title={
          <>
            One device. Its <em>whole story.</em>
          </>
        }
        description="Every physical handset or serialized item has its own identifier record."
        action={
          <Btn kind="secondary" onClick={csv}>
            <Download size={15} /> Export device list
          </Btn>
        }
      />
      <div className="identifier-search">
        <Barcode size={23} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search IMEI 1, IMEI 2, serial, label, SKU or model…"
        />
        <span>{list.length} units</span>
      </div>
      <div className="panel">
        <div className="toolbar">
          <div className="segmented">
            {[
              "All",
              "In stock",
              "Sold",
              "Returned to supplier",
              "Damaged",
              "Under inspection",
            ].map((t) => (
              <button
                key={t}
                className={filter === t ? "selected" : ""}
                onClick={() => setFilter(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Table
          headers={[
            "IMEI 1 / Serial",
            "IMEI 2",
            "Device label",
            "Product / SKU",
            "Supplier",
            "Purchase cost",
            "Status",
          ]}
        >
          {list.map((d) => {
            const p = products.find((x) => x.id === d.productId);
            return (
              <tr key={d.id}>
                <td>
                  <strong className="mono">
                    {d.imei1 || d.serialNumber || "—"}
                  </strong>
                  <small>{d.imei1 ? "IMEI 1" : "Serial number"}</small>
                </td>
                <td>
                  <span className="mono">{d.imei2 || "—"}</span>
                </td>
                <td>
                  <span className="mono">{d.barcode}</span>
                </td>
                <td>
                  <strong>{p?.name || "Unknown product"}</strong>
                  <small>
                    {p?.variant} · {p?.sku}
                  </small>
                </td>
                <td>
                  <span className="code">{d.supplierCode || "—"}</span>
                </td>
                <td>{money(d.purchaseCost)}</td>
                <td>
                  <Status
                    tone={
                      d.status === "In stock"
                        ? "good"
                        : d.status === "Sold"
                          ? "neutral"
                          : "warn"
                    }
                  >
                    {d.status}
                  </Status>
                </td>
              </tr>
            );
          })}
        </Table>
        {!list.length && (
          <Empty
            title="No matching device units"
            detail="Try another identifier or receive stock with IMEI / serial numbers."
          />
        )}
        <div className="table-footer">
          One row per physical unit · duplicate identifiers are rejected in the
          browser demo
        </div>
      </div>
      <div className="notice-box">
        <ShieldCheck size={17} />
        <span>
          Demo records are browser-local. Production must enforce cross-column
          IMEI uniqueness in PostgreSQL as well.
        </span>
      </div>
    </div>
  );
}
function Barcodes({ products, notify }: any) {
  const [q, setQ] = useState(""),
    [selected, setSelected] = useState<string[]>([]);
  const list = products.filter((p: Product) =>
    [p.name, p.sku, p.barcode]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <div className="screen">
      <Heading
        eyebrow="INVENTORY / LABEL STUDIO"
        title={
          <>
            Give every item <em>a code.</em>
          </>
        }
        description="Find existing codes and prepare labels for supported printers."
        action={
          <Btn
            onClick={() =>
              notify(
                selected.length
                  ? "Real barcode artwork generation still needs implementation."
                  : "Select products first.",
              )
            }
          >
            <Printer size={16} /> Print labels
          </Btn>
        }
      />
      <div className="panel label-tools">
        <div>
          <span className="eyebrow">LABEL CONFIGURATION</span>
          <h3>Label batch</h3>
          <p>Select products and review identifiers before printing.</p>
        </div>
        <label>
          Format
          <select>
            <option>Code 128</option>
            <option>Code 39</option>
            <option>QR code</option>
          </select>
        </label>
      </div>
      <div className="panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search product or SKU"
            />
          </label>
          <span className="subtle-note">{selected.length} selected</span>
        </div>
        <Table headers={["Select", "Product", "SKU", "Barcode", "Tracking"]}>
          {list.map((p: Product) => (
            <tr key={p.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected((s) =>
                      e.target.checked
                        ? [...s, p.id]
                        : s.filter((id) => id !== p.id),
                    )
                  }
                />
              </td>
              <td>
                <strong>{p.name}</strong>
                <small>{p.variant}</small>
              </td>
              <td className="mono">{p.sku}</td>
              <td className="mono">{p.barcode}</td>
              <td>{p.tracking}</td>
            </tr>
          ))}
        </Table>
      </div>
    </div>
  );
}
function Purchases(p: any) {
  const ret = p.screen === "Purchase Returns";
  const total = p.lines.reduce((s: number, l: any) => s + l.qty * l.cost, 0);
  const visible = p.products.filter((x: Product) =>
    [x.name, x.sku, x.barcode, x.imei || ""]
      .join(" ")
      .toLowerCase()
      .includes(p.q.toLowerCase()),
  );
  return (
    <div className="screen">
      <Heading
        eyebrow={
          ret ? "OPERATIONS / SUPPLIER RETURNS" : "OPERATIONS / GOODS RECEIVED"
        }
        title={
          ret ? (
            <>
              Back to the <em>supplier.</em>
            </>
          ) : (
            <>
              Bring stock <em>in.</em>
            </>
          )
        }
        description={
          ret
            ? "Record supplier returns against their source purchase."
            : "Record supplier bills, scan devices and receive stock."
        }
        action={
          <div className="segmented">
            <button
              className={!ret ? "selected" : ""}
              onClick={() => p.go("Purchase In")}
            >
              Purchase In
            </button>
            <button
              className={ret ? "selected" : ""}
              onClick={() => p.go("Purchase Returns")}
            >
              Purchase Return
            </button>
          </div>
        }
      />
      <div className="form-layout">
        <section className="panel form-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">01 / SUPPLIER</span>
              <h3>Who supplied it?</h3>
            </div>
            <Building2 size={18} />
          </div>
          <div className="form-grid" data-tour="shop-form">
            <label className="field span-2">
              Supplier
              <select
                value={p.supplier}
                onChange={(e: any) => p.setSupplier(e.target.value)}
              >
                {p.parties
                  .filter((x: Party) => x.roles.includes("Supplier"))
                  .map((x: Party) => (
                    <option key={x.id} value={x.code || x.id}>
                      {x.code ? x.code + " · " : ""}
                      {x.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field">
              Supplier bill no.
              <input
                value={p.billNo}
                onChange={(e: any) => p.setBillNo(e.target.value)}
                placeholder="DEL/2026/018"
              />
            </label>
            <label className="field">
              Bill date
              <input
                type="date"
                value={p.billDate}
                onChange={(e: any) => p.setBillDate(e.target.value)}
              />
            </label>
          </div>
          <div className="form-divider" />
          <div className="panel-head">
            <div>
              <span className="eyebrow">02 / PRODUCT LINES</span>
              <h3>Add items</h3>
            </div>
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              value={p.q}
              onChange={(e: any) => p.setQ(e.target.value)}
              placeholder="Search model, SKU, IMEI or barcode"
            />
          </label>
          <div className="purchase-catalog">
            {visible.map((x: Product) => (
              <div className="purchase-pick" key={x.id}>
                <div>
                  <strong>{x.name}</strong>
                  <small>
                    {x.sku} · Stock {x.stock}
                  </small>
                </div>
                <span>{money(x.purchaseCost)}</span>
                <button
                  onClick={() =>
                    p.setLines((old: any[]) => {
                      const found = old.find((l) => l.productId === x.id);
                      return found
                        ? old.map((l) =>
                            l.productId === x.id ? { ...l, qty: l.qty + 1 } : l,
                          )
                        : [
                            ...old,
                            {
                              productId: x.id,
                              qty: 1,
                              cost: x.purchaseCost,
                              imei1s: "",
                              imei2s: "",
                              serialNumbers: "",
                            },
                          ];
                    })
                  }
                >
                  <Plus size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="form-divider" />
          {p.lines.length ? (
            <Table headers={["Product", "Qty", "Unit cost", "Line total", ""]}>
              {p.lines.map((l: any) => (
                <tr key={l.productId}>
                  <td>
                    <strong>
                      {
                        p.products.find((x: Product) => x.id === l.productId)
                          ?.name
                      }
                    </strong>
                    <small>
                      {
                        p.products.find((x: Product) => x.id === l.productId)
                          ?.sku
                      }
                    </small>
                    {p.products.find((x: Product) => x.id === l.productId)
                      ?.tracking === "IMEI" ? (
                      <div className="purchase-identifiers">
                        <label>
                          IMEI 1 / one per phone
                          <textarea
                            rows={2}
                            value={l.imei1s || ""}
                            onChange={(e: any) =>
                              p.setLines((old: any[]) =>
                                old.map((x) =>
                                  x.productId === l.productId
                                    ? { ...x, imei1s: e.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder="One 15-digit IMEI per line"
                          />
                        </label>
                        <label>
                          IMEI 2 / optional
                          <textarea
                            rows={2}
                            value={l.imei2s || ""}
                            onChange={(e: any) =>
                              p.setLines((old: any[]) =>
                                old.map((x) =>
                                  x.productId === l.productId
                                    ? { ...x, imei2s: e.target.value }
                                    : x,
                                ),
                              )
                            }
                            placeholder="Optional second IMEI per phone"
                          />
                        </label>
                      </div>
                    ) : p.products.find((x: Product) => x.id === l.productId)
                        ?.tracking === "Serial" ? (
                      <label className="purchase-identifiers">
                        Serial numbers / one per unit
                        <textarea
                          rows={2}
                          value={l.serialNumbers || ""}
                          onChange={(e: any) =>
                            p.setLines((old: any[]) =>
                              old.map((x) =>
                                x.productId === l.productId
                                  ? { ...x, serialNumbers: e.target.value }
                                  : x,
                              ),
                            )
                          }
                          placeholder="One serial number per line"
                        />
                      </label>
                    ) : null}
                  </td>
                  <td>
                    <input
                      className="small-edit"
                      type="number"
                      min="1"
                      value={l.qty}
                      onChange={(e: any) =>
                        p.setLines((old: any[]) =>
                          old.map((x) =>
                            x.productId === l.productId
                              ? { ...x, qty: Math.max(1, +e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      className="small-edit"
                      type="number"
                      min="0"
                      value={l.cost}
                      onChange={(e: any) =>
                        p.setLines((old: any[]) =>
                          old.map((x) =>
                            x.productId === l.productId
                              ? { ...x, cost: Math.max(0, +e.target.value) }
                              : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>{money(l.qty * l.cost)}</td>
                  <td>
                    <button
                      className="mini-icon"
                      onClick={() =>
                        p.setLines((old: any[]) =>
                          old.filter((x) => x.productId !== l.productId),
                        )
                      }
                    >
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </Table>
          ) : (
            <Empty
              title="No purchase lines"
              detail="Search the catalogue and add goods received."
            />
          )}
        </section>
        <aside
          className="checkout-panel purchase-summary"
          data-tour="receive-stock"
        >
          <span className="eyebrow">03 / SUMMARY</span>
          <h3>{ret ? "Return value" : "Purchase value"}</h3>
          <div className="summary-lines">
            <div>
              <span>Bill reference</span>
              <strong>{p.billNo || "Not entered"}</strong>
            </div>
            <div>
              <span>Line items</span>
              <strong>{p.lines.length}</strong>
            </div>
            <div>
              <span>Quantity</span>
              <strong>
                {p.lines.reduce((s: number, l: any) => s + l.qty, 0)}
              </strong>
            </div>
          </div>
          <div className="grand-total">
            <span>{ret ? "RETURN VALUE" : "PURCHASE COST"}</span>
            <strong>{money(total)}</strong>
          </div>
          <p className="checkout-foot">
            <AlertTriangle size={14} /> Demo only. No accounting voucher was
            posted.
          </p>
          <Btn disabled={!p.lines.length} onClick={p.save}>
            {ret ? "Record return" : "Save purchase"}
          </Btn>
          <Btn kind="secondary" onClick={() => p.setLines([])}>
            Clear lines
          </Btn>
        </aside>
      </div>
      <section className="panel purchase-history">
        <div className="panel-head">
          <div>
            <span className="eyebrow">SAVED IN THIS BROWSER</span>
            <h3>Recent purchases & supplier returns</h3>
          </div>
        </div>
        {p.records?.length ? (
          <Table
            headers={[
              "Supplier bill",
              "Date",
              "Supplier",
              "Type",
              "Units",
              "Cost total",
            ]}
          >
            {p.records.map((r: PurchaseRecord) => (
              <tr key={r.id}>
                <td>
                  <strong>{r.number}</strong>
                </td>
                <td>{r.date}</td>
                <td>{r.supplier}</td>
                <td>{r.kind}</td>
                <td>{r.qty}</td>
                <td>{money(r.total)}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="No purchases received yet"
            detail="Enter the supplier bill and match quantities to your delivery before receiving stock."
          />
        )}
      </section>
    </div>
  );
}
function Returns({ invoices, devices, returns, onReturn }: any) {
  const [q, setQ] = useState("");
  const list = invoices.filter((i: Invoice) =>
    [
      i.number,
      i.party,
      ...i.items.map((l) => [l.name, l.imei1, l.imei2].join(" ")),
    ]
      .join(" ")
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  return (
    <section className="screen">
      <Heading
        eyebrow="DAILY OPERATIONS / SALES RETURNS"
        title="Receive a customer return"
        description="Find the original bill and select the exact handset. Returned phones stay out of saleable stock until inspected."
      />
      <div className="panel">
        <div className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Find original invoice"
              placeholder="Invoice, customer, IMEI or product"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
        </div>
        {list.length ? (
          <div className="return-list">
            {list.map((i: Invoice) => (
              <section key={i.id} className="return-invoice">
                <h3>
                  {i.number}{" "}
                  <small>
                    {i.party} · {i.date}
                  </small>
                </h3>
                {i.items.map((l, n) => {
                  const d = devices.find(
                    (d: DeviceUnit) => d.id === l.deviceId,
                  );
                  const done = returns.some(
                    (r: ReturnRecord) =>
                      r.deviceId === l.deviceId && r.invoice === i.number,
                  );
                  return (
                    <div className="return-line" key={l.deviceId || n}>
                      <div>
                        <strong>{l.name}</strong>
                        <small>
                          {l.imei1 || l.serialNumber || "Quantity item"}
                          {l.imei2 ? " · IMEI 2: " + l.imei2 : ""}
                        </small>
                      </div>
                      {d ? (
                        <Btn
                          kind="secondary"
                          disabled={
                            done ||
                            d.status !== "Sold" ||
                            d.invoiceNumber !== i.number
                          }
                          onClick={() => onReturn(i, d.id)}
                        >
                          {done ? "Return received" : "Receive for inspection"}
                        </Btn>
                      ) : (
                        <Status tone="warn">
                          Quantity return not connected
                        </Status>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
          </div>
        ) : (
          <Empty
            title="No matching demo sales"
            detail="Create a sale first, or search for its original invoice."
          />
        )}
      </div>
      <div className="notice-box">
        <ShieldCheck size={17} />
        <span>
          Demo handset intake only. Refunds, quantity-item returns and credit
          notes are not connected. Complete inspection from Device Tracking.
        </span>
      </div>
    </section>
  );
}
function Movements({
  products,
  invoices,
  purchases = [],
  returns = [],
  stockAudit = [],
}: any) {
  const rows = [
    ...stockAudit.map((a: StockAudit) => ({
      id: a.id,
      date: a.at.slice(0, 10),
      ref: a.label,
      type: "Stock correction · " + a.action,
      party: a.reason,
      qty:
        a.scope === "device"
          ? (a.after.status === "In stock" ? 1 : 0) -
            (a.before.status === "In stock" ? 1 : 0)
          : Number(a.after.stock || 0) - Number(a.before.stock || 0),
    })),
    ...invoices.map((i: Invoice) => ({
      id: i.id,
      date: i.date,
      ref: i.number,
      type: "Sale issue",
      party: i.party,
      qty: -i.items.reduce((s, l) => s + l.qty, 0),
    })),
    ...purchases.map((p: PurchaseRecord) => ({
      id: p.id,
      date: p.date,
      ref: p.number,
      type: p.kind,
      party: p.supplier,
      qty: p.kind === "Purchase" ? p.qty : -p.qty,
    })),
    ...returns.map((r: ReturnRecord) => ({
      id: r.id,
      date: r.date,
      ref: r.invoice,
      type: "Return · inspection hold",
      party: r.name,
      qty: 0,
    })),
  ];
  return (
    <div className="screen">
      <Heading
        eyebrow="INVENTORY / STOCK LEDGER"
        title={
          <>
            Every movement <em>counts.</em>
          </>
        }
        description="Timeline for receipts, sales, returns and adjustments."
      />
      <div className="inventory-metrics">
        <div>
          <span>Catalogue records</span>
          <strong>{products.length}</strong>
        </div>
        <div>
          <span>Demo movements</span>
          <strong>{rows.length}</strong>
        </div>
        <div>
          <span>Ledger status</span>
          <strong>Preview</strong>
        </div>
      </div>
      <div className="panel">
        {rows.length ? (
          <Table
            headers={[
              "Date",
              "Reference",
              "Movement",
              "Party",
              "Units",
              "Status",
            ]}
          >
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td>{r.date}</td>
                <td>{r.ref}</td>
                <td>{r.type}</td>
                <td>{r.party}</td>
                <td>{r.qty}</td>
                <td>
                  <Status tone="warn">Demo</Status>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="No movements yet"
            detail="Demo sales appear here. Production needs an immutable stock ledger."
          />
        )}
      </div>
    </div>
  );
}
function Payments({ parties, invoices, open }: any) {
  return (
    <div className="screen">
      <Heading
        eyebrow="BUSINESS / CASH FLOW"
        title={
          <>
            Payments <em>& receipts</em>
          </>
        }
        description="Payment entry preview. A persistent payment ledger is not connected."
        action={
          <Btn onClick={open}>
            <Plus size={16} /> Record payment
          </Btn>
        }
      />
      <div className="metric-grid">
        <Metric
          label="Receivables (sample)"
          value={money(
            parties.reduce((s: number, p: Party) => s + p.receivable, 0),
          )}
          detail="Illustrative balances"
          icon={ArrowDownLeft}
          tone="orange"
        />
        <Metric
          label="Payables (sample)"
          value={money(
            parties.reduce((s: number, p: Party) => s + p.payable, 0),
          )}
          detail="Illustrative balances"
          icon={ArrowUpRight}
        />
        <Metric
          label="Demo invoices"
          value={String(invoices.length)}
          detail="Browser-local records"
          icon={Receipt}
        />
        <Metric
          label="Payments"
          value="0"
          detail="No payment records"
          icon={Wallet}
          tone="red"
        />
      </div>
      <div className="panel">
        <Table headers={["Party", "Role", "Receivable", "Payable"]}>
          {parties.map((p: Party) => (
            <tr key={p.id}>
              <td>
                <strong>{p.name}</strong>
                <small>Code {p.code || "not assigned"}</small>
              </td>
              <td>{p.roles.join(" / ")}</td>
              <td>{money(p.receivable)}</td>
              <td>{money(p.payable)}</td>
            </tr>
          ))}
        </Table>
      </div>
      <div className="notice-box">
        <AlertTriangle size={17} />
        <span>
          Balances are illustrative sample values; replace them with verified
          records.
        </span>
      </div>
    </div>
  );
}
function Invoices({ invoices, selected, setSelected, csv }: any) {
  return (
    <div className="screen">
      <Heading
        eyebrow="BUSINESS / DOCUMENTS"
        title={
          <>
            Paperwork, <em>sorted.</em>
          </>
        }
        description="Invoices created in the current browser demo."
        action={
          <Btn kind="secondary" onClick={csv}>
            <Download size={15} /> Export CSV
          </Btn>
        }
      />
      <div className="panel">
        {invoices.length ? (
          <Table
            headers={[
              "Invoice",
              "Date",
              "Type",
              "Buyer",
              "Taxable",
              "GST",
              "Total",
              "Status",
            ]}
          >
            {invoices.map((i: Invoice) => (
              <tr key={i.id}>
                <td>
                  <button className="table-link" onClick={() => setSelected(i)}>
                    <strong>{i.number}</strong>
                  </button>
                </td>
                <td>{i.date}</td>
                <td>{i.type}</td>
                <td>{i.party}</td>
                <td className="numeric">{money(i.taxable)}</td>
                <td className="numeric">{money(i.tax)}</td>
                <td className="numeric">{money(i.total)}</td>
                <td>
                  <Status tone="warn">{i.status}</Status>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <Empty
            title="No invoices yet"
            detail="Create a sale from Retail POS to see it here."
          />
        )}
      </div>
      {selected && (
        <div className="panel selected-invoice">
          <div className="panel-head">
            <div>
              <span className="eyebrow">SELECTED DOCUMENT</span>
              <h3>{selected.number}</h3>
            </div>
            <Btn kind="secondary" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </Btn>
          </div>
          <p>
            {selected.party} · {selected.date} · {money(selected.total)}
          </p>
        </div>
      )}
    </div>
  );
}
function Reports({ products, invoices, exportProducts, exportInvoices }: any) {
  const sales = invoices.reduce((s: number, i: Invoice) => s + i.total, 0),
    tax = invoices.reduce((s: number, i: Invoice) => s + i.tax, 0);
  return (
    <div className="screen">
      <Heading
        eyebrow="BUSINESS INTELLIGENCE / REPORTS"
        title={
          <>
            See the <em>whole picture.</em>
          </>
        }
        description="Operational summaries based on available records."
      />
      <div className="report-grid">
        {[
          {
            title: "Sales report",
            desc: invoices.length + " demo invoices",
            icon: FileText,
            fn: exportInvoices,
          },
          {
            title: "Inventory valuation",
            desc:
              money(
                products.reduce(
                  (s: number, p: Product) => s + p.stock * p.purchaseCost,
                  0,
                ),
              ) + " sample cost",
            icon: Boxes,
            fn: exportProducts,
          },
          {
            title: "Supplier catalogue",
            desc:
              new Set(
                products.map((p: Product) => p.supplierCode).filter(Boolean),
              ).size + " supplier codes",
            icon: Truck,
            fn: exportProducts,
          },
          {
            title: "GST summary",
            desc:
              money(invoices.reduce((n: number, i: Invoice) => n + i.tax, 0)) +
              " demo tax amount",
            icon: Calculator,
            fn: exportInvoices,
          },
        ].map((x) => (
          <button className="report-card" key={x.title} onClick={x.fn}>
            <x.icon size={21} />
            <strong>{x.title}</strong>
            <span>{x.desc}</span>
            <Download size={16} />
          </button>
        ))}
      </div>
      <div className="report-summary">
        <span>DEMO SALES TOTAL</span>
        <strong>{money(sales)}</strong>
        <small>Local sample invoices only</small>
      </div>
      <div className="notice-box">
        <AlertTriangle size={17} />
        <span>
          Do not use demo reports for statutory filing. Production values must
          be persisted and reconciled with Tally.
        </span>
      </div>
    </div>
  );
}
function Tally() {
  return (
    <div className="screen">
      <Heading
        eyebrow="INTEGRATIONS / ACCOUNTING"
        title={
          <>
            Accounting <em>& Tally</em>
          </>
        }
        description="Designed for a secure local Windows connector and confirmed voucher synchronization."
      />
      <div className="integration-hero">
        <div className="integration-icon">
          <Calculator size={28} />
        </div>
        <div>
          <span className="eyebrow">TALLYPRIME / LOCAL CONNECTOR</span>
          <h2>Connector not configured.</h2>
          <p>
            The ERP must not claim a voucher synced before Tally confirms
            import.
          </p>
        </div>
        <Status tone="warn">Setup required</Status>
      </div>
      <div className="integration-grid">
        <div className="panel">
          <span className="eyebrow">01 / CONNECTION</span>
          <h3>Local connection</h3>
          <p>
            Install a Windows connector on the shop PC. It communicates with
            Tally locally and makes an authenticated outbound connection to the
            ERP.
          </p>
          {[
            "Install connector",
            "Verify company and port",
            "Send a test voucher in a test company",
          ].map((x, i) => (
            <div className="integration-step" key={x}>
              <span>{i + 1}</span>
              <div>
                <strong>{x}</strong>
                <small>Not configured</small>
              </div>
            </div>
          ))}
        </div>
        <div className="panel">
          <span className="eyebrow">02 / SYNC QUEUE</span>
          <h3>Nothing sent yet.</h3>
          {["Pending", "Synced", "Failed"].map((x) => (
            <div className="sync-row" key={x}>
              <span>{x}</span>
              <strong>—</strong>
            </div>
          ))}
          <p className="subtle-note">No fake connection counts.</p>
        </div>
      </div>
      <div className="notice-box">
        <ShieldCheck size={17} />
        <span>
          Never expose Tally's local HTTP interface publicly. Use authenticated
          outbound communication and duplicate-safe transaction IDs.
        </span>
      </div>
    </div>
  );
}
function Staff() {
  const [role, setRole] = useState("Staff");
  const perms = [
    "Retail sales",
    "Wholesale sales",
    "Purchase entry",
    "Returns",
    "Edit selling prices",
    "View purchase cost",
    "View profit reports",
    "Record payments",
    "Tally sync",
    "Shop settings",
  ];
  return (
    <div className="screen">
      <Heading
        eyebrow="ADMINISTRATION / ACCESS CONTROL"
        title={
          <>
            Clear roles. <em>Clear limits.</em>
          </>
        }
        description="Prepare simple staff workflows and owner-only controls."
      />
      <div className="panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">ROLE PREVIEW</span>
            <h3>Permission matrix</h3>
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Staff</option>
            <option>Owner / Admin</option>
          </select>
        </div>
        <Table headers={["Permission", "Staff", "Owner / Admin"]}>
          {perms.map((x, i) => (
            <tr key={x}>
              <td>{x}</td>
              <td>
                {role === "Owner / Admin" || [0, 1, 2, 3, 7].includes(i) ? (
                  <Status tone="good">Allowed</Status>
                ) : (
                  <Status tone="bad">Restricted</Status>
                )}
              </td>
              <td>
                <Status tone="good">Allowed</Status>
              </td>
            </tr>
          ))}
        </Table>
      </div>
      <div className="notice-box">
        <ShieldCheck size={17} />
        <span>
          This matrix is a UI preview. Server-side authorization must enforce
          permissions before real data is used.
        </span>
      </div>
    </div>
  );
}
function SettingsPage({ settings, setSettings, notify }: any) {
  const [tab, setTab] = useState("Business identity");
  return (
    <div className="screen">
      <Heading
        eyebrow="ADMINISTRATION / CONFIGURATION"
        title={
          <>
            Make it <em>yours.</em>
          </>
        }
        description="Manage shop identity, invoice defaults and system setup."
      />
      <div className="settings-layout">
        <div className="settings-tabs">
          {[
            "Business identity",
            "Branding gallery",
            "Invoices",
            "Tax configuration",
            "Inventory",
            "Integrations",
            "Backup & data",
          ].map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
        <section className="panel settings-panel" data-tour="shop-settings">
          {tab === "Branding gallery" ? (
            <BrandingGallery />
          ) : tab === "Business identity" ? (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">SHOP PROFILE</span>
                  <h3>Business identity</h3>
                </div>
                <Building2 size={18} />
              </div>
              <div className="form-grid">
                <label className="field span-2">
                  Shop name
                  <input
                    data-tour="shop-name"
                    value={settings.shopName}
                    onChange={(e) =>
                      setSettings({ ...settings, shopName: e.target.value })
                    }
                  />
                </label>
                <label className="field span-2">
                  Address
                  <textarea
                    rows={2}
                    value={settings.address}
                    onChange={(e) =>
                      setSettings({ ...settings, address: e.target.value })
                    }
                  />
                </label>
                <label className="field">
                  GSTIN{" "}
                  <small>
                    Optional in demo. Enter verified registration only.
                  </small>
                  <input
                    value={settings.gstin}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        gstin: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Enter verified GSTIN"
                  />
                </label>
                <label className="field">
                  Shop contact
                  <input
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                  />
                </label>
              </div>
            </>
          ) : tab === "Invoices" ? (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">DOCUMENT DEFAULTS</span>
                  <h3>Invoice setup</h3>
                </div>
                <Receipt size={18} />
              </div>
              <div className="form-grid">
                <label className="field">
                  Invoice prefix
                  <input
                    value={settings.invoicePrefix}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        invoicePrefix: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </label>
                <div className="field">
                  <span>Print formats</span>
                  <div className="setting-pill-row">
                    <Status>A4 invoice</Status>
                    <Status tone="warn">Thermal printing not connected</Status>
                  </div>
                </div>
              </div>
              <p className="subtle-note">
                Production invoice numbers must be allocated atomically in the
                database.
              </p>
            </>
          ) : tab === "Tax configuration" ? (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">TAX DEFAULTS</span>
                  <h3>GST configuration</h3>
                </div>
                <Calculator size={18} />
              </div>
              <label className="field">
                Display default GST rate %
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.defaultGst}
                  onChange={(e) =>
                    setSettings({ ...settings, defaultGst: +e.target.value })
                  }
                />
              </label>
              <div className="notice-box">
                <AlertTriangle size={17} />
                <span>
                  Actual tax must come from verified product tax profiles and
                  place-of-supply rules.
                </span>
              </div>
            </>
          ) : tab === "Integrations" ? (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">CONNECTED SYSTEMS</span>
                  <h3>Integrations</h3>
                </div>
              </div>
              <div className="integration-setting">
                <Calculator size={18} />
                <div>
                  <strong>TallyPrime</strong>
                  <small>Local connector not configured</small>
                </div>
                <Status tone="warn">Needs setup</Status>
              </div>
              <div className="integration-setting">
                <Boxes size={18} />
                <div>
                  <strong>Neon PostgreSQL</strong>
                  <small>Database URL not verified</small>
                </div>
                <Status tone="warn">Needs setup</Status>
              </div>
            </>
          ) : tab === "Inventory" ? (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">CATALOGUE RULES</span>
                  <h3>Inventory defaults</h3>
                </div>
              </div>
              <p>
                Track phones by IMEI. Accessories may be quantity managed or
                serialized. Production identifier uniqueness must be enforced in
                PostgreSQL.
              </p>
            </>
          ) : (
            <>
              <div className="panel-head">
                <div>
                  <span className="eyebrow">DATA SAFETY</span>
                  <h3>Backup and exports</h3>
                </div>
              </div>
              <p>
                Demo records live in this browser only. They are not a shared
                database or backup.
              </p>
            </>
          )}
          <div className="settings-save">
            <span className="subtle-note">
              Settings save in this browser demo only.
            </span>
            <Btn onClick={() => notify("Settings saved to this browser demo.")}>
              <Check size={15} /> Save settings
            </Btn>
          </div>
        </section>
      </div>
    </div>
  );
}
function Modal(p: any) {
  const kind = p.kind;
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e: any) => {
        if (e.target === e.currentTarget) p.close();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Record editor"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">
              {kind === "product"
                ? "INVENTORY / NEW RECORD"
                : kind === "party"
                  ? "BUSINESS / NEW PARTY"
                  : kind === "payment"
                    ? "BUSINESS / PAYMENT"
                    : "DOCUMENT / PREVIEW"}
            </span>
            <h2>
              {kind === "product"
                ? "Add a product"
                : kind === "party"
                  ? "Add a party"
                  : kind === "payment"
                    ? "Record payment"
                    : "Invoice preview"}
            </h2>
          </div>
          <button className="icon-btn" onClick={p.close}>
            <X size={18} />
          </button>
        </div>
        {kind === "product" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              p.saveProduct();
            }}
          >
            <div className="form-grid">
              <label className="field span-2">
                Product name
                <input
                  required
                  value={p.newProduct.name}
                  onChange={(e) =>
                    p.setNewProduct({ ...p.newProduct, name: e.target.value })
                  }
                />
              </label>
              <label className="field">
                Brand
                <input
                  value={p.newProduct.brand}
                  onChange={(e) =>
                    p.setNewProduct({ ...p.newProduct, brand: e.target.value })
                  }
                />
              </label>
              <label className="field">
                Category
                <select
                  value={p.newProduct.category}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      category: e.target.value,
                      tracking:
                        e.target.value === "Accessories" ? "Quantity" : "IMEI",
                      hsn: e.target.value === "Accessories" ? "8504" : "8517",
                    })
                  }
                >
                  <option>Smartphones</option>
                  <option>China phones</option>
                  <option>Keypad phones</option>
                  <option>Accessories</option>
                </select>
              </label>
              <label className="field span-2">
                Variant
                <input
                  value={p.newProduct.variant}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      variant: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                SKU <small>Model / variant code, shared by its units.</small>
                <input
                  required
                  value={p.newProduct.sku}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      sku: e.target.value.toUpperCase(),
                    })
                  }
                />
              </label>
              <label className="field">
                Barcode
                <input
                  value={p.newProduct.barcode}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      barcode: e.target.value,
                    })
                  }
                />
              </label>
              <>
                {p.newProduct.tracking === "IMEI" ? (
                  <>
                    <label className="field span-2">
                      IMEI 1 · one per phone
                      <textarea
                        rows={3}
                        required={Number(p.newProduct.stock) > 0}
                        value={p.newProduct.imei1s}
                        onChange={(e) =>
                          p.setNewProduct({
                            ...p.newProduct,
                            imei1s: e.target.value,
                          })
                        }
                        placeholder="Paste one 15-digit IMEI 1 per line"
                      />
                    </label>
                    <label className="field span-2">
                      IMEI 2 · optional, one per phone
                      <textarea
                        rows={2}
                        value={p.newProduct.imei2s}
                        onChange={(e) =>
                          p.setNewProduct({
                            ...p.newProduct,
                            imei2s: e.target.value,
                          })
                        }
                        placeholder="Optional second IMEI per phone, same order"
                      />
                    </label>
                  </>
                ) : p.newProduct.tracking === "Serial" ? (
                  <label className="field span-2">
                    Serial numbers · one per unit
                    <textarea
                      rows={3}
                      required={Number(p.newProduct.stock) > 0}
                      value={p.newProduct.serialNumbers}
                      onChange={(e) =>
                        p.setNewProduct({
                          ...p.newProduct,
                          serialNumbers: e.target.value,
                        })
                      }
                      placeholder="Paste one serial number per line"
                    />
                  </label>
                ) : null}
              </>
              <label className="field">
                Supplier code
                <input
                  value={p.newProduct.supplierCode}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      supplierCode: e.target.value.toUpperCase(),
                    })
                  }
                />
              </label>
              <label className="field">
                Purchase cost ₹
                <input
                  type="number"
                  min="0"
                  value={p.newProduct.purchaseCost}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      purchaseCost: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                Wholesale ₹
                <input
                  type="number"
                  min="0"
                  value={p.newProduct.wholesalePrice}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      wholesalePrice: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                Retail ₹
                <input
                  type="number"
                  min="0"
                  value={p.newProduct.retailPrice}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      retailPrice: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                Opening quantity{" "}
                <small>
                  Actual units already on your shelf; zero is allowed.
                </small>
                <input
                  type="number"
                  min="0"
                  value={p.newProduct.stock}
                  onChange={(e) =>
                    p.setNewProduct({ ...p.newProduct, stock: e.target.value })
                  }
                />
              </label>
              <label className="field">
                GST %
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={p.newProduct.gstRate}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      gstRate: e.target.value,
                    })
                  }
                />
              </label>
              <label className="field">
                Tracking
                <select
                  value={p.newProduct.tracking}
                  onChange={(e) =>
                    p.setNewProduct({
                      ...p.newProduct,
                      tracking: e.target.value,
                    })
                  }
                >
                  <option>IMEI</option>
                  <option>Serial</option>
                  <option>Quantity</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <Btn kind="secondary" onClick={p.close}>
                Cancel
              </Btn>
              <Btn type="submit">
                <Plus size={15} /> Add product
              </Btn>
            </div>
          </form>
        ) : kind === "party" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              p.saveParty();
            }}
          >
            <div className="form-grid">
              <label className="field span-2">
                Party/business name
                <input
                  required
                  value={p.newParty.name}
                  onChange={(e) =>
                    p.setNewParty({ ...p.newParty, name: e.target.value })
                  }
                />
              </label>
              <label className="field">
                Party code
                <input
                  value={p.newParty.code}
                  onChange={(e) =>
                    p.setNewParty({
                      ...p.newParty,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="3355 / KVMT"
                />
              </label>
              <label className="field">
                Contact
                <input
                  value={p.newParty.phone}
                  onChange={(e) =>
                    p.setNewParty({ ...p.newParty, phone: e.target.value })
                  }
                />
              </label>
              <label className="field span-2">
                GSTIN{" "}
                <small>
                  Optional in demo. Enter verified registration only.
                </small>
                <input
                  value={p.newParty.gstin}
                  onChange={(e) =>
                    p.setNewParty({
                      ...p.newParty,
                      gstin: e.target.value.toUpperCase(),
                    })
                  }
                />
              </label>
              <label className="field">
                City
                <input
                  value={p.newParty.city}
                  onChange={(e) =>
                    p.setNewParty({ ...p.newParty, city: e.target.value })
                  }
                />
              </label>
              <label className="field">
                Role
                <select
                  value={p.newParty.roles.join(",")}
                  onChange={(e) =>
                    p.setNewParty({
                      ...p.newParty,
                      roles: e.target.value.split(","),
                    })
                  }
                >
                  <option value="Buyer">Buyer</option>
                  <option value="Supplier">Supplier</option>
                  <option value="Supplier,Buyer">Supplier + Buyer</option>
                </select>
              </label>
            </div>
            <div className="modal-actions">
              <Btn kind="secondary" onClick={p.close}>
                Cancel
              </Btn>
              <Btn type="submit">
                <UserRoundPlus size={15} /> Save party
              </Btn>
            </div>
          </form>
        ) : kind === "payment" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              p.notify(
                "Payment not recorded: persistent ledger is not connected.",
              );
              p.close();
            }}
          >
            <div className="form-grid">
              <label className="field span-2">
                Party
                <select
                  value={p.payParty}
                  onChange={(e) => p.setPayParty(e.target.value)}
                >
                  <option value="">Select party</option>
                  {p.parties.map((x: Party) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Direction
                <select>
                  <option>Receive from buyer</option>
                  <option>Pay supplier</option>
                </select>
              </label>
              <label className="field">
                Method
                <select
                  value={p.payMethod}
                  onChange={(e) => p.setPayMethod(e.target.value)}
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank transfer</option>
                </select>
              </label>
              <label className="field">
                Amount ₹
                <input
                  required
                  type="number"
                  min="0"
                  value={p.payAmount}
                  onChange={(e) => p.setPayAmount(e.target.value)}
                />
              </label>
            </div>
            <div className="notice-box">
              <AlertTriangle size={15} />
              <span>Demo only. No ledger entry will be created.</span>
            </div>
            <div className="modal-actions">
              <Btn kind="secondary" onClick={p.close}>
                Close
              </Btn>
              <Btn kind="secondary" type="submit">
                Test form
              </Btn>
            </div>
          </form>
        ) : (
          <div className="invoice-paper">
            <div className="invoice-top">
              <div>
                <div className="chosen-logo invoice-chosen-logo">
                  <img
                    src="/branding/logo-option-c.png"
                    alt="Sri Sai Mobile ERP"
                  />
                </div>
                <div className="invoice-brand">{p.settings.shopName}</div>
                <p>{p.settings.address}</p>
                <p>GSTIN: {p.settings.gstin || "Not configured"}</p>
              </div>
              <div className="invoice-stamp">
                <strong>DEMO INVOICE</strong>
                <span>{p.selectedInvoice?.number}</span>
                <span>{p.selectedInvoice?.date}</span>
              </div>
            </div>
            <div className="invoice-buyer">
              <small>BILL TO</small>
              <strong>{p.selectedInvoice?.party}</strong>
            </div>
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {(p.selectedInvoice?.items || []).map((l: any, i: number) => (
                  <tr key={i}>
                    <td>
                      {l.name}
                      {(l.imei1 || l.imei2 || l.serialNumber || l.imei) && (
                        <small>
                          {l.imei1
                            ? "IMEI 1: " + l.imei1
                            : l.imei
                              ? "IMEI: " + l.imei
                              : ""}
                          {l.imei2 ? " · IMEI 2: " + l.imei2 : ""}
                          {l.serialNumber ? " · Serial: " + l.serialNumber : ""}
                        </small>
                      )}
                    </td>
                    <td>{l.qty}</td>
                    <td>
                      {money(l.price)}
                      {l.discount ? (
                        <small>Discount: {money(l.discount)}</small>
                      ) : null}
                    </td>
                    <td>{money(l.lineTotal ?? l.qty * l.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="invoice-totals">
              <div>
                <span>Taxable value</span>
                <strong>{money(p.selectedInvoice?.taxable || 0)}</strong>
              </div>
              <div>
                <span>GST</span>
                <strong>{money(p.selectedInvoice?.tax || 0)}</strong>
              </div>
              <div className="invoice-grand">
                <span>Grand total</span>
                <strong>{money(p.selectedInvoice?.total || 0)}</strong>
              </div>
            </div>
            <p className="invoice-foot">
              Demo preview. Validate tax and statutory particulars before
              issuing real tax invoices.
            </p>
            <div className="modal-actions">
              <Btn kind="secondary" onClick={p.close}>
                Close
              </Btn>
              <Btn onClick={() => window.print()}>
                <Printer size={15} /> Print preview
              </Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function ProductDrawer({
  product,
  devices,
  close,
}: {
  product?: Product;
  devices: DeviceUnit[];
  close: () => void;
}) {
  if (!product) return null;
  const units = devices.filter((d) => d.productId === product.id);
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <aside
        className="product-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Product details"
      >
        <div className="modal-head">
          <div>
            <span className="eyebrow">PRODUCT / RECORD</span>
            <h2>{product.name}</h2>
          </div>
          <button className="icon-btn" onClick={close}>
            <X size={18} />
          </button>
        </div>
        <div className="drawer-hero">
          <span className="product-glyph large">
            {product.category === "Accessories" ? "AC" : "PH"}
          </span>
          <div>
            <strong>{product.variant}</strong>
            <small>{product.sku}</small>
            <Status tone={product.stock > 0 ? "good" : "bad"}>
              {product.stock > 0 ? "Available" : "Out of stock"}
            </Status>
          </div>
        </div>
        <div className="drawer-section">
          <span className="eyebrow">IDENTIFIERS / UNIT REGISTRY</span>
          <dl>
            <dt>Model barcode</dt>
            <dd className="mono">{product.barcode}</dd>
            <dt>Tracked units</dt>
            <dd>{units.length} physical unit(s)</dd>
            <dt>Supplier code</dt>
            <dd>
              <span className="code">{product.supplierCode || "—"}</span>
            </dd>
          </dl>
          <div className="unit-record-list">
            {units.length ? (
              units.map((d) => (
                <div className="unit-record" key={d.id}>
                  <div>
                    <strong>
                      {d.imei1 || d.serialNumber || "Unit identifier"}
                    </strong>
                    <small>
                      {d.imei2 ? "IMEI 2: " + d.imei2 : "Label: " + d.barcode}
                    </small>
                  </div>
                  <Status
                    tone={
                      d.status === "In stock"
                        ? "good"
                        : d.status === "Sold"
                          ? "neutral"
                          : "warn"
                    }
                  >
                    {d.status}
                  </Status>
                </div>
              ))
            ) : (
              <p className="drawer-empty">
                Quantity-managed stock does not track individual devices.
              </p>
            )}
          </div>
        </div>
        <div className="drawer-section">
          <span className="eyebrow">PRICING</span>
          <dl>
            <dt>Purchase cost</dt>
            <dd>{money(product.purchaseCost)}</dd>
            <dt>Wholesale</dt>
            <dd>{money(product.wholesalePrice)}</dd>
            <dt>Retail</dt>
            <dd>{money(product.retailPrice)}</dd>
            <dt>Configured GST</dt>
            <dd>{product.gstRate}%</dd>
          </dl>
        </div>
        <div className="drawer-section">
          <span className="eyebrow">STOCK</span>
          <div className="big-stock">
            {product.stock}
            <small>units on hand</small>
          </div>
        </div>
        <div className="notice-box">
          <History size={16} />
          <span>
            Persisted product history requires database configuration.
          </span>
        </div>
      </aside>
    </div>
  );
}
function InvoicePrint({
  invoice,
  settings,
}: {
  invoice: Invoice;
  settings: any;
}) {
  return (
    <article className="invoice-paper">
      <div className="invoice-top">
        <div>
          <div className="chosen-logo invoice-chosen-logo">
            <img src="/branding/logo-option-c.png" alt="Sri Sai Mobile ERP" />
          </div>
          <div className="invoice-brand">{settings.shopName}</div>
          <p>{settings.address}</p>
          {settings.phone && <p>Phone: {settings.phone}</p>}
          <p>GSTIN: {settings.gstin || "Not configured"}</p>
          <p>
            Payment: {invoice.paymentMethod || "Not recorded"} · Demo paid:{" "}
            {money(invoice.paid)}
          </p>
        </div>
        <div className="invoice-stamp">
          <strong>DEMO INVOICE</strong>
          <span>{invoice.number}</span>
          <span>{invoice.date}</span>
        </div>
      </div>
      <div className="invoice-buyer">
        <small>BILL TO</small>
        <strong>{invoice.party}</strong>
      </div>
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((l, i) => (
            <tr key={i}>
              <td>
                {l.name}
                {(l.imei1 || l.imei2 || l.serialNumber || l.imei) && (
                  <small>
                    {l.imei1
                      ? "IMEI 1: " + l.imei1
                      : l.imei
                        ? "IMEI: " + l.imei
                        : ""}
                    {l.imei2 ? " · IMEI 2: " + l.imei2 : ""}
                    {l.serialNumber ? " · Serial: " + l.serialNumber : ""}
                  </small>
                )}
              </td>
              <td>{l.qty}</td>
              <td>
                {money(l.price)}
                {l.discount ? (
                  <small>Discount: {money(l.discount)}</small>
                ) : null}
              </td>
              <td>{money(l.lineTotal ?? l.qty * l.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="invoice-totals">
        <div>
          <span>Taxable value</span>
          <strong>{money(invoice.taxable)}</strong>
        </div>
        <div>
          <span>GST amount</span>
          <strong>{money(invoice.tax)}</strong>
        </div>
        <div className="invoice-grand">
          <span>Grand total</span>
          <strong>{money(invoice.total)}</strong>
        </div>
      </div>
      <p className="invoice-foot">
        Demo preview. Validate GST, invoice numbering and legal particulars
        before issuing real tax invoices.
      </p>
    </article>
  );
}
