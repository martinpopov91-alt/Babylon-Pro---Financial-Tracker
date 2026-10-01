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
  CalendarCheck
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

  return (
    <div className="flex h-screen w-full bg-[#8E8B85] dark:bg-[#0B0D11] p-2 sm:p-6 text-slate-800 dark:text-slate-100 font-sans antialiased overflow-hidden">
      {/* Main App Container */}
      <div className="flex w-full h-full bg-[#EFF3F8] dark:bg-[#13161C] rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl relative border border-transparent dark:border-slate-800/80">
        {/* Sidebar */}
        <aside className="w-64 bg-[#282A3A] dark:bg-[#181B22] border-r border-transparent dark:border-slate-800/80 flex flex-col flex-shrink-0 hidden lg:flex z-50">
          {/* Top Teal Section - App Logo */}
          <div className="bg-[#174E5B] pt-10 pb-8 px-6 rounded-br-[3rem] flex flex-col items-center text-center relative z-10 select-none shadow-md">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 p-2 mb-3 shadow-lg flex items-center justify-center backdrop-blur-sm">
              <div className="w-full h-full rounded-xl bg-gradient-to-tr from-amber-400 via-amber-300 to-amber-200 text-[#174E5B] flex items-center justify-center shadow-inner">
                <Coins className="w-8 h-8 stroke-[2.5]" />
              </div>
            </div>
            <h2 className="text-white font-extrabold text-xl tracking-tight leading-tight">
              {t('appTitle')}
            </h2>
            <div className="inline-flex items-center gap-1.5 text-teal-200/90 text-[11px] font-semibold tracking-wider uppercase mt-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Financial Tracker</span>
            </div>
          </div>
          
          {/* Bottom Navy Section */}
          <div className="flex-1 flex flex-col -mt-8 pt-16 px-4 pb-6 overflow-y-auto">
            <nav className="space-y-2 flex-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#EFF3F8] dark:bg-[#13161C] text-[#174E5B] dark:text-emerald-400 font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#174E5B] dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{t('dashboard')}</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'ledger'
                    ? 'bg-[#EFF3F8] dark:bg-[#13161C] text-[#174E5B] dark:text-emerald-400 font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <ListOrdered className={`w-5 h-5 ${activeTab === 'ledger' ? 'text-[#174E5B] dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{t('ledger')}</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-[#EFF3F8] dark:bg-[#13161C] text-[#174E5B] dark:text-emerald-400 font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <PieChart className={`w-5 h-5 ${activeTab === 'analytics' ? 'text-[#174E5B] dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{t('analytics')}</span>
              </button>

              <button
                onClick={() => setActiveTab('vaults')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'vaults'
                    ? 'bg-[#EFF3F8] dark:bg-[#13161C] text-[#174E5B] dark:text-emerald-400 font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <PiggyBank className={`w-5 h-5 ${activeTab === 'vaults' ? 'text-[#174E5B] dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{t('vaults')}</span>
              </button>

              <button
                onClick={() => setActiveTab('bills')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'bills'
                    ? 'bg-[#EFF3F8] dark:bg-[#13161C] text-[#174E5B] dark:text-emerald-400 font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <Receipt className={`w-5 h-5 ${activeTab === 'bills' ? 'text-[#174E5B] dark:text-emerald-400' : 'text-slate-400'}`} />
                <span>{t('billsAndDebt')}</span>
              </button>
            </nav>

            <div className="mt-8">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer text-slate-400 hover:text-white font-medium"
              >
                <SettingsIcon className="w-5 h-5 text-slate-400" />
                <span>{t('settings')}</span>
              </button>
            </div>
            
            {/* Real Interactive Sidebar Calendar with Spending vs Income Dots */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'bg' ? 'Календар на разходите' : 'Activity Calendar'}
                </span>
                <span className="text-[10px] text-teal-400 font-semibold">
                  {appState.transactions.length} {lang === 'bg' ? 'записа' : 'txs'}
                </span>
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
          </div>
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

        <main className="flex-1 overflow-y-auto w-full p-3.5 sm:p-6 lg:p-8 space-y-6 pb-28 md:pb-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Stat Cards Grid - High-Converting Executive SaaS Design */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. Safe-to-Spend Disposable Balance */}
                <div 
                  onClick={() => setActiveTab('ledger')}
                  className="group bg-gradient-to-br from-[#133F4A] via-[#174E5B] to-[#1F6272] dark:from-[#0E1F24] dark:via-[#14343D] dark:to-[#19424D] rounded-2xl p-5 shadow-sm text-white flex flex-col justify-between relative overflow-hidden border border-teal-500/20 hover:border-teal-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-200/90">
                        {lang === 'bg' ? 'Свободен бюджет' : 'Safe-to-Spend'}
                      </span>
                      <h3 className="text-white text-xs font-semibold mt-0.5">
                        {lang === 'bg' ? 'Чист остатък (Life Money)' : 'Disposable Liquidity'}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                      <Coins className="w-4 h-4 text-teal-200" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mb-1 tabular-nums">
                      {formatCurrency(summary.remainingLifeMoney, currency)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                      <span className={`inline-flex items-center gap-1 font-medium ${summary.remainingLifeMoney >= 0 ? 'text-teal-200' : 'text-rose-300'}`}>
                        {summary.remainingLifeMoney >= 0 ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            {lang === 'bg' ? 'В рамките на бюджета' : 'Budget on track'}
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                            {lang === 'bg' ? 'Надвишен бюджет' : 'Budget exceeded'}
                          </>
                        )}
                      </span>
                      <span className="text-teal-300/80 group-hover:text-white flex items-center gap-0.5 text-[10px] font-semibold transition-colors">
                        {lang === 'bg' ? 'Дневник' : 'Ledger'} <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Total Inflow / Income */}
                <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-amber-600/10 dark:from-[#262013] dark:via-[#1E1A11] dark:to-[#17140E] border border-amber-500/25 dark:border-amber-500/20 rounded-2xl p-5 shadow-sm text-slate-900 dark:text-amber-50 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                        {lang === 'bg' ? 'Общ приход' : 'Total Inflow'}
                      </span>
                      <h3 className="text-slate-800 dark:text-slate-200 text-xs font-semibold mt-0.5">
                        {lang === 'bg' ? 'Постъпления за периода' : 'Monthly Income'}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setQuickAddInitialType('income');
                        setQuickAddInitialDate(undefined);
                        setIsQuickAddOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-[10px] font-bold transition-all cursor-pointer"
                      title={lang === 'bg' ? 'Добави приход' : 'Add income'}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'bg' ? 'Приход' : 'Add'}</span>
                    </button>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 mb-1 tabular-nums">
                      +{formatCurrency(summary.totalIncome, currency)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-amber-500/15 dark:border-amber-500/10 text-slate-600 dark:text-slate-400">
                      <span>{lang === 'bg' ? 'Стабилен паричен поток' : 'Recorded Cash Inflows'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                        100% {lang === 'bg' ? 'база' : 'base'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Total Outflows (Expenses & Commitments) */}
                <div className="bg-white dark:bg-[#151922] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-slate-900 dark:text-slate-100 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        {lang === 'bg' ? 'Общи разходи' : 'Total Outflows'}
                      </span>
                      <h3 className="text-slate-800 dark:text-slate-200 text-xs font-semibold mt-0.5">
                        {lang === 'bg' ? 'Разходи, сметки и дълг' : 'Expenses & Bills'}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setQuickAddInitialType('needs');
                        setQuickAddInitialDate(undefined);
                        setIsQuickAddOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900/40 transition-all cursor-pointer"
                      title={lang === 'bg' ? 'Добави разход' : 'Record expense'}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{lang === 'bg' ? 'Разход' : 'Add'}</span>
                    </button>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white mb-1 tabular-nums">
                      -{formatCurrency(summary.totalVariableExpenses + summary.totalBills + summary.totalDebts + summary.totalSavingsAllocated, currency)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      <span className="truncate">
                        {lang === 'bg' ? 'Сметки' : 'Bills'}: {formatCurrency(summary.totalBills, currency)}
                      </span>
                      <span className="text-rose-500 font-semibold text-[10px]">
                        {summary.totalIncome > 0 
                          ? `${Math.round(((summary.totalVariableExpenses + summary.totalBills + summary.totalDebts) / summary.totalIncome) * 100)}% burn`
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Savings & Wealth Rate */}
                <div 
                  onClick={() => setActiveTab('vaults')}
                  className="group bg-gradient-to-br from-[#1E2235] via-[#24273E] to-[#2E314F] dark:from-[#12141F] dark:via-[#181B2B] dark:to-[#1E2238] border border-indigo-500/25 dark:border-indigo-500/20 rounded-2xl p-5 shadow-sm text-white flex flex-col justify-between relative overflow-hidden hover:border-indigo-400/50 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                        {lang === 'bg' ? 'Спестявания & Богатство' : 'Savings & Wealth'}
                      </span>
                      <h3 className="text-white text-xs font-semibold mt-0.5">
                        {lang === 'bg' ? 'Процент заделени средства' : 'Generation Velocity'}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                      <PieChart className="w-4 h-4 text-indigo-300" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-indigo-200 tabular-nums">
                        {summary.totalIncome > 0 ? Math.round(((summary.totalSavingsAllocated + summary.wealthAmount) / summary.totalIncome) * 100) : 0}%
                      </span>
                      <span className="text-xs text-indigo-300/80 font-medium">
                        ({formatCurrency(summary.totalSavingsAllocated + summary.wealthAmount, currency)})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/10">
                      <span className="text-slate-300 text-[10px]">
                        {lang === 'bg' ? 'Вавилон (10%) + Цели' : 'Babylon 10% + Goals'}
                      </span>
                      <span className="text-indigo-300 group-hover:text-white flex items-center gap-0.5 text-[10px] font-semibold transition-colors">
                        {lang === 'bg' ? 'Фондове' : 'Vaults'} <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion-Focused Quick Action Command Hub */}
              <div className="bg-white dark:bg-[#161922] border border-slate-200/90 dark:border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{lang === 'bg' ? 'Бързи финансови операции' : 'Instant Financial Operations'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-medium">
                        {lang === 'bg' ? 'Управление' : 'Shortcuts'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                      {lang === 'bg' 
                        ? 'Записвайте приходи и разходи за секунди или експортирайте отчет.' 
                        : 'Capture daily cashflows with one click or review period allocations.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setQuickAddInitialType('needs');
                      setQuickAddInitialDate(undefined);
                      setIsQuickAddOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/90 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                    <span>{lang === 'bg' ? 'Запиши разход' : 'Record Expense'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setQuickAddInitialType('income');
                      setQuickAddInitialDate(undefined);
                      setIsQuickAddOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{lang === 'bg' ? 'Добави приход' : 'Add Income'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('vaults')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-900/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{lang === 'bg' ? 'Цели и фондове' : 'Target Goals'}</span>
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                    title={lang === 'bg' ? 'Свали CSV отчет' : 'Download CSV Report'}
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{lang === 'bg' ? 'Експорт' : 'Export'}</span>
                  </button>
                </div>
              </div>

              {/* Main dashboard widgets */}
              <div className="space-y-6">
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

      {/* Mobile Floating Action Button (FAB) for Quick Add */}
      <button
        type="button"
        onClick={() => {
          try { navigator.vibrate?.(12); } catch (_) {}
          setIsQuickAddOpen(true);
        }}
        aria-label={t('addTransaction')}
        className="fixed bottom-20 right-4 z-40 md:hidden flex items-center gap-2 bg-gradient-to-r from-[#174E5B] to-[#0d343d] text-white px-4 py-3 rounded-full shadow-lg shadow-[#174E5B]/30 hover:shadow-xl active:scale-95 transition-all duration-200 border border-white/20 cursor-pointer"
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
              ? 'text-[#174E5B] dark:text-emerald-400 font-bold bg-[#174E5B]/8 dark:bg-emerald-500/15'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform ${activeTab === 'dashboard' ? 'scale-110 text-[#174E5B] dark:text-emerald-400' : ''}`} />
          <span className="text-[10px] tracking-tight">{t('dashboard')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            try { navigator.vibrate?.(8); } catch (_) {}
            setActiveTab('ledger');
          }}
          className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 transition-all rounded-xl cursor-pointer ${
            activeTab === 'ledger'
              ? 'text-[#174E5B] dark:text-emerald-400 font-bold bg-[#174E5B]/8 dark:bg-emerald-500/15'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <ListOrdered className={`w-5 h-5 transition-transform ${activeTab === 'ledger' ? 'scale-110 text-[#174E5B] dark:text-emerald-400' : ''}`} />
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
              ? 'text-[#174E5B] dark:text-emerald-400 font-bold bg-[#174E5B]/8 dark:bg-emerald-500/15'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <PieChart className={`w-5 h-5 transition-transform ${activeTab === 'analytics' ? 'scale-110 text-[#174E5B] dark:text-emerald-400' : ''}`} />
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
              ? 'text-[#174E5B] dark:text-emerald-400 font-bold bg-[#174E5B]/8 dark:bg-emerald-500/15'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <PiggyBank className={`w-5 h-5 transition-transform ${activeTab === 'vaults' ? 'scale-110 text-[#174E5B] dark:text-emerald-400' : ''}`} />
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
              ? 'text-[#174E5B] dark:text-emerald-400 font-bold bg-[#174E5B]/8 dark:bg-emerald-500/15'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <Receipt className={`w-5 h-5 transition-transform ${activeTab === 'bills' ? 'scale-110 text-[#174E5B] dark:text-emerald-400' : ''}`} />
          <span className="text-[10px] tracking-tight">{t('billsAndDebt')}</span>
        </button>
      </nav>

      {/* Desktop Footer (Hidden on mobile) */}
      <footer className="hidden md:block border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#15181E] py-6 text-center text-xs text-slate-500 dark:text-slate-400 shadow-sm">
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
      </div>
    </div>
  );
}
