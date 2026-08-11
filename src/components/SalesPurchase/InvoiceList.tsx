import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportInvoicePDF } from '../../utils/pdfExport';
import { formatCurrency } from '../../utils/accounting';
import { InvoiceBuilder } from './InvoiceBuilder';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export const InvoiceList: React.FC = () => {
  const { invoices, settings, language } = useApp();

  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'SALE' | 'PURCHASE'>('ALL');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || inv.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-cairo">
      {isBuilderOpen ? (
        <InvoiceBuilder
          onSuccess={() => setIsBuilderOpen(false)}
          onCancel={() => setIsBuilderOpen(false)}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>{language === 'ar' ? 'سجل الفواتير والمبيعات والمشتريات' : 'Sales & Purchase Invoices'}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {language === 'ar'
                  ? 'عرض وإصدار فواتير المبيعات والمشتريات وطباعتها وتوليد القيود الآلية'
                  : 'Manage sales & purchase invoices with automatic GL postings'}
              </p>
            </div>

            <button
              onClick={() => setIsBuilderOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ar' ? 'إصدار فاتورة جديدة' : 'New Invoice'}</span>
            </button>
          </div>

          {/* Search & Type Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-xs">
            <div className="w-full sm:w-auto flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 rtl:right-3 rtl:left-auto" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === 'ar' ? 'بحث برقم الفاتورة أو اسم العميل/المورد...' : 'Search invoice number or partner...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  filterType === 'ALL'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setFilterType('SALE')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  filterType === 'SALE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                المبيعات
              </button>
              <button
                onClick={() => setFilterType('PURCHASE')}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  filterType === 'PURCHASE'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                المشتريات
              </button>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-3">رقم الفاتورة</th>
                    <th className="pb-3">النوع</th>
                    <th className="pb-3">التاريخ</th>
                    <th className="pb-3">العميل / المورد</th>
                    <th className="pb-3">المبلغ الإجمالي</th>
                    <th className="pb-3">المدفوع</th>
                    <th className="pb-3 text-center">حالة السداد</th>
                    <th className="pb-3 text-center">طباعة PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition text-slate-200">
                      <td className="py-3 font-mono font-bold text-slate-100">{inv.invoiceNumber}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                            inv.type === 'SALE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                          }`}
                        >
                          {inv.type === 'SALE' ? 'مبيعات' : 'مشتريات'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{inv.date}</td>
                      <td className="py-3 font-bold text-slate-100">{inv.partnerName}</td>
                      <td className="py-3 font-mono font-bold text-emerald-400">
                        {formatCurrency(inv.grandTotal, inv.currency, language)}
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {formatCurrency(inv.paidAmount, inv.currency, language)}
                      </td>
                      <td className="py-3 text-center">
                        {inv.paymentStatus === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" /> مسدد بالكامل
                          </span>
                        ) : inv.paymentStatus === 'PARTIAL' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" /> سداد جزئي
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" /> غير مسدد
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => exportInvoicePDF(inv, settings)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
                          title="تحميل طباعة PDF"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
