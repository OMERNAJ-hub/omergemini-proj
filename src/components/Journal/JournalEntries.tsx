import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { validateJournalEntry, formatCurrency } from '../../utils/accounting';
import type { CurrencyCode, JournalLine } from '../../types';
import {
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  FileText,
  Search,
  Filter,
  ArrowDownUp,
  AlertCircle,
} from 'lucide-react';

interface JournalEntriesProps {
  onEntrySaved?: () => void;
}

export const JournalEntries: React.FC<JournalEntriesProps> = () => {
  const { accounts, journalEntries, exchangeRates, language, refreshData, showToast } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Voucher Form State
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('YER');
  const [lines, setLines] = useState<
    { id: string; accountId: string; description: string; debit: number; credit: number }[]
  >([
    { id: '1', accountId: '', description: '', debit: 0, credit: 0 },
    { id: '2', accountId: '', description: '', debit: 0, credit: 0 },
  ]);

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), accountId: '', description: '', debit: 0, credit: 0 },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      showToast(
        language === 'ar'
          ? 'القيد المحاسبي المزدوج يجب أن يحتوي على طرفين على الأقل'
          : 'At least 2 lines required for double-entry',
        'error'
      );
      return;
    }
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (
    index: number,
    field: 'accountId' | 'description' | 'debit' | 'credit',
    value: any
  ) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const validation = validateJournalEntry(lines);

  const handleSaveJournal = async () => {
    if (!validation.isValid) {
      showToast(validation.messageAr, 'error');
      return;
    }

    if (!description.trim()) {
      showToast(language === 'ar' ? 'يرجى كتابة بيان عام للقيد المحاسبي' : 'Description is required', 'error');
      return;
    }

    const rateToYER = exchangeRates.find((r) => r.code === currency)?.rateToYER || 1;
    const entryNumber = `JV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const journalLines: JournalLine[] = lines.map((l) => ({
      id: `jl-${Math.random().toString(36).substring(2, 9)}`,
      accountId: l.accountId,
      description: l.description || description,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      currency,
      rateToYER,
    }));

    const newEntry = {
      id: `jv-${Date.now()}`,
      entryNumber,
      date: entryDate,
      description,
      lines: journalLines,
      totalDebit,
      totalCredit,
      currency,
      createdAt: new Date().toISOString(),
    };

    try {
      await db.transaction('rw', [db.journalEntries, db.accounts], async () => {
        // 1. Insert Entry
        await db.journalEntries.add(newEntry);

        // 2. Post directly to Account Balances
        for (const line of journalLines) {
          const acc = await db.accounts.get(line.accountId);
          if (acc) {
            let change = 0;
            // Debit increases ASSET & EXPENSE, Credit increases LIABILITY, EQUITY, REVENUE
            if (acc.category === 'ASSET' || acc.category === 'EXPENSE') {
              change = line.debit - line.credit;
            } else {
              change = line.credit - line.debit;
            }
            await db.accounts.update(acc.id, { balance: acc.balance + change });
          }
        }
      });

      await refreshData();
      showToast(
        language === 'ar'
          ? `تم حفظ وتسجيل القيد رقم ${entryNumber} بنجاح وترحيله إلى الدفتر العام`
          : `Journal voucher ${entryNumber} saved and posted to GL`,
        'success'
      );

      setIsModalOpen(false);
      // Reset form
      setDescription('');
      setLines([
        { id: '1', accountId: '', description: '', debit: 0, credit: 0 },
        { id: '2', accountId: '', description: '', debit: 0, credit: 0 },
      ]);
    } catch (err) {
      console.error('Failed to save journal entry:', err);
      showToast('خطأ أثناء حفظ القيد المحاسبي', 'error');
    }
  };

  // Filter journal entries
  const filteredEntries = journalEntries.filter((e) => {
    const matchesSearch =
      e.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = selectedAccountId
      ? e.lines.some((l) => l.accountId === selectedAccountId)
      : true;
    return matchesSearch && matchesAccount;
  });

  return (
    <div className="space-y-6">
      {/* Module Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/30 border border-slate-700/50 p-6 rounded-2xl backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-bold font-serif italic text-emerald-500 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400 not-italic" />
            <span className="font-sans not-italic font-bold text-slate-100">{language === 'ar' ? 'دفتر اليومية العامة والقيود المزدوجة' : 'General Ledger & Journal Entries'}</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            {language === 'ar'
              ? 'تسجيل وترحيل قيود اليومية مع التحقق الفوري من التوازن (المدين = الدائن)'
              : 'Record and verify balanced double-entry accounting transactions'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-md shadow-emerald-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إنشاء قيد يومية جديد (JV)' : 'Create Journal Voucher'}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-800/30 border border-slate-700/50 p-3.5 rounded-2xl backdrop-blur-sm text-xs">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 rtl:right-3 rtl:left-auto" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'ar' ? 'بحث برقم القيد أو الشرح...' : 'Search journal entry number or description...'}
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-slate-900/50 border border-slate-700/50 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">{language === 'ar' ? 'جميع الحسابات المحاسبية' : 'All Accounts'}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} - {a.nameAr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-800/20 border border-slate-700/50 text-slate-400 font-sans">
            {language === 'ar' ? 'لا توجد قيود يومية مطابقة للبحث' : 'No journal entries found'}
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="p-5 rounded-2xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm space-y-3 font-sans transition hover:border-slate-600"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/60 font-mono font-bold text-emerald-400 border border-slate-700/50 text-xs">
                    {entry.entryNumber}
                  </span>
                  <span className="text-xs text-slate-400">{entry.date}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-300">
                    {language === 'ar' ? 'إجمالي القيد:' : 'Total:'}{' '}
                    <span className="font-mono text-emerald-400">
                      {formatCurrency(entry.totalDebit, entry.currency, language)}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                    رحّل إلى الدفتر
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-200 font-semibold">{entry.description}</p>

              {/* Lines Breakdown Table */}
              <div className="overflow-x-auto rounded-xl bg-slate-900/50 border border-slate-700/50">
                <table className="w-full text-right rtl:text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-700/50 text-slate-500 uppercase bg-slate-900/80">
                      <th className="p-2.5 font-semibold">رقم اسم الحساب</th>
                      <th className="p-2.5 font-semibold">البيان الفرعي</th>
                      <th className="p-2.5 font-semibold">مدين (Debit)</th>
                      <th className="p-2.5 font-semibold">دائن (Credit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {entry.lines.map((l) => {
                      const acc = accounts.find((a) => a.id === l.accountId);
                      return (
                        <tr key={l.id} className="text-slate-300 hover:bg-slate-700/20">
                          <td className="p-2.5 font-bold text-slate-100">
                            <span className="font-mono text-sky-400">{acc?.code}</span> - {acc?.nameAr || l.accountId}
                          </td>
                          <td className="p-2.5 text-slate-400">{l.description}</td>
                          <td className="p-2.5 font-mono text-emerald-400 font-bold">
                            {l.debit > 0 ? formatCurrency(l.debit, l.currency, language) : '-'}
                          </td>
                          <td className="p-2.5 font-mono text-amber-400 font-bold">
                            {l.credit > 0 ? formatCurrency(l.credit, l.currency, language) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Double-Entry Journal Voucher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 font-cairo my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>{language === 'ar' ? 'إنشاء قيد محاسبي مزدوج جديد' : 'New Double-Entry Journal Voucher'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">تاريخ القيد</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">عملة القيد الرئيسية</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200"
                >
                  <option value="YER">YER - ريال يمني</option>
                  <option value="SAR">SAR - ريال سعودي</option>
                  <option value="USD">USD - دولار أمريكي</option>
                </select>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-slate-400 mb-1 font-semibold">توازن القيد الحالي</label>
                <div
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-bold border ${
                    validation.isValid
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {validation.isValid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{validation.isValid ? 'متوازن (المدين = الدائن)' : 'غير متوازن!'}</span>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-slate-400 mb-1 font-semibold">البيان والشرح العام للقيد</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: قيد إثبات سداد مصاريف الصيانة والإيجارات نقداً..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200"
                />
              </div>
            </div>

            {/* Voucher Lines Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>طرفا القيد المحاسبي (أسطر المدين والدائن):</span>
                <button
                  onClick={handleAddLine}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة حساب آخر</span>
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {lines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs"
                  >
                    {/* Account Picker */}
                    <div className="col-span-4">
                      <select
                        value={line.accountId}
                        onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100"
                      >
                        <option value="">اختر الحساب المحاسبي...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.nameAr}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="col-span-3">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                        placeholder="بيان فرعي (اختياري)..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-200"
                      />
                    </div>

                    {/* Debit */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={line.debit || ''}
                        onChange={(e) => handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                        placeholder="مدين (Debit)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-emerald-400 font-mono font-bold"
                      />
                    </div>

                    {/* Credit */}
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={line.credit || ''}
                        onChange={(e) => handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                        placeholder="دائن (Credit)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-amber-400 font-mono font-bold"
                      />
                    </div>

                    {/* Delete Line */}
                    <div className="col-span-1 text-center">
                      <button
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Balance Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono">
              <div className="text-emerald-400 font-bold">
                مجموع المدين: {formatCurrency(totalDebit, currency, language)}
              </div>
              <div className="text-amber-400 font-bold">
                مجموع الدائن: {formatCurrency(totalCredit, currency, language)}
              </div>
              <div className="text-slate-300 font-bold">
                الفارق: {formatCurrency(Math.abs(totalDebit - totalCredit), currency, language)}
              </div>
            </div>

            {/* Save & Cancel */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveJournal}
                disabled={!validation.isValid}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                  validation.isValid
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                حفظ وترحيل القيد المحاسبي
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
