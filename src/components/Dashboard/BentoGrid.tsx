import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import {
  TrendingUp,
  Wallet,
  Clock,
  ArrowUpRight,
  PlusCircle,
  FileText,
  AlertTriangle,
  Boxes,
  Users,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/accounting';

interface BentoGridProps {
  onNavigate: (tab: any) => void;
  onOpenQuickJournal: () => void;
  onOpenQuickInvoice: () => void;
}

export const BentoGrid: React.FC<BentoGridProps> = ({
  onNavigate,
  onOpenQuickJournal,
  onOpenQuickInvoice,
}) => {
  const { metrics, debtAging, language, activeCurrency, journalEntries, products, partners } = useApp();

  const netProfit = metrics?.netProfitYER || 0;
  const totalAssets = metrics?.totalAssetsYER || 0;
  const cashHoldings = metrics?.cashHoldings || { YER: 0, SAR: 0, USD: 0, totalInYER: 0 };
  const receivables = metrics?.receivablesYER || 0;
  const payables = metrics?.payablesYER || 0;
  const inventoryVal = metrics?.inventoryValuationYER || 0;

  // Low stock alert items
  const lowStockProducts = products.filter((p) => p.totalQuantity <= p.minStockAlert);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm relative overflow-hidden">
        <div className="space-y-1 z-10">
          <h1 className="text-2xl font-bold font-serif italic text-emerald-500 flex items-center gap-3">
            <span>𝒪ℳ𝒩ℐ</span>
            <span className="text-xs font-sans not-italic font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {language === 'ar' ? 'المركز المالي المباشر' : 'Live Financial Control'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-sans">
            {language === 'ar'
              ? 'مرحباً بك في نظام أومني المحاسبي. جميع القوائم والمؤشرات المالية محدثة فورياً بناءً على القيود المزدوجة.'
              : 'Welcome to OMNI ERP. Real-time balance sheets and double-entry ledger analytics.'}
          </p>
        </div>

        <div className="flex items-center gap-2 z-10">
          <button
            onClick={onOpenQuickInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-lg shadow-emerald-500/10"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{language === 'ar' ? 'فاتورة بيع جديدة' : 'New Sales Invoice'}</span>
          </button>

          <button
            onClick={onOpenQuickJournal}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700/50 transition-transform active:scale-95"
          >
            <FileText className="w-4 h-4 text-sky-400" />
            <span>{language === 'ar' ? 'قيد يومية جديد' : 'New Journal Voucher'}</span>
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Net Profit */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-sm text-slate-400">
              {language === 'ar' ? 'إجمالي الربح الصافي' : 'Net Accounting Profit'}
            </span>
            <div className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 font-mono font-medium">
              +12.4%
            </div>
          </div>

          <div>
            <div className="text-3xl font-bold text-white mt-1 font-mono">
              {formatCurrency(netProfit, activeCurrency, language)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-bold">الإيرادات - المصاريف</span>
              <span>(حساب 4010 - 5010)</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
            <span className="text-slate-400">{language === 'ar' ? 'إجمالي الأصول' : 'Total Assets'}</span>
            <span className="font-mono text-slate-200 font-semibold">
              {formatCurrency(totalAssets, activeCurrency, language)}
            </span>
          </div>
        </motion.div>

        {/* Metric 2: Multi-Currency Cash Positions */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm flex flex-col justify-between col-span-1 md:col-span-1 lg:col-span-2"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'ar' ? 'أسعار الصرف والسيولة المركزية' : 'Cash & Bank Holdings'}
              </span>
            </div>
            <span className="text-sm font-mono font-bold text-sky-400">
              {formatCurrency(cashHoldings.totalInYER, activeCurrency, language)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 my-2">
            {/* YER Cash */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/30">
              <div className="text-[10px] font-bold text-slate-400 mb-1">الريال اليمني (YER)</div>
              <div className="text-sm font-bold font-mono text-slate-100">
                {formatCurrency(cashHoldings.YER, 'YER', language)}
              </div>
            </div>

            {/* USD Cash */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-5 h-3 bg-blue-600/20 text-blue-400 text-[9px] flex items-center justify-center font-bold border border-blue-600/30 rounded">USD</span>
                <span className="text-[10px] text-slate-300 font-semibold">دولار</span>
              </div>
              <div className="text-sm font-bold font-mono text-sky-300">
                {formatCurrency(cashHoldings.USD, 'USD', language)}
              </div>
            </div>

            {/* SAR Cash */}
            <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/30">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-5 h-3 bg-emerald-600/20 text-emerald-400 text-[9px] flex items-center justify-center font-bold border border-emerald-600/30 rounded">SAR</span>
                <span className="text-[10px] text-slate-300 font-semibold">سعودي</span>
              </div>
              <div className="text-sm font-bold font-mono text-emerald-300">
                {formatCurrency(cashHoldings.SAR, 'SAR', language)}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
            <span>{language === 'ar' ? 'مقيمة بالعملة الرئيسية بناءً على سعر الصرف' : 'Valued in base currency'}</span>
            <button
              onClick={() => onNavigate('currency')}
              className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>{language === 'ar' ? 'إدارة الصرف' : 'Manage Rates'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        {/* Metric 3: Gradient Stock Alert Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 border border-emerald-500/30 rounded-2xl backdrop-blur-sm shadow-xl shadow-emerald-500/5 flex flex-col justify-between"
        >
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            {language === 'ar' ? 'تنبيهات المخزون' : 'Stock Alerts'}
          </span>

          <div className="flex items-center gap-4 my-2">
            <div className="text-3xl font-bold text-white font-mono">
              {lowStockProducts.length < 10 ? `0${lowStockProducts.length}` : lowStockProducts.length}
            </div>
            <div className="text-[10px] leading-tight text-slate-300">
              عناصر تحت الحد الأدنى<br />تتطلب إعادة طلب
            </div>
          </div>

          <button
            onClick={() => onNavigate('inventory')}
            className="w-full mt-3 py-2 bg-emerald-500 text-slate-900 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-md shadow-emerald-500/20"
          >
            {language === 'ar' ? 'إدارة المخزون' : 'Manage Inventory'}
          </button>
        </motion.div>
      </div>

      {/* Bento Middle Row: Recent Ledger Entries + Stock Alerts & Quick Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Recent Journal Entries */}
        <div className="lg:col-span-2 bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col backdrop-blur-sm">
          <div className="p-5 border-b border-slate-700/50 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-slate-200">
              {language === 'ar' ? 'قيود اليومية الأخيرة (Double-Entry)' : 'Recent Journal Vouchers'}
            </h3>

            <button
              onClick={() => onNavigate('journal')}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>{language === 'ar' ? 'عرض دفتر الأستاذ' : 'View Ledger'}</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/50 text-slate-500 uppercase">
                <tr className="border-b border-slate-700/50">
                  <th className="p-4 font-medium">رقم القيد</th>
                  <th className="p-4 font-medium">التاريخ</th>
                  <th className="p-4 font-medium">البيان والشرح</th>
                  <th className="p-4 font-medium">المبلغ</th>
                  <th className="p-4 font-medium text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {journalEntries.slice(0, 5).map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="p-4 font-mono text-slate-400 font-bold">{entry.entryNumber}</td>
                    <td className="p-4 text-slate-400">{entry.date}</td>
                    <td className="p-4 text-slate-200 font-medium max-w-xs truncate">{entry.description}</td>
                    <td className="p-4 font-mono text-emerald-400 font-bold tracking-tight">
                      {formatCurrency(entry.totalDebit, entry.currency, language)}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-semibold border border-emerald-500/20">
                        متوازن
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Customer Debt Balances */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-5 flex flex-col backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            {language === 'ar' ? 'أرصدة الذمم والعملاء (مدين)' : 'Customer Receivables'}
          </span>

          <div className="flex-1 flex flex-col gap-3">
            {partners.slice(0, 3).map((partner) => (
              <div key={partner.id} className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/30">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">{partner.name}</span>
                  <span className="text-[10px] text-emerald-400 font-medium">ضمن المهلة</span>
                </div>
                <div className="text-sm font-mono text-slate-100 font-bold">
                  {formatCurrency(partner.balanceYER || 0, 'YER', language)}
                </div>
                <div className="w-full h-1 bg-slate-800 mt-2 rounded-full overflow-hidden">
                  <div className="w-[45%] h-full bg-emerald-400"></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center text-white shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-blue-400 font-bold">
                  {language === 'ar' ? 'تقرير الذمم المالية' : 'Aging Analysis'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {language === 'ar' ? 'تصدير PDF فوري ومتابعة الديون' : 'Export PDF statements'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
