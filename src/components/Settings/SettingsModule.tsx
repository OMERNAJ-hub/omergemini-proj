import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db, exportDatabaseBackup, importDatabaseBackup, resetDatabaseToDefault } from '../../db';
import type { CompanySettings, CurrencyCode } from '../../types';
import {
  Settings,
  Database,
  Download,
  Upload,
  RotateCcw,
  Save,
  Building,
  Phone,
  MapPin,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const { settings, language, refreshData, showToast } = useApp();

  const [shopNameAr, setShopNameAr] = useState(settings.shopNameAr);
  const [shopNameEn, setShopNameEn] = useState(settings.shopNameEn);
  const [taglineAr, setTaglineAr] = useState(settings.taglineAr);
  const [commercialRegNo, setCommercialRegNo] = useState(settings.commercialRegNo);
  const [taxNo, setTaxNo] = useState(settings.taxNo);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [defaultCurrency, setDefaultCurrency] = useState<CurrencyCode>(settings.defaultCurrency);

  const [isRestoring, setIsRestoring] = useState(false);

  const handleSaveSettings = async () => {
    const updated: CompanySettings = {
      shopNameAr,
      shopNameEn,
      taglineAr,
      taglineEn: settings.taglineEn,
      commercialRegNo,
      taxNo,
      phone,
      address,
      defaultCurrency,
    };

    try {
      await db.settings.put({ ...updated, id: 'main' });
      await refreshData();
      showToast(
        language === 'ar'
          ? 'تم حفظ إعدادات هبوية المنشأة والنظام بنجاح'
          : 'Company settings saved successfully',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
    }
  };

  const handleExportBackup = async () => {
    try {
      const jsonBackup = await exportDatabaseBackup();
      const blob = new Blob([jsonBackup], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OMNI_ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(
        language === 'ar' ? 'تم تصدير النسخة الاحتياطية الكاملة بنجاح' : 'Backup downloaded successfully',
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast('خطأ أثناء تصدير النسخة الاحتياطية', 'error');
    }
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const success = await importDatabaseBackup(content);
      setIsRestoring(false);

      if (success) {
        await refreshData();
        showToast(
          language === 'ar'
            ? 'تمت استعادة كافة بيانات النظام والقيود من الملف بنجاح'
            : 'Database restored successfully',
          'success'
        );
      } else {
        showToast('ملف النسخة الاحتياطية غير صالح أو تالف', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    if (
      window.confirm(
        language === 'ar'
          ? 'هل أنت تأكد من استعادة بيانات العرض الافتراضية؟ سيتم استبدال البيانات الحالية.'
          : 'Are you sure you want to reset to demo seed dataset?'
      )
    ) {
      await resetDatabaseToDefault();
      await refreshData();
      showToast('تمت إعادة ضبط البيانات الافتراضية للشركة', 'info');
    }
  };

  return (
    <div className="space-y-6 font-cairo">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            <span>{language === 'ar' ? 'إعدادات المنشأة والنسخ الاحتياطي المحاسبي' : 'System Settings & Backup'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'تعديل بيانات الشركة، الشعار، السجل التجاري، واستيراد وتصدير قواعد البيانات المحلية'
              : 'Configure company information, tax registration, and local JSON backup/restore'}
          </p>
        </div>
      </div>

      {/* Grid: Company Details & Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Company Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-400" />
            <span>بيانات ومعلومات المنشأة والطباعة:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">اسم الشركة / المحل (بالعربي)</label>
              <input
                type="text"
                value={shopNameAr}
                onChange={(e) => setShopNameAr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Company Name (English)</label>
              <input
                type="text"
                value={shopNameEn}
                onChange={(e) => setShopNameEn(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">الشعار والوصف التسويقي</label>
              <input
                type="text"
                value={taglineAr}
                onChange={(e) => setTaglineAr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">رقم السجل التجاري</label>
              <input
                type="text"
                value={commercialRegNo}
                onChange={(e) => setCommercialRegNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">الرقم الضريبي / القيمة المضافة</label>
              <input
                type="text"
                value={taxNo}
                onChange={(e) => setTaxNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">رقم الهاتف والتواصل</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">العنوان والمقر الرئيسي</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-800">
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </div>

        {/* Right Column: Database Backup & Reset */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>النسخ الاحتياطي واستعادة البيانات:</span>
          </h3>

          <p className="text-xs text-slate-400 leading-relaxed">
            يمكنك حفظ نسخة احتياطية كاملة من قاعدة بيانات نظام أومني (القيود، الفواتير، المخزون، الحسابات) ونقلها إلى أي جهاز آخر بسهولة.
          </p>

          <div className="space-y-3 pt-2">
            {/* Export */}
            <button
              onClick={handleExportBackup}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 font-bold text-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل نسخة احتياطية JSON</span>
            </button>

            {/* Restore File */}
            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-sky-400 font-bold text-xs transition cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{isRestoring ? 'جاري الاستعادة...' : 'استعادة بيانات من ملف JSON'}</span>
              <input type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
            </label>

            {/* Reset */}
            <button
              onClick={handleResetDemo}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-bold text-xs transition mt-4"
            >
              <RotateCcw className="w-4 h-4" />
              <span>استعادة البيانات الافتراضية العرضية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
