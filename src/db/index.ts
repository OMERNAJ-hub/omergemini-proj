import Dexie, { type Table } from 'dexie';
import type {
  Account,
  JournalEntry,
  Product,
  CustomerSupplier,
  Invoice,
  ExchangeRate,
  CompanySettings,
} from '../types';

export class OmniDatabase extends Dexie {
  accounts!: Table<Account>;
  journalEntries!: Table<JournalEntry>;
  products!: Table<Product>;
  partners!: Table<CustomerSupplier>;
  invoices!: Table<Invoice>;
  exchangeRates!: Table<ExchangeRate>;
  settings!: Table<CompanySettings & { id: string }>;

  constructor() {
    super('OmniErpDb');
    this.version(1).stores({
      accounts: 'id, code, category, currency',
      journalEntries: 'id, entryNumber, date, currency',
      products: 'id, code, category',
      partners: 'id, type, name',
      invoices: 'id, invoiceNumber, type, date, partnerId, paymentStatus',
      exchangeRates: 'code',
      settings: 'id',
    });
  }
}

export const db = new OmniDatabase();

export const INITIAL_SETTINGS: CompanySettings = {
  shopNameAr: 'مؤسسة أومني للحلول والتقنية',
  shopNameEn: 'OMNI Tech & Enterprise Systems',
  taglineAr: 'النظام المحاسبي الذكي والمتكامل للشركات والمتاجر',
  taglineEn: 'Integrated High-Performance Smart Accounting System',
  commercialRegNo: '1010-884920',
  taxNo: '300-9182-01',
  phone: '+967 770 000 111',
  address: 'صنعاء - شارع الزبيري / عدن - المعلا',
  defaultCurrency: 'YER',
};

export const INITIAL_RATES: ExchangeRate[] = [
  { code: 'YER', rateToYER: 1, updatedAt: new Date().toISOString() },
  { code: 'SAR', rateToYER: 425, updatedAt: new Date().toISOString() },
  { code: 'USD', rateToYER: 1610, updatedAt: new Date().toISOString() },
];

export const INITIAL_ACCOUNTS: Account[] = [
  // ASSETS (1000s)
  { id: '1010', code: '1010', nameAr: 'الصندوق الرئيسي (ريال يمني)', nameEn: 'Main Cash Box (YER)', category: 'ASSET', currency: 'YER', balance: 4500000, isSystem: true },
  { id: '1011', code: '1011', nameAr: 'صندوق الدولار (USD)', nameEn: 'Cash Box (USD)', category: 'ASSET', currency: 'USD', balance: 12500, isSystem: true },
  { id: '1012', code: '1012', nameAr: 'صندوق الريال السعودي (SAR)', nameEn: 'Cash Box (SAR)', category: 'ASSET', currency: 'SAR', balance: 35000, isSystem: true },
  { id: '1020', code: '1020', nameAr: 'بنك اليمن والخليج (YER)', nameEn: 'Yemen Gulf Bank (YER)', category: 'ASSET', currency: 'YER', balance: 18500000, isSystem: true },
  { id: '1030', code: '1030', nameAr: 'العملاء / ذمم مدينة', nameEn: 'Accounts Receivable', category: 'ASSET', currency: 'YER', balance: 2850000, isSystem: true },
  { id: '1040', code: '1040', nameAr: 'مخزون البضائع', nameEn: 'Inventory Asset', category: 'ASSET', currency: 'YER', balance: 14200000, isSystem: true },

  // LIABILITIES (2000s)
  { id: '2010', code: '2010', nameAr: 'الموردون / ذمم دائنة', nameEn: 'Accounts Payable', category: 'LIABILITY', currency: 'YER', balance: 3200000, isSystem: true },
  { id: '2020', code: '2020', nameAr: 'أوراق الدفع والكمبيالات', nameEn: 'Notes Payable', category: 'LIABILITY', currency: 'YER', balance: 0, isSystem: true },

  // EQUITY (3000s)
  { id: '3010', code: '3010', nameAr: 'رأس المال المباشر', nameEn: 'Capital Equity', category: 'EQUITY', currency: 'YER', balance: 35000000, isSystem: true },
  { id: '3020', code: '3020', nameAr: 'الأرباح المبقاة / المدورة', nameEn: 'Retained Earnings', category: 'EQUITY', currency: 'YER', balance: 1850000, isSystem: true },

  // REVENUE (4000s)
  { id: '4010', code: '4010', nameAr: 'إيرادات المبيعات', nameEn: 'Sales Revenue', category: 'REVENUE', currency: 'YER', balance: 8400000, isSystem: true },
  { id: '4020', code: '4020', nameAr: 'إيرادات تقديم خدمات', nameEn: 'Service Revenue', category: 'REVENUE', currency: 'YER', balance: 1200000, isSystem: true },

  // EXPENSES (5000s)
  { id: '5010', code: '5010', nameAr: 'تكلفة البضاعة المباعة (COGS)', nameEn: 'Cost of Goods Sold', category: 'EXPENSE', currency: 'YER', balance: 5100000, isSystem: true },
  { id: '5020', code: '5020', nameAr: 'مصاريف إيجار المقر', nameEn: 'Rent Expense', category: 'EXPENSE', currency: 'YER', balance: 600000, isSystem: true },
  { id: '5030', code: '5030', nameAr: 'رواتب وأجور الموظفين', nameEn: 'Salaries Expense', category: 'EXPENSE', currency: 'YER', balance: 1400000, isSystem: true },
  { id: '5040', code: '5040', nameAr: 'مصاريف الكهرباء والإنترنت', nameEn: 'Utilities Expense', category: 'EXPENSE', currency: 'YER', balance: 250000, isSystem: true },
  { id: '5090', code: '5090', nameAr: 'أرباح / خسائر فروق العملة', nameEn: 'Exchange Gain/Loss', category: 'EXPENSE', currency: 'YER', balance: -150000, isSystem: true },
];

export const INITIAL_PARTNERS: CustomerSupplier[] = [
  { id: 'p-1', type: 'CUSTOMER', name: 'شركة السعيد للتجارة العامة', phone: '+967 771 222 333', address: 'صنعاء', taxNumber: '301122', balanceYER: 1850000 },
  { id: 'p-2', type: 'CUSTOMER', name: 'محلات الأمل للالكترونيات', phone: '+967 733 444 555', address: 'عدن', taxNumber: '402233', balanceYER: 1000000 },
  { id: 'p-3', type: 'SUPPLIER', name: 'مجموعة الهلال للاستيراد والتصدير', phone: '+966 50 111 2222', address: 'الرياض', taxNumber: '908822', balanceYER: -2500000 },
  { id: 'p-4', type: 'SUPPLIER', name: 'شركة دبي العالمية المحدودة', phone: '+971 4 800 999', address: 'دبي', balanceYER: -700000 },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'PRD-101',
    nameAr: 'آيفون 15 برو ماكس 256 جيجا',
    nameEn: 'iPhone 15 Pro Max 256GB',
    category: 'الهواتف الذكية',
    unit: 'جهاز',
    sellingPriceUSD: 1180,
    sellingPriceYER: 1900000,
    minStockAlert: 3,
    trackSerials: true,
    totalQuantity: 8,
    batches: [
      {
        id: 'b-101',
        productId: 'prod-1',
        purchaseDate: '2026-06-15',
        quantityRemaining: 8,
        unitCostYER: 1650000,
        serialNumbers: [
          'IMEI-358920192830192',
          'IMEI-358920192830193',
          'IMEI-358920192830194',
          'IMEI-358920192830195',
          'IMEI-358920192830196',
          'IMEI-358920192830197',
          'IMEI-358920192830198',
          'IMEI-358920192830199',
        ],
      },
    ],
  },
  {
    id: 'prod-2',
    code: 'PRD-102',
    nameAr: 'سامسونج جالاكسي S24 ألترا',
    nameEn: 'Samsung Galaxy S24 Ultra',
    category: 'الهواتف الذكية',
    unit: 'جهاز',
    sellingPriceUSD: 1050,
    sellingPriceYER: 1690000,
    minStockAlert: 2,
    trackSerials: true,
    totalQuantity: 5,
    batches: [
      {
        id: 'b-102',
        productId: 'prod-2',
        purchaseDate: '2026-07-01',
        quantityRemaining: 5,
        unitCostYER: 1480000,
        serialNumbers: [
          'IMEI-869201029304101',
          'IMEI-869201029304102',
          'IMEI-869201029304103',
          'IMEI-869201029304104',
          'IMEI-869201029304105',
        ],
      },
    ],
  },
  {
    id: 'prod-3',
    code: 'PRD-103',
    nameAr: 'شاحن أنكر سريع 65 واط',
    nameEn: 'Anker 65W Fast Charger',
    category: 'إكسسوارات',
    unit: 'قطعة',
    sellingPriceUSD: 28,
    sellingPriceYER: 45000,
    minStockAlert: 10,
    trackSerials: false,
    totalQuantity: 40,
    batches: [
      {
        id: 'b-103',
        productId: 'prod-3',
        purchaseDate: '2026-06-20',
        quantityRemaining: 40,
        unitCostYER: 32000,
      },
    ],
  },
];

export const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: 'jv-1001',
    entryNumber: 'JV-2026-0001',
    date: '2026-07-01',
    description: 'قيد إثبات رأسمال الشركة الافتتاحي بالصناديق المختلفة',
    currency: 'YER',
    totalDebit: 35000000,
    totalCredit: 35000000,
    createdAt: new Date('2026-07-01').toISOString(),
    lines: [
      { id: 'jl-1', accountId: '1010', description: 'إيداع الصندوق الرئيسي - يمني', debit: 4500000, credit: 0, currency: 'YER', rateToYER: 1 },
      { id: 'jl-2', accountId: '1011', description: 'إيداع صندوق الدولار ($12,500 @ 1600)', debit: 20000000, credit: 0, currency: 'USD', rateToYER: 1600 },
      { id: 'jl-3', accountId: '1012', description: 'إيداع صندوق السعودي (35,000 SAR @ 300)', debit: 10500000, credit: 0, currency: 'SAR', rateToYER: 300 },
      { id: 'jl-4', accountId: '3010', description: 'حساب رأس المال المباشر للشركاء', debit: 0, credit: 35000000, currency: 'YER', rateToYER: 1 },
    ],
  },
  {
    id: 'jv-1002',
    entryNumber: 'JV-2026-0002',
    date: '2026-07-10',
    description: 'اثبات مبيعات أجهزة آيفون لشركة السعيد مع تحصيل نقدي جزئي',
    currency: 'YER',
    totalDebit: 3800000,
    totalCredit: 3800000,
    createdAt: new Date('2026-07-10').toISOString(),
    lines: [
      { id: 'jl-5', accountId: '1010', description: 'دفعة نقدية مقبوضة من شركة السعيد', debit: 1950000, credit: 0, currency: 'YER', rateToYER: 1 },
      { id: 'jl-6', accountId: '1020', description: 'المتبقي ذمة على شركة السعيد', debit: 1850000, credit: 0, currency: 'YER', rateToYER: 1 },
      { id: 'jl-7', accountId: '4010', description: 'إيراد بيع أجهزة إلكترونية', debit: 0, credit: 3800000, currency: 'YER', rateToYER: 1 },
    ],
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-101',
    invoiceNumber: 'INV-2026-001',
    type: 'SALE',
    date: '2026-07-10',
    partnerId: 'p-1',
    partnerName: 'شركة السعيد للتجارة العامة',
    currency: 'YER',
    exchangeRateToYER: 1,
    items: [
      {
        id: 'ii-1',
        productId: 'prod-1',
        productName: 'آيفون 15 برو ماكس 256 جيجا',
        quantity: 2,
        unitPrice: 1900000,
        total: 3800000,
        serials: ['IMEI-358920192830192', 'IMEI-358920192830193'],
        unitCostYER: 1650000,
      },
    ],
    subtotal: 3800000,
    taxRatePercent: 0,
    taxAmount: 0,
    discount: 0,
    grandTotal: 3800000,
    paidAmount: 1950000,
    paymentStatus: 'PARTIAL',
    journalEntryId: 'jv-1002',
    notes: 'تم تسليم الجهازين مع الضمان الرسمي لمدة عام كامل',
    createdAt: new Date('2026-07-10').toISOString(),
  },
];

export async function initializeDatabase() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.put({ ...INITIAL_SETTINGS, id: 'main' });
  }

  const ratesCount = await db.exchangeRates.count();
  if (ratesCount === 0) {
    await db.exchangeRates.bulkPut(INITIAL_RATES);
  }

  const accountsCount = await db.accounts.count();
  if (accountsCount === 0) {
    await db.accounts.bulkPut(INITIAL_ACCOUNTS);
  }

  const partnersCount = await db.partners.count();
  if (partnersCount === 0) {
    await db.partners.bulkPut(INITIAL_PARTNERS);
  }

  const productsCount = await db.products.count();
  if (productsCount === 0) {
    await db.products.bulkPut(INITIAL_PRODUCTS);
  }

  const journalsCount = await db.journalEntries.count();
  if (journalsCount === 0) {
    await db.journalEntries.bulkPut(INITIAL_JOURNALS);
  }

  const invoicesCount = await db.invoices.count();
  if (invoicesCount === 0) {
    await db.invoices.bulkPut(INITIAL_INVOICES);
  }
}

export async function exportDatabaseBackup(): Promise<string> {
  const accounts = await db.accounts.toArray();
  const journalEntries = await db.journalEntries.toArray();
  const products = await db.products.toArray();
  const partners = await db.partners.toArray();
  const invoices = await db.invoices.toArray();
  const exchangeRates = await db.exchangeRates.toArray();
  const settings = await db.settings.get('main');

  const dump = {
    appName: '𝒪ℳ𝒩ℐ ERP System Backup',
    exportDate: new Date().toISOString(),
    data: {
      settings,
      exchangeRates,
      accounts,
      journalEntries,
      products,
      partners,
      invoices,
    },
  };

  return JSON.stringify(dump, null, 2);
}

export async function importDatabaseBackup(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data) return false;

    const { settings, exchangeRates, accounts, journalEntries, products, partners, invoices } = parsed.data;

    await db.transaction('rw', [db.settings, db.exchangeRates, db.accounts, db.journalEntries, db.products, db.partners, db.invoices], async () => {
      if (settings) {
        await db.settings.put({ ...settings, id: 'main' });
      }
      if (exchangeRates && Array.isArray(exchangeRates)) {
        await db.exchangeRates.clear();
        await db.exchangeRates.bulkPut(exchangeRates);
      }
      if (accounts && Array.isArray(accounts)) {
        await db.accounts.clear();
        await db.accounts.bulkPut(accounts);
      }
      if (journalEntries && Array.isArray(journalEntries)) {
        await db.journalEntries.clear();
        await db.journalEntries.bulkPut(journalEntries);
      }
      if (products && Array.isArray(products)) {
        await db.products.clear();
        await db.products.bulkPut(products);
      }
      if (partners && Array.isArray(partners)) {
        await db.partners.clear();
        await db.partners.bulkPut(partners);
      }
      if (invoices && Array.isArray(invoices)) {
        await db.invoices.clear();
        await db.invoices.bulkPut(invoices);
      }
    });

    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}

export async function resetDatabaseToDefault() {
  await db.transaction('rw', [db.settings, db.exchangeRates, db.accounts, db.journalEntries, db.products, db.partners, db.invoices], async () => {
    await db.settings.clear();
    await db.exchangeRates.clear();
    await db.accounts.clear();
    await db.journalEntries.clear();
    await db.products.clear();
    await db.partners.clear();
    await db.invoices.clear();

    await db.settings.put({ ...INITIAL_SETTINGS, id: 'main' });
    await db.exchangeRates.bulkPut(INITIAL_RATES);
    await db.accounts.bulkPut(INITIAL_ACCOUNTS);
    await db.partners.bulkPut(INITIAL_PARTNERS);
    await db.products.bulkPut(INITIAL_PRODUCTS);
    await db.journalEntries.bulkPut(INITIAL_JOURNALS);
    await db.invoices.bulkPut(INITIAL_INVOICES);
  });
}
