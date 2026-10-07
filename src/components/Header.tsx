import React from 'react';
import { 
  Coins, 
  Globe, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  Sparkles, 
  BookOpen,
  Keyboard,
  Search
} from 'lucide-react';
import { AppState, Currency, Language, Theme } from '../types';
import { getTranslation } from '../constants/translations';
import { PayPeriodSelector } from './PayPeriodSelector';

interface HeaderProps {
  state: AppState;
  onUpdateSettings: (newSettings: Partial<AppState['settings']>) => void;
  onOpenSettings: () => void;
  onOpenOnboarding: () => void;
  onOpenInstructions?: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onUpdateSettings,
  onOpenSettings,
  onOpenOnboarding,
  onOpenInstructions,
  onOpenShortcuts
}) => {
  const { settings, transactions } = state;
  const lang = settings.language;
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const currencies: Currency[] = ['BGN', 'EUR', 'USD', 'GBP'];

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#15181E]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors duration-200 shadow-2xs">
      <div className="w-full px-2 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Desktop Search Bar */}
        <div className="hidden lg:block flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder={lang === 'bg' ? 'Търсене...' : 'Search records...'} 
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50/80 dark:bg-[#1A1E26] hover:bg-slate-50 dark:hover:bg-[#20252F] focus:bg-white dark:focus:bg-[#20252F] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#174E5B]/20 dark:focus:ring-emerald-500/20 focus:border-[#174E5B] dark:focus:border-emerald-500 transition-all shadow-2xs"
          />
        </div>

        {/* Pay Period Interactive Selector */}
        <div className="flex items-center flex-shrink min-w-0 justify-center">
          <PayPeriodSelector
            settings={settings}
            transactions={transactions}
            lang={lang}
            onUpdateSettings={onUpdateSettings}
          />
        </div>

        {/* Controls: Currency, Grouped Toggles (Language + Theme), Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Currency Dropdown */}
          <select
            id="currency-selector"
            value={settings.currency}
            onChange={(e) => onUpdateSettings({ currency: e.target.value as Currency })}
            className="bg-slate-50 dark:bg-[#1A1E26] hover:bg-slate-100 dark:hover:bg-[#20252F] text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-[#174E5B]/20 dark:focus:ring-emerald-500/20 focus:border-[#174E5B] dark:focus:border-emerald-500 cursor-pointer transition-colors shadow-2xs"
          >
            {currencies.map((c) => (
              <option key={c} value={c} className="dark:bg-[#1A1E26] dark:text-slate-200">
                {c}
              </option>
            ))}
          </select>

          {/* Grouped Toggles: Language & Theme Pill to prevent mobile overflow */}
          <div className="inline-flex items-center rounded-xl bg-slate-50 dark:bg-[#1A1E26] border border-slate-200 dark:border-slate-700/80 p-0.5 shadow-2xs">
            {/* Language Toggle */}
            <button
              id="language-toggle-btn"
              onClick={() => onUpdateSettings({ language: lang === 'en' ? 'bg' : 'en' })}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg hover:bg-white dark:hover:bg-[#252B37] text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              title="Toggle Language (EN / BG)"
            >
              <Globe className="w-3.5 h-3.5 text-[#174E5B] dark:text-emerald-400" />
              <span className="uppercase text-[10px] sm:text-[11px] font-bold">{lang}</span>
            </button>

            <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700 mx-0.5" />

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className="p-1 sm:p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#252B37] text-slate-500 dark:text-slate-400 hover:text-[#174E5B] dark:hover:text-amber-300 transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {settings.theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#174E5B]" />
              )}
            </button>
          </div>

          {/* Keyboard Shortcuts Trigger (Desktop only) */}
          {onOpenShortcuts && (
            <button
              id="open-shortcuts-btn"
              onClick={onOpenShortcuts}
              className="p-2 rounded-xl bg-slate-50 dark:bg-[#1A1E26] hover:bg-slate-100 dark:hover:bg-[#20252F] text-slate-500 dark:text-slate-400 hover:text-[#174E5B] dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-2xs transition-colors cursor-pointer hidden md:flex items-center gap-1.5"
              title={`${t('keyboardShortcuts')} (?)`}
            >
              <Keyboard className="w-4 h-4" />
            </button>
          )}

          {/* Instructions Trigger (Tablet / Desktop) */}
          {onOpenInstructions && (
            <button
              id="open-instructions-btn"
              onClick={onOpenInstructions}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1A1E26] hover:bg-slate-100 dark:hover:bg-[#20252F] text-slate-600 dark:text-slate-300 hover:text-[#174E5B] dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title={t('instructions')}
            >
              <BookOpen className="w-3.5 h-3.5 text-[#174E5B] dark:text-emerald-400" />
              <span>{t('instructions')}</span>
            </button>
          )}

          {/* Onboarding Wizard Trigger (Desktop) */}
          <button
            id="open-wizard-btn"
            onClick={onOpenOnboarding}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#174E5B]/10 dark:bg-emerald-500/10 hover:bg-[#174E5B]/15 dark:hover:bg-emerald-500/20 text-[#174E5B] dark:text-emerald-400 border border-[#174E5B]/20 dark:border-emerald-500/30 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#174E5B] dark:text-emerald-400" />
            <span>{t('onboarding')}</span>
          </button>

          {/* Settings Modal Gear Trigger */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-1 sm:p-1.5 rounded-xl bg-slate-50 dark:bg-[#1A1E26] hover:bg-slate-100 dark:hover:bg-[#20252F] text-slate-600 dark:text-slate-300 hover:text-[#174E5B] dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700/80 shadow-2xs transition-all cursor-pointer group"
            title={t('settings')}
          >
            <SettingsIcon className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
