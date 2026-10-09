import React from 'react';
import { 
  Heart, 
  Sparkles, 
  PiggyBank, 
  Receipt, 
  CreditCard, 
  ArrowUpRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { FinancialSummary, Language } from '../types';
import { getTranslation } from '../constants/translations';
import { formatCurrency } from '../utils/calculations';

interface AllocationsOverviewProps {
  summary: FinancialSummary;
  currency: string;
  lang: Language;
  tithePercent: number;
  wealthPercent: number;
  onOpenSettings: () => void;
  onSelectTab?: (tab: 'vaults' | 'bills') => void;
}

export const AllocationsOverview: React.FC<AllocationsOverviewProps> = ({
  summary,
  currency,
  lang,
  tithePercent,
  wealthPercent,
  onOpenSettings,
  onSelectTab
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const {
    baseSalary,
    extraIncome,
    totalIncome,
    titheAmount,
    wealthAmount,
    totalBills,
    totalDebts,
    totalSavingsAllocated,
    billsPaidTotal,
    debtsPaidTotal
  } = summary;

  return (
    <div id="allocations-overview" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#334155] dark:text-slate-300" />
            <span>{t('babylonHeadline')}</span>
          </h3>
          <p className="text-xs text-[#94A3B8]">
            {t('babylonSub')}
          </p>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-xs font-semibold text-[#334155] dark:text-slate-300 hover:text-[#0F172A] dark:hover:text-white transition-colors cursor-pointer"
        >
          {t('edit')} %
        </button>
      </div>

      {/* Grid of 5 Allocations */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Tithe Card */}
        <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#161B22] border border-[#E2E8F0] dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-2">
          <div className="flex items-center justify-between sm:w-full shrink-0">
            <span className="p-2 rounded-xl bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/20">
              <Heart className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/20">
              {tithePercent}%
            </span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center sm:block">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('titheShort')}</p>
            <p className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white font-display truncate">
              {formatCurrency(titheAmount, currency)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 hidden sm:block">
              {t('titheDesc')}
            </p>
          </div>
          <div className="sm:hidden shrink-0">
            <span className="inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-500/20">
              {tithePercent}%
            </span>
          </div>
        </div>

        {/* 2. Wealth Fund Card */}
        <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-2">
          <div className="flex items-center justify-between sm:w-full shrink-0">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {wealthPercent}%
            </span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center sm:block">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('wealthShort')}</p>
            <p className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white font-display truncate">
              {formatCurrency(wealthAmount, currency)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 hidden sm:block">
              {t('wealthDesc')}
            </p>
          </div>
          <div className="sm:hidden shrink-0">
            <span className="inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              {wealthPercent}%
            </span>
          </div>
        </div>

        {/* 3. Goal Vaults Card */}
        <div 
          onClick={() => onSelectTab?.('vaults')}
          className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-2"
        >
          <div className="flex items-center justify-between sm:w-full shrink-0">
            <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20">
              <PiggyBank className="w-4 h-4" />
            </span>
            <ArrowUpRight className="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center sm:block">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('savingsAllocated')}</p>
            <p className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white font-display truncate">
              {formatCurrency(totalSavingsAllocated, currency)}
            </p>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium hidden sm:block">
              {t('vaults')} &rarr;
            </p>
          </div>
          <div className="sm:hidden shrink-0 flex items-center justify-end pr-1">
            <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors" />
          </div>
        </div>

        {/* 4. Fixed Bills Card */}
        <div 
          onClick={() => onSelectTab?.('bills')}
          className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group shadow-sm flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-2"
        >
          <div className="flex items-center justify-between sm:w-full shrink-0">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
              <Receipt className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {formatCurrency(billsPaidTotal, currency)} {t('paid')}
            </span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center sm:block">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('fixedBills')}</p>
            <p className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white font-display truncate">
              {formatCurrency(totalBills, currency)}
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium hidden sm:block">
              {t('billsAndDebt')} &rarr;
            </p>
          </div>
          <div className="sm:hidden shrink-0 flex flex-col items-end">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{t('paid')}</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatCurrency(billsPaidTotal, currency)}</span>
          </div>
        </div>

        {/* 5. Debt Obligations Card */}
        <div 
          onClick={() => onSelectTab?.('bills')}
          className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all cursor-pointer group shadow-sm flex sm:flex-col items-center sm:items-stretch gap-3 sm:gap-2"
        >
          <div className="flex items-center justify-between sm:w-full shrink-0">
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-semibold text-slate-500 dark:text-slate-400">
              {formatCurrency(debtsPaidTotal, currency)} {t('paid')}
            </span>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center sm:block">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('debtObligations')}</p>
            <p className="text-sm sm:text-lg font-bold text-rose-600 dark:text-rose-400 font-display truncate">
              {formatCurrency(totalDebts, currency)}
            </p>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium hidden sm:block">
              {t('billsAndDebt')} &rarr;
            </p>
          </div>
          <div className="sm:hidden shrink-0 flex flex-col items-end">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{t('paid')}</span>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{formatCurrency(debtsPaidTotal, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
