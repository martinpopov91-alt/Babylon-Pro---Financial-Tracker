import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  HelpCircle, 
  Receipt, 
  PiggyBank, 
  ArrowRight, 
  Wallet, 
  Calendar, 
  BarChart3, 
  ShieldCheck, 
  RefreshCw, 
  FileSpreadsheet,
  HeartHandshake,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../constants/translations';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onOpenWizard?: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
  lang,
  onOpenWizard
}) => {
  const [activeGuideTab, setActiveGuideTab] = useState<'quick' | 'philosophy' | 'workflow' | 'categories' | 'faq'>('quick');

  if (!isOpen) return null;

  const isBg = lang === 'bg';

  return (
    <div id="instructions-modal" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl text-zinc-100 flex flex-col relative overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-zinc-800/80 bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shadow-sm">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-zinc-100 font-display">
                  {isBg ? 'Ръководство за употреба' : 'Instructions of Use'}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isBg ? 'Първа употреба' : 'First Start'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {isBg 
                  ? 'Как да организирате и управлявате парите си с Babylon Pro step-by-step' 
                  : 'How to manage and optimize your finances with Babylon Pro step-by-step'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            title={isBg ? 'Затвори' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 flex items-center gap-1 sm:gap-2 px-6 py-3 bg-zinc-950/60 border-b border-zinc-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveGuideTab('quick')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeGuideTab === 'quick'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isBg ? '1. Бърз Старт (4 стъпки)' : '1. Quick Start Guide'}</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('philosophy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeGuideTab === 'philosophy'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>{isBg ? '2. Философия на Вавилон' : '2. Babylon Wealth Rules'}</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('workflow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeGuideTab === 'workflow'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isBg ? '3. Работа и Дневен Бюджет' : '3. Daily Budget & Pace'}</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('categories')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeGuideTab === 'categories'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{isBg ? '4. Категории и Сейфове' : '4. Categories & Vaults'}</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('faq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeGuideTab === 'faq'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{isBg ? '5. Често задавани въпроси' : '5. Tips & Backup'}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: QUICK START */}
          {activeGuideTab === 'quick' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                    {isBg ? 'Добре дошли в Babylon Pro!' : 'Welcome to Babylon Pro!'}
                  </h3>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    {isBg 
                      ? 'Приложението изчислява вашите реални свободни пари за живот след задължителните спестявания и фиксирани сметки. Следвайте тези 4 стъпки при първоначална употреба:' 
                      : 'This app isolates your true disposable "Life Money" after setting aside savings and mandatory fixed bills. Follow these 4 quick steps when getting started:'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Step 1 */}
                <div className="p-5 bg-zinc-800/70 border border-zinc-700/80 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/30">
                      1
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                      {isBg ? 'Конфигурация' : 'Configuration'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <span>{isBg ? 'Заплата, Валута и Дата' : 'Set Salary & Payday'}</span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isBg 
                      ? 'Въведете вашата основна чиста заплата, валута (BGN, EUR, USD, GBP) и деня от месеца, в който получавате заплата (напр. 1-ви или 25-ти).' 
                      : 'Enter your monthly salary income, primary currency, and start day of your pay period (e.g. 1st or 25th of the month).'}
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-5 bg-zinc-800/70 border border-zinc-700/80 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 font-black flex items-center justify-center text-sm border border-pink-500/30">
                      2
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                      {isBg ? 'Плати на себе си' : 'Wealth Allocation'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-pink-400" />
                    <span>{isBg ? 'Заделяне на Десятък и Фонд Богатство' : 'Tithe & Wealth Funds'}</span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isBg 
                      ? 'Според древната философия 10% отиват за каузи/десятък и поне 10% за Фонд Богатство (инвестиции) – заделят се АВТОМАТИЧНО преди да похарчите 1 стотинка.' 
                      : 'Automatically lock 10% Tithe and 10% Wealth Fund into investments BEFORE spending anything on daily living.'}
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-5 bg-zinc-800/70 border border-zinc-700/80 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-sm border border-blue-500/30">
                      3
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                      {isBg ? 'Фиксирани Сметки' : 'Obligations'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-400" />
                    <span>{isBg ? 'Въведете Сметки и Дългове' : 'Log Fixed Bills & Loans'}</span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isBg 
                      ? 'В раздел "Сметки и Дългове" въведете наем, ток, застраховки и кредити. Те се изваждат задължително от общия приход.' 
                      : 'In the "Bills & Debts" tab, list rent, utilities, insurance, and loans. They are subtracted upfront.'}
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-5 bg-zinc-800/70 border border-zinc-700/80 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/30">
                      4
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">
                      {isBg ? 'Ежедневна Употреба' : 'Daily Life'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>{isBg ? 'Записвайте Разходи и Следете Темпото' : 'Record Expenses & Track Pace'}</span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isBg 
                      ? 'Използвайте бутона "+ Бързо Добавяне". Следете дневния и седмичния си бюджет на таблото, за да не надвишите наличните пари за живот.' 
                      : 'Use the "+ Quick Add" button for daily spending. Monitor your Daily Budget & Spending Pace gauge on the Dashboard.'}
                  </p>
                </div>

              </div>

              {/* Action Button to launch setup wizard */}
              {onOpenWizard && (
                <div className="p-5 bg-zinc-800/50 border border-zinc-700/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">
                      {isBg ? 'Готови ли сте да конфигурирате профила си?' : 'Ready to set up your profile?'}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isBg ? 'Стартирайте помощника за първоначален старт в 4 стъпки.' : 'Launch the interactive 4-step wizard now.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenWizard();
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isBg ? 'Стартирай Бърз Старт' : 'Launch Setup Wizard'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PHILOSOPHY */}
          {activeGuideTab === 'philosophy' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 bg-zinc-800/80 border border-zinc-700 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-400">
                      {isBg ? 'Древната мъдрост за Вавилонското богатство' : 'The Ancient Babylon Wealth Formula'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {isBg ? 'От книгата "Най-богатият човек във Вавилон"' : 'Based on "The Richest Man in Babylon"'}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic border-l-2 border-emerald-500/50 pl-3 py-1">
                  "{isBg 
                    ? 'Част от всичко, което печелиш, е твое да запазиш. Не трябва да бъде по-малко от една десета, колкото и малка да е заплатата ти.' 
                    : 'A portion of all you earn is yours to keep. It should be not less than a tenth no matter how little you earn.'}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-pink-500/5 border border-pink-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-pink-400 flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4" />
                      {isBg ? '1. Фонд Десятък (10%)' : '1. Tithe Fund (10%)'}
                    </span>
                    <span className="text-xs font-black text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20">10%</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isBg 
                      ? 'Заделяне за благотворителност, помагане на близки и каузи. Изгражда нагласа на изобилие вместо оскъдица.' 
                      : 'Allocated for charity, giving back, and helping family. Fosters an abundance mindset.'}
                  </p>
                </div>

                <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {isBg ? '2. Фонд Богатство (10%+)' : '2. Wealth Fund (10%+)'}
                    </span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">10%</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isBg 
                      ? 'Вашите пари за инвестиции и бъдеща финансова независимост. Тези пари НЕ СЕ ХАРЧАТ за текущи сметки или развлечения.' 
                      : 'Funds reserved for compounding investments and future wealth. NEVER spent on daily consumables.'}
                  </p>
                </div>
              </div>

              <div className="p-5 bg-zinc-800/60 border border-zinc-700/80 rounded-2xl space-y-2">
                <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                  <CalculatorIcon className="w-4 h-4 text-emerald-400" />
                  <span>{isBg ? 'Формула за Свободните Пари за Живот:' : 'Formula for Disposable Life Money:'}</span>
                </h4>
                <div className="p-3 bg-zinc-900 rounded-xl text-xs font-mono text-emerald-400 border border-zinc-700/50 overflow-x-auto">
                  Life Money = Total Income - (Tithe + Wealth Fund + Fixed Bills + Debt Obligations + Goal Allocations)
                </div>
                <p className="text-xs text-zinc-400">
                  {isBg 
                    ? 'Това ви дава пълна яснота колко точно имате за харчене за храна, забавления и пазаруване, без стрес че няма да си платите сметките.' 
                    : 'This removes all anxiety: you know exact spending limits for variable daily life while your savings and bills are 100% guaranteed.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: WORKFLOW */}
          {activeGuideTab === 'workflow' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-5 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-3">
                  <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{isBg ? 'Бюджетен Период и Дневен Бюджет' : 'Pay Period & Daily Budget'}</span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isBg 
                      ? 'Приложението автоматично изчислява оставащите дни до следващата ви заплата и разделя останалите ви парите за живот на дневен и седмичен бюджет.' 
                      : 'The system auto-calculates days remaining until your next payday and splits remaining life money into Daily & Weekly budgets.'}
                  </p>
                  <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
                    <li><strong className="text-zinc-200">{isBg ? 'Дневен бюджет' : 'Daily Budget'}</strong>: {isBg ? 'Максимална препоръчителна сума за харчене днес.' : 'Recommended spending limit for today.'}</li>
                    <li><strong className="text-zinc-200">{isBg ? 'Темпо на харчене' : 'Pace Gauge'}</strong>: {isBg ? 'Зелено (В норма), Жълто (Умерено), Червено (Бързо харчене).' : 'Green (Safe), Yellow (Caution), Red (Alert).'}</li>
                  </ul>
                </div>

                <div className="p-5 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-3">
                  <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>{isBg ? 'Автоматични Повтарящи се Сметки' : 'Automated Monthly Bills'}</span>
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {isBg 
                      ? 'Маркирайте сметките си като "Повтарящи се" в раздел "Сметки и Дългове". В началото на всеки нов месец приложението ще ги записва автоматично в дневника!' 
                      : 'Mark bills as "Recurring" in Bills & Debts. At the start of a new month, the app auto-logs them in your ledger so you don\'t miss any.'}
                  </p>
                </div>

              </div>

              {/* Transaction Ledger & Categories explanation */}
              <div className="p-5 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isBg ? 'Дневник с Транзакции (Excel Стил)' : 'Transaction Ledger (Excel Style)'}</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isBg 
                    ? 'В раздела "Дневник с транзакции" можете да преглеждате, търсите и филтрирате всички ваши разходи и приходи. Можете също да разглеждате обобщение по категории.' 
                    : 'The "Transactions Ledger" tab gives you full search, filtering, category grouping, and editing capabilities for all financial entries.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES & VAULTS */}
          {activeGuideTab === 'categories' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="p-5 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-4">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  <span>{isBg ? 'Новата Организация на Категориите' : 'New Category Hierarchy'}</span>
                </h3>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isBg 
                    ? 'Категориите са подредени в логически основни групи и подкатегории за максимална точност:' 
                    : 'Categories are organized into master groups and subcategories matching your exact needs:'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-zinc-900 border border-orange-500/30 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-orange-400"> Food & Drinks</span>
                    <p className="text-[11px] text-zinc-400">Bar/cafe, Groceries, Restaurant/fast-food</p>
                  </div>

                  <div className="p-3 bg-zinc-900 border border-sky-500/30 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-sky-400"> Shopping</span>
                    <p className="text-[11px] text-zinc-400">Clothes, Drug-store, Electronics, Gifts, Kids, Pets, Home/garden</p>
                  </div>

                  <div className="p-3 bg-zinc-900 border border-amber-500/30 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-amber-400"> Housing</span>
                    <p className="text-[11px] text-zinc-400">Energy/utilities, Maintenance, Mortgage, Rent, Services</p>
                  </div>

                  <div className="p-3 bg-zinc-900 border border-slate-500/30 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-slate-300"> Transportation</span>
                    <p className="text-[11px] text-zinc-400">Business trips, Long distance, Public transport, Taxi</p>
                  </div>

                  <div className="p-3 bg-zinc-900 border border-purple-500/30 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-purple-400"> Vehicle</span>
                    <p className="text-[11px] text-zinc-400">Fuel, Leasing, Parking, Vehicle insurance & maintenance</p>
                  </div>

                  <div className="p-3 bg-zinc-900 border border-emerald-500/30 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-emerald-400"> Life, PC & Others</span>
                    <p className="text-[11px] text-zinc-400">Life & Entertainment, Communication/PC, Investments, Financial</p>
                  </div>
                </div>
              </div>

              {/* Vaults & Sinking funds */}
              <div className="p-5 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-3">
                <h4 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                  <PiggyBank className="w-4 h-4" />
                  <span>{isBg ? 'Спестовни Сейфове и Цели (Sinking Funds)' : 'Sinking Funds & Goal Vaults'}</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isBg 
                    ? 'В раздела "Сейфове и Цели" заделяйте пари за Авариен фонд, Почивки или Ремонт. Когато правите депозит, можете автоматично да го запишете като транзакция в дневника.' 
                    : 'In the "Vaults & Goals" tab, set up targeted funds (Emergency, Vacation, Car). Depositing into a vault automatically logs a savings ledger entry.'}
                </p>
              </div>

            </div>
          )}

          {/* TAB 5: FAQ & TIPS */}
          {activeGuideTab === 'faq' && (
            <div className="space-y-4 animate-fadeIn">
              
              <div className="p-4 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>{isBg ? 'Как да направя резервно копие на данните си?' : 'How do I backup my data?'}</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isBg 
                    ? 'Отидете в Настройки (зъбното колело влиза отгоре) -> "Архивиране и Износ към CSV". Можете да изнесете JSON файл за архив или CSV за Excel.' 
                    : 'Open Settings (gear icon in the top header) -> Data Backup. You can export a full JSON backup file or CSV ledger for Excel.'}
                </p>
              </div>

              <div className="p-4 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>{isBg ? 'Как да променя валутата или езика?' : 'How do I change currency or language?'}</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isBg 
                    ? 'В горната лента (Header) имате падащо меню за валута (BGN, EUR, USD, GBP) и бутон за превключване между Английски (EN) и Български (BG).' 
                    : 'Use the quick dropdowns in the top header to instantly toggle Currency (BGN, EUR, USD, GBP) or Language (EN / BG).'}
                </p>
              </div>

              <div className="p-4 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>{isBg ? 'Какво става, ако прехвърля неизхарчените пари за следващия месец?' : 'What is Rollover Balance?'}</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isBg 
                    ? 'Ако в края на месеца са ви останали пари от "Пари за живот", можете да ги прехвърлите като начален бонус за следващия бюджетен период от Настройки.' 
                    : 'If you have leftover Life Money at the end of the period, you can enable Rollover in Settings to carry it into your next pay cycle!'}
                </p>
              </div>

              <div className="p-4 bg-zinc-800/70 border border-zinc-700 rounded-2xl space-y-1.5">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{isBg ? 'Къде се съхраняват данните ми?' : 'Is my financial data private?'}</span>
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {isBg 
                    ? 'Всички данни се съхраняват сигурно във вашия браузър (Local Storage). Никаква финансова информация не се изпраща към външни сървъри.' 
                    : '100% private. All your financial records are stored locally in your browser storage (localStorage). Nothing leaves your device.'}
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-t border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isBg ? 'Babylon Pro Версия 2.0' : 'Babylon Pro Version 2.0'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            {isBg ? 'Разбрах / Към таблото' : 'Got it / Proceed to Dashboard'}
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper internal icon component
function CalculatorIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}
