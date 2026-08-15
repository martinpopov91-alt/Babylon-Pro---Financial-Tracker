import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  Filter,
  Calendar,
  Layers,
  ChevronDown,
  ChevronRight,
  Target,
  DollarSign,
  Tag,
  Receipt,
  Activity
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { AppState, Category, Transaction } from '../types';
import { formatCurrency, getCategoryName, calculatePayPeriodDates } from '../utils/calculations';
import { getTranslation } from '../constants/translations';
import * as Icons from 'lucide-react';

interface SpendingAnalyticsProps {
  appState: AppState;
}

type PeriodFilter = 'period' | 'thisMonth' | 'last30' | 'allTime';
type ViewLevel = 'main' | 'detailed';
type ExpenseTypeFilter = 'all' | 'needs' | 'wants' | 'savings';
type ChartType = 'pie' | 'bar';

const COLOR_PALETTE = [
  '#F97316', // Orange
  '#38BDF8', // Sky Blue
  '#FBBF24', // Amber
  '#A855F7', // Purple
  '#84CC16', // Lime Green
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#6366F1', // Indigo
  '#64748B'  // Slate
];

export const SpendingAnalytics: React.FC<SpendingAnalyticsProps> = ({ appState }) => {
  const [period, setPeriod] = useState<PeriodFilter>('period');
  const [viewLevel, setViewLevel] = useState<ViewLevel>('main');
  const [expenseType, setExpenseType] = useState<ExpenseTypeFilter>('all');
  const [chartType, setChartType] = useState<ChartType>('pie');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [expandedMainCats, setExpandedMainCats] = useState<Record<string, boolean>>({});

  const lang = appState.settings.language;
  const currency = appState.settings.currency;
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);
  const categories = appState.categories;
  const budgetLimits = appState.settings.budgetLimits || {};

  // Calculate active period label for the dropdown
  const activePeriodInfo = useMemo(() => {
    return calculatePayPeriodDates(
      appState.settings.startDay,
      appState.settings.customStartDate,
      appState.settings.customEndDate,
      appState.settings.periodMode || (appState.settings.customStartDate && appState.settings.customEndDate ? 'custom' : 'payday'),
      appState.settings.periodOffset || 0,
      lang
    );
  }, [appState.settings, lang]);

  // 1. Filter transactions based on period and expense type
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (period === 'period') {
      startDate = activePeriodInfo.startDate;
      endDate = activePeriodInfo.endDate;
    } else if (period === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (period === 'last30') {
      startDate = new Date();
      startDate.setDate(now.getDate() - 30);
      endDate = new Date();
    }

    return appState.transactions.filter(t => {
      // Must be an expense type (needs, wants, savings)
      if (expenseType === 'all') {
        if (t.type !== 'needs' && t.type !== 'wants' && t.type !== 'savings') return false;
      } else {
        if (t.type !== expenseType) return false;
      }

      // Date filter
      if (startDate && endDate && t.date) {
        const txDate = new Date(t.date);
        if (txDate < startDate || txDate > endDate) return false;
      }

      return true;
    });
  }, [appState.transactions, activePeriodInfo, period, expenseType]);

  // 2. Aggregate data by categories
  const { chartData, categoryBreakdown, totalSpent, avgTx, topCategory } = useMemo(() => {
    let total = 0;
    const catTotals: Record<string, number> = {};

    filteredTransactions.forEach(t => {
      const amt = Number(t.amount || 0);
      total += amt;
      catTotals[t.category] = (catTotals[t.category] || 0) + amt;
    });

    const averageTx = filteredTransactions.length > 0 ? total / filteredTransactions.length : 0;

    if (viewLevel === 'detailed') {
      // Detailed view: every individual category that has spending
      const items = Object.entries(catTotals).map(([catId, amount], idx) => {
        const cat = categories.find(c => c.id === catId);
        const name = getCategoryName(catId, categories, lang);
        const color = cat?.color || COLOR_PALETTE[idx % COLOR_PALETTE.length];
        const percent = total > 0 ? (amount / total) * 100 : 0;

        return {
          id: catId,
          name,
          value: amount,
          color,
          percent,
          icon: cat?.icon,
          parentId: cat?.parentId,
          type: cat?.type,
          count: filteredTransactions.filter(t => t.category === catId).length
        };
      }).sort((a, b) => b.value - a.value);

      const topCat = items.length > 0 ? items[0] : null;

      return {
        chartData: items,
        categoryBreakdown: items,
        totalSpent: total,
        avgTx: averageTx,
        topCategory: topCat
      };
    } else {
      // Main level view: roll up subcategories to main parent categories
      const mainCatTotals: Record<string, { total: number; subcategories: Record<string, number> }> = {};

      Object.entries(catTotals).forEach(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        let mainId = catId;

        if (cat?.parentId) {
          const parent = categories.find(p => p.id === cat.parentId);
          if (parent) {
            mainId = parent.id;
          }
        }

        if (!mainCatTotals[mainId]) {
          mainCatTotals[mainId] = { total: 0, subcategories: {} };
        }

        mainCatTotals[mainId].total += amount;
        mainCatTotals[mainId].subcategories[catId] = (mainCatTotals[mainId].subcategories[catId] || 0) + amount;
      });

      const mainItems = Object.entries(mainCatTotals).map(([mainId, data], idx) => {
        const mainCat = categories.find(c => c.id === mainId);
        const name = lang === 'bg' ? (mainCat?.nameBg || mainId) : (mainCat?.nameEn || mainId);
        const color = mainCat?.color || COLOR_PALETTE[idx % COLOR_PALETTE.length];
        const percent = total > 0 ? (data.total / total) * 100 : 0;

        const subItems = Object.entries(data.subcategories).map(([subId, subAmt]) => {
          const subCat = categories.find(c => c.id === subId);
          const subName = lang === 'bg' ? (subCat?.nameBg || subId) : (subCat?.nameEn || subId);
          return {
            id: subId,
            name: subName,
            value: subAmt,
            percent: data.total > 0 ? (subAmt / data.total) * 100 : 0,
            color: subCat?.color || color
          };
        }).sort((a, b) => b.value - a.value);

        return {
          id: mainId,
          name,
          value: data.total,
          color,
          percent,
          icon: mainCat?.icon,
          subcategories: subItems,
          type: mainCat?.type,
          count: filteredTransactions.filter(t => {
            if (t.category === mainId) return true;
            const c = categories.find(cat => cat.id === t.category);
            return c?.parentId === mainId;
          }).length
        };
      }).sort((a, b) => b.value - a.value);

      const topCat = mainItems.length > 0 ? mainItems[0] : null;

      return {
        chartData: mainItems,
        categoryBreakdown: mainItems,
        totalSpent: total,
        avgTx: averageTx,
        topCategory: topCat
      };
    }
  }, [filteredTransactions, viewLevel, categories, lang]);

  // 3. Aggregate data for the 6-month trend line chart
  const sixMonthTrendData = useMemo(() => {
    const data: { key: string; name: string; total: number; year: number; month: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYearKey = `${d.getFullYear()}-${d.getMonth()}`;
      
      let monthName = '';
      try {
        monthName = new Intl.DateTimeFormat(lang === 'bg' ? 'bg-BG' : 'en-US', { month: 'short' }).format(d);
        // capitalize first letter
        monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      } catch (e) {
        // fallback if Intl is not supported
        const fallbackBg = ['Яну', 'Фев', 'Мар', 'Апр', 'Май', 'Юни', 'Юли', 'Авг', 'Сеп', 'Окт', 'Ное', 'Дек'];
        const fallbackEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        monthName = lang === 'bg' ? fallbackBg[d.getMonth()] : fallbackEn[d.getMonth()];
      }

      data.push({
        key: monthYearKey,
        name: monthName,
        total: 0,
        year: d.getFullYear(),
        month: d.getMonth()
      });
    }

    // Filter all transactions that are expenses and fall into these buckets
    appState.transactions.forEach(t => {
      // Must be an expense type
      if (t.type !== 'needs' && t.type !== 'wants' && t.type !== 'savings') return;
      if (!t.date) return;

      const txDate = new Date(t.date);
      const txKey = `${txDate.getFullYear()}-${txDate.getMonth()}`;

      const bucket = data.find(d => d.key === txKey);
      if (bucket) {
        bucket.total += Number(t.amount || 0);
      }
    });

    return data;
  }, [appState.transactions, lang]);

  const toggleExpandMainCat = (catId: string) => {
    setExpandedMainCats(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) iconName = 'Tag';
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className="w-4 h-4" />;
  };

  // Custom Pie Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold text-zinc-100">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-amber-400 font-extrabold text-sm">
            {formatCurrency(data.value, currency)}
          </div>
          <div className="text-zinc-400">
            {data.percent.toFixed(1)}% {lang === 'bg' ? 'от общо' : 'of total'} ({data.count} {lang === 'bg' ? 'транзакции' : 'txs'})
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
              <PieIcon className="w-6 h-6 text-amber-500" />
              <span>{lang === 'bg' ? 'Анализ на Разходите' : 'Spending Analytics'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {lang === 'bg' 
                ? 'Визуализация на разходите по категории с интерактивна графика.'
                : 'Interactive pie chart breakdown of monthly expense distribution.'}
            </p>
          </div>

          {/* Chart Type Toggle Button */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'pie'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>{lang === 'bg' ? 'Кръгова Графика' : 'Pie Chart'}</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'bar'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{lang === 'bg' ? 'Стълбова Графика' : 'Bar Chart'}</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Time Period Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" />
              <span>{lang === 'bg' ? 'Период' : 'Time Period'}</span>
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodFilter)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="period">
                {lang === 'bg' ? `Бюджетен период (${activePeriodInfo.label})` : `Selected Period (${activePeriodInfo.label})`}
              </option>
              <option value="thisMonth">{lang === 'bg' ? 'Този месец' : 'This Calendar Month'}</option>
              <option value="last30">{lang === 'bg' ? 'Последните 30 дни' : 'Last 30 Days'}</option>
              <option value="allTime">{lang === 'bg' ? 'Всички времена' : 'All Time'}</option>
            </select>
          </div>

          {/* View Level Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>{lang === 'bg' ? 'Ниво на детайлност' : 'Category Level'}</span>
            </label>
            <select
              value={viewLevel}
              onChange={(e) => setViewLevel(e.target.value as ViewLevel)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="main">{lang === 'bg' ? 'Основни Категории' : 'Main Categories'}</option>
              <option value="detailed">{lang === 'bg' ? 'Подробни Подкатегории' : 'Detailed Subcategories'}</option>
            </select>
          </div>

          {/* Expense Type Filter */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-amber-400" />
              <span>{lang === 'bg' ? 'Тип разход' : 'Expense Type'}</span>
            </label>
            <select
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value as ExpenseTypeFilter)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              <option value="all">{lang === 'bg' ? 'Всички разходи' : 'All Expense Types'}</option>
              <option value="needs">{lang === 'bg' ? 'Нужди (Задължителни)' : 'Needs (Essential)'}</option>
              <option value="wants">{lang === 'bg' ? 'Желания (Начин на живот)' : 'Wants (Lifestyle)'}</option>
              <option value="savings">{lang === 'bg' ? 'Спестявания и Цели' : 'Savings & Goals'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expense */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {lang === 'bg' ? 'Общо Разходи' : 'Total Expenses'}
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400">
            {formatCurrency(totalSpent, currency)}
          </div>
          <p className="text-[10px] text-zinc-500">
            {filteredTransactions.length} {lang === 'bg' ? 'транзакции' : 'transactions'}
          </p>
        </div>

        {/* Top Expense Category */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {lang === 'bg' ? 'Топ Категория' : 'Top Category'}
          </span>
          <div className="text-base sm:text-lg font-bold text-zinc-100 truncate">
            {topCategory ? topCategory.name : '—'}
          </div>
          <p className="text-[10px] text-amber-400/90 font-medium">
            {topCategory ? `${formatCurrency(topCategory.value, currency)} (${topCategory.percent.toFixed(1)}%)` : '—'}
          </p>
        </div>

        {/* Active Categories Count */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {lang === 'bg' ? 'Активни Категории' : 'Active Categories'}
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-zinc-100">
            {categoryBreakdown.length}
          </div>
          <p className="text-[10px] text-zinc-500">
            {lang === 'bg' ? 'категории с разходи' : 'categories with spending'}
          </p>
        </div>

        {/* Average Expense Transaction */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {lang === 'bg' ? 'Средна Транзакция' : 'Average Transaction'}
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-zinc-100">
            {formatCurrency(avgTx, currency)}
          </div>
          <p className="text-[10px] text-zinc-500">
            {lang === 'bg' ? 'за единичен разход' : 'per expense record'}
          </p>
        </div>
      </div>

      {/* Chart Section & Legend Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Chart Card */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>{lang === 'bg' ? 'Разпределение на разходите' : 'Expense Distribution'}</span>
            </h3>
            {selectedCatId && (
              <button
                onClick={() => setSelectedCatId(null)}
                className="text-xs text-amber-400 hover:underline"
              >
                {lang === 'bg' ? 'Изчисти избора' : 'Reset selection'}
              </button>
            )}
          </div>

          {chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500">
              <Receipt className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">
                {lang === 'bg' ? 'Няма записани разходи за избрания период.' : 'No expense data for the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="w-full h-72 sm:h-80 relative">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' ? (
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={(data: any) => {
                        const clickedId = data?.id || data?.payload?.id;
                        if (clickedId) {
                          setSelectedCatId(clickedId === selectedCatId ? null : clickedId);
                        }
                      }}
                      cursor="pointer"
                    >
                      {chartData.map((entry) => (
                        <Cell
                          key={entry.id}
                          fill={entry.color}
                          stroke="#18181b"
                          strokeWidth={2}
                          opacity={selectedCatId && selectedCatId !== entry.id ? 0.35 : 1}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RechartsPieChart>
                ) : (
                  <BarChart
                    data={chartData.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis type="number" stroke="#71717a" fontSize={11} tickFormatter={(v) => formatCurrency(v, currency)} />
                    <YAxis type="category" dataKey="name" stroke="#a1a1aa" fontSize={11} width={110} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>

              {/* Center Donut Stats Label */}
              {chartType === 'pie' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                    {lang === 'bg' ? 'Общо' : 'Total'}
                  </span>
                  <span className="text-lg font-extrabold text-zinc-100">
                    {formatCurrency(totalSpent, currency)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend / Category List Breakdown */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 space-y-4 max-h-[480px] overflow-y-auto">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center justify-between border-b border-zinc-800 pb-3">
            <span>{lang === 'bg' ? 'Детайлен преглед' : 'Category Breakdown'}</span>
            <span className="text-xs text-zinc-500 font-normal">
              {categoryBreakdown.length} {lang === 'bg' ? 'категории' : 'items'}
            </span>
          </h3>

          <div className="space-y-3 pr-1">
            {categoryBreakdown.map((item) => {
              const isSelected = selectedCatId === item.id;
              const limit = budgetLimits[item.id];
              const isOverBudget = limit && item.value > limit;
              const isExpanded = expandedMainCats[item.id];
              const hasSubcategories = (item as any).subcategories && (item as any).subcategories.length > 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      onClick={() => setSelectedCatId(isSelected ? null : item.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <div className="text-xs font-extrabold text-zinc-100">
                          {formatCurrency(item.value, currency)}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-medium">
                          {item.percent.toFixed(1)}%
                        </div>
                      </div>

                      {hasSubcategories && (
                        <button
                          onClick={() => toggleExpandMainCat(item.id)}
                          className="p-1 text-zinc-400 hover:text-zinc-200"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, item.percent)}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>

                  {/* Budget warning indicator if limit set */}
                  {limit && (
                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>
                        {lang === 'bg' ? 'Лимит:' : 'Limit:'} {formatCurrency(limit, currency)}
                      </span>
                      <span className={isOverBudget ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {isOverBudget
                          ? `${lang === 'bg' ? 'Надхвърлен с' : 'Over by'} ${formatCurrency(item.value - limit, currency)}`
                          : `${lang === 'bg' ? 'Остават' : 'Left:'} ${formatCurrency(limit - item.value, currency)}`}
                      </span>
                    </div>
                  )}

                  {/* Expandable Subcategories */}
                  {hasSubcategories && isExpanded && (
                    <div className="mt-3 pt-2 border-t border-zinc-800/80 space-y-2 pl-2">
                      {(item as any).subcategories.map((sub: any) => (
                        <div key={sub.id} className="flex items-center justify-between text-[11px] text-zinc-300">
                          <span className="truncate flex items-center gap-1.5">
                            <span className="text-zinc-500">└</span>
                            <span>{sub.name}</span>
                          </span>
                          <div className="font-medium text-zinc-200">
                            {formatCurrency(sub.value, currency)}
                            <span className="text-zinc-500 text-[10px] ml-1">
                              ({sub.percent.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 6-Month Trend Line Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'bg' ? 'Тенденция на разходите (Последните 6 месеца)' : 'Expense Trend (Last 6 Months)'}</span>
            </h3>
          </div>
        </div>
        
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sixMonthTrendData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(v) => formatCurrency(v, currency)} 
                width={80}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-zinc-900 border border-zinc-700/80 p-3 rounded-xl shadow-xl text-xs space-y-1">
                        <div className="font-bold text-zinc-100 mb-1">{label}</div>
                        <div className="text-emerald-400 font-extrabold text-sm">
                          {formatCurrency(payload[0].value as number, currency)}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#34D399" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#34D399', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#34D399', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
