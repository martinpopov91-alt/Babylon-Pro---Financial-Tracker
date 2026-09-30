import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Check,
  X,
  Clock,
  Sparkles,
  CalendarDays,
  CalendarRange,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { AppSettings, Language, PayPeriodInfo, PeriodMode, Transaction } from '../types';
import { getTranslation } from '../constants/translations';
import { calculatePayPeriodDates, getPayPeriodPresetOptions, getCalendarMonthPresetOptions } from '../utils/calculations';

interface PayPeriodSelectorProps {
  settings: AppSettings;
  transactions?: Transaction[];
  lang: Language;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  compact?: boolean;
}

export const PayPeriodSelector: React.FC<PayPeriodSelectorProps> = ({
  settings,
  transactions = [],
  lang,
  onUpdateSettings,
  compact = false
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const periodMode: PeriodMode = settings.periodMode || (settings.customStartDate && settings.customEndDate ? 'custom' : 'payday');
  const periodOffset: number = settings.periodOffset || 0;
  const startDay: number = settings.startDay || 1;

  const [activeTab, setActiveTab] = useState<PeriodMode>(periodMode);
  const [tempStartDay, setTempStartDay] = useState<number>(startDay);
  const [customStart, setCustomStart] = useState<string>(settings.customStartDate || new Date().toISOString().slice(0, 10));
  const [customEnd, setCustomEnd] = useState<string>(settings.customEndDate || new Date().toISOString().slice(0, 10));

  // Calculate current active period info
  const activePeriodInfo: PayPeriodInfo = useMemo(() => {
    return calculatePayPeriodDates(
      startDay,
      settings.customStartDate,
      settings.customEndDate,
      periodMode,
      periodOffset,
      lang
    );
  }, [startDay, settings.customStartDate, settings.customEndDate, periodMode, periodOffset, lang]);

  // Generate preset options for Payday & Calendar
  const paydayOptions = useMemo(() => {
    return getPayPeriodPresetOptions(tempStartDay, lang, 12, 2);
  }, [tempStartDay, lang]);

  const calendarOptions = useMemo(() => {
    return getCalendarMonthPresetOptions(lang, 12, 2);
  }, [lang]);

  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // When popover opens, sync temp tab & values
  useEffect(() => {
    if (isOpen) {
      setActiveTab(periodMode);
      setTempStartDay(startDay);
      if (settings.customStartDate) setCustomStart(settings.customStartDate);
      if (settings.customEndDate) setCustomEnd(settings.customEndDate);
    }
  }, [isOpen, periodMode, startDay, settings.customStartDate, settings.customEndDate]);

  // Quick arrow navigation (Previous / Next)
  const handleStepPrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (periodMode === 'custom') {
      // Switch to payday mode with -1 offset
      onUpdateSettings({
        periodMode: 'payday',
        periodOffset: -1,
        customStartDate: undefined,
        customEndDate: undefined
      });
    } else {
      onUpdateSettings({
        periodOffset: periodOffset - 1
      });
    }
  };

  const handleStepNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (periodMode === 'custom') {
      // Switch to payday mode with +1 offset
      onUpdateSettings({
        periodMode: 'payday',
        periodOffset: 1,
        customStartDate: undefined,
        customEndDate: undefined
      });
    } else {
      onUpdateSettings({
        periodOffset: periodOffset + 1
      });
    }
  };

  const handleResetToCurrent = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onUpdateSettings({
      periodMode: 'payday',
      periodOffset: 0,
      customStartDate: undefined,
      customEndDate: undefined
    });
  };

  const handleSelectPaydayPeriod = (offset: number) => {
    onUpdateSettings({
      periodMode: 'payday',
      periodOffset: offset,
      startDay: tempStartDay,
      customStartDate: undefined,
      customEndDate: undefined
    });
    setIsOpen(false);
  };

  const handleSelectCalendarMonth = (offset: number) => {
    onUpdateSettings({
      periodMode: 'calendar',
      periodOffset: offset,
      customStartDate: undefined,
      customEndDate: undefined
    });
    setIsOpen(false);
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStart || !customEnd) return;
    onUpdateSettings({
      periodMode: 'custom',
      periodOffset: 0,
      customStartDate: customStart,
      customEndDate: customEnd
    });
    setIsOpen(false);
  };

  const handleApplyQuickPreset = (preset: 'last30' | 'last90' | 'ytd' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const now = new Date();
    let s = new Date();
    let e = new Date();

    if (preset === 'last30') {
      s.setDate(now.getDate() - 30);
    } else if (preset === 'last90') {
      s.setDate(now.getDate() - 90);
    } else if (preset === 'ytd') {
      s = new Date(now.getFullYear(), 0, 1);
    } else if (preset === 'thisYear') {
      s = new Date(now.getFullYear(), 0, 1);
      e = new Date(now.getFullYear(), 11, 31);
    } else if (preset === 'thisMonth') {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (preset === 'lastMonth') {
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const sStr = s.toISOString().slice(0, 10);
    const eStr = e.toISOString().slice(0, 10);
    setCustomStart(sStr);
    setCustomEnd(eStr);

    onUpdateSettings({
      periodMode: 'custom',
      periodOffset: 0,
      customStartDate: sStr,
      customEndDate: eStr
    });
    setIsOpen(false);
  };

  // Helper to count transactions in a given period
  const getTxCountInPeriod = (startDate: Date, endDate: Date) => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d >= startDate && d <= endDate;
    }).length;
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Bar */}
      <div
        id="pay-period-control-bar"
        className="flex items-center gap-1 bg-slate-100 dark:bg-[#1A1E26] border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl p-1 shadow-sm transition-all text-xs"
      >
        {/* Previous Period Button */}
        <button
          id="prev-period-btn"
          onClick={handleStepPrevious}
          title={t('previousPeriod')}
          className="p-1 sm:p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Main Interactive Period Display */}
        <button
          id="open-period-selector-btn"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2.5 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer group min-w-0"
        >
          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
          
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-[11px] sm:text-xs truncate max-w-[100px] min-[360px]:max-w-[130px] sm:max-w-none">
              {activePeriodInfo.label}
            </span>

            {/* Status indicator badge */}
            {activePeriodInfo.isCurrent ? (
              <>
                <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse flex-shrink-0" title={`${activePeriodInfo.daysRemaining} ${t('daysLeft')}`} />
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-black/5 dark:bg-emerald-500/15 text-black dark:text-emerald-300 border border-black/15 dark:border-emerald-500/30 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-emerald-400 animate-pulse" />
                  <span className="text-black dark:text-emerald-300">{activePeriodInfo.daysRemaining} {t('daysLeft')}</span>
                </span>
              </>
            ) : activePeriodInfo.isPast ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30 whitespace-nowrap">
                <span>{t('pastPeriod')}</span>
              </span>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.2 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/20 dark:border-teal-500/30 whitespace-nowrap">
                <span>{t('futurePeriod')}</span>
              </span>
            )}
          </div>

          <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Next Period Button */}
        <button
          id="next-period-btn"
          onClick={handleStepNext}
          title={t('nextPeriod')}
          className="p-1 sm:p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Quick Jump to Current Period Button (if not in current) */}
        {(!activePeriodInfo.isCurrent || periodMode === 'custom') && (
          <button
            id="jump-to-current-btn"
            onClick={handleResetToCurrent}
            title={t('jumpToCurrent')}
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 hover:bg-emerald-100 dark:hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-[11px] font-bold transition-all cursor-pointer ml-0.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('today')}</span>
          </button>
        )}
      </div>

      {/* Period Selector Popover Modal */}
      {isOpen && (
        <div
          id="pay-period-popover"
          className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-[300px] sm:w-[420px] max-w-[95vw] bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-4 sm:p-5 z-50 animate-fadeIn text-slate-800 dark:text-slate-100 space-y-4 max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-50 dark:bg-emerald-500/10 text-teal-600 dark:text-emerald-400 border border-teal-200 dark:border-emerald-500/20">
                <CalendarRange className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white">
                {t('selectPayPeriod')}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-[#13161C] rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('payday')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'payday'
                  ? 'bg-teal-600 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t('paydayCycle')}</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-teal-600 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('calendarMonth')}</span>
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-teal-600 dark:bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t('customRange')}</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[340px]">
            {/* TAB 1: Payday Cycle List */}
            {activeTab === 'payday' && (
              <div className="space-y-3">
                {/* Payday startDay adjustment bar */}
                <div className="p-3 bg-slate-50 dark:bg-[#13161C] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{t('paydayDay')}: </span>
                    <span className="font-bold text-teal-600 dark:text-emerald-400">
                      {tempStartDay === 1 ? (lang === 'bg' ? '1-во число (Месечен)' : '1st of month') : `${tempStartDay}-то число`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={tempStartDay}
                      onChange={(e) => setTempStartDay(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-14 px-2 py-1 bg-white dark:bg-[#1A1E26] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center font-bold text-teal-600 dark:text-emerald-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1">
                    {lang === 'bg' ? 'Изберете бюджетен период' : 'Choose Payday Period'}
                  </p>

                  {paydayOptions.map((opt) => {
                    const isSelected = periodMode === 'payday' && periodOffset === opt.offset;
                    const txCount = getTxCountInPeriod(opt.startDate, opt.endDate);

                    return (
                      <button
                        key={`payday-${opt.offset}`}
                        onClick={() => handleSelectPaydayPeriod(opt.offset)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-teal-50 dark:bg-emerald-500/15 border-teal-500 dark:border-emerald-500/40 text-teal-700 dark:text-emerald-300 font-bold'
                            : 'bg-white dark:bg-[#1A1E26] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#20252F] hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{opt.label}</span>
                            {opt.isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-teal-500/20 dark:bg-emerald-500/20 text-teal-700 dark:text-emerald-300 text-[10px] font-bold">
                                {t('currentPeriod')}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {opt.subLabel} {txCount > 0 && `• ${txCount} ${lang === 'bg' ? 'транзакции' : 'transactions'}`}
                          </p>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-teal-600 dark:text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Calendar Month List */}
            {activeTab === 'calendar' && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1">
                  {lang === 'bg' ? 'Изберете календарен месец' : 'Choose Calendar Month'}
                </p>

                {calendarOptions.map((opt) => {
                  const isSelected = periodMode === 'calendar' && periodOffset === opt.offset;
                  const txCount = getTxCountInPeriod(opt.startDate, opt.endDate);

                  return (
                    <button
                      key={`cal-${opt.offset}`}
                      onClick={() => handleSelectCalendarMonth(opt.offset)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-emerald-500/15 border-teal-500 dark:border-emerald-500/40 text-teal-700 dark:text-emerald-300 font-bold'
                          : 'bg-white dark:bg-[#1A1E26] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#20252F] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{opt.label}</span>
                          {opt.isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-teal-500/20 dark:bg-emerald-500/20 text-teal-700 dark:text-emerald-300 text-[10px] font-bold">
                              {t('currentPeriod')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {opt.subLabel} {txCount > 0 && `• ${txCount} ${lang === 'bg' ? 'транзакции' : 'transactions'}`}
                        </p>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-teal-600 dark:text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 3: Custom Range Picker & Presets */}
            {activeTab === 'custom' && (
              <form onSubmit={handleApplyCustomRange} className="space-y-4">
                {/* Date Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {t('startDate')}
                    </label>
                    <input
                      type="date"
                      required
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E26] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      {t('endDate')}
                    </label>
                    <input
                      type="date"
                      required
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#1A1E26] border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {t('quickPresets')}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPreset('thisMonth')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#1A1E26] hover:bg-slate-200 dark:hover:bg-[#20252F] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 text-left transition-colors cursor-pointer"
                    >
                      {lang === 'bg' ? 'Този месец' : 'This Month'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPreset('lastMonth')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#1A1E26] hover:bg-slate-200 dark:hover:bg-[#20252F] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 text-left transition-colors cursor-pointer"
                    >
                      {lang === 'bg' ? 'Миналия месец' : 'Last Month'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPreset('last30')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#1A1E26] hover:bg-slate-200 dark:hover:bg-[#20252F] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 text-left transition-colors cursor-pointer"
                    >
                      {t('last30Days')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPreset('last90')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#1A1E26] hover:bg-slate-200 dark:hover:bg-[#20252F] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 text-left transition-colors cursor-pointer"
                    >
                      {t('last90Days')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPreset('ytd')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#1A1E26] hover:bg-slate-200 dark:hover:bg-[#20252F] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 text-left transition-colors cursor-pointer"
                    >
                      {t('yearToDate')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickPreset('thisYear')}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-[#1A1E26] hover:bg-slate-200 dark:hover:bg-[#20252F] border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 text-left transition-colors cursor-pointer"
                    >
                      {t('fullYear')}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <span>{t('applyDates')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
