import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Calendar, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { Transaction, Language } from '../types';
import { formatCurrency } from '../utils/calculations';

interface SidebarCalendarProps {
  transactions: Transaction[];
  currency: string;
  lang: Language;
  onSelectDate?: (dateStr: string) => void;
  onOpenQuickAddWithDate?: (dateStr: string) => void;
}

export const SidebarCalendar: React.FC<SidebarCalendarProps> = ({
  transactions,
  currency,
  lang,
  onSelectDate,
  onOpenQuickAddWithDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDayNumber(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDayNumber(null);
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayNumber(new Date().getDate());
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  // Month and weekday names
  const monthNamesEn = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const monthNamesBg = [
    "Яну", "Фев", "Мар", "Апр", "Май", "Юни", 
    "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"
  ];
  const dayHeadersEn = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const dayHeadersBg = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  const monthNames = lang === 'bg' ? monthNamesBg : monthNamesEn;
  const dayHeaders = lang === 'bg' ? dayHeadersBg : dayHeadersEn;

  // Group transactions for the current month
  const { dayMetrics, highSpendingThreshold } = useMemo(() => {
    const map: Record<number, { income: number; expense: number; txs: Transaction[] }> = {};
    let totalExpenseSum = 0;
    let expenseDayCount = 0;

    transactions.forEach(t => {
      if (!t.date) return;
      // Handle "YYYY-MM-DD"
      const parts = t.date.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);

        if (y === currentYear && m === currentMonth) {
          if (!map[d]) {
            map[d] = { income: 0, expense: 0, txs: [] };
          }
          map[d].txs.push(t);
          if (t.type === 'income') {
            map[d].income += t.amount;
          } else if (['needs', 'wants', 'bills', 'debt'].includes(t.type)) {
            map[d].expense += t.amount;
            totalExpenseSum += t.amount;
            expenseDayCount++;
          }
        }
      }
    });

    // High spending threshold: average daily expense across active spending days, minimum 20 currency units
    const avgExpense = expenseDayCount > 0 ? totalExpenseSum / expenseDayCount : 0;
    const threshold = Math.max(avgExpense * 0.75, 25);

    return { dayMetrics: map, highSpendingThreshold: threshold };
  }, [transactions, currentMonth, currentYear]);

  // Construct calendar grid items: null for leading empty cells, then day numbers
  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  }, [firstDayOfMonth, daysInMonth]);

  const selectedDayData = selectedDayNumber ? dayMetrics[selectedDayNumber] : null;
  const selectedDateFormatted = selectedDayNumber
    ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDayNumber).padStart(2, '0')}`
    : null;

  return (
    <div className="bg-[#1f212f] dark:bg-[#111318] rounded-xl p-2.5 text-slate-200 border border-white/5 dark:border-slate-800 shadow-inner relative select-none">
      {/* Header: Month/Year navigation and jump today */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-[11px] font-bold font-display text-white tracking-wide">
            {monthNames[currentMonth]} {currentYear}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isCurrentMonth && (
            <button
              onClick={handleJumpToToday}
              title={lang === 'bg' ? 'Към днес' : 'Jump to Today'}
              className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-teal-300 transition-colors cursor-pointer text-[10px]"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
          <button
            onClick={handlePrevMonth}
            title={lang === 'bg' ? 'Предишен месец' : 'Previous Month'}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextMonth}
            title={lang === 'bg' ? 'Следващ месец' : 'Next Month'}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-semibold text-slate-400 mb-1">
        {dayHeaders.map((dh, idx) => (
          <div key={idx} className={idx === 0 || idx === 6 ? 'text-teal-400/80' : ''}>
            {dh}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-6.5 w-full" />;
          }

          const isToday = isCurrentMonth && day === today.getDate();
          const isSelected = selectedDayNumber === day;
          const metric = dayMetrics[day];

          const hasIncome = metric && metric.income > 0;
          const hasSpending = metric && metric.expense > 0;
          const isHighSpending = hasSpending && (metric.expense >= highSpendingThreshold || metric.expense >= 50);

          return (
            <button
              key={`day-${day}`}
              type="button"
              onClick={() => setSelectedDayNumber(selectedDayNumber === day ? null : day)}
              title={
                metric
                  ? `${day} ${monthNames[currentMonth]}: ${hasIncome ? `+${formatCurrency(metric.income, currency)} ` : ''}${hasSpending ? `-${formatCurrency(metric.expense, currency)}` : ''}`
                  : `${day} ${monthNames[currentMonth]}`
              }
              className={`h-6.5 w-full rounded-md flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                isSelected
                  ? 'bg-teal-500 text-white font-bold shadow-xs scale-105 z-10'
                  : isToday
                  ? 'bg-white/20 text-white font-bold ring-1 ring-teal-400/70'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-[10px] leading-none">{day}</span>

              {/* Visual Indicator Dots */}
              {(hasIncome || hasSpending) && (
                <div className="flex items-center justify-center gap-0.5 mt-0.5 h-1">
                  {/* Green dot: Income */}
                  {hasIncome && (
                    <span
                      className={`w-1 h-1 rounded-full bg-emerald-400 ${
                        isSelected ? 'ring-1 ring-white' : ''
                      }`}
                      title={lang === 'bg' ? 'Приход' : 'Income logged'}
                    />
                  )}
                  {/* Red dot: High Spending (or rose dot for spending) */}
                  {hasSpending && (
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isHighSpending ? 'bg-rose-500 animate-pulse' : 'bg-rose-400'
                      } ${isSelected ? 'ring-1 ring-white' : ''}`}
                      title={lang === 'bg' ? 'Висок разход' : 'High spending'}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Visual Legend */}
      <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2 pt-1.5 border-t border-white/10 dark:border-slate-800">
        <div className="flex items-center gap-1.5" title="Days with recorded income">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shadow-xs" />
          <span className="text-[9px] text-slate-300">{lang === 'bg' ? 'Приход' : 'Income'}</span>
        </div>
        <div className="flex items-center gap-1.5" title="Days with heavy expenditure">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block shadow-xs" />
          <span className="text-[9px] text-slate-300">{lang === 'bg' ? 'Разход' : 'High Spending'}</span>
        </div>
      </div>

      {/* Selected Day Popover Card */}
      {selectedDayNumber !== null && (
        <div className="mt-2.5 p-2.5 bg-[#171923] dark:bg-[#141720] rounded-xl border border-teal-500/30 text-xs space-y-2 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-white text-[11px]">
              {selectedDayNumber} {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={() => setSelectedDayNumber(null)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {selectedDayData && (selectedDayData.income > 0 || selectedDayData.expense > 0) ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                {selectedDayData.income > 0 && (
                  <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                    <ArrowDownLeft className="w-3 h-3" />
                    +{formatCurrency(selectedDayData.income, currency)}
                  </span>
                )}
                {selectedDayData.expense > 0 && (
                  <span className="text-rose-400 font-bold flex items-center gap-0.5 ml-auto">
                    <ArrowUpRight className="w-3 h-3" />
                    -{formatCurrency(selectedDayData.expense, currency)}
                  </span>
                )}
              </div>

              {/* Transactions on this day */}
              <div className="max-h-24 overflow-y-auto divide-y divide-white/5 pr-1 text-[10px]">
                {selectedDayData.txs.map(tx => (
                  <div key={tx.id} className="py-1 flex items-center justify-between text-slate-300">
                    <span className="truncate max-w-[120px] text-slate-200">{tx.note || tx.category}</span>
                    <span className={`font-mono font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {onSelectDate && selectedDateFormatted && (
                <button
                  type="button"
                  onClick={() => onSelectDate(selectedDateFormatted)}
                  className="w-full mt-1 py-1 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[10px] font-semibold transition-colors cursor-pointer text-center"
                >
                  {lang === 'bg' ? 'Филтрирай в Дневник →' : 'Filter in Ledger →'}
                </button>
              )}
            </div>
          ) : (
            <div className="py-1 text-center text-slate-400 text-[10px]">
              <p>{lang === 'bg' ? 'Няма транзакции за този ден.' : 'No transactions on this date.'}</p>
              {onOpenQuickAddWithDate && selectedDateFormatted && (
                <button
                  type="button"
                  onClick={() => onOpenQuickAddWithDate(selectedDateFormatted)}
                  className="mt-1.5 px-2 py-0.5 rounded bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  + {lang === 'bg' ? 'Добави запис' : 'Log transaction'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
