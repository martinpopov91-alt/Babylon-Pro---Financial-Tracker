import { AppState, FinancialSummary, Category, PayPeriodInfo, PeriodMode } from '../types';

export const calculatePayPeriodDates = (
  startDay: number = 1,
  customStart?: string,
  customEnd?: string,
  periodMode: PeriodMode = 'payday',
  periodOffset: number = 0,
  lang: 'en' | 'bg' = 'en'
): PayPeriodInfo => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let startDate: Date;
  let endDate: Date;

  if (periodMode === 'custom' && customStart && customEnd) {
    startDate = new Date(customStart);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(customEnd);
    endDate.setHours(23, 59, 59, 999);
  } else if (periodMode === 'calendar') {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + (periodOffset || 0), 1);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    startDate = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
  } else {
    // Payday cycle mode
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    let baseMonth: number;
    if (startDay === 1) {
      baseMonth = currentMonth;
    } else {
      if (currentDate >= startDay) {
        baseMonth = currentMonth;
      } else {
        baseMonth = currentMonth - 1;
      }
    }

    const targetMonth = baseMonth + (periodOffset || 0);

    if (startDay === 1) {
      startDate = new Date(currentYear, targetMonth, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, targetMonth + 1, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(currentYear, targetMonth, startDay, 0, 0, 0, 0);
      endDate = new Date(currentYear, targetMonth + 1, startDay - 1, 23, 59, 59, 999);
    }
  }

  // Calculate days & status
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const nowTime = now.getTime();

  const totalDays = Math.max(1, Math.round((endTime - startTime) / (1000 * 60 * 60 * 24)) + 1);

  // Consider it current if today falls within startDate to endDate
  const isPast = endTime < nowTime;
  const isFuture = startTime > (nowTime + 24 * 60 * 60 * 1000 - 1);
  const isCurrent = !isPast && !isFuture;

  let daysRemaining = 0;
  let daysElapsed = 0;

  if (isPast) {
    daysRemaining = 0;
    daysElapsed = totalDays;
  } else if (isFuture) {
    daysRemaining = totalDays;
    daysElapsed = 0;
  } else {
    const diffMs = endTime - nowTime;
    daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    daysElapsed = Math.max(1, totalDays - daysRemaining + 1);
  }

  const formatDate = (d: Date) => {
    return d.toLocaleDateString(lang === 'bg' ? 'bg-BG' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const label = `${formatDate(startDate)} - ${formatDate(endDate)}`;

  let subLabel = '';
  if (isCurrent) {
    subLabel = lang === 'bg' ? `${daysRemaining} дни остават` : `${daysRemaining} days remaining`;
  } else if (isPast) {
    subLabel = lang === 'bg' ? 'Приключил период' : 'Completed period';
  } else {
    subLabel = lang === 'bg' ? 'Предстоящ период' : 'Upcoming period';
  }

  return {
    startDate,
    endDate,
    isCurrent,
    isPast,
    isFuture,
    label,
    subLabel,
    totalDays,
    daysRemaining,
    daysElapsed,
    mode: periodMode,
    offset: periodOffset
  };
};

export const getPayPeriodPresetOptions = (
  startDay: number = 1,
  lang: 'en' | 'bg' = 'en',
  countPast: number = 12,
  countFuture: number = 2
) => {
  const options: PayPeriodInfo[] = [];

  for (let offset = countFuture; offset >= -countPast; offset--) {
    const info = calculatePayPeriodDates(startDay, undefined, undefined, 'payday', offset, lang);
    options.push(info);
  }

  return options;
};

export const getCalendarMonthPresetOptions = (
  lang: 'en' | 'bg' = 'en',
  countPast: number = 12,
  countFuture: number = 2
) => {
  const options: PayPeriodInfo[] = [];

  for (let offset = countFuture; offset >= -countPast; offset--) {
    const info = calculatePayPeriodDates(1, undefined, undefined, 'calendar', offset, lang);
    options.push(info);
  }

  return options;
};

export const getDaysRemainingInPeriod = (endDate: Date): { daysRemaining: number; totalDays: number; daysElapsed: number } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const diffTimeMs = end.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTimeMs / (1000 * 60 * 60 * 24)));
  const totalDays = 30;
  const daysElapsed = Math.max(1, totalDays - daysRemaining + 1);

  return { daysRemaining, totalDays, daysElapsed };
};

export const calculateFinancials = (state: AppState): FinancialSummary => {
  const { settings, goals, bills, debts, transactions } = state;
  const periodInfo = calculatePayPeriodDates(
    settings.startDay,
    settings.customStartDate,
    settings.customEndDate,
    settings.periodMode || (settings.customStartDate && settings.customEndDate ? 'custom' : 'payday'),
    settings.periodOffset || 0,
    settings.language || 'en'
  );

  const { startDate, endDate, daysRemaining, totalDays, isPast } = periodInfo;

  const baseSalary = settings.salary || 0;

  // Filter transactions in current pay period
  const periodTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const tDate = new Date(t.date);
    return tDate >= startDate && tDate <= endDate;
  });

  // Extra income in period
  const extraIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalIncome = baseSalary + extraIncome;

  // Babylon Rule Calculations ("Pay Yourself First")
  const titheAmount = (baseSalary * (settings.tithePercent || 10)) / 100;
  const wealthAmount = (baseSalary * (settings.wealthPercent || 10)) / 100;

  // Fixed Commitments
  const totalBills = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalDebts = debts.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  const totalSavingsAllocated = goals.reduce((sum, g) => sum + Number(g.monthlyTarget || 0), 0);

  // Rollover Funds
  const rolloverFunds = settings.rollover ? Number(settings.rolloverAmount || 0) : 0;

  // Disposable "Life Money" Formula:
  // Life Money Total = Income - Tithe - Wealth - Bills - Debt - Savings Goals (+ Rollover)
  const lifeMoneyTotal = Math.max(
    0,
    totalIncome - titheAmount - wealthAmount - totalBills - totalDebts - totalSavingsAllocated + rolloverFunds
  );

  // Variable Expenses in Period (Needs, Wants, Savings logged as expenses)
  const totalVariableExpenses = periodTransactions
    .filter(t => t.type === 'needs' || t.type === 'wants' || t.type === 'savings')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const needsSpent = periodTransactions
    .filter(t => t.type === 'needs')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const wantsSpent = periodTransactions
    .filter(t => t.type === 'wants')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const billsPaidTotal = bills.filter(b => b.isPaid).reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const debtsPaidTotal = debts.filter(d => d.isPaid).reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const categorySpending: Record<string, number> = {};
  periodTransactions.forEach(t => {
    if (t.type === 'needs' || t.type === 'wants' || t.type === 'savings') {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount || 0);
    }
  });

  const remainingLifeMoney = lifeMoneyTotal - totalVariableExpenses;

  // For past periods, daily budget calculation doesn't apply to remaining days, or is zero if closed
  const effectiveDaysRemaining = isPast ? 0 : Math.max(1, daysRemaining);
  const dailyBudget = remainingLifeMoney > 0 && !isPast ? remainingLifeMoney / effectiveDaysRemaining : 0;
  const weeklyBudget = dailyBudget * 7;

  const spentPercentage = lifeMoneyTotal > 0 ? Math.min(100, Math.max(0, (totalVariableExpenses / lifeMoneyTotal) * 100)) : 0;

  return {
    baseSalary,
    extraIncome,
    totalIncome,
    titheAmount,
    wealthAmount,
    totalBills,
    totalDebts,
    totalSavingsAllocated,
    rolloverFunds,
    lifeMoneyTotal,
    totalVariableExpenses,
    remainingLifeMoney,
    daysInPeriod: totalDays,
    daysRemaining,
    dailyBudget,
    weeklyBudget,
    spentPercentage,
    needsSpent,
    wantsSpent,
    billsPaidTotal,
    debtsPaidTotal,
    categorySpending
  };
};

export const getCategoryName = (categoryKeyOrId: string, categories: Category[], lang: 'en' | 'bg'): string => {
  const match = categories.find(c => c.id === categoryKeyOrId || c.nameEn === categoryKeyOrId || c.nameBg === categoryKeyOrId);
  if (match) {
    if (match.parentId) {
      const parent = categories.find(p => p.id === match.parentId);
      if (parent) {
        const parentName = lang === 'bg' ? parent.nameBg : parent.nameEn;
        const subName = lang === 'bg' ? match.nameBg : match.nameEn;
        return `${parentName} › ${subName}`;
      }
    }
    return lang === 'bg' ? match.nameBg : match.nameEn;
  }
  return categoryKeyOrId;
};

export const formatCurrency = (amount: number, currency: string = 'BGN'): string => {
  const symbolMap: Record<string, string> = {
    BGN: 'лв.',
    EUR: '€',
    USD: '$',
    GBP: '£'
  };
  const formattedNumber = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const symbol = symbolMap[currency] || currency;

  if (currency === 'BGN') {
    return `${formattedNumber} ${symbol}`;
  }
  return `${symbol}${formattedNumber}`;
};
