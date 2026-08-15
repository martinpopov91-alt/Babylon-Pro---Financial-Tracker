import React from 'react';
import { 
  Coins, 
  Globe, 
  Sun, 
  Moon, 
  Settings as SettingsIcon, 
  Sparkles, 
  BookOpen
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
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onUpdateSettings,
  onOpenSettings,
  onOpenOnboarding,
  onOpenInstructions
}) => {
  const { settings, transactions } = state;
  const lang = settings.language;
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const currencies: Currency[] = ['BGN', 'EUR', 'USD', 'GBP'];

  return (
    <header id="app-header" className="sticky top-0 z-40 w-full backdrop-blur-md bg-zinc-900/90 border-b border-zinc-800 text-zinc-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-amber-500/20">
            <Coins className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-zinc-100 font-display">
                {t('appTitle')}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Currency Dropdown */}
          <select
            id="currency-selector"
            value={settings.currency}
            onChange={(e) => onUpdateSettings({ currency: e.target.value as Currency })}
            className="bg-zinc-800 text-zinc-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            title="Toggle Language (EN / BG)"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase">{lang}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="theme-toggle-btn"
            onClick={() => onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {settings.theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>

          {/* Instructions Trigger */}
          {onOpenInstructions && (
            <button
              id="open-instructions-btn"
              onClick={onOpenInstructions}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-amber-400 text-xs font-semibold transition-colors cursor-pointer"
              title={t('instructions')}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{t('instructions')}</span>
            </button>
          )}

          {/* Onboarding Wizard Trigger */}
          <button
            id="open-wizard-btn"
            onClick={onOpenOnboarding}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('onboarding')}</span>
          </button>

          {/* Settings Modal Gear Trigger */}
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer"
            title={t('settings')}
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
