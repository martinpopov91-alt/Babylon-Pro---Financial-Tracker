import React, { useState } from 'react';
import { 
  Receipt, 
  CreditCard, 
  Plus, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Edit3, 
  Calendar,
  X,
  Repeat,
  Sparkles,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Bill, Debt, Language } from '../types';
import { getTranslation } from '../constants/translations';
import { formatCurrency } from '../utils/calculations';
import { getCurrentMonthKey } from '../utils/recurringBills';

interface BillsAndDebtManagerProps {
  bills: Bill[];
  debts: Debt[];
  currency: string;
  lang: Language;
  autoGenerateRecurringBills?: boolean;
  onToggleBillPaid: (id: string) => void;
  onToggleDebtPaid: (id: string) => void;
  onAddBill: (bill: Omit<Bill, 'id'>) => void;
  onUpdateBill: (bill: Bill) => void;
  onAddDebt: (debt: Omit<Debt, 'id'>) => void;
  onDeleteBill: (id: string) => void;
  onDeleteDebt: (id: string) => void;
  onProcessRecurringNow: () => void;
  onToggleGlobalAutoGenerate: (enabled: boolean) => void;
}

export const BillsAndDebtManager: React.FC<BillsAndDebtManagerProps> = ({
  bills,
  debts,
  currency,
  lang,
  autoGenerateRecurringBills = true,
  onToggleBillPaid,
  onToggleDebtPaid,
  onAddBill,
  onUpdateBill,
  onAddDebt,
  onDeleteBill,
  onDeleteDebt,
  onProcessRecurringNow,
  onToggleGlobalAutoGenerate
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [activeTab, setActiveTab] = useState<'bills' | 'debts'>('bills');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState('');
  const [dueDateDay, setDueDateDay] = useState('15');
  const [isRecurring, setIsRecurring] = useState(true);
  const [autoGenerateTransaction, setAutoGenerateTransaction] = useState(true);

  const currentMonth = getCurrentMonthKey();

  const handleOpenAddModal = () => {
    setEditingBill(null);
    setItemName('');
    setItemAmount('');
    setDueDateDay('15');
    setIsRecurring(true);
    setAutoGenerateTransaction(true);
    setIsAddModalOpen(true);
  };

  const handleOpenEditBillModal = (bill: Bill) => {
    setEditingBill(bill);
    setItemName(bill.name);
    setItemAmount(bill.amount.toString());
    setDueDateDay((bill.dueDateDay || 15).toString());
    setIsRecurring(bill.isRecurring ?? false);
    setAutoGenerateTransaction(bill.autoGenerateTransaction ?? true);
    setIsAddModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(itemAmount);
    if (!itemName.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'bg' ? 'Моля въведете валидно име и сума!' : 'Please enter a valid name and amount!');
      return;
    }

    if (activeTab === 'bills') {
      if (editingBill) {
        onUpdateBill({
          ...editingBill,
          name: itemName.trim(),
          amount: parsedAmount,
          dueDateDay: parseInt(dueDateDay) || 15,
          isRecurring,
          autoGenerateTransaction: isRecurring ? autoGenerateTransaction : false
        });
      } else {
        onAddBill({
          name: itemName.trim(),
          amount: parsedAmount,
          dueDateDay: parseInt(dueDateDay) || 15,
          isPaid: false,
          isRecurring,
          autoGenerateTransaction: isRecurring ? autoGenerateTransaction : false
        });
      }
    } else {
      onAddDebt({
        name: itemName.trim(),
        amount: parsedAmount,
        isPaid: false
      });
    }

    setIsAddModalOpen(false);
    setEditingBill(null);
    setItemName('');
    setItemAmount('');
  };

  const totalBillsSum = bills.reduce((sum, b) => sum + b.amount, 0);
  const totalBillsPaid = bills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0);

  const totalDebtsSum = debts.reduce((sum, d) => sum + d.amount, 0);
  const totalDebtsPaid = debts.filter(d => d.isPaid).reduce((sum, d) => sum + d.amount, 0);

  const recurringBillsCount = bills.filter(b => b.isRecurring).length;
  const autoLogEligibleCount = bills.filter(b => b.isRecurring && (b.autoGenerateTransaction ?? true)).length;
  const generatedThisMonthCount = bills.filter(b => b.isRecurring && b.lastGeneratedMonth === currentMonth).length;

  return (
    <div id="bills-and-debt-manager" className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#F7B352]" />
            <span>{t('billsAndDebt')}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {lang === 'bg' 
              ? 'Управление на фиксирани сметки, повтарящи се задължения и автоматично отчитане.' 
              : 'Track fixed recurring obligations, debt service, and automated monthly entries.'}
          </p>
        </div>

        {/* Tab Switcher & Add Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 dark:bg-[#13161C] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'bills'
                  ? 'bg-[#F7B352] text-slate-900 font-black shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{t('billsTitle')}</span>
            </button>
            <button
              onClick={() => setActiveTab('debts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'debts'
                  ? 'bg-[#E07A6C] text-slate-900 font-black shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{t('debtTitle')}</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7B352] hover:bg-[#E59F2A] active:scale-[0.98] text-slate-900 font-black text-xs shadow-sm shadow-[#F7B352]/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('add')}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards for active tab */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('totalDue')}</p>
            <p className="text-2xl font-black text-slate-800 dark:text-white font-display mt-1">
              {formatCurrency(activeTab === 'bills' ? totalBillsSum : totalDebtsSum, currency)}
            </p>
          </div>
          <span className="p-3 rounded-xl bg-slate-50 dark:bg-[#1A1E26] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {activeTab === 'bills' ? <Receipt className="w-6 h-6 text-[#F7B352]" /> : <CreditCard className="w-6 h-6 text-[#E07A6C]" />}
          </span>
        </div>

        <div className="bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('totalPaid')}</p>
            <p className="text-2xl font-black text-[#9BB18A] dark:text-emerald-400 font-display mt-1">
              {formatCurrency(activeTab === 'bills' ? totalBillsPaid : totalDebtsPaid, currency)}
            </p>
          </div>
          <span className="p-3 rounded-xl bg-[#8DA37C]/15 dark:bg-emerald-500/15 text-[#9BB18A] dark:text-emerald-400 border border-[#8DA37C]/30 dark:border-emerald-500/30">
            <CheckCircle className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Recurring Bills Automation Banner (Bills tab only) */}
      {activeTab === 'bills' && (
        <div className="bg-slate-50 dark:bg-[#14171E] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#F7B352]/15 text-[#174E5B] dark:text-[#F7B352] border border-[#F7B352]/30 shrink-0 mt-0.5">
                <Repeat className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">{t('autoGenerateSetting')}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#F7B352]/15 text-[#174E5B] dark:text-[#F7B352] border border-[#F7B352]/30 text-[10px] font-bold">
                    {recurringBillsCount} {t('recurringBadge')}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('autoGenerateSettingSub')}</p>
              </div>
            </div>

            {/* Toggle Switch & Process Now Button */}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 bg-slate-50 dark:bg-[#1A1E26] hover:bg-slate-100 dark:hover:bg-[#222732] border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer transition-colors text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                <input
                  type="checkbox"
                  checked={autoGenerateRecurringBills}
                  onChange={(e) => onToggleGlobalAutoGenerate(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#F7B352] cursor-pointer"
                />
                <span>{t('autoGenerateTx')}</span>
              </label>

              <button
                onClick={onProcessRecurringNow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F7B352] hover:bg-[#E59F2A] active:scale-[0.98] text-slate-900 font-black text-xs shadow-sm shadow-[#F7B352]/25 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('processRecurringNow')}</span>
              </button>
            </div>
          </div>

          {/* Status summary */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F7B352]" />
              <span>
                {lang === 'bg' 
                  ? `${autoLogEligibleCount} сметки са с включен авто-запис.`
                  : `${autoLogEligibleCount} bills configured for auto-generation.`}
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">&bull;</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-[#9BB18A] dark:text-emerald-400" />
              <span>
                {lang === 'bg'
                  ? `${generatedThisMonthCount} генерирани за текущия месец (${currentMonth}).`
                  : `${generatedThisMonthCount} logged for current month (${currentMonth}).`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main List */}
      {activeTab === 'bills' ? (
        bills.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#181B22]/60 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-400 dark:text-slate-500 text-sm">{lang === 'bg' ? 'Няма добавени фиксирани сметки.' : 'No fixed bills added yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bills.map((bill) => {
              const isAutoLoggedThisMonth = bill.lastGeneratedMonth === currentMonth;

              return (
                <div
                  key={bill.id}
                  className={`bg-white dark:bg-[#181B22] border rounded-3xl p-5 space-y-3 shadow-sm transition-all ${
                    bill.isPaid 
                      ? 'border-[#8DA37C]/40 dark:border-emerald-500/30' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-[#F7B352]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-800 dark:text-white text-base">{bill.name}</h4>
                        {bill.isRecurring && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F7B352]/15 text-[#174E5B] dark:text-[#F7B352] border border-[#F7B352]/30 text-[10px] font-bold">
                            <Repeat className="w-3 h-3" />
                            <span>{t('recurringBadge')}</span>
                          </span>
                        )}
                        {bill.isRecurring && (bill.autoGenerateTransaction ?? true) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#8DA37C]/15 dark:bg-emerald-500/15 text-[#9BB18A] dark:text-emerald-400 border border-[#8DA37C]/30 dark:border-emerald-500/30 text-[10px] font-bold">
                            <Zap className="w-3 h-3" />
                            <span>{t('autoLoggedBadge')}</span>
                          </span>
                        )}
                      </div>

                      {bill.dueDateDay && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t('dueDate')}: {bill.dueDateDay}-то число</span>
                        </p>
                      )}

                      {isAutoLoggedThisMonth && (
                        <p className="text-[11px] text-[#9BB18A] dark:text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          <span>{lang === 'bg' ? 'Генерирана за текущия месец' : 'Auto-logged for this month'}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditBillModal(bill)}
                        className="text-slate-500 dark:text-slate-400 hover:text-[#F7B352] p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={t('editBill')}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteBill(bill.id)}
                        className="text-slate-500 dark:text-slate-400 hover:text-[#E07A6C] p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                    <span className="text-xl font-black text-slate-800 dark:text-white font-display">
                      {formatCurrency(bill.amount, currency)}
                    </span>

                    <button
                      onClick={() => onToggleBillPaid(bill.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        bill.isPaid
                          ? 'bg-[#8DA37C]/15 text-[#9BB18A] border border-[#8DA37C]/30 hover:bg-[#8DA37C]/25'
                          : 'bg-slate-50 dark:bg-[#1E232D] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#252B37]'
                      }`}
                    >
                      {bill.isPaid ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-[#9BB18A]" />
                          <span>{t('paid')}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                          <span>{t('markAsPaid')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        debts.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl">
            <p className="text-slate-500 dark:text-slate-400 text-sm">{lang === 'bg' ? 'Няма добавени дългове.' : 'No debts added yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((debt) => (
              <div
                key={debt.id}
                className={`bg-white dark:bg-[#181B22] border rounded-3xl p-5 space-y-3 shadow-sm transition-all ${
                  debt.isPaid 
                    ? 'border-[#8DA37C]/40 bg-white dark:bg-[#181B22]' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-[#E07A6C]/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 dark:text-white text-base">{debt.name}</h4>
                  </div>
                  <button
                    onClick={() => onDeleteDebt(debt.id)}
                    className="text-slate-400 dark:text-slate-500 hover:text-[#E07A6C] p-1 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3">
                  <span className="text-xl font-black text-[#E07A6C] font-display">
                    {formatCurrency(debt.amount, currency)}
                  </span>

                  <button
                    onClick={() => onToggleDebtPaid(debt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      debt.isPaid
                        ? 'bg-[#8DA37C]/15 text-[#9BB18A] border border-[#8DA37C]/30 hover:bg-[#8DA37C]/25'
                        : 'bg-slate-50 dark:bg-[#1E232D] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#252B37]'
                    }`}
                  >
                    {debt.isPaid ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-[#9BB18A]" />
                        <span>{t('paid')}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span>{t('markAsPaid')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Modal Add/Edit Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 text-slate-800 dark:text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {activeTab === 'bills' 
                  ? (editingBill ? t('editBill') : t('addBill')) 
                  : t('addDebt')}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingBill(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Име / Name *</label>
                <input
                  type="text"
                  required
                  placeholder={activeTab === 'bills' ? 'e.g. Electricity, Internet, Rent' : 'e.g. Car Loan'}
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#101217] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-[#F7B352] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Сума / Amount ({currency}) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="150"
                  value={itemAmount}
                  onChange={(e) => setItemAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#101217] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-[#F7B352] focus:outline-none"
                />
              </div>

              {activeTab === 'bills' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{t('dueDate')} (1-31)</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDateDay}
                      onChange={(e) => setDueDateDay(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#101217] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-[#F7B352] focus:outline-none"
                    />
                  </div>

                  {/* Recurring Bill Switch */}
                  <div className="p-3 bg-slate-50 dark:bg-[#101217] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Repeat className="w-3.5 h-3.5 text-[#F7B352]" />
                          <span>{t('recurringBill')}</span>
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('recurringSub')}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isRecurring}
                        onChange={(e) => setIsRecurring(e.target.checked)}
                        className="w-4 h-4 rounded accent-[#F7B352] cursor-pointer"
                      />
                    </label>

                    {/* Auto Generate Switch */}
                    {isRecurring && (
                      <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="font-bold text-xs text-[#174E5B] dark:text-teal-400 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            <span>{t('autoGenerateTx')}</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('autoGenerateTxSub')}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoGenerateTransaction}
                          onChange={(e) => setAutoGenerateTransaction(e.target.checked)}
                          className="w-4 h-4 rounded accent-[#F7B352] cursor-pointer"
                        />
                      </label>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingBill(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#F7B352] hover:bg-[#E59F2A] active:scale-[0.98] text-slate-900 font-black text-sm shadow-sm shadow-[#F7B352]/25 cursor-pointer"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
