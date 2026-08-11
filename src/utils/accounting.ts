import type {
  Account,
  JournalEntry,
  Product,
  CustomerSupplier,
  ExchangeRate,
  FinancialMetric,
  DebtAging,
  CurrencyCode,
} from '../types';

/**
 * Validates a double-entry journal entry.
 * Debit must equal Credit exactly in the base entry.
 */
export function validateJournalEntry(
  lines: { debit: number; credit: number; accountId: string }[]
): { isValid: boolean; difference: number; messageAr: string; messageEn: string } {
  if (!lines || lines.length < 2) {
    return {
      isValid: false,
      difference: 0,
      messageAr: 'القيد المحاسبي يجب أن يتكون من طرفين على الأقل (مدين ودائن)',
      messageEn: 'Journal entry must have at least 2 lines (Debit and Credit)',
    };
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const line of lines) {
    if (!line.accountId) {
      return {
        isValid: false,
        difference: 0,
        messageAr: 'يرجى تحديد الحساب المحاسبي لكل طرف في القيد',
        messageEn: 'Please select an account for every line item',
      };
    }
    totalDebit += Math.round((line.debit || 0) * 100) / 100;
    totalCredit += Math.round((line.credit || 0) * 100) / 100;
  }

  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > 0.01) {
    return {
      isValid: false,
      difference: diff,
      messageAr: `القيد غير متوازن! الفارق بين المدين والدائن يساوي: ${diff.toLocaleString()} (المدين: ${totalDebit.toLocaleString()} | الدائن: ${totalCredit.toLocaleString()})`,
      messageEn: `Unbalanced entry! Debit vs Credit difference: ${diff.toLocaleString()} (Debit: ${totalDebit.toLocaleString()} | Credit: ${totalCredit.toLocaleString()})`,
    };
  }

  return {
    isValid: true,
    difference: 0,
    messageAr: 'القيد متوازن وسليم محاسبياً (المدين = الدائن)',
    messageEn: 'Balanced Journal Entry (Debit = Credit)',
  };
}

/**
 * Convert any amount from source currency to target currency using exchange rates
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRate[]
): number {
  if (from === to) return amount;
  const fromRate = rates.find((r) => r.code === from)?.rateToYER || 1;
  const toRate = rates.find((r) => r.code === to)?.rateToYER || 1;

  // Amount in YER = amount * fromRate
  const amountInYER = amount * fromRate;
  // Amount in target = amountInYER / toRate
  return Math.round((amountInYER / toRate) * 100) / 100;
}

/**
 * Calculate Real-time Financial Metrics for the Bento Grid Dashboard
 */
export function calculateFinancialMetrics(
  accounts: Account[],
  journalEntries: JournalEntry[],
  products: Product[],
  partners: CustomerSupplier[],
  rates: ExchangeRate[]
): FinancialMetric {
  // Calculate cash holdings per currency from cash & bank accounts (1010, 1011, 1012, 1020)
  const cashYERAccount = accounts.find((a) => a.code === '1010');
  const cashUSDAccount = accounts.find((a) => a.code === '1011');
  const cashSARAccount = accounts.find((a) => a.code === '1012');
  const bankYERAccount = accounts.find((a) => a.code === '1020');

  const cashYER = (cashYERAccount?.balance || 0) + (bankYERAccount?.balance || 0);
  const cashUSD = cashUSDAccount?.balance || 0;
  const cashSAR = cashSARAccount?.balance || 0;

  const usdRate = rates.find((r) => r.code === 'USD')?.rateToYER || 1610;
  const sarRate = rates.find((r) => r.code === 'SAR')?.rateToYER || 425;

  const totalCashInYER = cashYER + cashUSD * usdRate + cashSAR * sarRate;

  // Receivables & Payables
  let receivablesYER = 0;
  let payablesYER = 0;
  partners.forEach((p) => {
    if (p.balanceYER > 0) receivablesYER += p.balanceYER;
    if (p.balanceYER < 0) payablesYER += Math.abs(p.balanceYER);
  });

  // Inventory Valuation (Total Cost YER of remaining batches)
  let inventoryValuationYER = 0;
  products.forEach((prod) => {
    prod.batches.forEach((batch) => {
      inventoryValuationYER += batch.quantityRemaining * batch.unitCostYER;
    });
  });

  // Category Sums from Accounts
  let totalAssetsYER = 0;
  let totalLiabilitiesYER = 0;
  let totalEquityYER = 0;
  let totalRevenueYER = 0;
  let totalExpenseYER = 0;

  accounts.forEach((acc) => {
    const rate = rates.find((r) => r.code === acc.currency)?.rateToYER || 1;
    const balanceInYER = acc.balance * rate;

    switch (acc.category) {
      case 'ASSET':
        totalAssetsYER += balanceInYER;
        break;
      case 'LIABILITY':
        totalLiabilitiesYER += balanceInYER;
        break;
      case 'EQUITY':
        totalEquityYER += balanceInYER;
        break;
      case 'REVENUE':
        totalRevenueYER += balanceInYER;
        break;
      case 'EXPENSE':
        totalExpenseYER += balanceInYER;
        break;
    }
  });

  const netProfitYER = totalRevenueYER - totalExpenseYER;

  return {
    netProfitYER,
    totalAssetsYER,
    totalLiabilitiesYER,
    totalEquityYER,
    cashHoldings: {
      YER: cashYER,
      SAR: cashSAR,
      USD: cashUSD,
      totalInYER: totalCashInYER,
    },
    receivablesYER,
    payablesYER,
    inventoryValuationYER,
  };
}

/**
 * Calculates Debt Aging metrics for customer receivables
 */
export function calculateDebtAging(partners: CustomerSupplier[]): DebtAging {
  let period0to30 = 0;
  let period31to60 = 0;
  let period61to90 = 0;
  let periodOver90 = 0;

  partners
    .filter((p) => p.type === 'CUSTOMER' && p.balanceYER > 0)
    .forEach((p, idx) => {
      // Distribute receivables across aging buckets for realistic demonstration
      const bal = p.balanceYER;
      if (idx % 4 === 0) period0to30 += bal * 0.6;
      else if (idx % 4 === 1) period31to60 += bal * 0.25;
      else if (idx % 4 === 2) period61to90 += bal * 0.1;
      else periodOver90 += bal * 0.05;
    });

  const total = period0to30 + period31to60 + period61to90 + periodOver90;

  return {
    period0to30: Math.round(period0to30),
    period31to60: Math.round(period31to60),
    period61to90: Math.round(period61to90),
    periodOver90: Math.round(periodOver90),
    total: Math.round(total),
  };
}

/**
 * Process FIFO Sale deducting from stock batches and returning calculated total COGS in YER
 */
export function processFifoSale(
  product: Product,
  quantityRequested: number,
  selectedSerials?: string[]
): {
  updatedBatches: Product['batches'];
  totalCogsYER: number;
  consumedSerials: string[];
} {
  let remainingNeeded = quantityRequested;
  let totalCogsYER = 0;
  const consumedSerials: string[] = [];
  const updatedBatches = JSON.parse(JSON.stringify(product.batches)) as Product['batches'];

  // Sort batches by purchaseDate ascending (First In First Out)
  updatedBatches.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime());

  for (const batch of updatedBatches) {
    if (remainingNeeded <= 0) break;
    if (batch.quantityRemaining <= 0) continue;

    const takeQty = Math.min(batch.quantityRemaining, remainingNeeded);
    batch.quantityRemaining -= takeQty;
    remainingNeeded -= takeQty;

    totalCogsYER += takeQty * batch.unitCostYER;

    if (batch.serialNumbers && batch.serialNumbers.length > 0) {
      if (selectedSerials && selectedSerials.length > 0) {
        // match requested serials
        const taken = batch.serialNumbers.filter((s) => selectedSerials.includes(s));
        consumedSerials.push(...taken);
        batch.serialNumbers = batch.serialNumbers.filter((s) => !selectedSerials.includes(s));
      } else {
        const taken = batch.serialNumbers.slice(0, takeQty);
        consumedSerials.push(...taken);
        batch.serialNumbers = batch.serialNumbers.slice(takeQty);
      }
    }
  }

  return {
    updatedBatches,
    totalCogsYER,
    consumedSerials,
  };
}

/**
 * Formatter for currencies with custom symbol
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'YER',
  lang: 'ar' | 'en' = 'ar'
): string {
  const formattedNumber = new Intl.NumberFormat(lang === 'ar' ? 'ar-YE' : 'en-US', {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);

  const symbols: Record<CurrencyCode, { ar: string; en: string }> = {
    YER: { ar: 'ر.ي', en: 'YER' },
    SAR: { ar: 'ر.س', en: 'SAR' },
    USD: { ar: '$', en: 'USD' },
  };

  const symbol = symbols[currency]?.[lang] || currency;
  return lang === 'ar' ? `${formattedNumber} ${symbol}` : `${symbol} ${formattedNumber}`;
}
