import React, { useState } from 'react';
import { Target, TrendingUp, AlertTriangle, Plus, X, Check, Edit3, Settings2 } from 'lucide-react';
import { AppState, FinancialSummary, Category } from '../types';
import { getTranslation } from '../constants/translations';
import { formatCurrency, getCategoryName } from '../utils/calculations';
import * as Icons from 'lucide-react';

interface MonthlyBudgetTrackerProps {
  appState: AppState;
  summary: FinancialSummary;
  onUpdateSettings: (settings: Partial<AppState['settings']>) => void;
}

export const MonthlyBudgetTracker: React.FC<MonthlyBudgetTrackerProps> = ({
  appState,
  summary,
  onUpdateSettings,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [newLimit, setNewLimit] = useState<string>('');

  const lang = appState.settings.language;
  const currency = appState.settings.currency;
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);
  
  const limits = appState.settings.budgetLimits || {};
  const categories = appState.categories;
  const spending = summary.categorySpending;

  // Filter categories that have a budget set
  const budgetedCategoryIds = Object.keys(limits);
  
  // Available categories for new budget (not already budgeted, type needs/wants/savings)
  const availableCategories = categories.filter(c => 
    !budgetedCategoryIds.includes(c.id) && 
    ['needs', 'wants', 'savings'].includes(c.type)
  );

  const handleSaveNewLimit = () => {
    if (!newCategoryId || !newLimit) return;
    const amount = parseFloat(newLimit);
    if (isNaN(amount) || amount <= 0) return;

    onUpdateSettings({
      budgetLimits: {
        ...limits,
        [newCategoryId]: amount,
      }
    });
    setNewCategoryId('');
    setNewLimit('');
  };

  const handleUpdateLimit = (categoryId: string, amountStr: string) => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      handleRemoveLimit(categoryId);
      return;
    }
    onUpdateSettings({
      budgetLimits: {
        ...limits,
        [categoryId]: amount,
      }
    });
  };

  const handleRemoveLimit = (categoryId: string) => {
    const newLimits = { ...limits };
    delete newLimits[categoryId];
    onUpdateSettings({ budgetLimits: newLimits });
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) iconName = 'Tag';
    const IconComponent = (Icons as any)[iconName] || Icons.Tag;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" />
            <span>{lang === 'bg' ? 'Бюджетни Лимити' : 'Budget Limits'}</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {lang === 'bg' ? 'Проследявайте разходите си по категории.' : 'Track your spending against set category limits.'}
          </p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isEditing 
              ? 'bg-emerald-500/15 text-emerald-400' 
              : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {budgetedCategoryIds.length === 0 && !isEditing ? (
          <div className="text-center py-6 text-zinc-500">
            <Target className="w-8 h-8 mx-auto mb-3 text-zinc-600 opacity-50" />
            <p className="text-sm font-medium">{lang === 'bg' ? 'Нямате зададени лимити.' : 'No budget limits set.'}</p>
            <p className="text-xs mt-1">{lang === 'bg' ? 'Натиснете иконката за настройки, за да добавите.' : 'Click the settings icon to add some.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetedCategoryIds.map(catId => {
              const cat = categories.find(c => c.id === catId);
              if (!cat) return null;
              
              const limit = limits[catId];
              const spent = spending[catId] || 0;
              const remaining = limit - spent;
              const percentage = Math.min(100, Math.max(0, (spent / limit) * 100));
              
              let statusColor = 'bg-emerald-500 text-emerald-500';
              if (percentage >= 100) statusColor = 'bg-rose-500 text-rose-500';
              else if (percentage >= 80) statusColor = 'bg-amber-500 text-amber-500';

              return (
                <div key={catId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-zinc-200 font-medium">
                      <span className="p-1.5 rounded-md" style={{ backgroundColor: `${cat.color || '#a1a1aa'}15`, color: cat.color || '#a1a1aa' }}>
                        {renderIcon(cat.icon)}
                      </span>
                      <span>{getCategoryName(catId, categories, lang)}</span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={limit}
                          onChange={(e) => handleUpdateLimit(catId, e.target.value)}
                          className="w-24 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-right text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={() => handleRemoveLimit(catId)}
                          className="p-1 text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="font-bold text-zinc-100">{formatCurrency(spent, currency)}</span>
                        <span className="text-zinc-500 text-xs ml-1">/ {formatCurrency(limit, currency)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="h-2 bg-zinc-950 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full ${statusColor.split(' ')[0]} transition-all duration-500`} 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {!isEditing && (
                    <div className="flex items-center justify-between text-[11px] font-medium">
                      <span className="text-zinc-500">
                        {percentage.toFixed(0)}% {lang === 'bg' ? 'изразходвани' : 'spent'}
                      </span>
                      <span className={remaining < 0 ? 'text-rose-400' : remaining < (limit * 0.2) ? 'text-amber-400' : 'text-emerald-400'}>
                        {remaining < 0 
                          ? `${lang === 'bg' ? 'Надхвърлен с' : 'Over by'} ${formatCurrency(Math.abs(remaining), currency)}` 
                          : `${formatCurrency(remaining, currency)} ${lang === 'bg' ? 'оставащи' : 'left'}`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isEditing && (
          <div className="pt-4 border-t border-zinc-800/50 mt-4">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              {lang === 'bg' ? 'Добави лимит' : 'Add New Limit'}
            </h4>
            <div className="flex gap-2 items-center">
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">{lang === 'bg' ? 'Избери категория' : 'Select category'}</option>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.id}>
                    {getCategoryName(c.id, categories, lang)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="0.00"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="w-24 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleSaveNewLimit}
                disabled={!newCategoryId || !newLimit}
                className="p-2 bg-emerald-600 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
