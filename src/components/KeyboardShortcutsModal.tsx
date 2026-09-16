import React, { useEffect, useState } from 'react';
import { X, Command, Keyboard, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../constants/translations';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  lang,
  onClose,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.platform) {
      setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
    }
  }, []);

  if (!isOpen) return null;

  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups = [
    {
      title: lang === 'bg' ? 'Основни Действия' : 'Quick Actions',
      items: [
        {
          keys: [`${modKey}`, 'N'],
          fallback: ['Alt', 'N'],
          label: lang === 'bg' ? 'Нова Транзакция (Бързо Добавяне)' : 'Add New Transaction (Quick Add)',
          description: lang === 'bg' ? 'Отваря диалоговия прозорец за запис на разход или приход' : 'Opens the quick transaction modal instantly',
        },
        {
          keys: [`${modKey}`, 'Enter'],
          label: lang === 'bg' ? 'Запази / Изпрати Форма' : 'Submit & Save Form',
          description: lang === 'bg' ? 'Запазва транзакция в отворена форма' : 'Saves the open transaction or modal form',
        },
        {
          keys: ['Esc'],
          label: lang === 'bg' ? 'Затвори Прозорец / Отказ' : 'Close Modal / Cancel',
          description: lang === 'bg' ? 'Затваря всеки активен диалогов прозорец' : 'Dismisses any open modal or sheet',
        },
        {
          keys: ['?'],
          fallback: ['Shift', '/'],
          label: lang === 'bg' ? 'Покажи Клавишни Комбинации' : 'Show Keyboard Shortcuts',
          description: lang === 'bg' ? 'Отваря този справочник за бързи клавиши' : 'Opens this shortcuts cheatsheet',
        },
      ],
    },
    {
      title: lang === 'bg' ? 'Превключване на Раздели (Табове)' : 'Switching Tabs',
      items: [
        {
          keys: [`${modKey}`, '1'],
          fallback: ['Alt', '1'],
          label: lang === 'bg' ? 'Табло (Dashboard)' : 'Dashboard Tab',
          description: lang === 'bg' ? 'Преглед на правилата на Вавилон и свободни пари' : 'Babylon allocations overview and life money',
        },
        {
          keys: [`${modKey}`, '2'],
          fallback: ['Alt', '2'],
          label: lang === 'bg' ? 'Дневник (Ledger)' : 'Transaction Ledger',
          description: lang === 'bg' ? 'Пълен списък с транзакции и филтриране' : 'View, filter, sort and batch-update transactions',
        },
        {
          keys: [`${modKey}`, '3'],
          fallback: ['Alt', '3'],
          label: lang === 'bg' ? 'Анализ (Analytics)' : 'Spending Analytics',
          description: lang === 'bg' ? 'Диаграми и разбивка на разходите' : 'Expense charts, category distribution and trends',
        },
        {
          keys: [`${modKey}`, '4'],
          fallback: ['Alt', '4'],
          label: lang === 'bg' ? 'Сейфове и Цели (Vaults)' : 'Sinking Funds & Vaults',
          description: lang === 'bg' ? 'Спестовни цели и целеви фондове' : 'Goal trackers and sinking fund allocations',
        },
        {
          keys: [`${modKey}`, '5'],
          fallback: ['Alt', '5'],
          label: lang === 'bg' ? 'Сметки и Дълг (Bills)' : 'Bills & Debt Manager',
          description: lang === 'bg' ? 'Фиксирани месечни сметки и дългове' : 'Fixed recurring expenses and debt payoff',
        },
        {
          keys: [`${modKey}`, '['],
          fallback: ['Alt', '←'],
          label: lang === 'bg' ? 'Предишен Раздел' : 'Previous Tab',
          description: lang === 'bg' ? 'Преминаване към предходния таб' : 'Cycle backwards through tabs',
        },
        {
          keys: [`${modKey}`, ']'],
          fallback: ['Alt', '→'],
          label: lang === 'bg' ? 'Следващ Раздел' : 'Next Tab',
          description: lang === 'bg' ? 'Преминаване към следващия таб' : 'Cycle forwards through tabs',
        },
      ],
    },
    {
      title: lang === 'bg' ? 'Настройки и Предпочитания' : 'Preferences & Navigation',
      items: [
        {
          keys: [`${modKey}`, ','],
          fallback: ['Alt', 'S'],
          label: lang === 'bg' ? 'Настройки' : 'Open Settings',
          description: lang === 'bg' ? 'Заплата, параметри, категории и архивиране' : 'Manage budget rules, categories, and CSV exports',
        },
        {
          keys: ['Alt', 'T'],
          label: lang === 'bg' ? 'Смяна на Тема (Тъмна / Светла)' : 'Toggle Theme (Dark / Light)',
          description: lang === 'bg' ? 'Мигновено превключване на цветовата схема' : 'Switch between obsidian dark and crisp light mode',
        },
        {
          keys: ['Alt', 'L'],
          label: lang === 'bg' ? 'Смяна на Език (BG / EN)' : 'Toggle Language (BG / EN)',
          description: lang === 'bg' ? 'Превключване между български и английски' : 'Switch between English and Bulgarian',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6 bg-slate-100/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-3xl bg-[#F7B352]/10 text-[#F7B352] border border-[#F7B352]/30 shadow-inner">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-800 font-display">
                  {t('keyboardShortcuts')}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#F7B352]/15 text-[#F7B352] border border-[#F7B352]/30">
                  {isMac ? 'macOS' : 'Windows / Linux'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('keyboardShortcutsDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label="Close shortcuts modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List Content */}
        <div className="p-6 overflow-y-auto max-h-[68vh] space-y-6">
          {shortcutGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F7B352] flex items-center gap-2">
                <span>{group.title}</span>
                <div className="h-px flex-1 bg-slate-50"></div>
              </h4>

              <div className="grid grid-cols-1 gap-2.5">
                {group.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-3 rounded-3xl bg-slate-100/70 border border-slate-200 hover:border-slate-200 transition-all gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-700">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">
                        {item.description}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          <kbd className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-[#F7B352] shadow-sm">
                            {k}
                          </kbd>
                          {kIdx < item.keys.length - 1 && (
                            <span className="text-xs text-slate-400 font-bold">+</span>
                          )}
                        </React.Fragment>
                      ))}

                      {item.fallback && (
                        <>
                          <span className="text-xs text-slate-400 font-semibold mx-1">
                            {lang === 'bg' ? 'или' : 'or'}
                          </span>
                          {item.fallback.map((fk, fkIdx) => (
                            <React.Fragment key={fkIdx}>
                              <kbd className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-600 shadow-sm">
                                {fk}
                              </kbd>
                              {fkIdx < item.fallback!.length - 1 && (
                                <span className="text-xs text-slate-400">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Quick Tip Box */}
          <div className="p-4 rounded-3xl bg-[#F7B352]/5 border border-[#F7B352]/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#F7B352] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-[#F7B352]">
                {lang === 'bg' ? 'Професионален съвет:' : 'Power User Tip:'}
              </span>{' '}
              {lang === 'bg'
                ? 'Можете да натиснете "?" по всяко време за показване на този екран, или Esc за бързо затваряне на всякакви отворени форми.'
                : 'Press "?" anywhere at any time to open this cheat sheet, or "Esc" to quickly dismiss any open modal dialog.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-100/40 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {lang === 'bg' ? 'Клавишни комбинации за бърза работа' : 'Master your Babylon finances at lightning speed'}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#F7B352] hover:bg-[#E59F2A] active:scale-[0.98] text-slate-900 text-xs font-black transition-all cursor-pointer shadow-sm shadow-[#F7B352]/20"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
