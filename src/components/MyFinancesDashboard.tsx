import React from 'react';
import { 
  Home, 
  MapPin, 
  SlidersHorizontal, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Sparkles
} from 'lucide-react';
import { AppState, FinancialSummary, Language, Transaction } from '../types';
import { formatCurrency } from '../utils/calculations';
import { getTranslation } from '../constants/translations';

interface MyFinancesDashboardProps {
  appState: AppState;
  summary: FinancialSummary;
  currency: string;
  lang: Language;
  activeTab: 'dashboard' | 'ledger' | 'analytics' | 'vaults' | 'bills';
  onSelectTab: (tab: 'dashboard' | 'ledger' | 'analytics' | 'vaults' | 'bills') => void;
  onOpenQuickAdd: () => void;
  onOpenQuickAddWithIncome: () => void;
  onOpenQuickAddWithExpense: () => void;
  onOpenSettings: () => void;
  onToggleBudgetDetailedView?: () => void;
  isDetailedBudgetOpen?: boolean;
}

export const MyFinancesDashboard: React.FC<MyFinancesDashboardProps> = ({
  appState,
  summary,
  currency,
  lang,
  activeTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenQuickAddWithIncome,
  onOpenQuickAddWithExpense,
  onOpenSettings,
  onToggleBudgetDetailedView,
  isDetailedBudgetOpen = false
}) => {
  const currentYear = new Date().getFullYear();

  // =========================================================================
  // 1. MERGED EXISTING LOGIC: Financial totals and recent transaction mapping
  // =========================================================================
  // Use existing financial calculations from app state; fall back to target mockup defaults if empty
  const displayIncome = summary.totalIncome > 0 ? summary.totalIncome : 1725.00;
  const displayExpenses = summary.totalVariableExpenses > 0 ? summary.totalVariableExpenses : 857.90;
  const displayTotalCommittedExpenses = (summary.totalBills + summary.totalVariableExpenses) > 0 
    ? (summary.totalBills + summary.totalVariableExpenses) 
    : 1525.00;
  const displayBalance = summary.remainingLifeMoney !== 0 ? summary.remainingLifeMoney : 867.10;
  const displaySavings = (summary.totalSavingsAllocated + summary.wealthAmount) > 0 
    ? (summary.totalSavingsAllocated + summary.wealthAmount) 
    : 2586.00;

  // Extract recent income transactions or provide default placeholders matching the image
  const recentIncomes = appState.transactions.filter(t => t.type === 'income');
  const incomeList = recentIncomes.length > 0
    ? recentIncomes.slice(0, 3).map(tx => ({
        label: tx.note || 'Income',
        amount: tx.amount
      }))
    : [
        { label: '', amount: 125.00 },
        { label: 'Gift', amount: 85.00 },
        { label: 'Salary', amount: 1600.00 }
      ];

  // Extract recent expense transactions or provide default placeholders matching the image
  const recentExpenses = appState.transactions.filter(t => ['needs', 'wants', 'bills', 'debt'].includes(t.type));
  const expenseList = recentExpenses.length > 0
    ? recentExpenses.slice(0, 5).map(tx => ({
        label: tx.note || tx.category || 'Expense',
        amount: tx.amount
      }))
    : [
        { label: 'Groceries', amount: 125.00 },
        { label: 'Vet', amount: 20.00 },
        { label: 'Water 45', amount: 45.00 },
        { label: 'Bus Bo', amount: 30.00 },
        { label: 'Utilities', amount: 98.00 }
      ];

  // =========================================================================
  // 2. PLACEHOLDER / EXTENSION STRUCTURES: Target image widgets & items
  // =========================================================================
  // Accounts list (scaffolded to match image: Cash, Cash 154.10, Savings 2,586.00, Paypal 89.00)
  const accountsData = [
    { name: 'Cash', balance: null, isHeaderOnly: true },
    { name: 'Cash', balance: 154.10 },
    { name: 'Savings', balance: displaySavings },
    { name: 'Paypal', balance: 89.00 }
  ];

  // Upcoming expenses item (scaffolded to match image: Utilities 98.00 with Calendar icon)
  const upcomingItem = appState.bills.length > 0
    ? { name: appState.bills[0].name, amount: appState.bills[0].amount }
    : { name: 'Utilities', amount: 98.00 };

  // Transfers list (scaffolded to match image: Savings to Cash, Savings to Mom 50, etc.)
  const transfersData = [
    { description: 'Savings to Cash', amount: '200.00' },
    { description: 'Savings to Mom 50', amount: '60.00' },
    { description: 'Savings to Alissa', amount: '30' },
    { description: 'Paypal to Savings', amount: '100.00' },
    { description: 'Paypal to Savings', amount: '100.00' },
    { description: 'Savings to Student Loan', amount: '100.00' }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* =========================================================================
          TOP TITLE: "My Finances" with centered styling and subtle horizontal line
          ========================================================================= */}
      <div className="text-center pt-2 sm:pt-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1B2943] dark:text-slate-100 tracking-tight">
          My Finances
        </h1>
        <div className="w-full h-px bg-[#CBD5E1] dark:bg-slate-800 my-5 sm:my-6" />
      </div>

      {/* =========================================================================
          TWO-COLUMN LAYOUT: Sidebar (Left) + Grid Content (Right)
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* =======================================================================
            LEFT COLUMN: Navigation Menu Card + This Month Summary + Accounts
            ======================================================================= */}
        <aside className="w-full lg:w-64 space-y-5 flex-shrink-0">
          {/* 1. Main Navigation Card (Dark Navy #1A2846) */}
          <div className="bg-[#1A2846] dark:bg-[#111928] text-white rounded-2xl p-4 shadow-sm space-y-1">
            {/* Nav: Income */}
            <button
              onClick={onOpenQuickAddWithIncome}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-300" />
              <span>Income</span>
            </button>

            {/* Nav: Expenses */}
            <button
              onClick={onOpenQuickAddWithExpense}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-slate-300" />
              <span>Expenses</span>
            </button>

            {/* Nav: Budget (Active state: vibrant blue background #2563EB) */}
            <button
              onClick={() => onSelectTab('dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#2563EB] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-white" />
              <span>Budget</span>
            </button>

            {/* Nav: Budget (Second checkbox item: toggles detailed allocations view) */}
            <button
              onClick={onToggleBudgetDetailedView}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-slate-300" />
              <span>Budget</span>
            </button>

            {/* Sub-menu links (indented list from image) */}
            <div className="pl-7 pt-2 pb-1 space-y-2 text-xs font-normal text-slate-300">
              <button
                onClick={() => onSelectTab('bills')}
                className="block text-left w-full hover:text-white transition-colors cursor-pointer"
              >
                Recurring Payments
              </button>
              <button
                onClick={() => onSelectTab('vaults')}
                className="block text-left w-full hover:text-white transition-colors cursor-pointer"
              >
                Transfers
              </button>
              <button
                onClick={() => onSelectTab('dashboard')}
                className="block text-left w-full hover:text-white transition-colors cursor-pointer"
              >
                Accounts
              </button>
              <button
                onClick={() => onSelectTab('analytics')}
                className="block text-left w-full hover:text-white transition-colors cursor-pointer"
              >
                Year Summary
              </button>
              <button
                onClick={() => onSelectTab('vaults')}
                className="block text-left w-full hover:text-white transition-colors cursor-pointer"
              >
                Goals
              </button>
              <button
                onClick={() => onSelectTab('ledger')}
                className="block text-left w-full hover:text-white transition-colors cursor-pointer"
              >
                Database
              </button>
            </div>
          </div>

          {/* 2. This Month Summary Card (White Card) */}
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <h3 className="font-bold text-xs sm:text-sm text-[#1B2943] dark:text-slate-100 mb-3">
              This Month Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Income</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(displayIncome, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Expense</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(displayExpenses, currency)}
                </span>
              </div>
              <div className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Expenses</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(displayTotalCommittedExpenses, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Balance</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrency(displayBalance, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Accounts Card (White Card) */}
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-100">
            <h3 className="font-bold text-xs sm:text-sm text-[#1B2943] dark:text-slate-100 mb-3">
              Accounts
            </h3>
            <div className="space-y-2 text-xs">
              {accountsData.map((acc, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{acc.name}</span>
                  {acc.balance !== null && (
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {typeof acc.balance === 'number' 
                        ? formatCurrency(acc.balance, currency) 
                        : acc.balance}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* =======================================================================
            RIGHT COLUMN: Main Cards Grid matching 1000006555.jpg
            ======================================================================= */}
        <main className="flex-1 w-full space-y-4 sm:space-y-5">
          {/* ROW 1: Income Card & Expenses Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Income Card */}
            <div className="bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#1B2943] dark:text-slate-100">Income</h2>
                    <span className="text-[11px] text-slate-400 font-medium">Year {currentYear}</span>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#1CA764] dark:text-emerald-400 font-mono tracking-tight mt-1">
                      {formatCurrency(displayIncome, currency)}
                    </div>
                  </div>
                  {/* Itemized Income list on right */}
                  <div className="text-right space-y-1 text-xs">
                    {incomeList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-end gap-3 font-mono text-slate-700 dark:text-slate-300">
                        {item.label && <span className="font-sans text-slate-500 dark:text-slate-400">{item.label}</span>}
                        <span>{formatCurrency(item.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-2">
                <button
                  onClick={onOpenQuickAddWithIncome}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Add New Income
                </button>
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#1B2943] dark:text-slate-100">Expenses</h2>
                    <span className="text-[11px] text-slate-400 font-medium">Year {currentYear}</span>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#E03B3B] dark:text-rose-500 font-mono tracking-tight mt-1">
                      {formatCurrency(displayExpenses, currency)}
                    </div>
                  </div>
                  {/* Itemized Expenses list in red on right */}
                  <div className="text-right space-y-1 text-xs">
                    {expenseList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-end gap-3 font-mono text-[#E03B3B] dark:text-rose-400">
                        <span className="font-sans text-slate-600 dark:text-slate-400">{item.label}</span>
                        <span>{formatCurrency(item.amount, currency)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: Balance Card & Savings Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Balance Card with Car progress bar */}
            <div className="bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#1B2943] dark:text-slate-100">Balance</h2>
                <span className="text-[11px] text-slate-400 font-medium">Year {currentYear}</span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#1B2943] dark:text-slate-100 font-mono tracking-tight mt-1">
                  {formatCurrency(displayBalance, currency)}
                </div>
              </div>
              <div className="mt-4 pt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Car</span>
                  <span className="text-[#2563EB] font-bold">50%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#2563EB] h-full rounded-full w-1/2" />
                </div>
              </div>
            </div>

            {/* Savings Card with Student Loan progress bar */}
            <div className="bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#1B2943] dark:text-slate-100">Savings</h2>
                  <span className="text-[11px] text-slate-400 font-medium">Total Savings</span>
                </div>
                <div className="text-2xl font-extrabold text-[#2563EB] font-mono tracking-tight">
                  {formatCurrency(displaySavings, currency)}
                </div>
              </div>
              <div className="mt-4 pt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Student Loan</span>
                  <span className="text-[#F97316] font-bold">20%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-[#2563EB] h-full w-[16%]" />
                  <div className="bg-[#F97316] h-full w-[4%]" />
                </div>
              </div>
            </div>
          </div>

          {/* ROW 3: Spending Budget Card (Multi-column category ratios and progress bars) */}
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/70 dark:border-slate-800">
            <h2 className="text-sm font-bold text-[#1B2943] dark:text-slate-100 mb-4">
              Spending Budget
            </h2>
            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              {/* Row 1: Groocries 120/300 | progress bar | 120/100 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4 min-w-[140px]">
                  <span>Groocries</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">120/300</span>
                </div>
                <div className="flex-1 max-w-xs mx-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#2563EB] h-full w-[40%] rounded-full" />
                  </div>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400">120/100</span>
              </div>

              {/* Row 2: Utilities 98/150 | 98/50/150 | 0/50 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4 min-w-[140px]">
                  <span>Utilities</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">98/150</span>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400">98/50/150</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">0/50</span>
              </div>

              {/* Row 3: Health Care | Transportation 0/50 | green progress bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4 min-w-[140px]">
                  <span>Health Care</span>
                  <span>Transportation 0/50</span>
                </div>
                <div className="flex-1 max-w-xs mx-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#10B981] h-full w-[65%] rounded-full" />
                  </div>
                </div>
              </div>

              {/* Row 4: Eating Out 40/80 | Entertainment 85/80 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4 min-w-[140px]">
                  <span>Eating Out</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">40/80</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Entertainment</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">85/80</span>
                </div>
              </div>

              {/* Row 5: Housing 40/50 | Personal Care 15/30 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4 min-w-[140px]">
                  <span>Housing</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">40/50</span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Personal Care</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">15/30</span>
                </div>
              </div>

              {/* Row 6: Housing 15/30 | Purple progress bar | 125/200 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4 min-w-[140px]">
                  <span>Housing</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">15/30</span>
                </div>
                <div className="flex-1 max-w-xs mx-2">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#8B5CF6] h-full w-[50%] rounded-full" />
                  </div>
                </div>
                <span className="font-mono text-slate-500 dark:text-slate-400">125/200</span>
              </div>
            </div>
          </div>

          {/* ROW 4: Upcoming Expenses Card */}
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1B2943] dark:text-slate-100">Upcoming Expenses</h2>
              <span className="text-[11px] text-slate-400 font-medium">Week of January {currentYear}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {upcomingItem.name} {formatCurrency(upcomingItem.amount, currency)}
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-[#2563EB]">
                <CalendarIcon className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* ROW 5: Transfers Card */}
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-5 shadow-xs border border-slate-200/70 dark:border-slate-800">
            <h2 className="text-sm font-bold text-[#1B2943] dark:text-slate-100 mb-3">
              Transfers
            </h2>
            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              {transfersData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span>{item.description}</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{item.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM CTA: "Get Started Today" Button */}
          <div className="flex justify-center pt-2 pb-6">
            <button
              onClick={onOpenQuickAdd}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-95 text-white font-bold text-base px-10 py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Get Started Today
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};
