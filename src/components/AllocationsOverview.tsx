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
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{t('babylonHeadline')}</span>
          </h3>
          <p className="text-xs text-zinc-400">
            {t('babylonSub')}
          </p>
        </div>
        <button
          onClick={onOpenSettings}
          className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          {t('edit')} %
        </button>
      </div>

      {/* Grid of 5 Allocations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Tithe Card */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Heart className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400">
              {tithePercent}%
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">{t('titheShort')}</p>
            <p className="text-lg font-bold text-zinc-100 font-display">
              {formatCurrency(titheAmount, currency)}
            </p>
          </div>
          <p className="text-[11px] text-zinc-500 line-clamp-1">
            {t('titheDesc')}
          </p>
        </div>

        {/* 2. Wealth Fund Card */}
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/30 transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
              {wealthPercent}%
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">{t('wealthShort')}</p>
            <p className="text-lg font-bold text-zinc-100 font-display">
              {formatCurrency(wealthAmount, currency)}
            </p>
          </div>
          <p className="text-[11px] text-zinc-500 line-clamp-1">
            {t('wealthDesc')}
          </p>
        </div>

        {/* 3. Goal Vaults Card */}
        <div 
          onClick={() => onSelectTab?.('vaults')}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-teal-500/40 transition-all space-y-2 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <PiggyBank className="w-4 h-4" />
            </span>
            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-teal-400 transition-colors" />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">{t('savingsAllocated')}</p>
            <p className="text-lg font-bold text-zinc-100 font-display">
              {formatCurrency(totalSavingsAllocated, currency)}
            </p>
          </div>
          <p className="text-[11px] text-teal-400/80 font-medium">
            {t('vaults')} &rarr;
          </p>
        </div>

        {/* 4. Fixed Bills Card */}
        <div 
          onClick={() => onSelectTab?.('bills')}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-blue-500/40 transition-all space-y-2 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Receipt className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-semibold text-zinc-400">
              {formatCurrency(billsPaidTotal, currency)} {t('paid')}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">{t('fixedBills')}</p>
            <p className="text-lg font-bold text-zinc-100 font-display">
              {formatCurrency(totalBills, currency)}
            </p>
          </div>
          <p className="text-[11px] text-blue-400/80 font-medium">
            {t('billsAndDebt')} &rarr;
          </p>
        </div>

        {/* 5. Debt Obligations Card */}
        <div 
          onClick={() => onSelectTab?.('bills')}
          className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-rose-500/40 transition-all space-y-2 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-[10px] font-semibold text-zinc-400">
              {formatCurrency(debtsPaidTotal, currency)} {t('paid')}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-400">{t('debtObligations')}</p>
            <p className="text-lg font-bold text-rose-400 font-display">
              {formatCurrency(totalDebts, currency)}
            </p>
          </div>
          <p className="text-[11px] text-rose-400/80 font-medium">
            {t('billsAndDebt')} &rarr;
          </p>
        </div>
      </div>
    </div>
  );
};
