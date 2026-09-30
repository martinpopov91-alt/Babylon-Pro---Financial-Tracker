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
  Coins
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
    <div className="flex h-screen w-full bg-[#8E8B85] p-2 sm:p-6 text-slate-800 font-sans antialiased overflow-hidden">
      {/* Main App Container */}
      <div className="flex w-full h-full bg-[#EFF3F8] rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl relative">
        {/* Sidebar */}
        <aside className="w-64 bg-[#282A3A] flex flex-col flex-shrink-0 hidden lg:flex z-50">
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
                    ? 'bg-[#EFF3F8] text-[#174E5B] font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#174E5B]' : 'text-slate-400'}`} />
                <span>{t('dashboard')}</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'ledger'
                    ? 'bg-[#EFF3F8] text-[#174E5B] font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <ListOrdered className={`w-5 h-5 ${activeTab === 'ledger' ? 'text-[#174E5B]' : 'text-slate-400'}`} />
                <span>{t('ledger')}</span>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-[#EFF3F8] text-[#174E5B] font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <PieChart className={`w-5 h-5 ${activeTab === 'analytics' ? 'text-[#174E5B]' : 'text-slate-400'}`} />
                <span>{t('analytics')}</span>
              </button>

              <button
                onClick={() => setActiveTab('vaults')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'vaults'
                    ? 'bg-[#EFF3F8] text-[#174E5B] font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <PiggyBank className={`w-5 h-5 ${activeTab === 'vaults' ? 'text-[#174E5B]' : 'text-slate-400'}`} />
                <span>{t('vaults')}</span>
              </button>

              <button
                onClick={() => setActiveTab('bills')}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all cursor-pointer ${
                  activeTab === 'bills'
                    ? 'bg-[#EFF3F8] text-[#174E5B] font-bold shadow-sm relative z-20 -mr-8 pr-12 rounded-r-none'
                    : 'text-slate-400 hover:text-white font-medium'
                }`}
              >
                <Receipt className={`w-5 h-5 ${activeTab === 'bills' ? 'text-[#174E5B]' : 'text-slate-400'}`} />
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
            
            {/* Small Calendar Widget in Sidebar */}
            <div className="mt-6 bg-[#EBE9F1] rounded-3xl p-4 text-slate-800">
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-sm font-bold">Sun, Jan 19</h4>
                 <div className="w-4 h-4 bg-slate-300 rounded-full"></div>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500 mb-2">
                 <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
               </div>
               <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-800">
                 <div className="text-slate-400">1</div><div className="text-slate-400">2</div><div className="text-slate-400">3</div><div className="text-slate-400">4</div>
                 <div className="text-indigo-600 font-bold border border-indigo-200 rounded-full w-5 h-5 flex items-center justify-center mx-auto">5</div>
                 <div>6</div><div>7</div><div>8</div><div>9</div><div>10</div><div>11</div><div>12</div>
                 <div>13</div><div>14</div><div>15</div><div>16</div>
                 <div className="bg-[#282A3A] text-white rounded-full w-6 h-6 flex items-center justify-center mx-auto -mt-0.5">17</div>
                 <div>18</div><div>19</div>
                 <div>20</div><div>21</div><div>22</div><div>23</div><div>24</div><div>25</div><div>26</div>
               </div>
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

        <main className="flex-1 overflow-y-auto w-full p-6 lg:p-8 space-y-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Total Balance */}
                <div className="bg-[#174E5B] rounded-[1.25rem] p-5 shadow-sm text-white flex flex-col justify-between relative overflow-hidden h-32">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-teal-100/90 text-[11px] font-semibold">Total Balance</h3>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <Coins className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-display mb-1 tracking-tight">
                      {formatCurrency(summary.remainingLifeMoney, currency)}
                    </div>
                    <div className="text-[10px] text-teal-200/70 flex items-center gap-1 font-medium">
                      Updated Just Now &rarr;
                    </div>
                  </div>
                </div>

                {/* Total Income / Sales */}
                <div className="bg-[#F7B352] rounded-[1.25rem] p-5 shadow-sm text-slate-900 flex flex-col justify-between relative overflow-hidden h-32">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-slate-800/80 text-[11px] font-semibold">Total Income</h3>
                    <div className="w-7 h-7 rounded-full bg-black/10 flex items-center justify-center">
                      <PiggyBank className="w-3.5 h-3.5 text-slate-800" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-display mb-1 tracking-tight">
                      +{formatCurrency(summary.totalIncome, currency)}
                    </div>
                    <div className="text-[10px] text-slate-800/60 flex items-center gap-1 font-medium">
                      Updated Just Now
                    </div>
                  </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-[#174E5B] rounded-[1.25rem] p-5 shadow-sm text-white flex flex-col justify-between relative overflow-hidden h-32">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-teal-100/90 text-[11px] font-semibold">Total Expenses</h3>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <Receipt className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-display mb-1 tracking-tight">
                      -{formatCurrency(summary.totalVariableExpenses + summary.totalBills + summary.totalDebts + summary.totalSavingsAllocated, currency)}
                    </div>
                    <div className="text-[10px] text-teal-200/70 flex items-center gap-1 font-medium">
                      Updated Just Now &rarr;
                    </div>
                  </div>
                </div>

                {/* Savings Rate / Visitors */}
                <div className="bg-[#282A3A] rounded-[1.25rem] p-5 shadow-sm text-white flex flex-col justify-between relative overflow-hidden h-32">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-slate-400 text-[11px] font-semibold">Savings Rate</h3>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <PieChart className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-display mb-1 tracking-tight">
                      {summary.totalIncome > 0 ? Math.round(((summary.totalSavingsAllocated + summary.wealthAmount) / summary.totalIncome) * 100) : 0}%
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                      Updated Just Now
                    </div>
                  </div>
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
      <nav className="md:hidden flex-shrink-0 bg-white border-t border-slate-200 flex items-center justify-around pb-[env(safe-area-inset-bottom)] z-50">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'dashboard' ? 'text-[#174E5B] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">{t('dashboard')}</span>
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'ledger' ? 'text-[#174E5B] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ListOrdered className="w-5 h-5" />
          <span className="text-[10px]">{t('ledger')}</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'analytics' ? 'text-[#174E5B] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px]">{t('analytics')}</span>
        </button>
        <button
          onClick={() => setActiveTab('vaults')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'vaults' ? 'text-[#174E5B] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <PiggyBank className="w-5 h-5" />
          <span className="text-[10px]">{t('vaults')}</span>
        </button>
        <button
          onClick={() => setActiveTab('bills')}
          className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${activeTab === 'bills' ? 'text-[#174E5B] font-bold' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[10px]">{t('billsAndDebt')}</span>
        </button>
      </nav>

      {/* Desktop Footer (Hidden on mobile) */}
      <footer className="hidden md:block border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
          <p className="font-medium text-slate-600">
            {t('appTitle')} &copy; {new Date().getFullYear()} — {t('tagline')}
          </p>
          <div className="flex items-center gap-4 text-zinc-400 font-semibold">
            <button onClick={() => setIsInstructionsOpen(true)} className="hover:text-[#F7B352] transition-colors cursor-pointer text-[#174E5B] font-bold">
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
    </div>
  );
}
