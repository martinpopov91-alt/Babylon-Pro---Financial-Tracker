import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ListOrdered, 
  PiggyBank, 
  Receipt, 
  Settings as SettingsIcon,
  Sparkles,
  Plus,
  PieChart,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  TrendingUp,
  Wallet,
  Target,
  Download,
  CalendarCheck,
  SlidersHorizontal
} from 'lucide-react';
import { 
  AppState, 
  Bill, 
  Category, 
  CategoryType,
  Currency, 
  Debt, 
  Goal, 
  Language, 
  Transaction 
} from './types';
import { loadAppState, saveAppState, exportToCSV, exportToXML, exportJSONBackup } from './utils/storage';
import { calculateFinancials, formatCurrency } from './utils/calculations';
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
import { SidebarCalendar } from './components/SidebarCalendar';

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
  const [quickAddInitialDate, setQuickAddInitialDate] = useState<string | undefined>(undefined);
  const [quickAddInitialType, setQuickAddInitialType] = useState<CategoryType | undefined>(undefined);
  const [ledgerSearchFilter, setLedgerSearchFilter] = useState<string>('');
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

  const totalExpenses = useMemo(() => {
    return (summary.totalVariableExpenses || 0) + (summary.billsPaidTotal || 0) + (summary.debtsPaidTotal || 0);
  }, [summary]);

  const wealthAndGoals = useMemo(() => {
    return (summary.wealthAmount || 0) + (summary.totalSavingsAllocated || 0);
  }, [summary]);

  const savingsRate = useMemo(() => {
    return summary.totalIncome > 0
      ? Math.round((wealthAndGoals / summary.totalIncome) * 100)
      : 0;
  }, [summary.totalIncome, wealthAndGoals]);

  return (
    <div className="min-h-screen w-full bg-[#EFF3F8] dark:bg-[#0B0F17] flex font-sans antialiased text-slate-800 dark:text-slate-100 selection:bg-[#174E5B] selection:text-white">
      {/* =========================================================================
          LEFT SIDEBAR: Fixed Full-Height Persistent Navigation & Interactive Activity Hub
          ========================================================================= */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 lg:w-72 bg-[#121622] dark:bg-[#0A0D14] text-slate-200 border-r border-slate-800/80 z-30 overflow-y-auto custom-scrollbar select-none p-3.5">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-1 py-1.5 mb-3 border-b border-white/10 dark:border-slate-800/80 pb-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#174E5B] via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-900/30 shrink-0">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 font-display truncate">
              {t('appTitle')}
            </h1>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {lang === 'bg' ? 'Финансов панел & Навици' : 'Executive Wealth Dashboard'}
            </p>
          </div>
        </div>

        {/* Primary Navigation Menu */}
        <nav className="space-y-1 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-teal-600/90 to-emerald-600/90 text-white shadow-md shadow-teal-900/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-400'}`} />
              <span>{t('dashboard')}</span>
            </div>
            {activeTab === 'dashboard' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setLedgerSearchFilter('');
              setActiveTab('ledger');
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-gradient-to-r from-teal-600/90 to-emerald-600/90 text-white shadow-md shadow-teal-900/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ListOrdered className={`w-4 h-4 ${activeTab === 'ledger' ? 'text-white' : 'text-slate-400'}`} />
              <span>{t('ledger')}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
              {appState.transactions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-teal-600/90 to-emerald-600/90 text-white shadow-md shadow-teal-900/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PieChart className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-white' : 'text-slate-400'}`} />
              <span>{t('analytics')}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vaults')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'vaults'
                ? 'bg-gradient-to-r from-teal-600/90 to-emerald-600/90 text-white shadow-md shadow-teal-900/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PiggyBank className={`w-4 h-4 ${activeTab === 'vaults' ? 'text-white' : 'text-slate-400'}`} />
              <span>{t('vaults')}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
              {appState.goals.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bills')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
              activeTab === 'bills'
                ? 'bg-gradient-to-r from-teal-600/90 to-emerald-600/90 text-white shadow-md shadow-teal-900/40 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Receipt className={`w-4 h-4 ${activeTab === 'bills' ? 'text-white' : 'text-slate-400'}`} />
              <span>{t('billsAndDebt')}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-300">
              {appState.bills.length + appState.debts.length}
            </span>
          </button>
        </nav>

        {/* Real Interactive Sidebar Activity Calendar with Spending vs Income Dots */}
        <div className="my-1 shrink-0">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-teal-400" />
              {lang === 'bg' ? 'Календар на активността' : 'Activity Calendar'}
            </span>
            <div className="flex items-center gap-2 text-[9px] font-semibold text-slate-400">
              <span className="flex items-center gap-1" title="Income recorded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                {lang === 'bg' ? 'Приход' : 'In'}
              </span>
              <span className="flex items-center gap-1" title="Expenses recorded">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"></span>
                {lang === 'bg' ? 'Разход' : 'Out'}
              </span>
            </div>
          </div>

          <SidebarCalendar
            transactions={appState.transactions}
            currency={currency}
            lang={lang}
            onSelectDate={(dateStr) => {
              setLedgerSearchFilter(dateStr);
              setActiveTab('ledger');
            }}
            onOpenQuickAddWithDate={(dateStr) => {
              setQuickAddInitialDate(dateStr);
              setQuickAddInitialType('needs');
              setIsQuickAddOpen(true);
            }}
          />
        </div>

        {/* Financial Pulse & Cycle Snapshot Card - Uses screen height purposefully */}
        <div className="my-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/5 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">{lang === 'bg' ? 'Свободен баланс' : 'Safe-to-Spend'}</span>
            <span className={`font-bold font-mono text-xs ${summary.remainingLifeMoney >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(summary.remainingLifeMoney, currency)}
            </span>
          </div>

          {/* Income vs Expenses Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>{lang === 'bg' ? 'Усвоен доход' : 'Budget Spent'}</span>
              <span className="font-semibold text-slate-300">
                {summary.totalIncome > 0 ? Math.min(Math.round((totalExpenses / summary.totalIncome) * 100), 100) : 0}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.totalIncome > 0 && (totalExpenses / summary.totalIncome) > 0.85
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-teal-400 to-emerald-400'
                }`}
                style={{
                  width: `${summary.totalIncome > 0 ? Math.min(Math.round((totalExpenses / summary.totalIncome) * 100), 100) : 0}%`
                }}
              />
            </div>
          </div>

          {/* Cycle Stats Footer */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-white/5">
            <span>
              {lang === 'bg' ? `Остават ${summary.daysRemaining} дни` : `${summary.daysRemaining}d left in cycle`}
            </span>
            <span className="text-teal-300 font-semibold flex items-center gap-1">
              <span>{savingsRate}%</span>
              <span className="text-[9px] text-slate-400">{lang === 'bg' ? 'спестени' : 'saved'}</span>
            </span>
          </div>
        </div>

        {/* Sidebar Bottom Quick Add Transaction CTA */}
        <div className="mt-auto pt-2.5 border-t border-white/10 dark:border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => {
              setQuickAddInitialType('needs');
              setQuickAddInitialDate(undefined);
              setIsQuickAddOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-950/40 hover:shadow-teal-900/60 active:scale-[0.98] transition-all cursor-pointer font-display"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bg' ? 'Нов запис' : 'Quick Transaction'}</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN WRAPPER: Top Header + Dynamic Views Content (Offset by Sidebar Width)
          ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:pl-64 lg:pl-72">
        {/* Top Utility Header Bar with Pay Period, Currency, Language, Theme and Modals controls */}
        <Header
          state={appState}
          onUpdateSettings={handleUpdateSettings}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenInstructions={() => setIsInstructionsOpen(true)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
        />

        {/* Main Content Area - Expands gracefully across the screen */}
        <main className="w-full flex-1 px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-12 max-w-[1600px] mx-auto">
          {/* =========================================================================
              VIEW 1: High-Converting Executive SaaS Finance Dashboard
              ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Stat Cards Grid - High-Converting Executive SaaS Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. Safe-to-Spend Disposable Balance */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#174E5B] via-[#1A5968] to-[#123E49] rounded-2xl p-5 text-white shadow-md shadow-teal-950/20 border border-teal-500/20 group hover:shadow-xl transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-2xl pointer-events-none transform translate-x-8 -translate-y-8"></div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-teal-200/90 uppercase tracking-wider font-display">
                      {lang === 'bg' ? 'Разполагаеми средства' : 'Safe-to-Spend Balance'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {lang === 'bg' ? 'Чист остатък' : 'Available Capital'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-white">
                      {formatCurrency(summary.remainingLifeMoney, currency)}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                    <span className="text-teal-200/80 text-[11px]">
                      {lang === 'bg' ? `Остават ${summary.daysRemaining} дни от периода` : `${summary.daysRemaining} days left in cycle`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('ledger')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
                    >
                      <span>{lang === 'bg' ? 'Към дневника' : 'View Ledger'}</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* 2. Total Inflows (Revenue/Income) */}
                <div className="relative overflow-hidden bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
                      {lang === 'bg' ? 'Общи приходи' : 'Total Inflows'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-900 dark:text-slate-100">
                      {formatCurrency(summary.totalIncome, currency)}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      {lang === 'bg' ? 'Активен период' : 'Active Cycle'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAddInitialType('income');
                        setQuickAddInitialDate(undefined);
                        setIsQuickAddOpen(true);
                      }}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {lang === 'bg' ? '+ Приход' : '+ Log Income'}
                    </button>
                  </div>
                </div>

                {/* 3. Total Outflows (Expenses & Bills) */}
                <div className="relative overflow-hidden bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
                      {lang === 'bg' ? 'Общи разходи' : 'Total Outflows'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-900 dark:text-slate-100">
                      {formatCurrency(totalExpenses, currency)}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {summary.totalIncome > 0
                        ? `${Math.round((totalExpenses / summary.totalIncome) * 100)}% ${lang === 'bg' ? 'от приходите' : 'of income'}`
                        : `${lang === 'bg' ? 'Разходен поток' : 'Expense flow'}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickAddInitialType('needs');
                        setQuickAddInitialDate(undefined);
                        setIsQuickAddOpen(true);
                      }}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      {lang === 'bg' ? '+ Разход' : '+ Log Expense'}
                    </button>
                  </div>
                </div>

                {/* 4. Wealth & Sinking Accumulation */}
                <div className="relative overflow-hidden bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
                      {lang === 'bg' ? 'Спестявания & Фондове' : 'Wealth & Goals Accumulation'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display text-slate-900 dark:text-slate-100">
                      {formatCurrency(wealthAndGoals, currency)}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold">
                      <Coins className="w-3.5 h-3.5" />
                      {savingsRate}% {lang === 'bg' ? 'коефициент спестявания' : 'savings rate'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('vaults')}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {lang === 'bg' ? 'Към цели →' : 'View Vaults →'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Financial Actions Command Hub */}
              <div className="bg-white dark:bg-[#161B22] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-display">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    {lang === 'bg' ? 'Бързи финансови команди' : 'Quick Financial Actions'}
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    {lang === 'bg' ? 'Едно кликване за пълен контрол' : 'One-click transaction commands'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddInitialType('needs');
                      setQuickAddInitialDate(undefined);
                      setIsQuickAddOpen(true);
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1C212A] dark:hover:bg-[#252B37] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200/60 dark:border-slate-700/60 hover:border-rose-400/40 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">{lang === 'bg' ? 'Запиши разход' : 'Record Expense'}</div>
                      <div className="text-[10px] text-slate-400">{lang === 'bg' ? 'Нужди / Желания' : 'Needs & Wants'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickAddInitialType('income');
                      setQuickAddInitialDate(undefined);
                      setIsQuickAddOpen(true);
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1C212A] dark:hover:bg-[#252B37] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-400/40 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">{lang === 'bg' ? 'Добави приход' : 'Add Income'}</div>
                      <div className="text-[10px] text-slate-400">{lang === 'bg' ? 'Заплата / Бонус' : 'Salary / Extra'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('vaults')}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1C212A] dark:hover:bg-[#252B37] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-400/40 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Target className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">{lang === 'bg' ? 'Зареди цел' : 'Fund Goal'}</div>
                      <div className="text-[10px] text-slate-400">{lang === 'bg' ? 'Спестовни фондове' : 'Sinking Funds'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-[#1C212A] dark:hover:bg-[#252B37] text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all border border-slate-200/60 dark:border-slate-700/60 hover:border-teal-400/40 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Download className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xs">{lang === 'bg' ? 'Експорт на отчет' : 'Export Report'}</div>
                      <div className="text-[10px] text-slate-400">{lang === 'bg' ? 'CSV дневник' : 'Download CSV'}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Hero Disposable Life Money Card */}
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

              {/* Dashboard Recent Transactions Ledger Snapshot */}
              <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <TransactionLedger
                  transactions={appState.transactions}
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
            </div>
          )}

          {/* =========================================================================
              VIEW 2: Full Transaction Ledger
              ========================================================================= */}
          {activeTab === 'ledger' && (
            <div className="animate-fadeIn">
              <TransactionLedger
                transactions={appState.transactions}
                categories={appState.categories}
                currency={currency}
                lang={lang}
                settings={appState.settings}
                initialSearchQuery={ledgerSearchFilter}
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

          {/* =========================================================================
              VIEW 3: Spending Analytics
              ========================================================================= */}
          {activeTab === 'analytics' && (
            <div className="animate-fadeIn">
              <SpendingAnalytics appState={appState} />
            </div>
          )}

          {/* =========================================================================
              VIEW 4: Sinking Funds & Vaults
              ========================================================================= */}
          {activeTab === 'vaults' && (
            <div className="animate-fadeIn space-y-6">
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

          {/* =========================================================================
              VIEW 5: Bills & Recurring Debt Manager
              ========================================================================= */}
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

        {/* Desktop Footer */}
        <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15181E] py-6 text-center text-xs text-slate-500 dark:text-slate-400 shadow-xs mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
            <p className="font-medium text-slate-600 dark:text-slate-400">
              {t('appTitle')} &copy; {new Date().getFullYear()} — {t('tagline')}
            </p>
            <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 font-semibold">
              <button onClick={() => setIsInstructionsOpen(true)} className="hover:text-[#F7B352] transition-colors cursor-pointer text-[#174E5B] dark:text-emerald-400 font-bold">
                {t('instructions')}
              </button>
              <span>&bull;</span>
              <button onClick={() => setIsOnboardingOpen(true)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                {t('onboarding')}
              </button>
              <span>&bull;</span>
              <button onClick={() => setIsSettingsOpen(true)} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer">
                {t('settings')}
              </button>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile Floating Action Button (FAB) for Quick Add */}
      <button
        type="button"
        onClick={() => {
          try { navigator.vibrate?.(12); } catch (_) {}
          setQuickAddInitialType('needs');
          setQuickAddInitialDate(undefined);
          setIsQuickAddOpen(true);
        }}
        aria-label={t('addTransaction')}
        className="fixed bottom-20 right-4 z-40 md:hidden flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 rounded-full shadow-lg shadow-teal-900/40 hover:shadow-xl active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span className="text-xs font-bold font-display tracking-wide">{lang === 'bg' ? 'Запис' : 'Add'}</span>
      </button>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 dark:bg-[#15181E]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-50 flex items-center justify-around px-2 py-1.5 pb-[max(env(safe-area-inset-bottom),0.625rem)]">
        <button
          type="button"
          onClick={() => {
            try { navigator.vibrate?.(8); } catch (_) {}
            setActiveTab('dashboard');
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 transition-all rounded-xl cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110 text-teal-600 dark:text-teal-400' : ''}`} />
          <span className="text-[10px] tracking-tight">{t('dashboard')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            try { navigator.vibrate?.(8); } catch (_) {}
            setLedgerSearchFilter('');
            setActiveTab('ledger');
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 transition-all rounded-xl cursor-pointer ${
            activeTab === 'ledger'
              ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <ListOrdered className={`w-5 h-5 transition-transform ${activeTab === 'ledger' ? 'scale-110 text-teal-600 dark:text-teal-400' : ''}`} />
          <span className="text-[10px] tracking-tight">{t('ledger')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            try { navigator.vibrate?.(8); } catch (_) {}
            setActiveTab('analytics');
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 transition-all rounded-xl cursor-pointer ${
            activeTab === 'analytics'
              ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <PieChart className={`w-5 h-5 transition-transform ${activeTab === 'analytics' ? 'scale-110 text-teal-600 dark:text-teal-400' : ''}`} />
          <span className="text-[10px] tracking-tight">{t('analytics')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            try { navigator.vibrate?.(8); } catch (_) {}
            setActiveTab('vaults');
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 transition-all rounded-xl cursor-pointer ${
            activeTab === 'vaults'
              ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <PiggyBank className={`w-5 h-5 transition-transform ${activeTab === 'vaults' ? 'scale-110 text-teal-600 dark:text-teal-400' : ''}`} />
          <span className="text-[10px] tracking-tight">{t('vaults')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            try { navigator.vibrate?.(8); } catch (_) {}
            setActiveTab('bills');
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 transition-all rounded-xl cursor-pointer ${
            activeTab === 'bills'
              ? 'text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/40'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Receipt className={`w-5 h-5 transition-transform ${activeTab === 'bills' ? 'scale-110 text-teal-600 dark:text-teal-400' : ''}`} />
          <span className="text-[10px] tracking-tight">{t('billsAndDebt')}</span>
        </button>
      </nav>

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
          initialDate={quickAddInitialDate}
          initialType={quickAddInitialType}
          onClose={() => {
            setIsQuickAddOpen(false);
            setQuickAddInitialDate(undefined);
            setQuickAddInitialType(undefined);
          }}
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
  );
}
