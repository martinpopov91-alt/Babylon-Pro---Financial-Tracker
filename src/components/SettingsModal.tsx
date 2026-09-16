import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Banknote, 
  RotateCcw, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  Calendar,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Palette,
  CheckCircle2
} from 'lucide-react';
import { AppSettings, Category, Currency, Language, AppState, Theme } from '../types';
import { getTranslation } from '../constants/translations';
import { CategoryManager } from './CategoryManager';
import { formatCurrency } from '../utils/calculations';
import { GithubCloudSync } from './GithubCloudSync';

interface SettingsModalProps {
  appState: AppState;
  settings: AppSettings;
  categories: Category[];
  lang: Language;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onResetData: () => void;
  onSyncPull: (newState: AppState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  appState,
  settings,
  categories,
  lang,
  onClose,
  onUpdateSettings,
  onAddCategory,
  onDeleteCategory,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onResetData,
  onSyncPull
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'categories' | 'backup'>('general');

  // Form states
  const [salary, setSalary] = useState<number>(settings.salary);
  const [currency, setCurrency] = useState<Currency>(settings.currency);
  const [startDay, setStartDay] = useState<number>(settings.startDay);
  const [tithePercent, setTithePercent] = useState<number>(settings.tithePercent);
  const [wealthPercent, setWealthPercent] = useState<number>(settings.wealthPercent);
  const [rollover, setRollover] = useState<boolean>(settings.rollover);
  const [currentTheme, setCurrentTheme] = useState<Theme>(settings.theme || 'dark');

  useEffect(() => {
    setSalary(settings.salary || 0);
    setCurrency(settings.currency);
    setStartDay(settings.startDay);
    setTithePercent(settings.tithePercent);
    setWealthPercent(settings.wealthPercent);
    setRollover(settings.rollover);
    setCurrentTheme(settings.theme || 'dark');
  }, [settings]);

  const handleThemeChange = (newTheme: Theme) => {
    setCurrentTheme(newTheme);
    onUpdateSettings({ theme: newTheme });
  };

  const handleLanguageChange = (newLang: Language) => {
    onUpdateSettings({ language: newLang });
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      salary,
      currency,
      startDay,
      tithePercent,
      wealthPercent,
      rollover,
      theme: currentTheme
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
    }
  };

  return (
    <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-800 space-y-6 relative overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-[#F7B352]/10 text-[#F7B352] border border-[#F7B352]/30">
              <Settings className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-display text-slate-800">{t('settingsTitle')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-[#F7B352] text-slate-900 font-black shadow-sm shadow-[#F7B352]/20'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/60'
            }`}
          >
            {t('profileAndSalary')}
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'bg-[#F7B352] text-slate-900 font-black shadow-sm shadow-[#F7B352]/20'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{t('appearanceTab')}</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-[#F7B352] text-slate-900 font-black shadow-sm shadow-[#F7B352]/20'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/60'
            }`}
          >
            {t('categoryManagement')}
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-[#F7B352] text-slate-900 font-black shadow-sm shadow-[#F7B352]/20'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/60'
            }`}
          >
            {t('exportImportData')}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* General Tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-4">
              {/* Quick Theme Selector Banner in General Tab for high discoverability */}
              <div className="p-4 bg-slate-50/60 rounded-3xl border border-slate-200/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F7B352] uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    {t('theme')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {settings.theme === 'dark' ? t('darkMode') : t('lightMode')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.theme === 'dark'
                        ? 'bg-[#F7B352]/10 border-[#F7B352] text-[#F7B352] ring-1 ring-[#F7B352]/50'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-[#F7B352]" />
                      <span className="text-xs font-bold">{t('darkMode')}</span>
                    </div>
                    {settings.theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-[#F7B352]" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      settings.theme === 'light'
                        ? 'bg-[#F7B352]/10 border-[#F7B352] text-[#F7B352] ring-1 ring-[#F7B352]/50'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-[#F7B352]" />
                      <span className="text-xs font-bold">{t('lightMode')}</span>
                    </div>
                    {settings.theme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#F7B352]" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('salary')} *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salary}
                    onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('currency')} *</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="BGN">BGN (лв.)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{t('paydayStartDay')} (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={startDay}
                    onChange={(e) => setStartDay(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#F7B352]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="rollover-toggle"
                    checked={rollover}
                    onChange={(e) => setRollover(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-50 border-slate-200 text-[#F7B352] focus:ring-[#F7B352] cursor-pointer accent-[#F7B352]"
                  />
                  <label htmlFor="rollover-toggle" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    {t('rolloverEnabled')}
                  </label>
                </div>
              </div>

              {/* Babylon Rule Sliders */}
              <div className="p-4 bg-slate-50/60 rounded-3xl border border-slate-200/60 space-y-4">
                <h4 className="text-xs font-bold text-[#F7B352] uppercase tracking-wider">{t('babylonHeadline')}</h4>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#E07A6C]">{t('titheShort')}</span>
                    <div className="text-right">
                      <span className="text-[#E07A6C] font-bold">{tithePercent}%</span>
                      <span className="text-slate-400 ml-2">
                        ({formatCurrency((salary * tithePercent) / 100, currency)})
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={tithePercent}
                    onChange={(e) => setTithePercent(parseInt(e.target.value))}
                    className="w-full accent-[#E07A6C] cursor-pointer"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#9BB18A]">{t('wealthShort')}</span>
                    <div className="text-right">
                      <span className="text-[#9BB18A] font-bold">{wealthPercent}%</span>
                      <span className="text-slate-400 ml-2">
                        ({formatCurrency((salary * wealthPercent) / 100, currency)})
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={wealthPercent}
                    onChange={(e) => setWealthPercent(parseInt(e.target.value))}
                    className="w-full accent-[#9BB18A] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#F7B352] hover:bg-[#E59F2A] active:scale-[0.98] text-slate-900 font-black text-sm shadow-sm shadow-[#F7B352]/20 cursor-pointer transition-colors"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          )}

          {/* Dedicated Appearance & Theme Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-800">{t('appearance')}</h3>
                </div>
                <p className="text-xs text-slate-500">
                  {lang === 'bg'
                    ? 'Превключвайте плавно между тъмен и светъл изглед. Промените се отразяват мигновено във целия интерфейс.'
                    : 'Seamlessly switch between dark and light themes. Changes reflect immediately across all components.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Dark Mode Card */}
                  <div
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                      settings.theme === 'dark'
                        ? 'bg-slate-100 border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-400">
                        <Moon className="w-5 h-5" />
                      </div>
                      {settings.theme === 'dark' && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Check className="w-3 h-3 stroke-[3]" />
                          {t('status')}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{t('darkMode')}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{t('darkModeDesc')}</p>
                    </div>

                    {/* Miniature Theme Preview Bars */}
                    <div className="h-4 rounded-lg bg-[#161D27] border border-[#3B4860] p-1 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div className="w-8 h-1.5 rounded-full bg-[#3B4860]" />
                      <div className="w-4 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  </div>

                  {/* Light Mode Card */}
                  <div
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                      settings.theme === 'light'
                        ? 'bg-white border-emerald-500 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-50/80 border-slate-200/80 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
                        <Sun className="w-5 h-5" />
                      </div>
                      {settings.theme === 'light' && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          <Check className="w-3 h-3 stroke-[3]" />
                          {t('status')}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className={`text-sm font-bold mb-1 ${settings.theme === 'light' ? 'text-zinc-900' : 'text-slate-800'}`}>
                        {t('lightMode')}
                      </h4>
                      <p className={`text-xs leading-relaxed ${settings.theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t('lightModeDesc')}
                      </p>
                    </div>

                    {/* Miniature Theme Preview Bars */}
                    <div className="h-4 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] p-1 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-600" />
                      <div className="w-8 h-1.5 rounded-full bg-[#CBD5E1]" />
                      <div className="w-4 h-1.5 rounded-full bg-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Language Selection */}
              <div className="p-4 bg-slate-50/60 rounded-3xl border border-slate-200/60 space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase">{t('language')}</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange('en')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      lang === 'en'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">English (EN)</div>
                      <div className="text-[10px] text-slate-400">United States / Global</div>
                    </div>
                    {lang === 'en' && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLanguageChange('bg')}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      lang === 'bg'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">Български (BG)</div>
                      <div className="text-[10px] text-slate-400">България (лв.)</div>
                    </div>
                    {lang === 'bg' && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                </div>
              </div>

              {/* Live Info Banner */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <Sparkles className="w-4 h-4 flex-shrink-0" />
                <span>{t('themeChanged')}</span>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <CategoryManager
              categories={categories}
              lang={lang}
              onAddCategory={onAddCategory}
              onDeleteCategory={onDeleteCategory}
            />
          )}

          {/* Backup & Cloud Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <GithubCloudSync appState={appState} onSyncPull={onSyncPull} lang={lang} />

              <div className="p-4 bg-slate-50/60 rounded-3xl border border-slate-200/60 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">{t('exportImportData')}</h4>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={onExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-emerald-400 rounded-xl cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('exportCSV')}</span>
                  </button>

                  <button
                    onClick={onExportJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-teal-400 rounded-xl cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('exportJSON')}</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-blue-400 rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>{t('importJSON')}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Reset Data Danger Zone */}
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-3xl space-y-3">
                <h4 className="text-xs font-bold text-rose-400 uppercase">{t('reset')}</h4>
                <p className="text-xs text-slate-500">
                  {t('resetWarning')}
                </p>
                <button
                  type="button"
                  onClick={onResetData}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('reset')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
