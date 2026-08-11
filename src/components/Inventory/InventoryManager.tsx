import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db';
import { formatCurrency } from '../../utils/accounting';
import type { Product, StockBatch } from '../../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Layers,
  Barcode,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const { products, language, refreshData, showToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('إلكترونيات');
  const [unit, setUnit] = useState('جهاز');
  const [priceUSD, setPriceUSD] = useState(0);
  const [priceYER, setPriceYER] = useState(0);
  const [minStockAlert, setMinStockAlert] = useState(2);
  const [trackSerials, setTrackSerials] = useState(true);
  const [initialQty, setInitialQty] = useState(5);
  const [unitCostYER, setUnitCostYER] = useState(0);
  const [initialSerials, setInitialSerials] = useState('');

  const handleAddProduct = async () => {
    if (!code || !nameAr) {
      showToast('يرجى ملء رمز الصنف والاسم العربي', 'error');
      return;
    }

    const serialsList = initialSerials
      ? initialSerials.split('\n').map((s) => s.trim()).filter(Boolean)
      : [];

    const initialBatch: StockBatch = {
      id: `b-${Date.now()}`,
      productId: `prod-${Date.now()}`,
      purchaseDate: new Date().toISOString().slice(0, 10),
      quantityRemaining: initialQty,
      unitCostYER: unitCostYER || priceYER * 0.85,
      serialNumbers: serialsList,
    };

    const newProd: Product = {
      id: initialBatch.productId,
      code,
      nameAr,
      nameEn: nameEn || nameAr,
      category,
      unit,
      sellingPriceUSD: priceUSD,
      sellingPriceYER: priceYER,
      minStockAlert,
      trackSerials,
      totalQuantity: initialQty,
      batches: [initialBatch],
    };

    try {
      await db.products.add(newProd);
      await refreshData();
      showToast(language === 'ar' ? 'تمت إضافة الصنف والمخزون الأولي بنجاح' : 'Product added successfully', 'success');
      setIsAddModalOpen(false);
      setCode('');
      setNameAr('');
      setNameEn('');
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء إضافة الصنف', 'error');
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.batches.some((b) => b.serialNumbers?.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-6 font-cairo">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>{language === 'ar' ? 'إدارة المخزون والتكلفة بحسب FIFO وتتبع IMEI' : 'Inventory & FIFO Batches'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'متابعة كميات الأصناف، الشحنات، وأرقام السيريال/الهيكل للأجهزة الالكترونية'
              : 'Track stock quantities, FIFO batches, and IMEI/serial numbers'}
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إضافة صنف جديد للمخزن' : 'Add New Product'}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 text-xs relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 rtl:right-3 rtl:left-auto" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={language === 'ar' ? 'بحث برقم الصنف، الاسم، أو رقم السيريال IMEI...' : 'Search item code, name, or IMEI...'}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {/* Products Table */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">الكود</th>
                <th className="pb-3">اسم الصنف</th>
                <th className="pb-3">الفئة</th>
                <th className="pb-3">سعر البيع (YER)</th>
                <th className="pb-3">سعر البيع ($)</th>
                <th className="pb-3">الكمية بالمخزن</th>
                <th className="pb-3 text-center">شحنات FIFO</th>
                <th className="pb-3 text-center">تفاصيل Batches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const isLowStock = p.totalQuantity <= p.minStockAlert;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition text-slate-200">
                    <td className="py-3 font-mono font-bold text-sky-400">{p.code}</td>
                    <td className="py-3 font-bold text-slate-100">{p.nameAr}</td>
                    <td className="py-3 text-slate-400">{p.category}</td>
                    <td className="py-3 font-mono font-bold text-emerald-400">
                      {formatCurrency(p.sellingPriceYER, 'YER', language)}
                    </td>
                    <td className="py-3 font-mono text-sky-300 font-bold">
                      {formatCurrency(p.sellingPriceUSD, 'USD', language)}
                    </td>
                    <td className="py-3 font-mono">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          isLowStock ? 'text-amber-400' : 'text-slate-100'
                        }`}
                      >
                        {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                        {p.totalQuantity} {p.unit}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-sky-400">
                        {p.batches.length} دفعة
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold"
                      >
                        معاينة
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Inspector Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>تفاصيل شحنات FIFO وأرقام IMEI للصنف: {selectedProduct.nameAr}</span>
              </h3>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-slate-100">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-slate-300 font-semibold">
                شحنات التكلفة المسجلة بموجب قاعدة الأول فالأول (FIFO):
              </div>

              {selectedProduct.batches.map((b, idx) => (
                <div key={b.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between font-mono font-bold text-slate-200">
                    <span>دفعة #{idx + 1} (تاريخ الشراء: {b.purchaseDate})</span>
                    <span className="text-emerald-400">المتبقي: {b.quantityRemaining} قطعة</span>
                  </div>
                  <div className="text-slate-400">
                    تكلفة الشراء الفردية: <span className="font-mono text-slate-200 font-bold">{formatCurrency(b.unitCostYER, 'YER', language)}</span>
                  </div>

                  {b.serialNumbers && b.serialNumbers.length > 0 && (
                    <div className="pt-2 border-t border-slate-900 space-y-1">
                      <div className="text-[10px] text-sky-400 font-bold flex items-center gap-1">
                        <Barcode className="w-3 h-3" />
                        <span>أرقام IMEI / السيريال المتوفرة بهذه الدفعة:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {b.serialNumbers.map((s) => (
                          <span key={s} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">إضافة صنف جديد إلى دليل المخزون</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-100">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">كود الصنف (الرمز)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="PRD-201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">الفئة / القسم</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">اسم الصنف (بالعربي)</label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: شاشة ماك بوك برو 16 إنش..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">سعر البيع باليمني (YER)</label>
                <input
                  type="number"
                  value={priceYER}
                  onChange={(e) => setPriceYER(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-emerald-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">سعر البيع بالدولار ($)</label>
                <input
                  type="number"
                  value={priceUSD}
                  onChange={(e) => setPriceUSD(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-sky-400 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">الكمية الافتتاحية الأولية</label>
                <input
                  type="number"
                  value={initialQty}
                  onChange={(e) => setInitialQty(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">تكلفة الشراء الفردية (YER)</label>
                <input
                  type="number"
                  value={unitCostYER}
                  onChange={(e) => setUnitCostYER(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">أرقام IMEI / السيريال الأولي (سطر لكل رقم)</label>
                <textarea
                  rows={2}
                  value={initialSerials}
                  onChange={(e) => setInitialSerials(e.target.value)}
                  placeholder="IMEI-1001&#10;IMEI-1002"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono"
                />
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
                onClick={handleAddProduct}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/30"
              >
                إضافة الصنف للمخزن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
