import React, { useState } from 'react';
import { 
  Sparkles, 
  Coins, 
  Heart, 
  Receipt, 
  PiggyBank, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  X,
  Banknote,
  BookOpen
} from 'lucide-react';
import { AppSettings, Bill, Currency, Debt, Goal, Language } from '../types';
import { getTranslation } from '../constants/translations';

interface OnboardingWizardProps {
  initialSettings: AppSettings;
  initialBills: Bill[];
  initialDebts: Debt[];
  initialGoals: Goal[];
  lang: Language;
  onClose: () => void;
  onOpenInstructions?: () => void;
  onCompleteWizard: (data: {
    settings: Partial<AppSettings>;
    bills: Bill[];
    debts: Debt[];
    goals: Goal[];
  }) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialSettings,
  initialBills,
  initialDebts,
  initialGoals,
  lang,
  onClose,
  onOpenInstructions,
  onCompleteWizard
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Salary & Schedule
  const [salary, setSalary] = useState<number>(initialSettings.salary || 3000);
  const [currency, setCurrency] = useState<Currency>(initialSettings.currency || 'BGN');
  const [startDay, setStartDay] = useState<number>(initialSettings.startDay || 1);

  // Step 2: Babylon Percentages
  const [tithePercent, setTithePercent] = useState<number>(initialSettings.tithePercent ?? 10);
  const [wealthPercent, setWealthPercent] = useState<number>(initialSettings.wealthPercent ?? 10);

  // Step 3: Bills & Debts
  const [billsList, setBillsList] = useState<Bill[]>(initialBills);
  const [debtsList, setDebtsList] = useState<Debt[]>(initialDebts);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');

  // Step 4: Goals
  const [goalsList, setGoalsList] = useState<Goal[]>(initialGoals);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalMonthly, setNewGoalMonthly] = useState('');

  const handleAddQuickBill = () => {
    const amt = parseFloat(newBillAmount);
    if (!newBillName.trim() || isNaN(amt) || amt <= 0) return;
    setBillsList([
      ...billsList,
      {
        id: 'b_' + Date.now(),
        name: newBillName.trim(),
        amount: amt,
        isPaid: false
      }
    ]);
    setNewBillName('');
    setNewBillAmount('');
  };

  const handleAddQuickGoal = () => {
    const target = parseFloat(newGoalTarget) || 0;
    const monthly = parseFloat(newGoalMonthly) || 0;
    if (!newGoalName.trim()) return;
    setGoalsList([
      ...goalsList,
      {
        id: 'g_' + Date.now(),
        name: newGoalName.trim(),
        targetAmount: target,
        currentAmount: 0,
        monthlyTarget: monthly
      }
    ]);
    setNewGoalName('');
    setNewGoalTarget('');
    setNewGoalMonthly('');
  };

  const handleFinish = () => {
    onCompleteWizard({
      settings: {
        salary,
        currency,
        startDay,
        tithePercent,
        wealthPercent
      },
      bills: billsList,
      debts: debtsList,
      goals: goalsList
    });
    onClose();
  };

  return (
    <div id="onboarding-wizard-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-100 space-y-6 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display">{t('wizardTitle')}</h2>
              <p className="text-xs text-zinc-400">{t('wizardSub')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenInstructions && (
              <button
                type="button"
                onClick={onOpenInstructions}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{t('instructions')}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                step === currentStep
                  ? 'bg-emerald-500'
                  : step < currentStep
                  ? 'bg-emerald-500/40'
                  : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Banknote className="w-5 h-5" />
                <span>{t('step1Title')}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{t('step1Desc')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('salary')} *</label>
                <input
                  type="number"
                  step="50"
                  value={salary}
                  onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xl font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('currency')} *</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-base font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="BGN">BGN (лв.)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">{t('paydayStartDay')} *</label>
              <input
                type="number"
                min="1"
                max="31"
                value={startDay}
                onChange={(e) => setStartDay(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span>{t('step2Title')}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{t('step2Desc')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-zinc-800/80 border border-zinc-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-pink-400">{t('titheShort')}</span>
                  <span className="font-black text-lg text-pink-400">{tithePercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={tithePercent}
                  onChange={(e) => setTithePercent(parseInt(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <p className="text-[11px] text-zinc-400">
                  {lang === 'bg' ? 'Дарения, каузи и заделяния' : 'Charity and tithe'}
                </p>
              </div>

              <div className="p-4 bg-zinc-800/80 border border-zinc-700 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-emerald-400">{t('wealthShort')}</span>
                  <span className="font-black text-lg text-emerald-400">{wealthPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={wealthPercent}
                  onChange={(e) => setWealthPercent(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-zinc-400">
                  {lang === 'bg' ? 'Инвестиционен заделен фонд за бъдещето' : 'Compounding wealth investments'}
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-emerald-400 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-400" />
                <span>{t('step3Title')}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{t('step3Desc')}</p>
            </div>

            {/* Quick add bill input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Rent, Internet, Electricity"
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-medium"
              />
              <input
                type="number"
                placeholder="Amount"
                value={newBillAmount}
                onChange={(e) => setNewBillAmount(e.target.value)}
                className="w-28 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-emerald-400"
              />
              <button
                type="button"
                onClick={handleAddQuickBill}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                + {t('add')}
              </button>
            </div>

            {/* List of current bills */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {billsList.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 bg-zinc-800/60 rounded-xl text-xs">
                  <span className="font-semibold text-zinc-200">{b.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-400">{b.amount} {currency}</span>
                    <button
                      type="button"
                      onClick={() => setBillsList(billsList.filter(x => x.id !== b.id))}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-base font-bold text-teal-400 flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-teal-400" />
                <span>{t('step4Title')}</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">{t('step4Desc')}</p>
            </div>

            {/* Quick add goal input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder={lang === 'bg' ? 'Име (напр. Ваканция)' : 'Goal name e.g. Vacation'}
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-medium"
              />
              <input
                type="number"
                placeholder={lang === 'bg' ? 'Цел (Опционално)' : 'Target Total (Optional)'}
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-bold text-teal-400"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={lang === 'bg' ? 'Месечна (Опционално)' : 'Monthly (Optional)'}
                  value={newGoalMonthly}
                  onChange={(e) => setNewGoalMonthly(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddQuickGoal}
                  className="px-3 py-2 bg-teal-500 text-zinc-950 font-bold text-xs rounded-xl whitespace-nowrap"
                >
                  + {t('add')}
                </button>
              </div>
            </div>

            {/* Goals List */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {goalsList.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-2.5 bg-zinc-800/60 rounded-xl text-xs">
                  <span className="font-semibold text-zinc-200">{g.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-teal-400">{g.targetAmount} {currency} ({g.monthlyTarget}/mo)</span>
                    <button
                      type="button"
                      onClick={() => setGoalsList(goalsList.filter(x => x.id !== g.id))}
                      className="text-zinc-500 hover:text-rose-400"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back')}</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <span>{t('next')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('finish')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
