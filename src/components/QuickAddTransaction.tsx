import React, { useState, useRef } from 'react';
import { X, Plus, Calendar, Tag, FileText, DollarSign, PiggyBank } from 'lucide-react';
import { Category, CategoryType, Goal, Language, Transaction } from '../types';
import { getTranslation } from '../constants/translations';
import { getCategoryName, getTypeLabel } from '../utils/calculations';

interface QuickAddTransactionProps {
  categories: Category[];
  goals: Goal[];
  currency: string;
  lang: Language;
  initialDate?: string;
  initialType?: CategoryType;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>, goalDepositId?: string) => void;
}

export const QuickAddTransaction: React.FC<QuickAddTransactionProps> = ({
  categories,
  goals,
  currency,
  lang,
  initialDate,
  initialType,
  onClose,
  onAddTransaction
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedType, setSelectedType] = useState<CategoryType>(initialType || 'needs');
  const initialMatchingCategory = initialType 
    ? categories.find(c => c.type === initialType) 
    : categories[0];
  const [categoryId, setCategoryId] = useState<string>(initialMatchingCategory?.id || categories[0]?.id || '');
  const [date, setDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleShiftDate = (days: number) => {
    const current = new Date(date || new Date());
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  const setQuickDate = (type: 'today' | 'yesterday') => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
  };

  // Handle category change -> auto update type if matching
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat) {
      setSelectedType(cat.type);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert(lang === 'bg' ? 'Моля въведете валидна сума!' : 'Please enter a valid amount!');
      return;
    }

    onAddTransaction(
      {
        amount: parsedAmount,
        note: note.trim() || getCategoryName(categoryId, categories, lang),
        category: categoryId,
        type: selectedType,
        date: date,
        goalId: selectedType === 'savings' && selectedGoalId ? selectedGoalId : undefined
      },
      selectedType === 'savings' && selectedGoalId ? selectedGoalId : undefined
    );

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const typesList: { type: CategoryType; label: string }[] = [
    { type: 'needs', label: getTypeLabel('needs', lang) },
    { type: 'wants', label: getTypeLabel('wants', lang) },
    { type: 'savings', label: getTypeLabel('savings', lang) },
    { type: 'income', label: getTypeLabel('income', lang) },
    { type: 'bills', label: getTypeLabel('bills', lang) },
    { type: 'debt', label: getTypeLabel('debt', lang) },
  ];

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <div id="quick-add-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 space-y-5 text-slate-800 dark:text-slate-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Plus className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold font-display text-slate-900 dark:text-white">{t('quickAdd')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('amount')} ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-3 bg-slate-50 dark:bg-[#101217] border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-bold text-emerald-600 dark:text-emerald-400 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              {t('type')} *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-slate-50/80 dark:bg-[#101217] rounded-xl border border-slate-200/50 dark:border-slate-800 text-xs">
              {typesList.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(item.type);
                    const matchingCat = categories.find(c => c.type === item.type);
                    if (matchingCat) setCategoryId(matchingCat.id);
                  }}
                  className={`py-1.5 px-2 rounded-lg font-medium text-center truncate transition-all cursor-pointer ${
                    selectedType === item.type
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('category')} *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#101217] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {(() => {
                  const typeCats = categories.filter(c => {
                    if (c.type === selectedType) return true;
                    if (c.parentId) {
                      const parent = categories.find(p => p.id === c.parentId);
                      if (parent && parent.type === selectedType) return true;
                    }
                    return false;
                  });

                  const mainCategories = typeCats.filter(c => !c.parentId);
                  const renderedIds = new Set<string>();

                  const groups = mainCategories.map(mainCat => {
                    renderedIds.add(mainCat.id);
                    const mainName = lang === 'bg' ? mainCat.nameBg : mainCat.nameEn;
                    const subCats = typeCats.filter(c => c.parentId === mainCat.id);
                    subCats.forEach(s => renderedIds.add(s.id));

                    return (
                      <optgroup key={mainCat.id} label={mainName} className="dark:bg-[#181B22] dark:text-white">
                        <option value={mainCat.id} className="dark:bg-[#181B22] dark:text-white">
                          {mainName}
                        </option>
                        {subCats.map(sub => (
                          <option key={sub.id} value={sub.id} className="dark:bg-[#181B22] dark:text-white">
                            {lang === 'bg' ? sub.nameBg : sub.nameEn}
                          </option>
                        ))}
                      </optgroup>
                    );
                  });

                  const remaining = typeCats.filter(c => !renderedIds.has(c.id));
                  if (remaining.length > 0) {
                    groups.push(
                      <optgroup key="other_group" label={lang === 'bg' ? 'Други' : 'Others'} className="dark:bg-[#181B22] dark:text-white">
                        {remaining.map(c => (
                          <option key={c.id} value={c.id} className="dark:bg-[#181B22] dark:text-white">
                            {lang === 'bg' ? c.nameBg : c.nameEn}
                          </option>
                        ))}
                      </optgroup>
                    );
                  }

                  return groups;
                })()}
              </select>
            </div>
          </div>

          {/* If Savings type: Select Goal Vault to Deposit into */}
          {selectedType === 'savings' && goals.length > 0 && (
            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl space-y-1.5">
              <label className="block text-xs font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4" />
                <span>{t('depositModalTitle')} (Vault Link)</span>
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#101217] border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="">-- {lang === 'bg' ? 'Без свързан сейф' : 'No specific vault'} --</option>
                {goals.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.currentAmount} / {g.targetAmount} {currency})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('notes')} / {lang === 'bg' ? 'Описание' : 'Description'}
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'bg' ? 'напр. Супермаркет, Зареждане гориво...' : 'e.g. Supermarket, Gas station...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#101217] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('date')} *
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuickDate('today')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {lang === 'bg' ? 'Днес' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate('yesterday')}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                >
                  {lang === 'bg' ? 'Вчера' : 'Yesterday'}
                </button>
              </div>
            </div>
            <div 
              className="relative flex items-center cursor-pointer"
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker?.();
                } catch (_) {}
              }}
            >
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                ref={dateInputRef}
                type="date"
                required
                value={date}
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker?.();
                  } catch (_) {}
                }}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-16 py-2.5 bg-slate-50 dark:bg-[#101217] border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              />
              <div 
                className="absolute right-2 flex items-center gap-1 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  title={lang === 'bg' ? 'Предишен ден' : 'Previous day'}
                  onClick={() => handleShiftDate(-1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  title={lang === 'bg' ? 'Следващ ден' : 'Next day'}
                  onClick={() => handleShiftDate(1)}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>{lang === 'bg' ? 'Натиснете' : 'Press'}</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-300">⌘+Enter</kbd>
              <span>{lang === 'bg' ? 'за запис' : 'to save'}</span>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>{t('cancel')}</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 font-mono text-[9px] text-slate-400">Esc</kbd>
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
              >
                <span>{t('save')}</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-emerald-700/50 border border-emerald-500/30 font-mono text-[10px] text-emerald-100">↵</kbd>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
