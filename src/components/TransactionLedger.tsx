import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  List, 
  BarChart3, 
  Trash2, 
  Edit3, 
  Download, 
  Plus, 
  Upload,
  Calendar,
  Tag,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  X,
  ChevronDown
} from 'lucide-react';
import { Category, CategoryType, Language, Transaction, AppSettings } from '../types';
import { getTranslation } from '../constants/translations';
import { formatCurrency, getCategoryName, getTypeLabel, getTypeBadgeColor, calculatePayPeriodDates } from '../utils/calculations';
import { CSVImportModal } from './CSVImportModal';
import { EditTransactionModal } from './EditTransactionModal';

interface TransactionLedgerProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  lang: Language;
  settings?: AppSettings;
  isDashboardSnapshot?: boolean;
  initialSearchQuery?: string;
  onViewAllLedger?: () => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteTransactions?: (ids: string[]) => void;
  onBatchUpdateCategory?: (ids: string[], newCategoryId: string, syncType?: boolean) => void;
  onUpdateTransaction?: (updatedTransaction: Transaction) => void;
  onOpenQuickAdd: () => void;
  onExportCSV: () => void;
  onExportXML?: () => void;
  onImportCSV?: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export const TransactionLedger: React.FC<TransactionLedgerProps> = ({
  transactions,
  categories,
  currency,
  lang,
  settings,
  isDashboardSnapshot = false,
  initialSearchQuery = '',
  onViewAllLedger,
  onDeleteTransaction,
  onDeleteTransactions,
  onBatchUpdateCategory,
  onUpdateTransaction,
  onOpenQuickAdd,
  onExportCSV,
  onExportXML,
  onImportCSV
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);

  const [viewMode, setViewMode] = useState<'list' | 'summary'>('list');
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedPeriodScope, setSelectedPeriodScope] = useState<'all' | 'period'>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync initialSearchQuery if passed dynamically
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Multi-select state
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBatchCategoryModalOpen, setIsBatchCategoryModalOpen] = useState(false);
  const [batchTargetCategory, setBatchTargetCategory] = useState<string>('');
  const [syncTransactionType, setSyncTransactionType] = useState<boolean>(true);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  // Active period info
  const activePeriodInfo = useMemo(() => {
    if (!settings) return null;
    return calculatePayPeriodDates(
      settings.startDay,
      settings.customStartDate,
      settings.customEndDate,
      settings.periodMode || (settings.customStartDate && settings.customEndDate ? 'custom' : 'payday'),
      settings.periodOffset || 0,
      lang
    );
  }, [settings, lang]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      // Period filter
      if (selectedPeriodScope === 'period' && activePeriodInfo && item.date) {
        const itemDate = new Date(item.date);
        if (itemDate < activePeriodInfo.startDate || itemDate > activePeriodInfo.endDate) {
          return false;
        }
      }

      // Type match
      if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) {
        return false;
      }
      // Category match
      if (selectedCategoryFilter !== 'all') {
        const catObj = categories.find(c => c.id === selectedCategoryFilter);
        if (catObj) {
          if (!catObj.parentId) {
            // Main category filter: match exact main cat or any subcategory under it
            const subCatIds = categories.filter(c => c.parentId === catObj.id).map(c => c.id);
            const validIds = new Set([catObj.id, ...subCatIds]);
            if (!validIds.has(item.category)) return false;
          } else {
            // Specific subcategory filter
            if (item.category !== selectedCategoryFilter) return false;
          }
        } else if (item.category !== selectedCategoryFilter) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const noteMatch = (item.note || '').toLowerCase().includes(query);
        const catName = getCategoryName(item.category, categories, lang).toLowerCase();
        const catMatch = catName.includes(query);
        const amountMatch = item.amount.toString().includes(query);
        const dateMatch = (item.date || '').toLowerCase().includes(query);
        return noteMatch || catMatch || amountMatch || dateMatch;
      }
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedPeriodScope, activePeriodInfo, selectedTypeFilter, selectedCategoryFilter, searchQuery, categories, lang]);

  // Filtered transaction IDs & selection logic
  const filteredTxIds = useMemo(() => filteredTransactions.map(t => t.id), [filteredTransactions]);
  const isAllSelected = filteredTxIds.length > 0 && filteredTxIds.every(id => selectedTxIds.includes(id));
  const isSomeSelected = filteredTxIds.some(id => selectedTxIds.includes(id)) && !isAllSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredSet = new Set(filteredTxIds);
      setSelectedTxIds(prev => prev.filter(id => !filteredSet.has(id)));
    } else {
      setSelectedTxIds(prev => Array.from(new Set([...prev, ...filteredTxIds])));
    }
  };

  const handleToggleSelectRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedTxIds([]);
  };

  const selectedTransactions = useMemo(() => {
    const idSet = new Set(selectedTxIds);
    return transactions.filter(t => idSet.has(t.id));
  }, [transactions, selectedTxIds]);

  const selectedTotalSum = useMemo(() => {
    return selectedTransactions.reduce((sum, item) => sum + item.amount, 0);
  }, [selectedTransactions]);

  const handleExecuteBulkDelete = () => {
    if (selectedTxIds.length === 0) return;
    if (onDeleteTransactions) {
      onDeleteTransactions(selectedTxIds);
    } else {
      selectedTxIds.forEach(id => onDeleteTransaction(id));
    }
    setSelectedTxIds([]);
    setIsBulkDeleteModalOpen(false);
  };

  const handleOpenBatchCategoryModal = () => {
    if (categories.length > 0 && !batchTargetCategory) {
      setBatchTargetCategory(categories[0].id);
    }
    setIsBatchCategoryModalOpen(true);
  };

  const handleExecuteBatchCategoryUpdate = () => {
    if (selectedTxIds.length === 0 || !batchTargetCategory) return;
    if (onBatchUpdateCategory) {
      onBatchUpdateCategory(selectedTxIds, batchTargetCategory, syncTransactionType);
    } else if (onUpdateTransaction) {
      const targetCat = categories.find(c => c.id === batchTargetCategory);
      selectedTransactions.forEach(tx => {
        onUpdateTransaction({
          ...tx,
          category: batchTargetCategory,
          type: syncTransactionType && targetCat ? targetCat.type : tx.type
        });
      });
    }
    setSelectedTxIds([]);
    setIsBatchCategoryModalOpen(false);
  };

  // Total filtered sum & Income/Expense breakdown
  const totalFilteredSum = useMemo(() => {
    return filteredTransactions.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredTransactions]);

  const { filteredIncomeSum, filteredExpenseSum, filteredNet, incomeCount, expenseCount } = useMemo(() => {
    let inSum = 0;
    let exSum = 0;
    let inCount = 0;
    let exCount = 0;

    filteredTransactions.forEach((item) => {
      if (item.type === 'income') {
        inSum += item.amount;
        inCount += 1;
      } else {
        exSum += item.amount;
        exCount += 1;
      }
    });

    return {
      filteredIncomeSum: inSum,
      filteredExpenseSum: exSum,
      filteredNet: inSum - exSum,
      incomeCount: inCount,
      expenseCount: exCount,
    };
  }, [filteredTransactions]);

  // Category Summary aggregation
  const categoryStats = useMemo(() => {
    const stats: Record<string, { categoryId: string; totalAmount: number; count: number; type: CategoryType }> = {};
    
    filteredTransactions.forEach((t) => {
      const key = t.category || 'other';
      if (!stats[key]) {
        stats[key] = {
          categoryId: key,
          totalAmount: 0,
          count: 0,
          type: t.type
        };
      }
      stats[key].totalAmount += t.amount;
      stats[key].count += 1;
    });

    return Object.values(stats).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [filteredTransactions]);

  return (
    <div id="transaction-ledger" className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display flex items-center gap-2">
              <span>{isDashboardSnapshot ? (lang === 'bg' ? 'Последни Транзакции' : 'Recent Transactions') : t('transactionHistory')}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                {filteredTransactions.length}
              </span>
            </h2>
            {isDashboardSnapshot && onViewAllLedger && (
              <button
                onClick={onViewAllLedger}
                className="hidden sm:flex items-center gap-1 text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 ml-2 cursor-pointer transition-colors"
              >
                <span>{lang === 'bg' ? 'Към Пълен Дневник →' : 'View Full Ledger →'}</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {t('total')}: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(totalFilteredSum, currency)}</strong>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" />
              <span>{t('income')}: +{formatCurrency(filteredIncomeSum, currency)}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{t('totalExpenses')}: -{formatCurrency(filteredExpenseSum, currency)}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className={`font-semibold flex items-center gap-1 ${filteredNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              <Scale className="w-3 h-3" />
              <span>{t('netCashFlow')}: {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, currency)}</span>
            </span>
          </div>
        </div>

        {/* View Mode Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* List vs Summary view toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-[#1A1E26] p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('viewList')}</span>
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t('viewSummary')}</span>
            </button>
          </div>

          {/* Import XML/CSV button */}
          {onImportCSV && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1E26] dark:hover:bg-[#222732] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title={lang === 'bg' ? 'Импортиране на XML или CSV файл' : 'Import XML or CSV file'}
            >
              <Upload className="w-3.5 h-3.5 text-blue-500 dark:text-indigo-400" />
              <span className="hidden sm:inline">{lang === 'bg' ? 'Импорт (XML / CSV)' : 'Import (XML / CSV)'}</span>
            </button>
          )}

          {/* Export CSV button */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1E26] dark:hover:bg-[#222732] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Export XML button */}
          {onExportXML && (
            <button
              onClick={onExportXML}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1E26] dark:hover:bg-[#222732] border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Export XML"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500 dark:text-purple-400" />
              <span className="hidden sm:inline">XML</span>
            </button>
          )}

          {/* Add Transaction Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('add')}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
          />
        </div>

        {/* Filter by Pay Period Scope */}
        <div className="relative">
          <Calendar className="w-4 h-4 text-teal-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedPeriodScope}
            onChange={(e) => setSelectedPeriodScope(e.target.value as 'all' | 'period')}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
          >
            <option value="all" className="dark:bg-[#181B22]">
              {lang === 'bg' ? 'Всички периоди' : 'All Transactions'}
            </option>
            {activePeriodInfo && (
              <option value="period" className="dark:bg-[#181B22]">
                {lang === 'bg' ? `Само ${activePeriodInfo.label}` : `Selected: ${activePeriodInfo.label}`}
              </option>
            )}
          </select>
        </div>

        {/* Filter by Type */}
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
          >
            <option value="all" className="dark:bg-[#181B22]">{t('all')} {t('type')}</option>
            <option value="needs" className="dark:bg-[#181B22]">{t('needs')}</option>
            <option value="wants" className="dark:bg-[#181B22]">{t('wants')}</option>
            <option value="savings" className="dark:bg-[#181B22]">{t('savings')}</option>
            <option value="income" className="dark:bg-[#181B22]">{t('income')}</option>
            <option value="bills" className="dark:bg-[#181B22]">{t('bills')}</option>
            <option value="debt" className="dark:bg-[#181B22]">{t('debt')}</option>
          </select>
        </div>

        {/* Filter by Category */}
        <div className="relative">
          <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
          >
            <option value="all" className="dark:bg-[#181B22]">{t('all')} {t('category')}</option>
            {(() => {
              const mainCategories = categories.filter(c => !c.parentId);
              const renderedIds = new Set<string>();

              const groups = mainCategories.map(mainCat => {
                renderedIds.add(mainCat.id);
                const mainName = lang === 'bg' ? mainCat.nameBg : mainCat.nameEn;
                const subCats = categories.filter(c => c.parentId === mainCat.id);
                subCats.forEach(s => renderedIds.add(s.id));

                return (
                  <optgroup key={mainCat.id} label={mainName} className="dark:bg-[#181B22]">
                    <option value={mainCat.id} className="dark:bg-[#181B22]">
                      {mainName} ({lang === 'bg' ? 'Всички в ' : 'All '}{mainName})
                    </option>
                    {subCats.map(sub => (
                      <option key={sub.id} value={sub.id} className="dark:bg-[#181B22]">
                        {lang === 'bg' ? sub.nameBg : sub.nameEn}
                      </option>
                    ))}
                  </optgroup>
                );
              });

              const remaining = categories.filter(c => !renderedIds.has(c.id));
              if (remaining.length > 0) {
                groups.push(
                  <optgroup key="other_cats" label={lang === 'bg' ? 'Други' : 'Others'} className="dark:bg-[#181B22]">
                    {remaining.map(c => (
                      <option key={c.id} value={c.id} className="dark:bg-[#181B22]">
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

      {/* Bulk Selection Action Toolbar */}
      {selectedTxIds.length > 0 && viewMode === 'list' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-teal-50 dark:bg-emerald-950/30 border border-teal-200 dark:border-emerald-800/50 rounded-3xl animate-fadeIn shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm">
              <CheckSquare className="w-4 h-4" />
              <span>{selectedTxIds.length} {t('selected')}</span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">{t('selectedTotal')}: </span>
              <span className="font-bold text-teal-600 dark:text-emerald-400 font-display">
                {formatCurrency(selectedTotalSum, currency)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center bg-white dark:bg-[#1A1E26] border border-teal-300 dark:border-slate-700 rounded-xl transition-all shadow-2xs">
              <div className="pl-3 pr-1 py-1.5 pointer-events-none flex items-center">
                <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" />
              </div>
              <select
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    if (onBatchUpdateCategory) {
                      onBatchUpdateCategory(selectedTxIds, val, true);
                    } else if (onUpdateTransaction) {
                      const targetCat = categories.find(c => c.id === val);
                      selectedTransactions.forEach(tx => {
                        onUpdateTransaction({
                          ...tx,
                          category: targetCat?.id || val,
                          type: targetCat?.type || tx.type,
                        });
                      });
                    }
                    setSelectedTxIds([]);
                  }
                }}
                className="bg-transparent text-teal-700 dark:text-teal-300 text-xs font-bold focus:outline-none cursor-pointer appearance-none py-1.5 pr-8 pl-1 w-full"
                title={t('changeCategory')}
              >
                <option value="" disabled className="dark:bg-[#1A1E26]">{t('changeCategory')}</option>
                {(() => {
                  const mainCategories = categories.filter(c => !c.parentId);
                  const renderedIds = new Set<string>();
                  const groups = mainCategories.map(mainCat => {
                    renderedIds.add(mainCat.id);
                    const mainName = lang === 'bg' ? mainCat.nameBg : mainCat.nameEn;
                    const subCats = categories.filter(c => c.parentId === mainCat.id);
                    subCats.forEach(s => renderedIds.add(s.id));
                    return (
                      <optgroup key={mainCat.id} label={`${mainName} (${getTypeLabel(mainCat.type, lang)})`} className="dark:bg-[#1A1E26]">
                        <option value={mainCat.id} className="dark:bg-[#1A1E26]">
                          {mainName}
                        </option>
                        {subCats.map(sub => (
                          <option key={sub.id} value={sub.id} className="dark:bg-[#1A1E26]">
                            {lang === 'bg' ? sub.nameBg : sub.nameEn}
                          </option>
                        ))}
                      </optgroup>
                    );
                  });
                  const standalone = categories.filter(c => !renderedIds.has(c.id));
                  if (standalone.length > 0) {
                    groups.push(
                      <optgroup key="other_group" label={lang === 'bg' ? 'Други' : 'Other'} className="dark:bg-[#1A1E26]">
                        {standalone.map(cat => (
                          <option key={cat.id} value={cat.id} className="dark:bg-[#1A1E26]">
                            {lang === 'bg' ? cat.nameBg : cat.nameEn}
                          </option>
                        ))}
                      </optgroup>
                    );
                  }
                  return groups;
                })()}
              </select>
              <div className="absolute right-3 pointer-events-none text-teal-600 dark:text-teal-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            <button
              onClick={handleClearSelection}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1E26] dark:hover:bg-[#222732] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <X className="w-3.5 h-3.5" />
              <span>{t('deselectAll')}</span>
            </button>

            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('deleteSelected')} ({selectedTxIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Content Section: LIST VIEW vs SUMMARY VIEW */}
      {viewMode === 'list' ? (
        /* List View Table / Cards */
        filteredTransactions.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl space-y-3 shadow-xs">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              {t('noTransactions')}
            </p>
            <button
              onClick={onOpenQuickAdd}
              className="px-4 py-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-xs font-bold hover:bg-teal-500/20 transition-colors cursor-pointer"
            >
              + {t('addTransaction')}
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            {/* Mobile Card-Based Row Layout (Phones & small screens) */}
            <div className="md:hidden">
              {/* Mobile Select All & Count Bar */}
              <div className="p-3 bg-slate-50 dark:bg-[#15171E] border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    aria-label={t('selectAll')}
                    className="w-4 h-4 rounded bg-white dark:bg-[#1A1E26] border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                  />
                  <span>{t('selectAll')}</span>
                </label>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {filteredTransactions.length} {lang === 'bg' ? 'транзакции' : 'items'}
                </span>
              </div>

              {/* Mobile Transaction Cards */}
              <div className="p-3 space-y-2.5 bg-slate-50/40 dark:bg-[#12141A]/50">
                {filteredTransactions.map((item) => {
                  const isIncome = item.type === 'income';
                  const isSelected = selectedTxIds.includes(item.id);
                  const catObj = categories.find(c => c.id === item.category);
                  const catColor = catObj?.color || '#0d9488';

                  return (
                    <div
                      key={item.id}
                      onClick={() => setEditingTransaction(item)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/90 dark:bg-emerald-950/30 border-teal-300 dark:border-emerald-800/60 shadow-xs'
                          : 'bg-white dark:bg-[#181B22] hover:bg-slate-50/80 dark:hover:bg-[#1E222B] border-slate-200/90 dark:border-slate-800 shadow-2xs'
                      }`}
                    >
                      {/* Top Row: Checkbox, Category Badge, Type Tag, Amount */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelectRow(item.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(item.id)}
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Select transaction ${item.id}`}
                              className="w-4 h-4 rounded bg-white dark:bg-[#1A1E26] border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                            />
                          </div>

                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border truncate max-w-[130px]"
                            style={{
                              backgroundColor: `${catColor}14`,
                              color: catColor,
                              borderColor: `${catColor}28`
                            }}
                          >
                            {getCategoryName(item.category, categories, lang)}
                          </span>

                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeBadgeColor(item.type)}`}>
                            {getTypeLabel(item.type, lang)}
                          </span>
                        </div>

                        <div className={`font-bold font-display text-sm sm:text-base whitespace-nowrap ${
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                        }`}>
                          {isIncome ? '+' : '-'}{formatCurrency(item.amount, currency)}
                        </div>
                      </div>

                      {/* Middle Row: Note / Description */}
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-1 mb-2">
                        {item.note || getCategoryName(item.category, categories, lang)}
                      </div>

                      {/* Bottom Row: Date & Action Icons */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 font-mono text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          <span>{item.date}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransaction(item);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title={t('edit')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteTransaction(item.id);
                              setSelectedTxIds(prev => prev.filter(id => id !== item.id));
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title={t('delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop View Table (Tablets & Desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 min-w-[750px]">
                <thead className="bg-slate-50 dark:bg-[#15171E] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        ref={selectAllRef}
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        aria-label={t('selectAll')}
                        className="w-4 h-4 rounded bg-white dark:bg-[#1A1E26] border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                      />
                    </th>
                    <th className="py-3.5 px-4">{t('date')}</th>
                    <th className="py-3.5 px-4">{t('type')}</th>
                    <th className="py-3.5 px-4">{t('category')}</th>
                    <th className="py-3.5 px-4">{t('notes')}</th>
                    <th className="py-3.5 px-4 text-right">{t('amount')}</th>
                    <th className="py-3.5 px-4 text-center">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTransactions.map((item) => {
                    const isIncome = item.type === 'income';
                    const isSelected = selectedTxIds.includes(item.id);

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors group cursor-pointer ${
                          isSelected 
                            ? 'bg-teal-50/80 dark:bg-emerald-950/30 hover:bg-teal-100/70 dark:hover:bg-emerald-950/50' 
                            : 'hover:bg-slate-50/80 dark:hover:bg-[#1E222B]'
                        }`}
                        onClick={() => setEditingTransaction(item)}
                      >
                        <td 
                          className="py-3 px-4 text-center w-10"
                          onClick={(e) => handleToggleSelectRow(item.id, e)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select transaction ${item.id}`}
                            className="w-4 h-4 rounded bg-white dark:bg-[#1A1E26] border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                          {item.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${getTypeBadgeColor(item.type)}`}>
                            {getTypeLabel(item.type, lang)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const catObj = categories.find(c => c.id === item.category);
                              const catColor = catObj?.color || '#0d9488';
                              return (
                                <span 
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:opacity-85" 
                                  style={{ 
                                    backgroundColor: `${catColor}14`, 
                                    color: catColor, 
                                    borderColor: `${catColor}28` 
                                  }}
                                  title={getCategoryName(item.category, categories, lang)}
                                >
                                  <span className="truncate max-w-[130px] sm:max-w-[170px]">{getCategoryName(item.category, categories, lang)}</span>
                                </span>
                              )
                            })()}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {item.note || '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold font-display ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(item.amount, currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTransaction(item);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 dark:hover:text-emerald-400 hover:bg-teal-50 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                              title={t('edit')}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction(item.id);
                                setSelectedTxIds(prev => prev.filter(id => id !== item.id));
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title={t('delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50/90 dark:bg-[#15171E] border-t-2 border-slate-200 dark:border-slate-800 text-xs font-semibold">
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider font-display text-slate-800 dark:text-white text-[11px]">
                          {t('total')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-[#1A1E26] text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                          {filteredTransactions.length} {lang === 'bg' ? 'транзакции' : 'txs'}
                        </span>
                      </div>
                    </td>
                    <td colSpan={3} className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold text-emerald-800/80 dark:text-emerald-500/80">{t('incomeTotal')}:</span>
                          <span className="font-mono font-bold text-xs">+{formatCurrency(filteredIncomeSum, currency)}</span>
                          <span className="text-[10px] text-emerald-700/70 dark:text-emerald-500/60 font-normal">({incomeCount})</span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold text-rose-800/80 dark:text-rose-500/80">{t('expenseTotal')}:</span>
                          <span className="font-mono font-bold text-xs">-{formatCurrency(filteredExpenseSum, currency)}</span>
                          <span className="text-[10px] text-rose-700/70 dark:text-rose-500/60 font-normal">({expenseCount})</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 tracking-wider">
                          {t('netCashFlow')}
                        </div>
                        <div className={`font-mono font-bold text-sm ${filteredNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, currency)}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Summary Bar for Filtered Totals */}
            <div className="p-4 bg-slate-50/90 dark:bg-[#15171E] border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <span>{t('incomeTotal')}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">({incomeCount})</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 font-display">
                      +{formatCurrency(filteredIncomeSum, currency)}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <span>{t('expenseTotal')}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">({expenseCount})</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 font-display">
                      -{formatCurrency(filteredExpenseSum, currency)}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${filteredNet >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">{t('netCashFlow')}</div>
                    <div className={`text-sm font-bold font-mono font-display ${filteredNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, currency)}
                    </div>
                  </div>
                </div>
              </div>

              {isDashboardSnapshot && onViewAllLedger ? (
                <button
                  onClick={onViewAllLedger}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-teal-700 dark:text-emerald-400 border border-teal-200 dark:border-emerald-500/20 text-xs font-bold transition-all cursor-pointer self-start md:self-auto"
                >
                  <span>{lang === 'bg' ? 'Виж Всички в Дневник →' : 'View All in Ledger →'}</span>
                </button>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 self-start md:self-auto">
                  <span>{t('displayedTransactions')}:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{filteredTransactions.length}</span>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* Category Summary Stats View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((stat) => {
              const catName = getCategoryName(stat.categoryId, categories, lang);
              const percentage = totalFilteredSum > 0 ? (stat.totalAmount / totalFilteredSum) * 100 : 0;

              return (
                <div key={stat.categoryId} className="bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${getTypeBadgeColor(stat.type)}`}>
                      {getTypeLabel(stat.type, lang)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {stat.count} {lang === 'bg' ? 'записа' : 'items'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {(() => {
                        const catObj = categories.find(c => c.id === stat.categoryId);
                        const catColor = catObj?.color || '#0d9488';
                        return (
                          <span 
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border" 
                            style={{ 
                              backgroundColor: `${catColor}14`, 
                              color: catColor, 
                              borderColor: `${catColor}28` 
                            }}
                          >
                            <span className="truncate">{catName}</span>
                          </span>
                        )
                      })()}
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white font-display mt-1">
                      {formatCurrency(stat.totalAmount, currency)}
                    </p>
                  </div>

                  {/* Progress bar relative to total filtered expenses */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>{lang === 'bg' ? 'Дял от общите' : 'Share of total'}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"
                        style={{ width: `${Math.min(100, percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Summary Bar for Summary View */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 bg-white dark:bg-[#181B22] border border-slate-200/90 dark:border-slate-800 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <span>{t('incomeTotal')}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">({incomeCount})</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 font-display">
                      +{formatCurrency(filteredIncomeSum, currency)}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1">
                      <span>{t('expenseTotal')}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">({expenseCount})</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 font-display">
                      -{formatCurrency(filteredExpenseSum, currency)}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${filteredNet >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">{t('netCashFlow')}</div>
                    <div className={`text-sm font-bold font-mono font-display ${filteredNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, currency)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 self-start md:self-auto">
                <span>{t('displayedTransactions')}:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">{filteredTransactions.length}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && onImportCSV && (
        <CSVImportModal
          categories={categories}
          currency={currency}
          lang={lang}
          onClose={() => setIsImportModalOpen(false)}
          onImport={onImportCSV}
        />
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          categories={categories}
          currency={currency}
          lang={lang}
          onClose={() => setEditingTransaction(null)}
          onSave={(updated) => {
            if (onUpdateTransaction) {
              onUpdateTransaction(updated);
            }
          }}
          onDelete={(id) => {
            onDeleteTransaction(id);
            setSelectedTxIds(prev => prev.filter(item => item !== id));
          }}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                  {lang === 'bg' ? 'Изтриване на множество транзакции' : 'Delete Multiple Transactions'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('confirmDeleteMultiple').replace('{count}', selectedTxIds.length.toString())}
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-slate-50 dark:bg-[#15171E] rounded-xl border border-slate-200 dark:border-slate-800 text-xs divide-y divide-slate-200/60 dark:divide-slate-800/80">
              {selectedTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-1.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px]">{tx.date}</span>
                    <span className="truncate text-slate-800 dark:text-slate-200">{tx.note || getCategoryName(tx.category, categories, lang)}</span>
                  </div>
                  <span className="font-bold font-mono text-slate-900 dark:text-white flex-shrink-0">
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <span>{t('total')}:</span>
              <span className="font-bold font-display text-teal-600 dark:text-emerald-400 text-sm">{formatCurrency(selectedTotalSum, currency)}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1E26] dark:hover:bg-[#222732] text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleExecuteBulkDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('delete')} ({selectedTxIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Update Category Modal */}
      {isBatchCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B22] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-5 bg-slate-50 dark:bg-[#15171E]">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-teal-50 dark:bg-emerald-500/10 text-teal-600 dark:text-emerald-400 border border-teal-200 dark:border-emerald-500/20">
                  <Tag className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-display">
                    {t('batchCategoryModalTitle')}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('batchCategoryModalSub').replace('{count}', selectedTxIds.length.toString())}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-emerald-400" />
                  <span>{t('selectTargetCategory')}</span>
                </label>

                <select
                  value={batchTargetCategory}
                  onChange={(e) => setBatchTargetCategory(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A1E26] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-teal-500 dark:focus:border-emerald-500 transition-colors cursor-pointer shadow-2xs"
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
                        <optgroup key={mainCat.id} label={`${mainName} (${getTypeLabel(mainCat.type, lang)})`} className="dark:bg-[#1A1E26]">
                          <option value={mainCat.id} className="dark:bg-[#1A1E26]">
                            {mainName}
                          </option>
                          {subCats.map(sub => (
                            <option key={sub.id} value={sub.id} className="dark:bg-[#1A1E26]">
                              {lang === 'bg' ? sub.nameBg : sub.nameEn}
                            </option>
                          ))}
                        </optgroup>
                      );
                    });

                    const standalone = categories.filter(c => !renderedIds.has(c.id));
                    if (standalone.length > 0) {
                      groups.push(
                        <optgroup key="other_group" label={lang === 'bg' ? 'Други' : 'Other'} className="dark:bg-[#1A1E26]">
                          {standalone.map(cat => (
                            <option key={cat.id} value={cat.id} className="dark:bg-[#1A1E26]">
                              {lang === 'bg' ? cat.nameBg : cat.nameEn}
                            </option>
                          ))}
                        </optgroup>
                      );
                    }

                    return groups;
                  })()}
                </select>
              </div>

              {/* Auto sync type checkbox */}
              <div className="p-3 bg-slate-50 dark:bg-[#15171E] rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncTransactionType}
                    onChange={(e) => setSyncTransactionType(e.target.checked)}
                    className="w-4 h-4 rounded bg-white dark:bg-[#1A1E26] border-slate-300 dark:border-slate-700 text-teal-600 focus:ring-teal-500 cursor-pointer accent-teal-600"
                  />
                  <span>{t('updateTypeToMatch')}</span>
                </label>
              </div>

              {/* Preview of items */}
              <div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{lang === 'bg' ? 'Преглед на избраните транзакции' : 'Preview Selected Transactions'}</span>
                  <span className="text-teal-600 dark:text-emerald-400 font-mono font-bold">
                    {formatCurrency(selectedTotalSum, currency)}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-slate-50 dark:bg-[#15171E] rounded-xl border border-slate-200 dark:border-slate-800 text-xs divide-y divide-slate-200/60 dark:divide-slate-800/80">
                  {selectedTransactions.map((tx) => {
                    const currentCatName = getCategoryName(tx.category, categories, lang);
                    const targetCatName = getCategoryName(batchTargetCategory, categories, lang);

                    return (
                      <div key={tx.id} className="flex items-center justify-between text-slate-700 dark:text-slate-300 py-2 first:pt-0 last:pb-0 gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <span className="font-mono text-slate-400 dark:text-slate-500 text-[10px] flex-shrink-0">{tx.date}</span>
                          <span className="truncate text-slate-800 dark:text-slate-200 text-xs">{tx.note || currentCatName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs">
                          <span className="text-slate-400 dark:text-slate-500 max-w-[80px] truncate text-[11px]">{currentCatName}</span>
                          <ArrowRight className="w-3 h-3 text-[#F7B352]" />
                          <span className="text-teal-600 dark:text-emerald-400 font-semibold max-w-[90px] truncate text-[11px]">{targetCatName}</span>
                          <span className="font-bold font-mono text-slate-700 dark:text-slate-300 ml-1 text-[11px]">
                            {formatCurrency(tx.amount, currency)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#15171E]">
              <button
                onClick={() => setIsBatchCategoryModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1A1E26] dark:hover:bg-[#222732] text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleExecuteBatchCategoryUpdate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{t('applyCategory')} ({selectedTxIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
