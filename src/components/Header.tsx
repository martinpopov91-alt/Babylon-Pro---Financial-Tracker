import React from 'react';
import { 
  Coins, 
  Globe, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  Sparkles, 
  BookOpen,
  Keyboard
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
    <header id="app-header" className="sticky top-0 z-40 w-full backdrop-blur-md bg-zinc-900/90 border-b border-zinc-800 text-zinc-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-sm transition-transform hover:scale-105">
            <Coins className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg tracking-tight text-zinc-100 font-display">
                {t('appTitle')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
            <p className="hidden sm:block text-xs text-zinc-400 font-medium">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Pay Period Interactive Selector */}
        <div className="flex items-center">
          <PayPeriodSelector
            settings={settings}
            transactions={transactions}
            lang={lang}
            onUpdateSettings={onUpdateSettings}
          />
        </div>

        {/* Controls: Currency, Language, Theme, Settings, Wizard */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Currency Dropdown */}
          <select
            id="currency-selector"
            value={settings.currency}
            onChange={(e) => onUpdateSettings({ currency: e.target.value as Currency })}
            className="bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-zinc-700/80 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 cursor-pointer transition-colors"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Language Toggle */}
          <button
            id="language-toggle-btn"
            onClick={() => onUpdateSettings({ language: lang === 'en' ? 'bg' : 'en' })}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            title="Toggle Language (EN / BG)"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="uppercase">{lang}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-300 hover:text-emerald-400 transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Keyboard Shortcuts Trigger */}
          {onOpenShortcuts && (
            <button
              id="open-shortcuts-btn"
              onClick={onOpenShortcuts}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-300 hover:text-emerald-400 transition-colors cursor-pointer hidden md:flex items-center gap-1.5"
              title={`${t('keyboardShortcuts')} (?)`}
            >
              <Keyboard className="w-4 h-4" />
            </button>
          )}

          {/* Instructions Trigger */}
          {onOpenInstructions && (
            <button
              id="open-instructions-btn"
              onClick={onOpenInstructions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-300 hover:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
              title={t('instructions')}
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{t('instructions')}</span>
            </button>
          )}

          {/* Onboarding Wizard Trigger */}
          <button
            id="open-wizard-btn"
            onClick={onOpenOnboarding}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('onboarding')}</span>
          </button>

          {/* Settings Modal Gear Trigger */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/80 text-zinc-300 hover:text-emerald-400 transition-colors cursor-pointer"
            title={t('settings')}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
