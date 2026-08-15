import { AppState, Bill, Transaction } from '../types';

export const getCurrentMonthKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const processRecurringBills = (
  state: AppState,
  forceManual: boolean = false
): { updatedState: AppState; generatedCount: number; generatedNames: string[] } => {
  const currentMonth = getCurrentMonthKey();
  const todayStr = new Date().toISOString().split('T')[0];

  const globalAutoEnabled = state.settings.autoGenerateRecurringBills ?? true;
  if (!globalAutoEnabled && !forceManual) {
    return { updatedState: state, generatedCount: 0, generatedNames: [] };
  }

  let generatedCount = 0;
  const generatedNames: string[] = [];
  const newTransactions: Transaction[] = [];

  const updatedBills: Bill[] = state.bills.map((bill) => {
    // A bill is eligible if it is marked recurring AND has autoGenerateTransaction enabled (or undefined defaults to true)
    const isRecurring = bill.isRecurring ?? false;
    const isAutoGenerate = bill.autoGenerateTransaction ?? true;
    const isEligible = isRecurring && isAutoGenerate;

    if (isEligible && bill.lastGeneratedMonth !== currentMonth) {
      // Determine transaction date using dueDateDay if present
      let txDate = todayStr;
      if (bill.dueDateDay && bill.dueDateDay >= 1 && bill.dueDateDay <= 31) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(Math.min(bill.dueDateDay, 28)).padStart(2, '0');
        txDate = `${year}-${month}-${day}`;
      }

      const autoTx: Transaction = {
        id: 'tx_auto_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        amount: bill.amount,
        note: `[Auto-Bill] ${bill.name}`,
        category: bill.category || 'cat_utilities',
        type: 'bills',
        date: txDate
      };

      newTransactions.push(autoTx);
      generatedCount++;
      generatedNames.push(bill.name);

      return {
        ...bill,
        lastGeneratedMonth: currentMonth,
        isPaid: true
      };
    }

    return bill;
  });

  if (generatedCount === 0) {
    return { updatedState: state, generatedCount: 0, generatedNames: [] };
  }

  const updatedState: AppState = {
    ...state,
    bills: updatedBills,
    transactions: [...newTransactions, ...state.transactions]
  };

  return { updatedState, generatedCount, generatedNames };
};
