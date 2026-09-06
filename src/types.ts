export type Currency = 'BGN' | 'EUR' | 'USD' | 'GBP';

export type Language = 'en' | 'bg';

export type Theme = 'dark' | 'light';

export type CategoryType = 'income' | 'bills' | 'debt' | 'needs' | 'wants' | 'savings';

export interface Category {
  id: string;
  nameEn: string;
  nameBg: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isCustom?: boolean;
  parentId?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  note: string;
  category: string; // Category ID or Name
  type: CategoryType;
  date: string; // YYYY-MM-DD
  goalId?: string; // Optional link to a specific Sinking Fund/Goal deposit
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  startingAmount?: number;
  monthlyTarget: number;
  icon?: string;
  targetDate?: string;
  category?: string;
  biblicalPrinciple?: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDateDay?: number; // Day of month e.g. 15
  isPaid: boolean;
  category?: string;
  isRecurring?: boolean;
  autoGenerateTransaction?: boolean;
  lastGeneratedMonth?: string; // YYYY-MM
}

export interface Debt {
  id: string;
  name: string;
  amount: number; // Monthly payment or total balance
  totalBalance?: number;
  interestRate?: number;
  isPaid: boolean;
  category?: string;
}

export type PeriodMode = 'payday' | 'calendar' | 'custom';

export interface PayPeriodInfo {
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  label: string;
  subLabel?: string;
  totalDays: number;
  daysRemaining: number;
  daysElapsed: number;
  mode: PeriodMode;
  offset: number;
}

export interface AppSettings {
  salary: number;
  currency: Currency;
  startDay: number; // Day of month payday occurs (1-31)
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string;   // YYYY-MM-DD
  periodMode?: PeriodMode;
  periodOffset?: number; // 0 for current, -1 for previous, +1 for next
  language: Language;
  theme: Theme;
  tithePercent: number; // default 10%
  wealthPercent: number; // default 10%
  rollover: boolean;
  rolloverAmount?: number; // Calculated unspent rollover balance
  autoGenerateRecurringBills?: boolean; // Global setting toggle for monthly auto-generation
  budgetLimits?: Record<string, number>; // Monthly budget limits for categories
}

export interface AppState {
  isNewUser: boolean;
  settings: AppSettings;
  goals: Goal[];
  bills: Bill[];
  debts: Debt[];
  transactions: Transaction[];
  categories: Category[];
}

export interface FinancialSummary {
  baseSalary: number;
  extraIncome: number;
  totalIncome: number;
  titheAmount: number;
  wealthAmount: number;
  totalBills: number;
  totalDebts: number;
  totalSavingsAllocated: number;
  rolloverFunds: number;
  
  lifeMoneyTotal: number;
  totalVariableExpenses: number;
  remainingLifeMoney: number;
  
  daysInPeriod: number;
  daysRemaining: number;
  dailyBudget: number;
  weeklyBudget: number;
  spentPercentage: number;
  
  // Breakdown by needs/wants/savings/etc.
  needsSpent: number;
  wantsSpent: number;
  billsPaidTotal: number;
  debtsPaidTotal: number;
  categorySpending: Record<string, number>;
}
