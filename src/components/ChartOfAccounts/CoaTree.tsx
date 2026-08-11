import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { formatCurrency } from '../../utils/accounting';
import type { Account, AccountCategory, CurrencyCode } from '../../types';
import {
  FolderTree,
  Folder,
  Plus,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const CoaTree: React.FC = () => {
  const { accounts, language, refreshData, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AccountCategory | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [newCode, setNewCode] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newCategory, setNewCategory] = useState<AccountCategory>('ASSET');
  const [newCurrency, setNewCurrency] = useState<CurrencyCode>('YER');

  const categories: { key: AccountCategory; labelAr: string; labelEn: string; color: string }[] = [
    { key: 'ASSET', labelAr: 'الأصول (1000)', labelEn: 'Assets', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { key: 'LIABILITY', labelAr: 'الخصوم والالتزامات (2000)', labelEn: 'Liabilities', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { key: 'EQUITY', labelAr: 'حقوق الملكية (3000)', labelEn: 'Equity', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    { key: 'REVENUE', labelAr: 'الإيرادات (4000)', labelEn: 'Revenue', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { key: 'EXPENSE', labelAr: 'المصاريف (5000)', labelEn: 'Expenses', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  const handleAddAccount = async () => {
    if (!newCode || !newNameAr) {
      showToast('يرجى إدخال رمز الحساب والاسم العربي', 'error');
      return;
    }

    const existing = accounts.find((a) => a.code === newCode);
    if (existing) {
      showToast('رمز الحساب موجود مسبقاً، يرجى اختيار رمز آخر', 'error');
      return;
    }

    const newAccount: Account = {
      id: `acc-${Date.now()}`,
      code: newCode,
      nameAr: newNameAr,
      nameEn: newNameEn || newNameAr,
      category: newCategory,
      currency: newCurrency,
      balance: 0,
      isSystem: false,
    };

    try {
      await db.accounts.add(newAccount);
      await refreshData();
      showToast(language === 'ar' ? 'تمت إضافة الحساب المحاسبي الجديد بنجاح' : 'Account created successfully', 'success');
      setIsAddModalOpen(false);
      setNewCode('');
      setNewNameAr('');
      setNewNameEn('');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء إضافة الحساب', 'error');
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch =
      a.code.includes(searchTerm) ||
      a.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || a.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 font-cairo">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-400" />
            <span>{language === 'ar' ? 'دليل الحسابات الشجري (Chart of Accounts)' : 'Chart of Accounts Tree'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'الهيكل التنظيمي للحسابات المالية الشجرية (الأصول، الخصوم، الملكية، الإيرادات، المصاريف)'
              : 'Hierarchical tree chart of accounts structure for financial reporting'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إضافة حساب فرعي جديد' : 'Add New Account'}</span>
        </button>
      </div>

      {/* Filter and Category Pills */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-xs font-cairo">
        <div className="w-full sm:w-auto flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'بحث برقم الحساب أو الاسم...' : 'Search account code or name...'}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition border ${
                selectedCategory === cat.key ? cat.color : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {language === 'ar' ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Account Tree View Groups */}
      <div className="space-y-4 font-cairo">
        {categories
          .filter((cat) => selectedCategory === 'ALL' || selectedCategory === cat.key)
          .map((cat) => {
            const catAccounts = filteredAccounts.filter((a) => a.category === cat.key);
            if (catAccounts.length === 0) return null;

            return (
              <div
                key={cat.key}
                className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${cat.color}`}>
                      {language === 'ar' ? cat.labelAr : cat.labelEn}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">({catAccounts.length} حساب فرعي)</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right rtl:text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 text-slate-400 font-semibold">
                        <th className="pb-2">رمز الحساب</th>
                        <th className="pb-2">اسم الحساب (عربي)</th>
                        <th className="pb-2">اسم الحساب (English)</th>
                        <th className="pb-2">العملة</th>
                        <th className="pb-2">الرصيد الحالي</th>
                        <th className="pb-2 text-center">النوع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {catAccounts.map((acc) => (
                        <tr key={acc.id} className="hover:bg-slate-800/30 transition text-slate-200">
                          <td className="py-2.5 font-mono font-bold text-sky-400">{acc.code}</td>
                          <td className="py-2.5 font-bold text-slate-100">{acc.nameAr}</td>
                          <td className="py-2.5 text-slate-400">{acc.nameEn}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 font-mono text-[10px] border border-slate-800">
                              {acc.currency}
                            </span>
                          </td>
                          <td className="py-2.5 font-mono font-bold text-emerald-400">
                            {formatCurrency(acc.balance, acc.currency, language)}
                          </td>
                          <td className="py-2.5 text-center">
                            {acc.isSystem ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                                <ShieldCheck className="w-3 h-3 text-sky-400" />
                                <span>نظامي</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400">مخصص</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
      </div>

      {/* Modal: Add Account */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 font-cairo">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">إضافة حساب فرعي جديد إلى الدليل</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-100">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">الفئة الرئيسية</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AccountCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100"
                >
                  <option value="ASSET">الأصول (Assets - 1000)</option>
                  <option value="LIABILITY">الخصوم (Liabilities - 2000)</option>
                  <option value="EQUITY">حقوق الملكية (Equity - 3000)</option>
                  <option value="REVENUE">الإيرادات (Revenue - 4000)</option>
                  <option value="EXPENSE">المصاريف (Expenses - 5000)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">رمز الحساب (الكود)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="مثال: 1050 أو 5050"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">اسم الحساب (بالعربي)</label>
                <input
                  type="text"
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  placeholder="مثال: صندوق فرع عدن أو مصروف المحروقات..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">اسم الحساب (English)</label>
                <input
                  type="text"
                  value={newNameEn}
                  onChange={(e) => setNewNameEn(e.target.value)}
                  placeholder="e.g. Aden Petty Cash Box"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">عملة الحساب</label>
                <select
                  value={newCurrency}
                  onChange={(e) => setNewCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100"
                >
                  <option value="YER">YER - ريال يمني</option>
                  <option value="SAR">SAR - ريال سعودي</option>
                  <option value="USD">USD - دولار أمريكي</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddAccount}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/30"
              >
                حفظ الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
