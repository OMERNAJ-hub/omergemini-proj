import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
import {
  Sun,
  Moon,
  Globe,
  Database,
  Search,
  RefreshCw,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency } from '../utils/accounting';

interface HeaderProps {
  onOpenSettings: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  onSearchChange,
  searchQuery,
}) => {
  const {
    theme,
    toggleTheme,
    language,
    toggleLanguage,
    activeCurrency,
    setActiveCurrency,
    exchangeRates,
    refreshData,
    showToast,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await refreshData();
    setTimeout(() => {
      setIsSyncing(false);
      showToast(
        language === 'ar'
          ? 'تم تحديث البيانات وقواعد البيانات المحلية بنجاح'
          : 'Local Database synced successfully',
        'success'
      );
    }, 400);
  };

  const usdRate = exchangeRates.find((r) => r.code === 'USD')?.rateToYER || 1610;
  const sarRate = exchangeRates.find((r) => r.code === 'SAR')?.rateToYER || 425;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-900/50 border-b border-slate-800/50 transition-colors py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-4">
          <BrandLogo size="md" />
        </div>

        {/* Multi-Currency Quick Rate Ticker */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-800/30 border border-slate-700/50 px-3.5 py-1.5 rounded-xl text-xs backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'ar' ? 'أسعار الصرف:' : 'Rates:'}</span>
          </div>

          <div className="flex items-center gap-2 pr-2 border-r border-slate-800 text-slate-200">
            <span className="w-6 h-4 bg-blue-600/20 text-blue-400 text-[10px] flex items-center justify-center font-bold border border-blue-600/30 rounded">USD</span>
            <span className="font-mono font-bold text-slate-100">{formatCurrency(usdRate, 'YER', language)}</span>
          </div>

          <div className="flex items-center gap-2 pr-2 border-r border-slate-800 text-slate-200">
            <span className="w-6 h-4 bg-emerald-600/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold border border-emerald-600/30 rounded">SAR</span>
            <span className="font-mono font-bold text-slate-100">{formatCurrency(sarRate, 'YER', language)}</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xs relative hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'بحث في الحسابات، الفواتير، الأصناف...'
                : 'Search accounts, invoices, products...'
            }
            className="w-full bg-slate-800/40 border border-slate-700/50 focus:border-emerald-500/50 rounded-xl pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Language Switcher Pill */}
          <div className="flex bg-slate-800/50 rounded-full p-1 border border-slate-700/50">
            <button
              onClick={() => language !== 'ar' && toggleLanguage()}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                language === 'ar'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              عربي
            </button>
            <button
              onClick={() => language !== 'en' && toggleLanguage()}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                language === 'en'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              EN
            </button>
          </div>

          {/* Sync Status Badge */}
          <button
            onClick={handleManualSync}
            className="hidden sm:flex px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs items-center gap-2 hover:border-slate-600 transition"
          >
            <span className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-sky-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></span>
            <span className="text-slate-400 font-medium">
              {isSyncing
                ? (language === 'ar' ? 'جاري المزامنة...' : 'Syncing...')
                : (language === 'ar' ? 'المزامنة المحلية: نشط' : 'Local Sync: Active')}
            </span>
          </button>

          {/* Active Currency Selector */}
          <div className="flex items-center bg-slate-800/50 border border-slate-700/50 rounded-lg p-0.5 text-xs font-medium">
            {(['YER', 'SAR', 'USD'] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => setActiveCurrency(curr)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeCurrency === curr
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* Settings Shortcut */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition"
            title={language === 'ar' ? 'إعدادات النظام والنسخ الاحتياطي' : 'Settings & Backup'}
          >
            <Database className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
