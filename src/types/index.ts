export type CurrencyCode = 'YER' | 'SAR' | 'USD';

export type Language = 'ar' | 'en';

export type AccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface Account {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: AccountCategory;
  parentId?: string;
  currency: CurrencyCode;
  balance: number; // in account's native currency
  isSystem?: boolean; // system default accounts
}

export interface ExchangeRate {
  id?: string;
  code: CurrencyCode;
  rateToYER: number; // e.g. USD = 1600 YER, SAR = 425 YER, YER = 1 YER
  updatedAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  description: string;
  debit: number;  // in entry currency
  credit: number; // in entry currency
  currency: CurrencyCode;
  rateToYER: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference?: string;
  description: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  currency: CurrencyCode;
  createdAt: string;
}

export interface StockBatch {
  id: string;
  productId: string;
  purchaseDate: string;
  quantityRemaining: number;
  unitCostYER: number;
  serialNumbers?: string[]; // IMEIs or frame numbers
}

export interface Product {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: string;
  unit: string;
  sellingPriceUSD: number;
  sellingPriceYER: number;
  minStockAlert: number;
  trackSerials: boolean;
  totalQuantity: number;
  batches: StockBatch[];
}

export interface CustomerSupplier {
  id: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  name: string;
  phone: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  balanceYER: number; // (+) receivable / (-) payable
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  serials?: string[];
  unitCostYER?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'SALE' | 'PURCHASE';
  date: string;
  partnerId: string; // Customer or Supplier ID
  partnerName: string;
  currency: CurrencyCode;
  exchangeRateToYER: number;
  items: InvoiceItem[];
  subtotal: number;
  taxRatePercent: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  journalEntryId?: string;
  notes?: string;
  createdAt: string;
}

export interface CompanySettings {
  shopNameAr: string;
  shopNameEn: string;
  taglineAr: string;
  taglineEn: string;
  commercialRegNo: string;
  taxNo: string;
  phone: string;
  address: string;
  defaultCurrency: CurrencyCode;
  logoUrl?: string;
}

export interface FinancialMetric {
  netProfitYER: number;
  totalAssetsYER: number;
  totalLiabilitiesYER: number;
  totalEquityYER: number;
  cashHoldings: {
    YER: number;
    SAR: number;
    USD: number;
    totalInYER: number;
  };
  receivablesYER: number;
  payablesYER: number;
  inventoryValuationYER: number;
}

export interface DebtAging {
  period0to30: number;
  period31to60: number;
  period61to90: number;
  periodOver90: number;
  total: number;
}
