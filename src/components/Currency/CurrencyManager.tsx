import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { formatCurrency } from '../../utils/accounting';
import type { CurrencyCode } from '../../types';
import {
  CircleDollarSign,
  Save,
  TrendingUp,
  RefreshCw,
  Calculator,
  CheckCircle2,
} from 'lucide-react';

export const CurrencyManager: React.FC = () => {
  const { exchangeRates, accounts, language, refreshData, showToast } = useApp();

  const usdRateObj = exchangeRates.find((r) => r.code === 'USD');
  const sarRateObj = exchangeRates.find((r) => r.code === 'SAR');

  const [usdRate, setUsdRate] = useState<number>(usdRateObj?.rateToYER || 1610);
  const [sarRate, setSarRate] = useState<number>(sarRateObj?.rateToYER || 425);

  const handleUpdateRates = async () => {
    try {
      await db.transaction('rw', [db.exchangeRates], async () => {
        await db.exchangeRates.put({
          code: 'USD',
          rateToYER: usdRate,
          updatedAt: new Date().toISOString(),
        });
        await db.exchangeRates.put({
          code: 'SAR',
          rateToYER: sarRate,
          updatedAt: new Date().toISOString(),
        });
      });

      await refreshData();
      showToast(
        language === 'ar'
          ? 'تم تحديث مصفوفة أسعار الصرف المركزية وتقييم الحسابات بنجاح'
          : 'Exchange rates updated successfully',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء تعديل أسعار الصرف', 'error');
    }
  };

  // Foreign Currency Holdings Revaluation Calculation
  const usdAccounts = accounts.filter((a) => a.currency === 'USD');
  const sarAccounts = accounts.filter((a) => a.currency === 'SAR');

  const totalUsdBalance = usdAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalSarBalance = sarAccounts.reduce((sum, a) => sum + a.balance, 0);

  const usdValuationOld = totalUsdBalance * (usdRateObj?.rateToYER || 1610);
  const usdValuationNew = totalUsdBalance * usdRate;
  const usdDifference = usdValuationNew - usdValuationOld;

  const sarValuationOld = totalSarBalance * (sarRateObj?.rateToYER || 425);
  const sarValuationNew = totalSarBalance * sarRate;
  const sarDifference = sarValuationNew - sarValuationOld;

  const netGainLoss = usdDifference + sarDifference;

  return (
    <div className="space-y-6 font-cairo">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-emerald-400" />
            <span>{language === 'ar' ? 'إدارة أسعار الصرف وحساب فروق العملة' : 'Multi-Currency & Exchange Rates'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'التحكم المركزي بأسعار صرف العملات الأجنبية (USD / SAR / YER) وإعادة تقييم الأرصدة'
              : 'Central exchange rate management and automatic gain/loss revaluation'}
          </p>
        </div>
      </div>

      {/* Exchange Rates Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* USD Rate Card */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400">الدولار الأمريكي (USD)</span>
            <span className="text-[10px] text-slate-500 font-mono">1 USD = ? YER</span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">سعر الصرف المعتمد مقابل الريال اليمني:</label>
            <input
              type="number"
              value={usdRate}
              onChange={(e) => setUsdRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-lg font-bold font-mono text-sky-300 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>إجمالي الأرصدة بالدولار:</span>
            <span className="font-mono font-bold text-slate-200">{formatCurrency(totalUsdBalance, 'USD', language)}</span>
          </div>
        </div>

        {/* SAR Rate Card */}
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">الريال السعودي (SAR)</span>
            <span className="text-[10px] text-slate-500 font-mono">1 SAR = ? YER</span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">سعر الصرف المعتمد مقابل الريال اليمني:</label>
            <input
              type="number"
              value={sarRate}
              onChange={(e) => setSarRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-lg font-bold font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>إجمالي الأرصدة بالسعودي:</span>
            <span className="font-mono font-bold text-slate-200">{formatCurrency(totalSarBalance, 'SAR', language)}</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleUpdateRates}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 transition"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتطبيق أسعار الصرف الجديدة الآن</span>
        </button>
      </div>

      {/* Gain / Loss Impact Revaluation Widget */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <span>محاكاة أثر إعادة التقييم على أرباح/خسائر فروق العملة (Exchange Gain/Loss):</span>
        </h3>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <div className="text-slate-400">فارق تقييم محفظة الدولار:</div>
            <div className={`font-mono font-bold text-sm mt-0.5 ${usdDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(usdDifference, 'YER', language)}
            </div>
          </div>

          <div>
            <div className="text-slate-400">فارق تقييم محفظة السعودي:</div>
            <div className={`font-mono font-bold text-sm mt-0.5 ${sarDifference >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(sarDifference, 'YER', language)}
            </div>
          </div>

          <div>
            <div className="text-slate-400 font-bold">صافي أرباح / خسائر التغير بالصرف:</div>
            <div className={`font-mono font-bold text-lg mt-0.5 ${netGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netGainLoss, 'YER', language)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
