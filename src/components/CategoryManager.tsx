import React, { useState } from 'react';
import { Tag, Trash2 } from 'lucide-react';
import { Category, CategoryType, Language } from '../types';
import { getTranslation } from '../constants/translations';
import { getTypeLabel, getTypeBadgeColor } from '../utils/calculations';

interface CategoryManagerProps {
  categories: Category[];
  lang: Language;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  lang,
  onAddCategory,
  onDeleteCategory
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [nameEn, setNameEn] = useState('');
  const [nameBg, setNameBg] = useState('');
  const [selectedType, setSelectedType] = useState<CategoryType>('needs');
  const [parentId, setParentId] = useState<string>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim()) return;

    onAddCategory({
      nameEn: nameEn.trim(),
      nameBg: nameBg.trim() || nameEn.trim(),
      type: selectedType,
      parentId: parentId || undefined,
      isCustom: true
    });

    setNameEn('');
    setNameBg('');
    setParentId('');
  };

  const typesList: { type: CategoryType; label: string }[] = [
    { type: 'needs', label: getTypeLabel('needs', lang) },
    { type: 'wants', label: getTypeLabel('wants', lang) },
    { type: 'savings', label: getTypeLabel('savings', lang) },
    { type: 'income', label: getTypeLabel('income', lang) },
    { type: 'bills', label: getTypeLabel('bills', lang) },
    { type: 'debt', label: getTypeLabel('debt', lang) },
  ];

  const mainCategoriesForSelectedType = categories.filter(
    c => !c.parentId && (c.type === selectedType || !c.type)
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
        <Tag className="w-4 h-4 text-emerald-400" />
        <span>{t('categoryManagement')}</span>
      </h3>

      {/* Add new category form */}
      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-zinc-800/60 p-3 rounded-xl border border-zinc-700/60">
        <input
          type="text"
          required
          placeholder="Name (EN)"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-100"
        />
        <input
          type="text"
          placeholder="Име (BG)"
          value={nameBg}
          onChange={(e) => setNameBg(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-100"
        />
        <select
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value as CategoryType);
            setParentId('');
          }}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 cursor-pointer"
        >
          {typesList.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 cursor-pointer"
        >
          <option value="">{lang === 'bg' ? 'Основна категория' : 'Main Category'}</option>
          {mainCategoriesForSelectedType.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {lang === 'bg' ? cat.nameBg : cat.nameEn}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
        >
          + {t('add')}
        </button>
      </form>

      {/* Categories Grid by Type */}
      <div className="max-h-72 overflow-y-auto space-y-4 pr-1">
        {typesList.map(({ type, label }) => {
          const catGroup = categories.filter((c) => c.type === type || (c.parentId && categories.find(p => p.id === c.parentId)?.type === type));
          if (catGroup.length === 0) return null;

          const mainCats = catGroup.filter(c => !c.parentId);

          return (
            <div key={type} className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                {label} ({catGroup.length})
              </span>
              <div className="space-y-2">
                {mainCats.map((main) => {
                  const subCats = catGroup.filter(c => c.parentId === main.id);
                  return (
                    <div key={main.id} className="bg-zinc-800/80 border border-zinc-700/50 rounded-xl p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-100">
                        <span 
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors" 
                          style={{ 
                            backgroundColor: `${main.color || '#a1a1aa'}15`, 
                            color: main.color || '#a1a1aa', 
                            borderColor: `${main.color || '#a1a1aa'}30` 
                          }}
                        >
                          {lang === 'bg' ? main.nameBg : main.nameEn}
                        </span>
                        {main.isCustom && (
                          <button
                            type="button"
                            onClick={() => onDeleteCategory(main.id)}
                            className="text-zinc-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {subCats.length > 0 && (
                        <div className="pl-3 border-l-2 border-zinc-700/60 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                          {subCats.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-1.5 rounded-md bg-zinc-900/60 text-zinc-300"
                            >
                              <div className="flex items-center gap-1.5">
                                <span 
                                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors" 
                                  style={{ 
                                    backgroundColor: `${sub.color || main.color || '#a1a1aa'}10`, 
                                    color: sub.color || main.color || '#a1a1aa', 
                                    borderColor: `${sub.color || main.color || '#a1a1aa'}20` 
                                  }}
                                >
                                  {lang === 'bg' ? sub.nameBg : sub.nameEn}
                                </span>
                              </div>
                              {sub.isCustom && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteCategory(sub.id)}
                                  className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
