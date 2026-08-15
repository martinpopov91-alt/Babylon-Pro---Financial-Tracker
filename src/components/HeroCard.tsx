import React, { useMemo } from 'react';
import { 
  PlusCircle, 
  Wallet, 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  TrendingDown,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { FinancialSummary, Language, AppSettings, PayPeriodInfo } from '../types';
import { getTranslation } from '../constants/translations';
import { formatCurrency, calculatePayPeriodDates } from '../utils/calculations';

interface HeroCardProps {
  summary: FinancialSummary;
  currency: string;
  lang: Language;
  settings?: AppSettings;
  onOpenQuickAdd: () => void;
  onUpdateSettings?: (newSettings: Partial<AppSettings>) => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  summary,
  currency,
  lang,
  settings,
  onOpenQuickAdd,
  onUpdateSettings
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const {
    lifeMoneyTotal,
    totalVariableExpenses,
    remainingLifeMoney,
    daysRemaining,
    dailyBudget,
    weeklyBudget,
    spentPercentage
  } = summary;

  const periodInfo: PayPeriodInfo | null = useMemo(() => {
    if (!settings) return null;
    return calculatePayPeriodDates(
      settings.startDay,
      settings.customStartDate,
      settings.customEndDate,
      settings.periodMode || (settings.customStartDate && settings.customEndDate ? 'custom' : 'payday'),
      settings.periodOffset || 0,
      lang
    );
  }, [settings, lang]);

  // Determine status color based on spent percentage
  let statusColor = 'from-emerald-500 to-teal-600';
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let statusText = t('paceSafe');
  let barColor = 'bg-emerald-500';

  if (spentPercentage >= 85 || remainingLifeMoney <= 0) {
    statusColor = 'from-rose-500 to-red-600';
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    statusText = t('paceAlert');
    barColor = 'bg-rose-500';
  } else if (spentPercentage >= 60) {
    statusColor = 'from-amber-500 to-yellow-600';
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    statusText = t('paceCaution');
    barColor = 'bg-amber-500';
  }

  const remainingPercent = Math.max(0, 100 - spentPercentage);

  return (
    <div id="hero-financial-card" className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 p-6 sm:p-8 shadow-xl space-y-5">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Non-current period banner (if viewing past or future) */}
      {periodInfo && !periodInfo.isCurrent && (
        <div className="relative z-10 flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span>
              {lang === 'bg' ? 'Преглеждате данни за:' : 'Viewing data for:'}{' '}
              <strong className="text-zinc-100 font-bold">{periodInfo.label}</strong> ({periodInfo.isPast ? t('pastPeriod') : t('futurePeriod')})
            </span>
          </div>

          {onUpdateSettings && (
            <button
              onClick={() => onUpdateSettings({ periodMode: 'payday', periodOffset: 0, customStartDate: undefined, customEndDate: undefined })}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('jumpToCurrent')}</span>
            </button>
          )}
        </div>
      )}

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Column: Disposable Life Money Display */}
        <div className="space-y-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">
                {t('lifeMoneyTotal')}
              </h2>
              <p className="text-xs text-zinc-500 hidden sm:block">
                {t('lifeMoneyDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-100 font-display">
              {formatCurrency(remainingLifeMoney, currency)}
            </span>
            <span className="text-sm text-zinc-400 font-medium">
              / {formatCurrency(lifeMoneyTotal, currency)}
            </span>
          </div>

          {/* Progress Visual Bar */}
          <div className="space-y-2 pt-1 max-w-xl">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-400 flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-zinc-500" />
                {t('spentSoFar')}: {formatCurrency(totalVariableExpenses, currency)}
              </span>
              <span className="text-zinc-300">
                {remainingPercent.toFixed(0)}% {lang === 'bg' ? 'остават' : 'remaining'}
              </span>
            </div>
            
            <div className="w-full h-3 rounded-full bg-zinc-800 p-0.5 border border-zinc-700/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.min(100, Math.max(0, spentPercentage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Pace Pills & Quick Add Action */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-zinc-800 pt-5 lg:pt-0 lg:pl-8">
          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${badgeColor}`}>
            <AlertCircle className="w-4 h-4" />
            <span>{statusText}</span>
          </div>

          {/* Daily & Weekly Budget Metrics Pill */}
          <div className="grid grid-cols-3 gap-3 bg-zinc-800/80 border border-zinc-700/60 rounded-xl p-3 text-center sm:text-left w-full lg:w-auto">
            <div className="space-y-0.5 px-2">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-medium text-zinc-400">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>{t('dailyBudget')}</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-zinc-100 font-display">
                {formatCurrency(dailyBudget, currency)}
              </p>
            </div>

            <div className="space-y-0.5 px-2 border-x border-zinc-700/60">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-medium text-zinc-400">
                <TrendingUp className="w-3 h-3 text-indigo-400" />
                <span>{t('weeklyBudget')}</span>
              </div>
              <p className="text-sm sm:text-base font-bold text-zinc-100 font-display">
                {formatCurrency(weeklyBudget, currency)}
              </p>
            </div>

            <div className="space-y-0.5 px-2">
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[11px] font-medium text-zinc-400">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>{periodInfo?.isPast ? (lang === 'bg' ? 'Приключил' : 'Closed') : `${daysRemaining} ${t('daysLeft')}`}</span>
              </div>
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide truncate max-w-[90px]">
                {periodInfo?.label || t('payPeriod')}
              </p>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            id="quick-add-transaction-btn"
            onClick={onOpenQuickAdd}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>{t('quickAdd')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

