import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  Account,
  JournalEntry,
  Product,
  CustomerSupplier,
  Invoice,
  ExchangeRate,
  CompanySettings,
  FinancialMetric,
  DebtAging,
  CurrencyCode,
  Language,
} from '../types';
import { db, initializeDatabase, INITIAL_SETTINGS } from '../db';
import { calculateFinancialMetrics, calculateDebtAging } from '../utils/accounting';

interface NotificationToast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
  activeCurrency: CurrencyCode;
  setActiveCurrency: (curr: CurrencyCode) => void;
  
  // Loaded Data
  isDbReady: boolean;
  settings: CompanySettings;
  accounts: Account[];
  journalEntries: JournalEntry[];
  products: Product[];
  partners: CustomerSupplier[];
  invoices: Invoice[];
  exchangeRates: ExchangeRate[];
  metrics: FinancialMetric | null;
  debtAging: DebtAging | null;
  
  // Methods
  refreshData: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  notifications: NotificationToast[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [language, setLanguage] = useState<Language>('ar');
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('YER');
  const [isDbReady, setIsDbReady] = useState(false);

  const [settings, setSettings] = useState<CompanySettings>(INITIAL_SETTINGS);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [partners, setPartners] = useState<CustomerSupplier[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [metrics, setMetrics] = useState<FinancialMetric | null>(null);
  const [debtAging, setDebtAging] = useState<DebtAging | null>(null);

  const [notifications, setNotifications] = useState<NotificationToast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [
        loadedSettings,
        loadedAccounts,
        loadedJournals,
        loadedProducts,
        loadedPartners,
        loadedInvoices,
        loadedRates,
      ] = await Promise.all([
        db.settings.get('main'),
        db.accounts.toArray(),
        db.journalEntries.orderBy('date').reverse().toArray(),
        db.products.toArray(),
        db.partners.toArray(),
        db.invoices.orderBy('date').reverse().toArray(),
        db.exchangeRates.toArray(),
      ]);

      if (loadedSettings) setSettings(loadedSettings);
      setAccounts(loadedAccounts || []);
      setJournalEntries(loadedJournals || []);
      setProducts(loadedProducts || []);
      setPartners(loadedPartners || []);
      setInvoices(loadedInvoices || []);
      setExchangeRates(loadedRates || []);

      const calculatedMetrics = calculateFinancialMetrics(
        loadedAccounts || [],
        loadedJournals || [],
        loadedProducts || [],
        loadedPartners || [],
        loadedRates || []
      );
      setMetrics(calculatedMetrics);

      const calculatedDebt = calculateDebtAging(loadedPartners || []);
      setDebtAging(calculatedDebt);
    } catch (err) {
      console.error('Failed to load ERP database:', err);
    }
  }, []);

  useEffect(() => {
    async function boot() {
      await initializeDatabase();
      await refreshData();
      setIsDbReady(true);
    }
    boot();
  }, [refreshData]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleLanguage = () => {
    const next = language === 'ar' ? 'en' : 'ar';
    setLanguage(next);
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        toggleLanguage,
        activeCurrency,
        setActiveCurrency,
        isDbReady,
        settings,
        accounts,
        journalEntries,
        products,
        partners,
        invoices,
        exchangeRates,
        metrics,
        debtAging,
        refreshData,
        showToast,
        notifications,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
};
