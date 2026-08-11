import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportTrialBalancePDF, exportProfitLossPDF } from '../../utils/pdfExport';
import { formatCurrency } from '../../utils/accounting';
import {
  BarChart3,
  Printer,
  Scale,
  TrendingUp,
  Landmark,
  CheckCircle2,
} from 'lucide-react';

export const FinancialReports: React.FC = () => {
  const { accounts, settings, metrics, language } = useApp();

  const [activeReport, setActiveReport] = useState<'TB' | 'PL' | 'BS'>('TB');

  const assetAccounts = accounts.filter((a) => a.category === 'ASSET');
  const liabilityAccounts = accounts.filter((a) => a.category === 'LIABILITY');
  const equityAccounts = accounts.filter((a) => a.category === 'EQUITY');
  const revenueAccounts = accounts.filter((a) => a.category === 'REVENUE');
  const expenseAccounts = accounts.filter((a) => a.category === 'EXPENSE');

  const netProfit = metrics?.netProfitYER || 0;
  const totalAssets = metrics?.totalAssetsYER || 0;
  const totalLiabilities = metrics?.totalLiabilitiesYER || 0;
  const totalEquity = (metrics?.totalEquityYER || 0) + netProfit;

  return (
    <div className="space-y-6 font-cairo">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>{language === 'ar' ? 'القوائم والتقارير المالية الختامية' : 'Financial Statements & Reports'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'ميزان المراجعة، قائمة الأرباح والخسائر، والميزانية العمومية الختامية مع إمكانية الطباعة PDF'
              : 'Trial Balance, Profit & Loss, and Balance Sheet with instant PDF export'}
          </p>
        </div>

        {/* Report Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveReport('TB')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeReport === 'TB'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ميزان المراجعة
          </button>
          <button
            onClick={() => setActiveReport('PL')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeReport === 'PL'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            قائمة الأرباح والخسائر
          </button>
          <button
            onClick={() => setActiveReport('BS')}
            className={`px-3 py-1.5 rounded-xl transition ${
              activeReport === 'BS'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            الميزانية العمومية
          </button>
        </div>
      </div>

      {/* REPORT 1: Trial Balance */}
      {activeReport === 'TB' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-sky-400" />
              <span className="text-base font-bold text-slate-100">ميزان المراجعة الشامل (Trial Balance)</span>
            </div>

            <button
              onClick={() => exportTrialBalancePDF(accounts, settings)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>تصدير تقرير PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/60">
                  <th className="p-3">رمز الحساب</th>
                  <th className="p-3">اسم الحساب المحاسبي</th>
                  <th className="p-3">الفئة</th>
                  <th className="p-3">أرصدة مدينة (Debit)</th>
                  <th className="p-3">أرصدة دائنة (Credit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accounts.map((acc) => {
                  const isDebitCategory = acc.category === 'ASSET' || acc.category === 'EXPENSE';
                  const debitBalance = isDebitCategory ? acc.balance : 0;
                  const creditBalance = !isDebitCategory ? acc.balance : 0;

                  return (
                    <tr key={acc.id} className="hover:bg-slate-800/30 text-slate-200">
                      <td className="p-3 font-mono font-bold text-sky-400">{acc.code}</td>
                      <td className="p-3 font-bold text-slate-100">{acc.nameAr}</td>
                      <td className="p-3 text-slate-400">{acc.category}</td>
                      <td className="p-3 font-mono text-emerald-400 font-bold">
                        {debitBalance > 0 ? formatCurrency(debitBalance, acc.currency, language) : '-'}
                      </td>
                      <td className="p-3 font-mono text-amber-400 font-bold">
                        {creditBalance > 0 ? formatCurrency(creditBalance, acc.currency, language) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: Profit & Loss Statement */}
      {activeReport === 'PL' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-base font-bold text-slate-100">قائمة الأرباح والخسائر (Income Statement)</span>
            </div>

            <button
              onClick={() => exportProfitLossPDF(revenueAccounts, expenseAccounts, netProfit, settings)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>تصدير تقرير PDF</span>
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Revenue Section */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-emerald-400 text-sm">أولاً: الإيرادات التشغيلية (Revenue)</div>
              <div className="space-y-1.5 pl-3">
                {revenueAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-slate-300">
                    <span>{a.code} - {a.nameAr}</span>
                    <span className="font-mono font-bold text-emerald-400">{formatCurrency(a.balance, a.currency, language)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Section */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="font-bold text-rose-400 text-sm">ثانياً: المصاريف وتكلفة المبيعات (Expenses & COGS)</div>
              <div className="space-y-1.5 pl-3">
                {expenseAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-slate-300">
                    <span>{a.code} - {a.nameAr}</span>
                    <span className="font-mono font-bold text-rose-400">{formatCurrency(a.balance, a.currency, language)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Net Profit Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/30 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-100">صافي الربح / الخسارة النهائي للفترة:</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(netProfit, 'YER', language)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: Balance Sheet */}
      {activeReport === 'BS' && (
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-purple-400" />
              <span className="text-base font-bold text-slate-100">الميزانية العمومية الختامية (Balance Sheet)</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>معادلة الميزانية متوازنة: الأصول = الخصوم + الملكية</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Left Column: Assets */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-sky-400 text-sm border-b border-slate-800 pb-2">
                الأصول والأسطول المالي (Assets)
              </div>
              <div className="space-y-2">
                {assetAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-slate-300">
                    <span>{a.code} - {a.nameAr}</span>
                    <span className="font-mono font-bold text-sky-400">{formatCurrency(a.balance, a.currency, language)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-sm text-slate-100">
                <span>مجموع الأصول:</span>
                <span className="font-mono text-sky-400">{formatCurrency(totalAssets, 'YER', language)}</span>
              </div>
            </div>

            {/* Right Column: Liabilities & Equity */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-amber-400 text-sm border-b border-slate-800 pb-2">
                الخصوم وحقوق الملكية (Liabilities & Equity)
              </div>
              <div className="space-y-2">
                <div className="font-semibold text-slate-400 text-[11px]">الخصوم والدائنون:</div>
                {liabilityAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-slate-300 pl-2">
                    <span>{a.code} - {a.nameAr}</span>
                    <span className="font-mono font-bold text-amber-400">{formatCurrency(a.balance, a.currency, language)}</span>
                  </div>
                ))}

                <div className="font-semibold text-slate-400 text-[11px] pt-2">حقوق الملكية والأرباح:</div>
                {equityAccounts.map((a) => (
                  <div key={a.id} className="flex justify-between text-slate-300 pl-2">
                    <span>{a.code} - {a.nameAr}</span>
                    <span className="font-mono font-bold text-purple-400">{formatCurrency(a.balance, a.currency, language)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-emerald-400 pl-2 font-bold">
                  <span>أرباح العام الحالي (صافي الدخل):</span>
                  <span className="font-mono">{formatCurrency(netProfit, 'YER', language)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-sm text-slate-100">
                <span>إجمالي الخصوم والملكية:</span>
                <span className="font-mono text-amber-400">{formatCurrency(totalLiabilities + totalEquity, 'YER', language)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
