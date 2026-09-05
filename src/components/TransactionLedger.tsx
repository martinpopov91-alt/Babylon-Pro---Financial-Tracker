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
  X
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedPeriodScope, setSelectedPeriodScope] = useState<'all' | 'period'>('all');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
        return noteMatch || catMatch || amountMatch;
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100 font-display flex items-center gap-2">
              <span>{isDashboardSnapshot ? (lang === 'bg' ? 'Последни Транзакции' : 'Recent Transactions') : t('transactionHistory')}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {filteredTransactions.length}
              </span>
            </h2>
            {isDashboardSnapshot && onViewAllLedger && (
              <button
                onClick={onViewAllLedger}
                className="hidden sm:flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 ml-2 cursor-pointer transition-colors"
              >
                <span>{lang === 'bg' ? 'Към Пълен Дневник →' : 'View Full Ledger →'}</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
            <span>
              {t('total')}: <strong className="text-zinc-200">{formatCurrency(totalFilteredSum, currency)}</strong>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" />
              <span>{t('income')}: +{formatCurrency(filteredIncomeSum, currency)}</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span className="text-rose-400 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{t('totalExpenses')}: -{formatCurrency(filteredExpenseSum, currency)}</span>
            </span>
            <span className="text-zinc-700">•</span>
            <span className={`font-semibold flex items-center gap-1 ${filteredNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              <Scale className="w-3 h-3" />
              <span>{t('netCashFlow')}: {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, currency)}</span>
            </span>
          </div>
        </div>

        {/* View Mode Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* List vs Summary view toggle */}
          <div className="flex items-center bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/60">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('viewList')}</span>
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'summary'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              title={lang === 'bg' ? 'Импортиране на XML или CSV файл' : 'Import XML or CSV file'}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{lang === 'bg' ? 'Импорт (XML / CSV)' : 'Import (XML / CSV)'}</span>
            </button>
          )}

          {/* Export CSV button */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          {/* Export XML button */}
          {onExportXML && (
            <button
              onClick={onExportXML}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors cursor-pointer"
              title="Export XML"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">XML</span>
            </button>
          )}

          {/* Add Transaction Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
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
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter by Pay Period Scope */}
        <div className="relative">
          <Calendar className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedPeriodScope}
            onChange={(e) => setSelectedPeriodScope(e.target.value as 'all' | 'period')}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">
              {lang === 'bg' ? 'Всички периоди' : 'All Transactions'}
            </option>
            {activePeriodInfo && (
              <option value="period">
                {lang === 'bg' ? `Само ${activePeriodInfo.label}` : `Selected: ${activePeriodInfo.label}`}
              </option>
            )}
          </select>
        </div>

        {/* Filter by Type */}
        <div className="relative">
          <Filter className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">{t('all')} {t('type')}</option>
            <option value="needs">{t('needs')}</option>
            <option value="wants">{t('wants')}</option>
            <option value="savings">{t('savings')}</option>
            <option value="income">{t('income')}</option>
            <option value="bills">{t('bills')}</option>
            <option value="debt">{t('debt')}</option>
          </select>
        </div>

        {/* Filter by Category */}
        <div className="relative">
          <Tag className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">{t('all')} {t('category')}</option>
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
                      {mainName} ({lang === 'bg' ? 'Всички в ' : 'All '}{mainName})
                    </option>
                    {subCats.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {lang === 'bg' ? sub.nameBg : sub.nameEn}
                      </option>
                    ))}
                  </optgroup>
                );
              });

              const remaining = categories.filter(c => !renderedIds.has(c.id));
              if (remaining.length > 0) {
                groups.push(
                  <optgroup key="other_cats" label={lang === 'bg' ? 'Други' : 'Others'}>
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

      {/* Bulk Selection Action Toolbar */}
      {selectedTxIds.length > 0 && viewMode === 'list' && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl animate-fadeIn shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm">
              <CheckSquare className="w-4 h-4" />
              <span>{selectedTxIds.length} {t('selected')}</span>
            </div>
            <div className="text-xs text-zinc-300">
              <span className="text-zinc-400">{t('selectedTotal')}: </span>
              <span className="font-bold text-emerald-400 font-display">
                {formatCurrency(selectedTotalSum, currency)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenBatchCategoryModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title={t('changeCategory')}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>{t('changeCategory')}</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer border border-zinc-700/60"
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
          <div className="p-12 text-center bg-zinc-900/50 border border-zinc-800/80 rounded-2xl space-y-3">
            <p className="text-zinc-400 text-sm font-medium">
              {t('noTransactions')}
            </p>
            <button
              onClick={onOpenQuickAdd}
              className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              + {t('addTransaction')}
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300 min-w-[750px]">
                <thead className="bg-zinc-800/60 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-3.5 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        ref={selectAllRef}
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        aria-label={t('selectAll')}
                        className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
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
                <tbody className="divide-y divide-zinc-800">
                  {filteredTransactions.map((item) => {
                    const isIncome = item.type === 'income';
                    const isSelected = selectedTxIds.includes(item.id);

                    return (
                      <tr 
                        key={item.id} 
                        className={`transition-colors group cursor-pointer ${
                          isSelected 
                            ? 'bg-emerald-500/10 hover:bg-emerald-500/15' 
                            : 'hover:bg-zinc-800/60'
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
                            className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
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
                              const catColor = catObj?.color || '#a1a1aa'; // default zinc-400
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
                        <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                          {item.note || '-'}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold font-display ${isIncome ? 'text-emerald-400' : 'text-zinc-100'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(item.amount, currency)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTransaction(item);
                              }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
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
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
                <tfoot className="bg-zinc-950/90 border-t-2 border-zinc-800 text-xs font-semibold">
                  <tr>
                    <td colSpan={2} className="py-4 px-4 text-zinc-300">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider font-display text-zinc-200 text-[11px]">
                          {t('total')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {filteredTransactions.length} {lang === 'bg' ? 'транзакции' : 'txs'}
                        </span>
                      </div>
                    </td>
                    <td colSpan={3} className="py-4 px-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold text-emerald-500/80">{t('incomeTotal')}:</span>
                          <span className="font-mono font-bold text-xs">+{formatCurrency(filteredIncomeSum, currency)}</span>
                          <span className="text-[10px] text-emerald-500/60 font-normal">({incomeCount})</span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold text-rose-500/80">{t('expenseTotal')}:</span>
                          <span className="font-mono font-bold text-xs">-{formatCurrency(filteredExpenseSum, currency)}</span>
                          <span className="text-[10px] text-rose-500/60 font-normal">({expenseCount})</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="space-y-0.5">
                        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                          {t('netCashFlow')}
                        </div>
                        <div className={`font-mono font-bold text-sm ${filteredNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
            <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                      <span>{t('incomeTotal')}</span>
                      <span className="text-[9px] text-zinc-500 font-normal">({incomeCount})</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-emerald-400 font-display">
                      +{formatCurrency(filteredIncomeSum, currency)}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-zinc-800 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                      <span>{t('expenseTotal')}</span>
                      <span className="text-[9px] text-zinc-500 font-normal">({expenseCount})</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-rose-400 font-display">
                      -{formatCurrency(filteredExpenseSum, currency)}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-zinc-800 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${filteredNet >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('netCashFlow')}</div>
                    <div className={`text-sm font-bold font-mono font-display ${filteredNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, currency)}
                    </div>
                  </div>
                </div>
              </div>

              {isDashboardSnapshot && onViewAllLedger ? (
                <button
                  onClick={onViewAllLedger}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer self-start md:self-auto"
                >
                  <span>{lang === 'bg' ? 'Виж Всички в Дневник →' : 'View All in Ledger →'}</span>
                </button>
              ) : (
                <div className="text-xs text-zinc-500 flex items-center gap-1.5 self-start md:self-auto">
                  <span>{t('displayedTransactions')}:</span>
                  <span className="font-bold text-zinc-300 font-mono">{filteredTransactions.length}</span>
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
                <div key={stat.categoryId} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${getTypeBadgeColor(stat.type)}`}>
                      {getTypeLabel(stat.type, lang)}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">
                      {stat.count} {lang === 'bg' ? 'записа' : 'items'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {(() => {
                        const catObj = categories.find(c => c.id === stat.categoryId);
                        const catColor = catObj?.color || '#a1a1aa';
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
                    <p className="text-2xl font-black text-zinc-100 font-display mt-1">
                      {formatCurrency(stat.totalAmount, currency)}
                    </p>
                  </div>

                  {/* Progress bar relative to total filtered expenses */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-zinc-400 font-medium">
                      <span>{lang === 'bg' ? 'Дял от общите' : 'Share of total'}</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
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
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                      <span>{t('incomeTotal')}</span>
                      <span className="text-[9px] text-zinc-500 font-normal">({incomeCount})</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-emerald-400 font-display">
                      +{formatCurrency(filteredIncomeSum, currency)}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-zinc-800 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider flex items-center gap-1">
                      <span>{t('expenseTotal')}</span>
                      <span className="text-[9px] text-zinc-500 font-normal">({expenseCount})</span>
                    </div>
                    <div className="text-sm font-bold font-mono text-rose-400 font-display">
                      -{formatCurrency(filteredExpenseSum, currency)}
                    </div>
                  </div>
                </div>

                <div className="h-8 w-px bg-zinc-800 hidden sm:block"></div>

                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${filteredNet >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{t('netCashFlow')}</div>
                    <div className={`text-sm font-bold font-mono font-display ${filteredNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet, currency)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-500 flex items-center gap-1.5 self-start md:self-auto">
                <span>{t('displayedTransactions')}:</span>
                <span className="font-bold text-zinc-300 font-mono">{filteredTransactions.length}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5 text-zinc-100">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-bold text-base text-zinc-100 font-display">
                  {lang === 'bg' ? 'Изтриване на множество транзакции' : 'Delete Multiple Transactions'}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {t('confirmDeleteMultiple').replace('{count}', selectedTxIds.length.toString())}
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80 text-xs divide-y divide-zinc-800/40">
              {selectedTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-zinc-300 py-1.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-mono text-zinc-500 text-[10px]">{tx.date}</span>
                    <span className="truncate text-zinc-200">{tx.note || getCategoryName(tx.category, categories, lang)}</span>
                  </div>
                  <span className="font-bold font-mono text-zinc-200 flex-shrink-0">
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800 text-zinc-400">
              <span>{t('total')}:</span>
              <span className="font-bold font-display text-emerald-400 text-sm">{formatCurrency(selectedTotalSum, currency)}</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleExecuteBulkDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 p-5 bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Tag className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-zinc-100 font-display">
                    {t('batchCategoryModalTitle')}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {t('batchCategoryModalSub').replace('{count}', selectedTxIds.length.toString())}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchCategoryModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 p-2 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Category Selector */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('selectTargetCategory')}</span>
                </label>

                <select
                  value={batchTargetCategory}
                  onChange={(e) => setBatchTargetCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer shadow-inner"
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
                        <optgroup key={mainCat.id} label={`${mainName} (${getTypeLabel(mainCat.type, lang)})`}>
                          <option value={mainCat.id}>
                            {mainName}
                          </option>
                          {subCats.map(sub => (
                            <option key={sub.id} value={sub.id}>
                              {lang === 'bg' ? sub.nameBg : sub.nameEn}
                            </option>
                          ))}
                        </optgroup>
                      );
                    });

                    const standalone = categories.filter(c => !renderedIds.has(c.id));
                    if (standalone.length > 0) {
                      groups.push(
                        <optgroup key="other_group" label={lang === 'bg' ? 'Други' : 'Other'}>
                          {standalone.map(cat => (
                            <option key={cat.id} value={cat.id}>
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
              <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncTransactionType}
                    onChange={(e) => setSyncTransactionType(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                  <span>{t('updateTypeToMatch')}</span>
                </label>
              </div>

              {/* Preview of items */}
              <div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{lang === 'bg' ? 'Преглед на избраните транзакции' : 'Preview Selected Transactions'}</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {formatCurrency(selectedTotalSum, currency)}
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 p-3 bg-zinc-950/80 rounded-xl border border-zinc-800/80 text-xs divide-y divide-zinc-800/40">
                  {selectedTransactions.map((tx) => {
                    const currentCatName = getCategoryName(tx.category, categories, lang);
                    const targetCatName = getCategoryName(batchTargetCategory, categories, lang);

                    return (
                      <div key={tx.id} className="flex items-center justify-between text-zinc-300 py-2 first:pt-0 last:pb-0 gap-2">
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <span className="font-mono text-zinc-500 text-[10px] flex-shrink-0">{tx.date}</span>
                          <span className="truncate text-zinc-200 text-xs">{tx.note || currentCatName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 text-xs">
                          <span className="text-zinc-500 max-w-[80px] truncate text-[11px]">{currentCatName}</span>
                          <ArrowRight className="w-3 h-3 text-emerald-500/70" />
                          <span className="text-emerald-400 font-semibold max-w-[90px] truncate text-[11px]">{targetCatName}</span>
                          <span className="font-bold font-mono text-zinc-300 ml-1 text-[11px]">
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
            <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-800 bg-zinc-950/40">
              <button
                onClick={() => setIsBatchCategoryModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleExecuteBatchCategoryUpdate}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
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
