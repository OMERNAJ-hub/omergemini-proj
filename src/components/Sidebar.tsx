import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  FileSpreadsheet,
  Package,
  CircleDollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'journal'
  | 'coa'
  | 'invoices'
  | 'inventory'
  | 'currency'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { language } = useApp();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      labelAr: 'لوحة التحكم القياسية',
      labelEn: 'Dashboard Bento',
      icon: LayoutDashboard,
      badge: 'الرئيسية',
    },
    {
      id: 'journal' as NavTab,
      labelAr: 'قيود اليومية والدفتر',
      labelEn: 'Journal & Ledger',
      icon: BookOpen,
      badge: 'مزدوج',
    },
    {
      id: 'coa' as NavTab,
      labelAr: 'دليل الحسابات الشجري',
      labelEn: 'Chart of Accounts',
      icon: FolderTree,
    },
    {
      id: 'invoices' as NavTab,
      labelAr: 'المبيعات والمشتريات',
      labelEn: 'Invoices & Sales',
      icon: FileSpreadsheet,
      badge: 'POS',
    },
    {
      id: 'inventory' as NavTab,
      labelAr: 'إدارة المخزون و IMEI',
      labelEn: 'Inventory & Serials',
      icon: Package,
      badge: 'FIFO',
    },
    {
      id: 'currency' as NavTab,
      labelAr: 'العملات وأسعار الصرف',
      labelEn: 'Currency & Rates',
      icon: CircleDollarSign,
      badge: 'YER/SAR/USD',
    },
    {
      id: 'reports' as NavTab,
      labelAr: 'القوائم والتقارير المالية',
      labelEn: 'Financial Reports',
      icon: BarChart3,
      badge: 'PDF',
    },
    {
      id: 'settings' as NavTab,
      labelAr: 'إعدادات النظام والنسخ',
      labelEn: 'System Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block bg-slate-900/50 border-r border-slate-800/50 p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sans">
          {language === 'ar' ? 'الوحدات المحاسبية' : 'ERP Modules'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-500'
                  }`}
                />
                <span>
                  {language === 'ar' ? item.labelAr : item.labelEn}
                </span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] px-2 py-0.5 rounded font-mono ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/50 text-slate-500 border border-slate-700/50'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Local First Security Card */}
      <div className="mt-8 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-xs space-y-2 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{language === 'ar' ? 'نظام محلي آمن 100%' : '100% Local First'}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {language === 'ar'
            ? 'تُحفظ جميع القيود والحسابات في قاعدة بيانات IndexedDB على متصفحك مباشرة بدون خوادم خارجية.'
            : 'All GL entries and accounts are encrypted and stored locally in browser IndexedDB.'}
        </p>
      </div>
    </aside>
  );
};
