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
import { INITIAL_APP_STATE } from './constants/defaultData';

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
    type: 'transaction' | 'goal' | null;
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
    if (confirm(t('resetWarning'))) {
      setAppState({ ...INITIAL_APP_STATE, isNewUser: false });
      alert(t('resetSuccess'));
      setIsSettingsOpen(false);
    }
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased selection:bg-emerald-500 selection:text-zinc-950 transition-colors duration-200 flex flex-col">
      {/* Top Navigation Header */}
      <Header
        state={appState}
        onUpdateSettings={handleUpdateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenInstructions={() => setIsInstructionsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Primary Tab Bar */}
      <nav id="app-primary-nav" className="bg-zinc-900/60 border-b border-zinc-800 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto no-scrollbar py-2">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              title={`Dashboard (${modKey}+1)`}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap group ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{t('dashboard')}</span>
              <kbd className={`hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono transition-opacity ${
                activeTab === 'dashboard' ? 'bg-emerald-700/50 text-white font-bold' : 'bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-300'
              }`}>
                1
              </kbd>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              title={`Ledger (${modKey}+2)`}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap group ${
                activeTab === 'ledger'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>{t('ledger')}</span>
              <kbd className={`hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono transition-opacity ${
                activeTab === 'ledger' ? 'bg-emerald-700/50 text-white font-bold' : 'bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-300'
              }`}>
                2
              </kbd>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              title={`Analytics (${modKey}+3)`}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap group ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>{t('analytics')}</span>
              <kbd className={`hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono transition-opacity ${
                activeTab === 'analytics' ? 'bg-emerald-700/50 text-white font-bold' : 'bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-300'
              }`}>
                3
              </kbd>
            </button>

            <button
              onClick={() => setActiveTab('vaults')}
              title={`Vaults (${modKey}+4)`}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap group ${
                activeTab === 'vaults'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
              <span>{t('vaults')}</span>
              <kbd className={`hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono transition-opacity ${
                activeTab === 'vaults' ? 'bg-emerald-700/50 text-white font-bold' : 'bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-300'
              }`}>
                4
              </kbd>
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              title={`Bills & Debt (${modKey}+5)`}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap group ${
                activeTab === 'bills'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>{t('billsAndDebt')}</span>
              <kbd className={`hidden lg:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono transition-opacity ${
                activeTab === 'bills' ? 'bg-emerald-700/50 text-white font-bold' : 'bg-zinc-800/80 text-zinc-500 group-hover:text-zinc-300'
              }`}>
                5
              </kbd>
            </button>
          </div>

          <button
            onClick={() => setIsQuickAddOpen(true)}
            title={`Add Transaction (${modKey}+N)`}
            className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{t('addTransaction')}</span>
            <kbd className="px-1.5 py-0.5 rounded bg-emerald-700/60 font-mono text-[10px] text-emerald-100 font-bold">
              {modKey}N
            </kbd>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* 1. Babylon Rules Allocations Overview (Pay Yourself First) */}
            <AllocationsOverview
              summary={summary}
              currency={currency}
              lang={lang}
              tithePercent={appState.settings.tithePercent}
              wealthPercent={appState.settings.wealthPercent}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onSelectTab={(tab) => setActiveTab(tab)}
            />

            {/* 2. Monthly Budget Tracker (Budget Limits) */}
            <MonthlyBudgetTracker
              appState={appState}
              summary={summary}
              onUpdateSettings={handleUpdateSettings}
            />

            {/* 3. Hero Disposable Life Money Card */}
            <HeroCard
              summary={summary}
              currency={currency}
              lang={lang}
              settings={appState.settings}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onUpdateSettings={handleUpdateSettings}
            />

            {/* 4. Goal Vaults & Sinking Funds */}
            <SinkingFundsTracker
              goals={appState.goals}
              currency={currency}
              lang={lang}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
              onDepositToGoal={handleDepositToGoal}
            />

            {/* 5. Recent Transactions Snapshot */}
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

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            {t('appTitle')} &copy; {new Date().getFullYear()} — {t('tagline')}
          </p>
          <div className="flex items-center gap-4 text-zinc-400 font-semibold">
            <button onClick={() => setIsInstructionsOpen(true)} className="hover:text-emerald-400 transition-colors cursor-pointer text-emerald-400/90 font-bold">
              {t('instructions')}
            </button>
            <span>&bull;</span>
            <button onClick={() => setIsOnboardingOpen(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
              {t('onboarding')}
            </button>
            <span>&bull;</span>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-emerald-400 transition-colors cursor-pointer">
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

      {/* Generic Confirmation Modal for Deletions */}
      <ConfirmModal
        isOpen={deleteConfirmation.isOpen}
        title={deleteConfirmation.type === 'transaction' ? t('confirmDeleteTxTitle') : t('confirmDeleteGoalTitle')}
        message={deleteConfirmation.type === 'transaction' ? t('confirmDeleteTxDesc') : t('confirmDeleteGoalDesc')}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation({ isOpen: false, type: null, id: null })}
        lang={lang}
      />
    </div>
  );
}
