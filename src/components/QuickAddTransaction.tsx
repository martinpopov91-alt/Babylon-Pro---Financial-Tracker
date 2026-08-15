import React, { useState } from 'react';
import { X, Plus, Calendar, Tag, FileText, DollarSign, PiggyBank } from 'lucide-react';
import { Category, CategoryType, Goal, Language, Transaction } from '../types';
import { getTranslation } from '../constants/translations';
import { getCategoryName } from '../utils/calculations';

interface QuickAddTransactionProps {
  categories: Category[];
  goals: Goal[];
  currency: string;
  lang: Language;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>, goalDepositId?: string) => void;
}

export const QuickAddTransaction: React.FC<QuickAddTransactionProps> = ({
  categories,
  goals,
  currency,
  lang,
  onClose,
  onAddTransaction
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id || '');
  const [selectedType, setSelectedType] = useState<CategoryType>('needs');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

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

  const typesList: { type: CategoryType; label: string }[] = [
    { type: 'needs', label: t('needs') },
    { type: 'wants', label: t('wants') },
    { type: 'savings', label: t('savings') },
    { type: 'income', label: t('income') },
    { type: 'bills', label: t('bills') },
    { type: 'debt', label: t('debt') },
  ];

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <div id="quick-add-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-5 text-zinc-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Plus className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold font-display">{t('quickAdd')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              {t('amount')} ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-xl font-bold text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
              {t('type')} *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 p-1 bg-zinc-800/80 rounded-xl border border-zinc-700/50 text-xs">
              {typesList.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(item.type);
                    const matchingCat = categories.find(c => c.type === item.type);
                    if (matchingCat) setCategoryId(matchingCat.id);
                  }}
                  className={`py-1.5 px-2 rounded-lg font-medium capitalize text-center truncate transition-all cursor-pointer ${
                    selectedType === item.type
                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-md'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                  }`}
                >
                  {item.type}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              {t('category')} *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
                      <optgroup key={mainCat.id} label={mainName}>
                        <option value={mainCat.id}>
                          {mainName} ({lang === 'bg' ? 'Основна категория' : 'Main Category'})
                        </option>
                        {subCats.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            └ {lang === 'bg' ? sub.nameBg : sub.nameEn}
                          </option>
                        ))}
                      </optgroup>
                    );
                  });

                  const remaining = typeCats.filter(c => !renderedIds.has(c.id));
                  if (remaining.length > 0) {
                    groups.push(
                      <optgroup key="other_group" label={lang === 'bg' ? 'Други' : 'Others'}>
                        {remaining.map(c => (
                          <option key={c.id} value={c.id}>
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
              <label className="block text-xs font-bold text-teal-400 flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4" />
                <span>{t('depositModalTitle')} (Vault Link)</span>
              </label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              {t('notes')} / {lang === 'bg' ? 'Описание' : 'Description'}
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={lang === 'bg' ? 'напр. Супермаркет, Зареждане гориво...' : 'e.g. Supermarket, Gas station...'}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              {t('date')} *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm font-medium text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
