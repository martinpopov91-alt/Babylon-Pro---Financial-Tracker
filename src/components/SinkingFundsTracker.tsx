import React, { useState } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Target, 
  ArrowUpRight, 
  Trash2, 
  Edit3, 
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { Goal, Language } from '../types';
import { getTranslation } from '../constants/translations';
import { formatCurrency } from '../utils/calculations';

interface SinkingFundsTrackerProps {
  goals: Goal[];
  currency: string;
  lang: Language;
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onDepositToGoal: (goalId: string, amount: number, recordAsTransaction: boolean) => void;
}

export const SinkingFundsTracker: React.FC<SinkingFundsTrackerProps> = ({
  goals,
  currency,
  lang,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onDepositToGoal
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Deposit modal state
  const [activeDepositGoal, setActiveDepositGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [recordTransaction, setRecordTransaction] = useState<boolean>(true);

  // Form states
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
  const [biblicalPrinciple, setBiblicalPrinciple] = useState('');

  const biblicalPrinciples = [
    { value: '', labelEn: 'None', labelBg: 'Няма' },
    { value: 'Generosity', labelEn: 'Generosity (Proverbs 11:25)', labelBg: 'Щедрост (Притчи 11:25)' },
    { value: 'Prudence', labelEn: 'Prudence (Proverbs 21:20)', labelBg: 'Благоразумие (Притчи 21:20)' },
    { value: 'Debt Freedom', labelEn: 'Debt Freedom (Proverbs 22:7)', labelBg: 'Свобода от дългове (Притчи 22:7)' },
    { value: 'Contentment', labelEn: 'Contentment (Hebrews 13:5)', labelBg: 'Удовлетворение (Евреи 13:5)' },
    { value: 'Diligence', labelEn: 'Diligence (Proverbs 21:5)', labelBg: 'Усърдие (Притчи 21:5)' },
    { value: 'Stewardship', labelEn: 'Stewardship (Luke 16:11)', labelBg: 'Настойничество (Лука 16:11)' },
    { value: 'Preparation', labelEn: 'Preparation (Proverbs 6:6-8)', labelBg: 'Подготовка (Притчи 6:6-8)' },
  ];

  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('');
    setMonthlyTarget('');
    setBiblicalPrinciple('');
    setEditingGoal(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setMonthlyTarget(goal.monthlyTarget.toString());
    setBiblicalPrinciple(goal.biblicalPrinciple || '');
    setIsAddModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount) || 0;
    const parsedCurrent = parseFloat(currentAmount) || 0;
    const parsedMonthly = parseFloat(monthlyTarget) || 0;

    if (!goalName.trim()) {
      alert(lang === 'bg' ? 'Моля въведете име на целта!' : 'Please enter a goal name!');
      return;
    }

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        name: goalName.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        monthlyTarget: parsedMonthly,
        biblicalPrinciple: biblicalPrinciple || undefined
      });
    } else {
      onAddGoal({
        name: goalName.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        startingAmount: parsedCurrent,
        monthlyTarget: parsedMonthly,
        icon: 'PiggyBank',
        biblicalPrinciple: biblicalPrinciple || undefined
      });
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDepositGoal) return;
    const parsed = parseFloat(depositAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    onDepositToGoal(activeDepositGoal.id, parsed, recordTransaction);
    setActiveDepositGoal(null);
    setDepositAmount('');
  };

  // Aggregated totals
  const totalTargetSum = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSavedSum = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalMonthlySum = goals.reduce((sum, g) => sum + g.monthlyTarget, 0);

  return (
    <div id="vaults-sinking-funds" className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-zinc-100 font-display flex items-center gap-2">
            <PiggyBank className="w-6 h-6 text-teal-400" />
            <span>{t('goalTrackerTitle')}</span>
          </h2>
          <p className="text-xs text-zinc-400">
            {t('goalTrackerSub')}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{t('addGoal')}</span>
        </button>
      </div>

      {/* Aggregate Overview Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-zinc-400">{lang === 'bg' ? 'Общо Спестено' : 'Total Saved'}</p>
          <p className="text-2xl font-black text-teal-400 font-display mt-1">
            {formatCurrency(totalSavedSum, currency)}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-zinc-400">{lang === 'bg' ? 'Обща Цел' : 'Total Target'}</p>
          <p className="text-2xl font-black text-zinc-100 font-display mt-1">
            {formatCurrency(totalTargetSum, currency)}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-zinc-400">{t('monthlyTarget')}</p>
          <p className="text-2xl font-black text-emerald-400 font-display mt-1">
            {formatCurrency(totalMonthlySum, currency)}
          </p>
        </div>
      </div>

      {/* Goal Cards Grid */}
      {goals.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
          <p className="text-zinc-400 text-sm font-medium">
            {lang === 'bg' ? 'Все още нямате създадени спестовни цели.' : 'No goal vaults created yet.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-bold hover:bg-teal-500/20 transition-colors cursor-pointer"
          >
            + {t('addGoal')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const hasTarget = goal.targetAmount > 0;
            const isCompleted = hasTarget && goal.currentAmount >= goal.targetAmount;
            const progressPercent = hasTarget
              ? Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100))
              : 0;
            const remainingNeeded = hasTarget ? Math.max(0, goal.targetAmount - goal.currentAmount) : 0;
            const monthsLeft = (hasTarget && goal.monthlyTarget > 0) ? Math.ceil(remainingNeeded / goal.monthlyTarget) : null;

            return (
              <div
                key={goal.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-teal-500/30 rounded-2xl p-5 space-y-4 shadow-lg transition-all relative overflow-hidden flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex-shrink-0">
                      <Target className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-zinc-100 text-sm sm:text-base leading-tight truncate" title={goal.name}>
                        {goal.name}
                      </h3>
                      {goal.biblicalPrinciple && (
                        <div className="mt-1 mb-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 truncate max-w-full">
                            {biblicalPrinciples.find(p => p.value === goal.biblicalPrinciple)?.[lang === 'bg' ? 'labelBg' : 'labelEn'] || goal.biblicalPrinciple}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-zinc-400 font-medium mt-0.5">
                        {t('monthlyTarget')}: <span className="text-emerald-400 font-bold">{goal.monthlyTarget > 0 ? formatCurrency(goal.monthlyTarget, currency) : (lang === 'bg' ? 'Няма' : 'None')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(goal)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title={lang === 'bg' ? 'Редактирай' : 'Edit'}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title={lang === 'bg' ? 'Изтрий' : 'Delete'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Progress Metric */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-teal-400 font-display">
                      {formatCurrency(goal.currentAmount, currency)}
                    </span>
                    {hasTarget ? (
                      <span className="text-xs text-zinc-400 font-semibold">
                        / {formatCurrency(goal.targetAmount, currency)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-teal-400/80 font-medium bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20">
                        {lang === 'bg' ? 'Отворен Сейф' : 'Open Vault'}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {hasTarget ? (
                    <div className="w-full h-3 rounded-full bg-zinc-800 p-0.5 overflow-hidden border border-zinc-700/50">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-teal-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-1.5 rounded-full bg-teal-500/20 border border-teal-500/30" />
                  )}

                  <div className="flex items-center justify-between text-xs font-semibold pt-0.5">
                    {hasTarget ? (
                      <span className="text-teal-400">{progressPercent.toFixed(0)}% {lang === 'bg' ? 'постигнати' : 'achieved'}</span>
                    ) : (
                      <span className="text-teal-400">{lang === 'bg' ? 'Гъвкав Фонд' : 'Flexible Vault'}</span>
                    )}
                    {isCompleted ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('goalAchieved')}
                      </span>
                    ) : monthsLeft !== null ? (
                      <span className="text-zinc-400">
                        ~{monthsLeft} {lang === 'bg' ? 'месеца остават' : 'months left'}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Quick Deposit Action Button */}
                <button
                  onClick={() => {
                    setActiveDepositGoal(goal);
                    setDepositAmount('');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{t('deposit')}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Deposit Modal */}
      {activeDepositGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 text-zinc-100 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-teal-400" />
                <span>{t('depositModalTitle')}</span>
              </h3>
              <button
                onClick={() => setActiveDepositGoal(null)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              {t('depositAmountPrompt')} <span className="font-bold text-zinc-200">{activeDepositGoal.name}</span>:
            </p>

            <form onSubmit={handleConfirmDeposit} className="space-y-4">
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xl font-bold text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordTransaction}
                  onChange={(e) => setRecordTransaction(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-teal-500 focus:ring-teal-500"
                />
                <span>{t('addTransactionForDeposit')}</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveDepositGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs"
                >
                  {t('confirm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 text-zinc-100 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base">
                {editingGoal ? t('editGoal') : t('addGoal')}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('goalName')} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Fund, Summer Trip"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t('targetAmount')} ({currency}) <span className="text-zinc-500 font-normal">({lang === 'bg' ? 'Опционално' : 'Optional'})</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-bold text-teal-400 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    {t('currentAmount')} ({currency}) <span className="text-zinc-500 font-normal">({lang === 'bg' ? 'Опционално' : 'Optional'})</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {t('monthlyTarget')} ({currency}) <span className="text-zinc-500 font-normal">({lang === 'bg' ? 'Опционално' : 'Optional'})</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  {lang === 'bg' ? 'Библейски принцип' : 'Biblical Principle'} <span className="text-zinc-500 font-normal">({lang === 'bg' ? 'Опционално' : 'Optional'})</span>
                </label>
                <select
                  value={biblicalPrinciple}
                  onChange={(e) => setBiblicalPrinciple(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none text-zinc-200"
                >
                  {biblicalPrinciples.map(principle => (
                    <option key={principle.value} value={principle.value}>
                      {lang === 'bg' ? principle.labelBg : principle.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-sm shadow-md"
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
