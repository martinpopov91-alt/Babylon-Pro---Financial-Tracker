import React, { useState } from 'react';
import { X, Save, Trash2, Calendar, Tag, FileText, DollarSign, ArrowUpDown } from 'lucide-react';
import { Category, CategoryType, Language, Transaction } from '../types';
import { getTranslation } from '../constants/translations';

interface EditTransactionModalProps {
  transaction: Transaction;
  categories: Category[];
  currency: string;
  lang: Language;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
  onDelete?: (id: string) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  categories,
  currency,
  lang,
  onClose,
  onSave,
  onDelete
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [date, setDate] = useState<string>(transaction.date);
  const [type, setType] = useState<CategoryType>(transaction.type);
  const [category, setCategory] = useState<string>(transaction.category);
  const [note, setNote] = useState<string>(transaction.note || '');
  const [amount, setAmount] = useState<string>(transaction.amount.toString());

  const handleTypeChange = (newType: CategoryType) => {
    setType(newType);
    // Auto switch category if current category doesn't match new type
    const matchingCat = categories.find(c => c.type === newType);
    if (matchingCat) {
      setCategory(matchingCat.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    onSave({
      ...transaction,
      date,
      type,
      category,
      note,
      amount: numAmount
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-5 bg-zinc-950/50">
          <h3 className="font-bold text-base text-zinc-100 flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Save className="w-4 h-4" />
            </span>
            <span>{lang === 'bg' ? 'Редактиране на транзакция' : 'Edit Transaction'}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-2 rounded-xl hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              {t('amount')} ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-lg font-bold font-display text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <span>{t('type')}</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['needs', 'wants', 'savings', 'income', 'bills', 'debt'] as CategoryType[]).map((tType) => (
                <button
                  key={tType}
                  type="button"
                  onClick={() => handleTypeChange(tType)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    type === tType
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-sm'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {t(tType as any) || tType}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              <span>{t('category')}</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              {(() => {
                const mainCategories = categories.filter(c => !c.parentId);
                const renderedIds = new Set<string>();

                const groups = mainCategories.map(mainCat => {
                  renderedIds.add(mainCat.id);
                  const mainName = lang === 'bg' ? mainCat.nameBg : mainCat.nameEn;
                  const subCats = categories.filter(c => c.parentId === mainCat.id);
                  subCats.forEach(s => renderedIds.add(s.id));

                  return (
                    <optgroup key={mainCat.id} label={mainName}>
                      <option value={mainCat.id}>
                        {mainName}
                      </option>
                      {subCats.map(sub => (
                        <option key={sub.id} value={sub.id}>
                          └ {lang === 'bg' ? sub.nameBg : sub.nameEn}
                        </option>
                      ))}
                    </optgroup>
                  );
                });

                return (
                  <>
                    {groups}
                    {categories.filter(c => !renderedIds.has(c.id)).map(c => (
                      <option key={c.id} value={c.id}>
                        {lang === 'bg' ? c.nameBg : c.nameEn}
                      </option>
                    ))}
                  </>
                );
              })()}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{t('date')}</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <span>{t('notes')}</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={lang === 'bg' ? 'Допълнителна бележка...' : 'Add a note...'}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(transaction.id);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('delete')}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{lang === 'bg' ? 'Запази промените' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
