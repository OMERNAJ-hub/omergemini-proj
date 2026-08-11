import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { processFifoSale, formatCurrency } from '../../utils/accounting';
import { exportInvoicePDF } from '../../utils/pdfExport';
import type { Invoice, InvoiceItem, CurrencyCode } from '../../types';
import {
  FilePlus,
  Plus,
  Trash2,
  Printer,
  CheckCircle,
  Package,
  Users,
  Building,
} from 'lucide-react';

interface InvoiceBuilderProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialType?: 'SALE' | 'PURCHASE';
}

export const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({
  onSuccess,
  onCancel,
  initialType = 'SALE',
}) => {
  const { products, partners, exchangeRates, settings, language, refreshData, showToast } = useApp();

  const [type, setType] = useState<'SALE' | 'PURCHASE'>(initialType);
  const [partnerId, setPartnerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState<CurrencyCode>('YER');
  const [discount, setDiscount] = useState(0);
  const [taxRatePercent, setTaxRatePercent] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Selected items array
  const [items, setItems] = useState<
    {
      id: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      selectedSerials: string[];
    }[]
  >([{ id: '1', productId: '', quantity: 1, unitPrice: 0, selectedSerials: [] }]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), productId: '', quantity: 1, unitPrice: 0, selectedSerials: [] },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    setItems((prev) => {
      const copy = [...prev];
      copy[index].productId = prodId;
      copy[index].unitPrice = currency === 'USD' ? prod?.sellingPriceUSD || 0 : prod?.sellingPriceYER || 0;
      copy[index].selectedSerials = [];
      return copy;
    });
  };

  const handleItemChange = (index: number, field: 'quantity' | 'unitPrice', val: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const handleToggleSerial = (itemIdx: number, serial: string) => {
    setItems((prev) => {
      const copy = [...prev];
      const currentSerials = copy[itemIdx].selectedSerials;
      if (currentSerials.includes(serial)) {
        copy[itemIdx].selectedSerials = currentSerials.filter((s) => s !== serial);
      } else {
        copy[itemIdx].selectedSerials = [...currentSerials, serial];
      }
      return copy;
    });
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = Math.round((subtotal * taxRatePercent) / 100);
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);

  const handleSaveInvoice = async () => {
    if (!partnerId) {
      showToast(type === 'SALE' ? 'يرجى اختيار العميل' : 'يرجى اختيار المورد', 'error');
      return;
    }

    if (items.some((i) => !i.productId || i.quantity <= 0)) {
      showToast('يرجى التحقق من الأصناف والكميات المطلوبة بالفاتورة', 'error');
      return;
    }

    const partner = partners.find((p) => p.id === partnerId);
    const rateToYER = exchangeRates.find((r) => r.code === currency)?.rateToYER || 1;
    const invNo = `${type === 'SALE' ? 'INV' : 'PUR'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const invoiceItems: InvoiceItem[] = [];
    let totalCogsYERAllItems = 0;

    // Process Stock Batch FIFO deductions if Sale
    const updatedProductsList = JSON.parse(JSON.stringify(products)) as typeof products;

    for (const item of items) {
      const prod = updatedProductsList.find((p) => p.id === item.productId);
      if (!prod) continue;

      let itemCostYER = 0;

      if (type === 'SALE') {
        if (prod.totalQuantity < item.quantity) {
          showToast(`الكمية غير متوفرة بالمخزن للصنف: ${prod.nameAr} (المتوفر: ${prod.totalQuantity})`, 'error');
          return;
        }

        const fifoResult = processFifoSale(prod, item.quantity, item.selectedSerials);
        prod.batches = fifoResult.updatedBatches;
        prod.totalQuantity -= item.quantity;
        totalCogsYERAllItems += fifoResult.totalCogsYER;
        itemCostYER = fifoResult.totalCogsYER / item.quantity;
      } else {
        // PURCHASE: Add new FIFO stock batch
        const newBatch = {
          id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: prod.id,
          purchaseDate: invoiceDate,
          quantityRemaining: item.quantity,
          unitCostYER: item.unitPrice * rateToYER,
          serialNumbers: item.selectedSerials,
        };
        prod.batches.push(newBatch);
        prod.totalQuantity += item.quantity;
        itemCostYER = item.unitPrice * rateToYER;
      }

      invoiceItems.push({
        id: `ii-${Math.random().toString(36).substring(2, 8)}`,
        productId: prod.id,
        productName: prod.nameAr,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
        serials: item.selectedSerials,
        unitCostYER: itemCostYER,
      });
    }

    const paymentStatus =
      paidAmount >= grandTotal ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

    const grandTotalYER = grandTotal * rateToYER;
    const paidAmountYER = paidAmount * rateToYER;
    const remainingYER = grandTotalYER - paidAmountYER;

    // Create Automated Journal Entry ID
    const jvId = `jv-auto-${Date.now()}`;
    const jvNo = `JV-AUTO-${Math.floor(1000 + Math.random() * 9000)}`;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNo,
      type,
      date: invoiceDate,
      partnerId,
      partnerName: partner?.name || 'عميل نقدي',
      currency,
      exchangeRateToYER: rateToYER,
      items: invoiceItems,
      subtotal,
      taxRatePercent,
      taxAmount,
      discount,
      grandTotal,
      paidAmount,
      paymentStatus,
      journalEntryId: jvId,
      notes,
      createdAt: new Date().toISOString(),
    };

    try {
      await db.transaction(
        'rw',
        [db.invoices, db.products, db.partners, db.journalEntries, db.accounts],
        async () => {
          // 1. Save Invoice
          await db.invoices.add(newInvoice);

          // 2. Update Products Inventory
          for (const updatedProd of updatedProductsList) {
            await db.products.put(updatedProd);
          }

          // 3. Update Partner Balance
          if (partner) {
            const balanceChange = type === 'SALE' ? remainingYER : -remainingYER;
            await db.partners.update(partner.id, {
              balanceYER: partner.balanceYER + balanceChange,
            });
          }

          // 4. Automated Double-Entry GL Posting
          const jvLines = [];
          if (type === 'SALE') {
            // Debit Cash if paid
            if (paidAmountYER > 0) {
              jvLines.push({
                id: 'jl-1',
                accountId: '1010', // Main Cash
                description: `تحصيل نقدي من فاتورة بيع ${invNo}`,
                debit: paidAmount,
                credit: 0,
                currency,
                rateToYER,
              });
            }
            // Debit Accounts Receivable if unpaid balance
            if (remainingYER > 0) {
              jvLines.push({
                id: 'jl-2',
                accountId: '1030', // Receivables
                description: `ذمة آجلة فاتورة بيع ${invNo}`,
                debit: grandTotal - paidAmount,
                credit: 0,
                currency,
                rateToYER,
              });
            }
            // Credit Sales Revenue
            jvLines.push({
              id: 'jl-3',
              accountId: '4010', // Revenue
              description: `إيراد مبيعات فاتورة رقم ${invNo}`,
              debit: 0,
              credit: grandTotal,
              currency,
              rateToYER,
            });

            // Debit COGS & Credit Inventory
            if (totalCogsYERAllItems > 0) {
              jvLines.push({
                id: 'jl-4',
                accountId: '5010', // COGS
                description: `تكلفة البضاعة المباعة ${invNo}`,
                debit: totalCogsYERAllItems / rateToYER,
                credit: 0,
                currency,
                rateToYER,
              });
              jvLines.push({
                id: 'jl-5',
                accountId: '1040', // Inventory Asset
                description: `خروج بضاعة من المخزن ${invNo}`,
                debit: 0,
                credit: totalCogsYERAllItems / rateToYER,
                currency,
                rateToYER,
              });
            }
          } else {
            // PURCHASE
            // Debit Inventory Asset
            jvLines.push({
              id: 'jl-p1',
              accountId: '1040',
              description: `مشتريات بضاعة مخزنية ${invNo}`,
              debit: grandTotal,
              credit: 0,
              currency,
              rateToYER,
            });
            // Credit Cash
            if (paidAmountYER > 0) {
              jvLines.push({
                id: 'jl-p2',
                accountId: '1010',
                description: `سداد نقدي لمشتريات ${invNo}`,
                debit: 0,
                credit: paidAmount,
                currency,
                rateToYER,
              });
            }
            // Credit Accounts Payable
            if (remainingYER > 0) {
              jvLines.push({
                id: 'jl-p3',
                accountId: '2010',
                description: `مستحق دائن للمورد ${invNo}`,
                debit: 0,
                credit: grandTotal - paidAmount,
                currency,
                rateToYER,
              });
            }
          }

          const jvEntry = {
            id: jvId,
            entryNumber: jvNo,
            date: invoiceDate,
            description: `قيد آلي آتوماتيكي ناتج عن فاتورة ${type === 'SALE' ? 'المبيعات' : 'المشتريات'} رقم ${invNo}`,
            lines: jvLines,
            totalDebit: grandTotal,
            totalCredit: grandTotal,
            currency,
            createdAt: new Date().toISOString(),
          };

          await db.journalEntries.add(jvEntry);
        }
      );

      await refreshData();
      showToast(
        language === 'ar'
          ? `تم إقرار الفاتورة ${invNo} وتحديث المخزون والقيود الآلية بنجاح`
          : `Invoice ${invNo} posted to inventory and GL`,
        'success'
      );

      // Offer PDF download
      exportInvoicePDF(newInvoice, settings);
      onSuccess();
    } catch (err) {
      console.error('Invoice save failed:', err);
      showToast('حدث خطأ أثناء حفظ الفاتورة', 'error');
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6 font-cairo">
      {/* Title Bar & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-emerald-400" />
            <span>{type === 'SALE' ? 'إنشاء فاتورة مبيعات جديدة' : 'تسجيل فاتورة مشتريات بضاعة'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {type === 'SALE'
              ? 'توليد فاتورة بيع مع الخصم الآلي من المخزن بحسب FIFO وتسجيل قيد المبيعات المزدوج'
              : 'إضافة شحنة مشتريات جديدة ودعم تتبع الأرقام التسلسلية IMEI'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setType('SALE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              type === 'SALE'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            فاتورة مبيعات
          </button>
          <button
            onClick={() => setType('PURCHASE')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              type === 'PURCHASE'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            فاتورة مشتريات
          </button>
        </div>
      </div>

      {/* Primary Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">
            {type === 'SALE' ? 'اختيار العميل' : 'اختيار المورد'}
          </label>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
          >
            <option value="">{type === 'SALE' ? 'اختر العميل...' : 'اختر المورد...'}</option>
            {partners
              .filter((p) => p.type === (type === 'SALE' ? 'CUSTOMER' : 'SUPPLIER'))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">تاريخ الفاتورة</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">عملة الفاتورة</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
          >
            <option value="YER">YER - ريال يمني</option>
            <option value="SAR">SAR - ريال سعودي</option>
            <option value="USD">USD - دولار أمريكي</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">ملاحظات الفاتورة</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: الضمان شامل قطع الغيار..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
          />
        </div>
      </div>

      {/* Items Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-200">
          <span>أصناف الفاتورة والتفاصيل (مع السيريال / IMEI):</span>
          <button
            onClick={handleAddItem}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة صنف آخر</span>
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const selectedProd = products.find((p) => p.id === item.productId);
            // Collect all available serials from product batches
            const availableSerials =
              selectedProd?.batches.flatMap((b) => b.serialNumbers || []) || [];

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs"
              >
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <label className="block text-[10px] text-slate-500 mb-1">اختر الصنف من المخزن</label>
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 font-bold"
                    >
                      <option value="">اختر المنتج...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} - {p.nameAr} (المتوفر: {p.totalQuantity} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">الكمية</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">سعر الوحدة ({currency})</label>
                    <input
                      type="number"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-emerald-400 font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-1">الإجمالي الفرعي</label>
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-emerald-400">
                      {formatCurrency(item.quantity * item.unitPrice, currency, language)}
                    </div>
                  </div>

                  <div className="col-span-1 text-center pt-3">
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* IMEI Picker if serial tracked */}
                {selectedProd?.trackSerials && availableSerials.length > 0 && (
                  <div className="pt-2 border-t border-slate-900 space-y-1.5">
                    <div className="text-[10px] font-bold text-sky-400">
                      اختر أرقام السيريال/IMEI للقطع المباعة ({item.selectedSerials.length} / {item.quantity}):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {availableSerials.map((s) => {
                        const isSelected = item.selectedSerials.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => handleToggleSerial(idx, s)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono border transition ${
                              isSelected
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                            }`}
                          >
                            {s} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-cairo">
        <div>
          <label className="block text-slate-400 mb-1 font-semibold">المبلغ الإجمالي الفعلي</label>
          <div className="text-xl font-bold font-mono text-slate-100">
            {formatCurrency(subtotal, currency, language)}
          </div>
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">الخصم المباشر ({currency})</label>
          <input
            type="number"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-rose-400 font-mono font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">المبلغ المدفوع الآن (نقداً)</label>
          <input
            type="number"
            min="0"
            value={paidAmount}
            onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-emerald-400 font-mono font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1 font-semibold">صافي الإجمالي النهائي</label>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(grandTotal, currency, language)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
        >
          إلغاء
        </button>

        <button
          onClick={handleSaveInvoice}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40"
        >
          <CheckCircle className="w-4 h-4" />
          <span>حفظ الفاتورة وترحيل القيود وطباعة PDF</span>
        </button>
      </div>
    </div>
  );
};
