import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RotateCcw,
  X,
  Wallet
} from 'lucide-react';
import { Transaction, Language } from '../types';
import { formatCurrency } from '../utils/calculations';

interface CalendarWidgetProps {
  transactions: Transaction[];
  currency: string;
  lang: Language;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ transactions, currency, lang }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    setSelectedDay(null);
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date().getDate());
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is first day of week (1), Sunday is 0 -> 6
  const startingEmptyCells = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const daysList = useMemo(() => {
    const list = [];
    for (let i = 0; i < startingEmptyCells; i++) {
      list.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      list.push(i);
    }
    return list;
  }, [startingEmptyCells, daysInMonth]);

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  const monthNamesBg = [
    "Януари", "Февруари", "Март", "Април", "Май", "Юни", 
    "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"
  ];
  const dayNamesEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNamesBg = ["Пон", "Вто", "Сря", "Чет", "Пет", "Съб", "Нед"];

  const monthNames = lang === 'bg' ? monthNamesBg : monthNamesEn;
  const dayNames = lang === 'bg' ? dayNamesBg : dayNamesEn;

  // Group transactions by date & calculate monthly totals
  const { dailyTotals, dailyTransactions, monthReceived, monthSpent } = useMemo(() => {
    const totals: Record<number, { income: number; expense: number }> = {};
    const txByDay: Record<number, Transaction[]> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      if (!t.date) return;
      const tDate = new Date(t.date);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        const day = tDate.getDate();
        if (!totals[day]) totals[day] = { income: 0, expense: 0 };
        if (!txByDay[day]) txByDay[day] = [];

        txByDay[day].push(t);

        if (t.type === 'income') {
          totals[day].income += t.amount;
          totalIncome += t.amount;
        } else if (['needs', 'wants', 'bills', 'debt'].includes(t.type)) {
          totals[day].expense += t.amount;
          totalExpense += t.amount;
        }
      }
    });

    return { 
      dailyTotals: totals, 
      dailyTransactions: txByDay, 
      monthReceived: totalIncome, 
      monthSpent: totalExpense 
    };
  }, [transactions, currentMonth, currentYear]);

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  const selectedDayTransactions = selectedDay ? dailyTransactions[selectedDay] || [] : [];
  const selectedDayTotals = selectedDay ? dailyTotals[selectedDay] || { income: 0, expense: 0 } : null;

  return (
    <div id="calendar-widget" className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-3xl bg-[#F7B352]/15 text-[#174E5B] border border-[#F7B352]/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 font-display">
              {lang === 'bg' ? 'Календар на транзакциите' : 'Transaction Calendar'}
            </h3>
            <p className="text-xs text-slate-500">
              {lang === 'bg' 
                ? 'Преглед на получените и изхарчени суми по дни за месеца' 
                : 'Daily breakdown of amounts received and spent this month'}
            </p>
          </div>
        </div>

        {/* Month Navigation & Today Button */}
        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <button
              onClick={handleJumpToToday}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F7B352]" />
              <span>{lang === 'bg' ? 'Днес' : 'Today'}</span>
            </button>
          )}

          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200">
            <button 
              onClick={handlePrevMonth} 
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title={lang === 'bg' ? 'Предишен месец' : 'Previous month'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-xs sm:text-sm w-32 text-center text-slate-700">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={handleNextMonth} 
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title={lang === 'bg' ? 'Следващ месец' : 'Next month'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Month Metrics Summary Pill Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-3xl">
        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#8DA37C]/15 text-[#9BB18A]">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">
                {lang === 'bg' ? 'Получени (Приходи)' : 'Total Received'}
              </p>
              <p className="text-sm font-black text-[#9BB18A] font-display">
                +{formatCurrency(monthReceived, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#E07A6C]/15 text-[#E07A6C]">
              <ArrowUpRight className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">
                {lang === 'bg' ? 'Изхарчени (Разходи)' : 'Total Spent'}
              </p>
              <p className="text-sm font-black text-[#E07A6C] font-display">
                -{formatCurrency(monthSpent, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#F7B352]/15 text-[#174E5B]">
              <Wallet className="w-4 h-4" />
            </span>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500">
                {lang === 'bg' ? 'Нетен Паричен Поток' : 'Net Cash Flow'}
              </p>
              <p className={`text-sm font-black font-display ${
                monthReceived - monthSpent >= 0 ? 'text-[#9BB18A]' : 'text-[#E07A6C]'
              }`}>
                {monthReceived - monthSpent >= 0 ? '+' : ''}{formatCurrency(monthReceived - monthSpent, currency)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {dayNames.map((day, idx) => (
          <div 
            key={day} 
            className={`text-center text-[11px] font-bold uppercase tracking-wider py-1 ${
              idx >= 5 ? 'text-[#174E5B]' : 'text-slate-500'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {daysList.map((day, index) => {
          if (day === null) {
            return (
              <div 
                key={`empty-${index}`} 
                className="min-h-16 sm:min-h-20 bg-slate-100/30 rounded-3xl border border-transparent" 
              />
            );
          }

          const isToday = isCurrentMonth && day === today.getDate();
          const isSelected = selectedDay === day;
          const totals = dailyTotals[day];
          const hasTransactions = totals && (totals.income > 0 || totals.expense > 0);

          return (
            <button
              type="button"
              key={day}
              onClick={() => setSelectedDay(selectedDay === day ? null : day)}
              className={`min-h-16 sm:min-h-20 p-1.5 sm:p-2.5 rounded-3xl flex flex-col justify-between border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[#F7B352] bg-[#F7B352]/15 border-[#F7B352]'
                  : isToday
                  ? 'bg-[#3F443B]/40 border-[#3F443B]'
                  : hasTransactions
                  ? 'bg-slate-50 border-slate-200 hover:border-[#F7B352]/60 hover:shadow-xs'
                  : 'bg-white/50 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-xl transition-colors ${
                  isToday 
                    ? 'bg-[#3F443B] text-slate-800 shadow-xs' 
                    : isSelected
                    ? 'bg-[#F7B352] text-slate-900 font-black shadow-xs'
                    : 'text-slate-600'
                }`}>
                  {day}
                </span>

                {hasTransactions && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F7B352]" />
                )}
              </div>

              {/* Day totals */}
              <div className="w-full flex flex-col justify-end gap-0.5 mt-1">
                {totals?.income > 0 && (
                  <div className="text-[10px] sm:text-[11px] font-extrabold text-[#9BB18A] truncate text-right">
                    +{totals.income >= 1000 ? `${(totals.income / 1000).toFixed(1)}k` : Math.round(totals.income)}
                  </div>
                )}
                {totals?.expense > 0 && (
                  <div className="text-[10px] sm:text-[11px] font-extrabold text-[#E07A6C] truncate text-right">
                    -{totals.expense >= 1000 ? `${(totals.expense / 1000).toFixed(1)}k` : Math.round(totals.expense)}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Transaction Breakdown Drawer/Panel */}
      {selectedDay !== null && (
        <div className="p-4 sm:p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F7B352]" />
              <h4 className="font-bold text-sm text-slate-800">
                {lang === 'bg' 
                  ? `Транзакции на ${selectedDay} ${monthNames[currentMonth]} ${currentYear}`
                  : `Transactions on ${selectedDay} ${monthNames[currentMonth]} ${currentYear}`}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              {selectedDayTotals && (
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
                  {selectedDayTotals.income > 0 && (
                    <span className="text-[#9BB18A]">
                      +{formatCurrency(selectedDayTotals.income, currency)}
                    </span>
                  )}
                  {selectedDayTotals.expense > 0 && (
                    <span className="text-[#E07A6C]">
                      -{formatCurrency(selectedDayTotals.expense, currency)}
                    </span>
                  )}
                </div>
              )}
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {selectedDayTransactions.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              {lang === 'bg' ? 'Няма записани транзакции за този ден.' : 'No transactions recorded for this day.'}
            </p>
          ) : (
            <div className="divide-y divide-zinc-700/60 max-h-56 overflow-y-auto">
              {selectedDayTransactions.map(tx => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">{tx.description}</p>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {tx.category} • {tx.type}
                    </p>
                  </div>
                  <span className={`font-bold font-display text-sm ${
                    tx.type === 'income' 
                      ? 'text-[#9BB18A]' 
                      : 'text-[#E07A6C]'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
