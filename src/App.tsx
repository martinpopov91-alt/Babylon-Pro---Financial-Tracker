import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ListOrdered, 
  PiggyBank, 
  Receipt, 
  Settings as SettingsIcon,
  Sparkles,
  Plus,
  PieChart
} from 'lucide-react';
import { 
  AppState, 
  Bill, 
  Category, 
  Currency, 
  Debt, 
  Goal, 
  Language, 
  Transaction 
} from './types';
import { loadAppState, saveAppState, exportToCSV, exportToXML, exportJSONBackup } from './utils/storage';
import { calculateFinancials } from './utils/calculations';
import { processRecurringBills } from './utils/recurringBills';
import { getTranslation } from './constants/translations';
import { INITIAL_APP_STATE, createEmptyAppState } from './constants/defaultData';

import { Header } from './components/Header';
import { HeroCard } from './components/HeroCard';
import { AllocationsOverview } from './components/AllocationsOverview';
import { QuickAddTransaction } from './components/QuickAddTransaction';
import { TransactionLedger } from './components/TransactionLedger';
import { SinkingFundsTracker } from './components/SinkingFundsTracker';
import { BillsAndDebtManager } from './components/BillsAndDebtManager';
import { OnboardingWizard } from './components/OnboardingWizard';
import { SettingsModal } from './components/SettingsModal';
import { InstructionsModal } from './components/InstructionsModal';

import { MonthlyBudgetTracker } from './components/MonthlyBudgetTracker';
import { SpendingAnalytics } from './components/SpendingAnalytics';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CalendarWidget } from './components/CalendarWidget';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'analytics' | 'vaults' | 'bills'>('dashboard');


  // Modals visibility
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: 'transaction' | 'goal' | 'reset' | null;
    id: string | null;
  }>({
    isOpen: false,
    type: null,
    id: null
  });

  // Sync state to localStorage on any change
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Sync Theme (dark/light mode) to HTML document class
  useEffect(() => {
    const root = document.documentElement;
    if (appState.settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [appState.settings.theme]);

  // Open onboarding wizard if user is marked as new user on first load
  useEffect(() => {
    if (appState.isNewUser) {
      setIsOnboardingOpen(true);
    }
  }, []);

  // Auto-process recurring bills at month start if enabled
  useEffect(() => {
    const { updatedState, generatedCount } = processRecurringBills(appState);
    if (generatedCount > 0) {
      setAppState(updatedState);
    }
  }, []);

  const lang = appState.settings.language;
  const currency = appState.settings.currency;
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  // Financial calculations memo
  const summary = useMemo(() => calculateFinancials(appState), [appState]);

  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.platform) {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }
  }, []);

  const modKey = isMac ? '⌘' : 'Ctrl';

  const isAnyModalOpen =
    isQuickAddOpen || isSettingsOpen || isOnboardingOpen || isInstructionsOpen || isShortcutsOpen || deleteConfirmation.isOpen;

  const handleCloseAllModals = () => {
    setIsQuickAddOpen(false);
    setIsSettingsOpen(false);
    setIsOnboardingOpen(false);
    setIsInstructionsOpen(false);
    setIsShortcutsOpen(false);
    setDeleteConfirmation({ isOpen: false, type: null, id: null });
  };

  // Register power-user keyboard shortcuts
  useKeyboardShortcuts({
    activeTab,
    setActiveTab,
    onOpenQuickAdd: () => setIsQuickAddOpen(true),
    onOpenSettings: () => setIsSettingsOpen(true),
    onOpenShortcuts: () => setIsShortcutsOpen(true),
    onToggleTheme: () =>
      handleUpdateSettings({ theme: appState.settings.theme === 'dark' ? 'light' : 'dark' }),
    onToggleLanguage: () =>
      handleUpdateSettings({ language: lang === 'en' ? 'bg' : 'en' }),
    onCloseModal: handleCloseAllModals,
    isAnyModalOpen,
  });

  // State Handlers
  const handleUpdateSettings = (newSettings: Partial<AppState['settings']>) => {
    setAppState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const handleAddTransaction = (transactionData: Omit<Transaction, 'id'>, goalDepositId?: string) => {
    const newTx: Transaction = {
      ...transactionData,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    };

    setAppState((prev) => {
      let updatedGoals = prev.goals;

      // If deposited to a goal, increment goal currentAmount
      if (goalDepositId) {
        updatedGoals = prev.goals.map((g) => {
          if (g.id === goalDepositId) {
            return {
              ...g,
              currentAmount: g.currentAmount + transactionData.amount
            };
          }
          return g;
        });
      }

      return {
        ...prev,
        transactions: [newTx, ...prev.transactions],
        goals: updatedGoals
      };
    });
  };

  const handleDeleteTransaction = (id: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'transaction', id });
  };

  const executeDeleteTransaction = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id)
    }));
  };

  const handleDeleteTransactions = (ids: string[]) => {
    const idSet = new Set(ids);
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => !idSet.has(t.id))
    }));
  };

  const handleUpdateTransaction = (updatedTx: Transaction) => {
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    }));
  };

  const handleBatchUpdateCategory = (ids: string[], newCategoryId: string, syncType: boolean = true) => {
    const idSet = new Set(ids);
    const targetCategory = appState.categories.find(c => c.id === newCategoryId);
    setAppState((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => {
        if (idSet.has(t.id)) {
          return {
            ...t,
            category: newCategoryId,
            type: syncType && targetCategory ? targetCategory.type : t.type
          };
        }
        return t;
      })
    }));
  };

  const handleImportTransactions = (newTransactions: Omit<Transaction, 'id'>[]) => {
    const txsWithIds = newTransactions.map(tx => ({
      ...tx,
      id: 'tx_imp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)
    }));

    setAppState((prev) => ({
      ...prev,
      transactions: [...txsWithIds, ...prev.transactions]
    }));
  };

  // Goal actions
  const handleAddGoal = (goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: 'g_' + Date.now()
    };
    setAppState((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal]
    }));
  };

  const handleUpdateGoal = (updatedGoal: Goal) => {
    setAppState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
    }));
  };

  const handleDeleteGoal = (id: string) => {
    setDeleteConfirmation({ isOpen: true, type: 'goal', id });
  };

  const executeDeleteGoal = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id)
    }));
  };

  const confirmDelete = () => {
    if (deleteConfirmation.type === 'transaction' && deleteConfirmation.id) {
      executeDeleteTransaction(deleteConfirmation.id);
    } else if (deleteConfirmation.type === 'goal' && deleteConfirmation.id) {
      executeDeleteGoal(deleteConfirmation.id);
    } else if (deleteConfirmation.type === 'reset') {
      executeResetData();
    }
    setDeleteConfirmation({ isOpen: false, type: null, id: null });
  };

  const handleDepositToGoal = (goalId: string, amount: number, recordAsTransaction: boolean) => {
    setAppState((prev) => {
      const targetGoal = prev.goals.find((g) => g.id === goalId);
      const updatedGoals = prev.goals.map((g) => {
        if (g.id === goalId) {
          return { ...g, currentAmount: g.currentAmount + amount };
        }
        return g;
      });

      let updatedTx = prev.transactions;
      if (recordAsTransaction && targetGoal) {
        const newTx: Transaction = {
          id: 'tx_' + Date.now(),
          amount: amount,
          note: `${t('deposit')}: ${targetGoal.name}`,
          category: 'cat_emergency',
          type: 'savings',
          date: new Date().toISOString().split('T')[0],
          goalId: goalId
        };
        updatedTx = [newTx, ...prev.transactions];
      }

      return {
        ...prev,
        goals: updatedGoals,
        transactions: updatedTx
      };
    });
  };

  // Bills actions
  const handleToggleBillPaid = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => (b.id === id ? { ...b, isPaid: !b.isPaid } : b))
    }));
  };

  const handleAddBill = (billData: Omit<Bill, 'id'>) => {
    const newBill: Bill = { ...billData, id: 'b_' + Date.now() };
    setAppState((prev) => ({
      ...prev,
      bills: [...prev.bills, newBill]
    }));
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setAppState((prev) => ({
      ...prev,
      bills: prev.bills.map((b) => (b.id === updatedBill.id ? updatedBill : b))
    }));
  };

  const handleDeleteBill = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      bills: prev.bills.filter((b) => b.id !== id)
    }));
  };

  const handleProcessRecurringNow = () => {
    const { updatedState, generatedCount, generatedNames } = processRecurringBills(appState, true);
    if (generatedCount > 0) {
      setAppState(updatedState);
      alert(`${t('recurringProcessedSuccess')}\n(${generatedNames.join(', ')})`);
    } else {
      alert(t('alreadyProcessedThisMonth'));
    }
  };

  const handleToggleGlobalAutoGenerate = (enabled: boolean) => {
    setAppState((prev) => ({
      ...prev,
      settings: { ...prev.settings, autoGenerateRecurringBills: enabled }
    }));
  };

  // Debts actions
  const handleToggleDebtPaid = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      debts: prev.debts.map((d) => (d.id === id ? { ...d, isPaid: !d.isPaid } : d))
    }));
  };

  const handleAddDebt = (debtData: Omit<Debt, 'id'>) => {
    const newDebt: Debt = { ...debtData, id: 'd_' + Date.now() };
    setAppState((prev) => ({
      ...prev,
      debts: [...prev.debts, newDebt]
    }));
  };

  const handleDeleteDebt = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id)
    }));
  };

  // Categories actions
  const handleAddCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = { ...categoryData, id: 'cat_' + Date.now() };
    setAppState((prev) => ({
      ...prev,
      categories: [...prev.categories, newCat]
    }));
  };

  const handleDeleteCategory = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id)
    }));
  };

  // Export / Backup / Reset
  const handleExportCSV = () => {
    exportToCSV(appState.transactions, currency);
  };

  const handleExportXML = () => {
    exportToXML(appState.transactions, currency);
  };

  const handleExportJSON = () => {
    exportJSONBackup(appState);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.settings && parsed.transactions) {
          setAppState(parsed);
          alert(t('importSuccess'));
          setIsSettingsOpen(false);
        } else {
          alert(t('importError'));
        }
      } catch (err) {
        alert(t('importError'));
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    setDeleteConfirmation({
      isOpen: true,
      type: 'reset',
      id: 'all_data'
    });
  };

  const executeResetData = () => {
    const cleanState = createEmptyAppState(appState.settings);
    setAppState(cleanState);
    saveAppState(cleanState);
    setIsSettingsOpen(false);
  };

  const handleCompleteWizard = (wizardData: {
    settings: Partial<AppState['settings']>;
    bills: Bill[];
    debts: Debt[];
    goals: Goal[];
  }) => {
    setAppState((prev) => ({
      ...prev,
      isNewUser: false,
      settings: { ...prev.settings, ...wizardData.settings },
      bills: wizardData.bills,
      debts: wizardData.debts,
      goals: wizardData.goals
    }));
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#161D27] text-slate-800 dark:text-zinc-100 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all flex-shrink-0 hidden md:flex z-50">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-black">C</span>
            </div>
            {t('appTitle')}
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white font-semibold shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-sm">{t('dashboard')}</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white font-semibold shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span className="text-sm">{t('ledger')}</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white font-semibold shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span className="text-sm">{t('analytics')}</span>
          </button>

          <button
            onClick={() => setActiveTab('vaults')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'vaults'
                ? 'bg-blue-600 text-white font-semibold shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            <span className="text-sm">{t('vaults')}</span>
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'bills'
                ? 'bg-blue-600 text-white font-semibold shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span className="text-sm">{t('billsAndDebt')}</span>
          </button>

          <div className="pt-6 pb-2">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</p>
          </div>
          
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-slate-400 hover:bg-slate-800 hover:text-slate-200 font-medium"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="text-sm">{t('settings')}</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header
          state={appState}
          onUpdateSettings={handleUpdateSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:px-8 pb-12 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Dark Blue Welcome Banner with KPI metrics embedded */}
              <div className="bg-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold mb-1">{t('dashboard')}</h1>
                    <p className="text-blue-200 text-sm">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setIsQuickAddOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('addTransaction')}</span>
                    </button>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-800/50 rounded-xl p-4 border border-blue-700/50 backdrop-blur-sm">
                    <h3 className="text-blue-200 text-xs font-semibold mb-1">Total Balance</h3>
                    <div className="text-xl font-bold text-white flex items-baseline gap-1">
                      {currency} {summary.remaining}
                    </div>
                  </div>
                  <div className="bg-blue-800/50 rounded-xl p-4 border border-blue-700/50 backdrop-blur-sm">
                    <h3 className="text-blue-200 text-xs font-semibold mb-1">Income</h3>
                    <div className="text-xl font-bold text-emerald-400 flex items-baseline gap-1">
                      +{currency} {summary.income}
                    </div>
                  </div>
                  <div className="bg-blue-800/50 rounded-xl p-4 border border-blue-700/50 backdrop-blur-sm">
                    <h3 className="text-blue-200 text-xs font-semibold mb-1">Expenses</h3>
                    <div className="text-xl font-bold text-red-400 flex items-baseline gap-1">
                      -{currency} {summary.expense}
                    </div>
                  </div>
                  <div className="bg-blue-800/50 rounded-xl p-4 border border-blue-700/50 backdrop-blur-sm">
                    <h3 className="text-blue-200 text-xs font-semibold mb-1">Savings Rate</h3>
                    <div className="text-xl font-bold text-white">
                      {summary.income > 0 ? Math.round(((summary.income - summary.expense) / summary.income) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid layout for previous components */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  {/* Hero Disposable Life Money Card adapted */}
                  <HeroCard
                    summary={summary}
                    currency={currency}
                    lang={lang}
                    settings={appState.settings}
                    onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                    onUpdateSettings={handleUpdateSettings}
                  />

                  {/* Monthly Budget Tracker (Budget Limits) */}
                  <MonthlyBudgetTracker
                    appState={appState}
                    summary={summary}
                    onUpdateSettings={handleUpdateSettings}
                  />

                  {/* Babylon Rules Allocations Overview (Pay Yourself First) */}
                  <AllocationsOverview
                    summary={summary}
                    currency={currency}
                    lang={lang}
                    tithePercent={appState.settings.tithePercent}
                    wealthPercent={appState.settings.wealthPercent}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    onSelectTab={(tab) => setActiveTab(tab)}
                  />
                </div>

                <div className="space-y-6">
                  {/* Goal Vaults & Sinking Funds */}
                  <SinkingFundsTracker
                    goals={appState.goals}
                    currency={currency}
                    lang={lang}
                    onAddGoal={handleAddGoal}
                    onUpdateGoal={handleUpdateGoal}
                    onDeleteGoal={handleDeleteGoal}
                    onDepositToGoal={handleDepositToGoal}
                  />
                </div>
              </div>

              {/* Monthly Spending & Income Calendar */}
              <CalendarWidget 
                transactions={appState.transactions}
                currency={currency}
                lang={lang}
              />

              {/* Recent Transactions Snapshot */}
              <TransactionLedger
                transactions={appState.transactions.slice(0, 6)}
                categories={appState.categories}
                currency={currency}
                lang={lang}
                settings={appState.settings}
                isDashboardSnapshot={true}
                onViewAllLedger={() => setActiveTab('ledger')}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteTransactions={handleDeleteTransactions}
                onBatchUpdateCategory={handleBatchUpdateCategory}
                onUpdateTransaction={handleUpdateTransaction}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                onExportCSV={handleExportCSV}
                onExportXML={handleExportXML}
                onImportCSV={handleImportTransactions}
              />
            </div>
          )}

        {activeTab === 'ledger' && (
          <div className="animate-fadeIn">
            <TransactionLedger
              transactions={appState.transactions}
              categories={appState.categories}
              currency={currency}
              lang={lang}
              settings={appState.settings}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteTransactions={handleDeleteTransactions}
              onBatchUpdateCategory={handleBatchUpdateCategory}
              onUpdateTransaction={handleUpdateTransaction}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onExportCSV={handleExportCSV}
              onExportXML={handleExportXML}
              onImportCSV={handleImportTransactions}
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-fadeIn">
            <SpendingAnalytics appState={appState} />
          </div>
        )}

        {activeTab === 'vaults' && (
          <div className="animate-fadeIn">
            <SinkingFundsTracker
              goals={appState.goals}
              currency={currency}
              lang={lang}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onDepositToGoal={handleDepositToGoal}
            />
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="animate-fadeIn">
            <BillsAndDebtManager
              bills={appState.bills}
              debts={appState.debts}
              currency={currency}
              lang={lang}
              autoGenerateRecurringBills={appState.settings.autoGenerateRecurringBills ?? true}
              onToggleBillPaid={handleToggleBillPaid}
              onToggleDebtPaid={handleToggleDebtPaid}
              onAddBill={handleAddBill}
              onUpdateBill={handleUpdateBill}
              onAddDebt={handleAddDebt}
              onDeleteBill={handleDeleteBill}
              onDeleteDebt={handleDeleteDebt}
              onProcessRecurringNow={handleProcessRecurringNow}
              onToggleGlobalAutoGenerate={handleToggleGlobalAutoGenerate}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden flex-shrink-0 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-around pb-[env(safe-area-inset-bottom)] z-50">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('dashboard')}</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'ledger' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
        >
          <ListOrdered className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('ledger')}</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'analytics' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('analytics')}</span>
        </button>
        <button
          onClick={() => setActiveTab('vaults')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'vaults' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
        >
          <PiggyBank className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('vaults')}</span>
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'bills' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200'}`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px] font-medium">{t('billsAndDebt')}</span>
        </button>
      </nav>

      {/* Desktop Footer (Hidden on mobile) */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-6 text-center text-xs text-slate-500 dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
          <p className="font-medium text-slate-600 dark:text-zinc-400">
            {t('appTitle')} &copy; {new Date().getFullYear()} — {t('tagline')}
          </p>
          <div className="flex items-center gap-4 text-slate-400 dark:text-zinc-400 font-semibold">
            <button onClick={() => setIsInstructionsOpen(true)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-blue-600 dark:text-blue-400/90 font-bold">
              {t('instructions')}
            </button>
            <span>&bull;</span>
            <button onClick={() => setIsOnboardingOpen(true)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              {t('onboarding')}
            </button>
            <span>&bull;</span>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              {t('settings')}
            </button>
          </div>
        </div>
      </footer>

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        lang={lang}
        onOpenWizard={() => setIsOnboardingOpen(true)}
      />

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <QuickAddTransaction
          categories={appState.categories}
          goals={appState.goals}
          currency={currency}
          lang={lang}
          onClose={() => setIsQuickAddOpen(false)}
          onAddTransaction={handleAddTransaction}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          appState={appState}
          settings={appState.settings}
          categories={appState.categories}
          lang={lang}
          onClose={() => setIsSettingsOpen(false)}
          onUpdateSettings={handleUpdateSettings}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onResetData={handleResetData}
          onSyncPull={(newState) => setAppState(newState)}
        />
      )}

      {/* Onboarding Wizard Modal */}
      {isOnboardingOpen && (
        <OnboardingWizard
          initialSettings={appState.settings}
          initialBills={appState.bills}
          initialDebts={appState.debts}
          initialGoals={appState.goals}
          lang={lang}
          onClose={() => setIsOnboardingOpen(false)}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          onCompleteWizard={handleCompleteWizard}
        />
      )}

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        lang={lang}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Generic Confirmation Modal for Deletions & Reset */}
      <ConfirmModal
        isOpen={deleteConfirmation.isOpen}
        title={
          deleteConfirmation.type === 'transaction'
            ? t('confirmDeleteTxTitle')
            : deleteConfirmation.type === 'goal'
            ? t('confirmDeleteGoalTitle')
            : t('reset')
        }
        message={
          deleteConfirmation.type === 'transaction'
            ? t('confirmDeleteTxDesc')
            : deleteConfirmation.type === 'goal'
            ? t('confirmDeleteGoalDesc')
            : t('resetWarning')
        }
        confirmText={deleteConfirmation.type === 'reset' ? t('confirmDeleteAll') : undefined}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, type: null, id: null })}
        lang={lang}
      />
      </div>
    </div>
  );
}
