import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { BentoGrid } from './components/Dashboard/BentoGrid';
import { JournalEntries } from './components/Journal/JournalEntries';
import { CoaTree } from './components/ChartOfAccounts/CoaTree';
import { InvoiceList } from './components/SalesPurchase/InvoiceList';
import { InvoiceBuilder } from './components/SalesPurchase/InvoiceBuilder';
import { InventoryManager } from './components/Inventory/InventoryManager';
import { CurrencyManager } from './components/Currency/CurrencyManager';
import { FinancialReports } from './components/Reports/FinancialReports';
import { SettingsModule } from './components/Settings/SettingsModule';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

function MainLayout() {
  const { isDbReady, notifications, language } = useApp();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Modal Overlays
  const [quickAction, setQuickAction] = useState<'NONE' | 'JOURNAL' | 'INVOICE'>('NONE');

  if (!isDbReady) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 shadow-lg shadow-blue-500/20 flex items-center justify-center animate-spin mb-4">
          <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent"></div>
        </div>
        <h2 className="text-3xl font-serif italic text-emerald-500">
          𝒪ℳ𝒩ℐ
        </h2>
        <p className="text-xs text-slate-400 mt-2 font-sans">
          {language === 'ar' ? 'جاري تحضير وتهيئة قاعدة البيانات المحاسبية المحلية...' : 'Initializing local accounting database...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans selection:bg-emerald-500/30 flex flex-col">
      {/* Top Navbar */}
      <Header
        onOpenSettings={() => setActiveTab('settings')}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
      />

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Dynamic View Canvas */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <BentoGrid
                  onNavigate={setActiveTab}
                  onOpenQuickJournal={() => setQuickAction('JOURNAL')}
                  onOpenQuickInvoice={() => setQuickAction('INVOICE')}
                />
              )}

              {activeTab === 'journal' && <JournalEntries />}

              {activeTab === 'coa' && <CoaTree />}

              {activeTab === 'invoices' && <InvoiceList />}

              {activeTab === 'inventory' && <InventoryManager />}

              {activeTab === 'currency' && <CurrencyManager />}

              {activeTab === 'reports' && <FinancialReports />}

              {activeTab === 'settings' && <SettingsModule />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Quick Action Modal: Invoice Builder */}
      {quickAction === 'INVOICE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <InvoiceBuilder
              onSuccess={() => setQuickAction('NONE')}
              onCancel={() => setQuickAction('NONE')}
              initialType="SALE"
            />
          </div>
        </div>
      )}

      {/* Quick Action Modal: Journal Entry */}
      {quickAction === 'JOURNAL' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">سريع: إضافة قيد يومية جديد</h3>
              <button onClick={() => setQuickAction('NONE')} className="text-slate-400">
                ✕
              </button>
            </div>
            <JournalEntries />
          </div>
        </div>
      )}

      {/* Floating Notifications Toast Container */}
      <div className="fixed bottom-4 left-4 rtl:right-4 rtl:left-auto z-50 space-y-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl flex items-center gap-3 text-xs font-bold font-cairo backdrop-blur-xl ${
                n.type === 'success'
                  ? 'bg-slate-900/90 text-emerald-300 border-emerald-500/30'
                  : n.type === 'error'
                  ? 'bg-slate-900/90 text-rose-300 border-rose-500/30'
                  : 'bg-slate-900/90 text-sky-300 border-sky-500/30'
              }`}
            >
              {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {n.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {n.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
              <span>{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
