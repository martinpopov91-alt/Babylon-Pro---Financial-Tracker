import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Transaction, Language, CategoryType } from '../types';
import { formatCurrency } from '../utils/calculations';

interface CalendarWidgetProps {
  transactions: Transaction[];
  currency: string;
  lang: Language;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({ transactions, currency, lang }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust so Monday is first day of week (1), Sunday is 0 -> 7
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

  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthNamesBg = ["Януари", "Февруари", "Март", "Април", "Май", "Юни", "Юли", "Август", "Септември", "Октомври", "Ноември", "Декември"];
  const dayNamesEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayNamesBg = ["Пон", "Вто", "Сря", "Чет", "Пет", "Съб", "Нед"];

  const monthNames = lang === 'bg' ? monthNamesBg : monthNamesEn;
  const dayNames = lang === 'bg' ? dayNamesBg : dayNamesEn;

  // Group transactions by date
  const dailyTotals = useMemo(() => {
    const totals: Record<number, { income: number; expense: number }> = {};
    
    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        const day = tDate.getDate();
        if (!totals[day]) totals[day] = { income: 0, expense: 0 };
        
        if (t.type === 'income') {
          totals[day].income += t.amount;
        } else if (['needs', 'wants', 'bills', 'debt'].includes(t.type)) {
          totals[day].expense += t.amount;
        }
      }
    });
    
    return totals;
  }, [transactions, currentMonth, currentYear]);

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-500" />
          <span>{lang === 'bg' ? 'Месечен Календар' : 'Monthly Calendar'}</span>
        </h3>
        <div className="flex items-center gap-3">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm w-28 text-center text-slate-700 dark:text-zinc-200">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button onClick={handleNextMonth} className="p-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-[10px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {daysList.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="min-h-16 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl" />;
          }

          const isToday = isCurrentMonth && day === today.getDate();
          const totals = dailyTotals[day];
          
          return (
            <div 
              key={day} 
              className={`min-h-16 sm:min-h-20 p-1 sm:p-2 rounded-xl flex flex-col border transition-all ${
                isToday 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 shadow-sm' 
                  : 'bg-white dark:bg-zinc-950 border-slate-100 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700'
              }`}
            >
              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                isToday 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-600 dark:text-zinc-400'
              }`}>
                {day}
              </span>
              
              <div className="flex-1 flex flex-col justify-end gap-0.5">
                {totals?.income > 0 && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate text-right">
                    +{totals.income >= 1000 ? `${(totals.income/1000).toFixed(1)}k` : totals.income}
                  </div>
                )}
                {totals?.expense > 0 && (
                  <div className="text-[9px] sm:text-[10px] font-bold text-red-600 dark:text-red-400 truncate text-right">
                    -{totals.expense >= 1000 ? `${(totals.expense/1000).toFixed(1)}k` : totals.expense}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
