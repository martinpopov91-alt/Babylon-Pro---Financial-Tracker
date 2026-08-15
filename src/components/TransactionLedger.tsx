import React, { useState, useMemo } from 'react';
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
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { Category, CategoryType, Language, Transaction, AppSettings } from '../types';
import { getTranslation } from '../constants/translations';
import { formatCurrency, getCategoryName, calculatePayPeriodDates } from '../utils/calculations';
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

  // Total filtered sum
  const totalFilteredSum = useMemo(() => {
    return filteredTransactions.reduce((sum, item) => sum + item.amount, 0);
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

  const getTypeBadgeColor = (type: CategoryType) => {
    switch (type) {
      case 'needs': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'wants': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'savings': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'income': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'bills': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'debt': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div id="transaction-ledger" className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-zinc-100 font-display flex items-center gap-2">
              <span>{isDashboardSnapshot ? (lang === 'bg' ? 'Последни Транзакции' : 'Recent Transactions') : t('transactionHistory')}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {filteredTransactions.length}
              </span>
            </h2>
            {isDashboardSnapshot && onViewAllLedger && (
              <button
                onClick={onViewAllLedger}
                className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 ml-2 cursor-pointer transition-colors"
              >
                <span>{lang === 'bg' ? 'Към Пълен Дневник →' : 'View Full Ledger →'}</span>
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            {t('total')}: <span className="font-bold text-zinc-200">{formatCurrency(totalFilteredSum, currency)}</span>
          </p>
        </div>

        {/* View Mode Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* List vs Summary view toggle */}
          <div className="flex items-center bg-zinc-800/80 p-1 rounded-xl border border-zinc-700/60">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
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
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
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
            <Download className="w-3.5 h-3.5 text-amber-400" />
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-colors cursor-pointer"
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
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Filter by Pay Period Scope */}
        <div className="relative">
          <Calendar className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={selectedPeriodScope}
            onChange={(e) => setSelectedPeriodScope(e.target.value as 'all' | 'period')}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
                        └ {lang === 'bg' ? sub.nameBg : sub.nameEn}
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
              className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              + {t('addTransaction')}
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-800/60 text-zinc-400 font-semibold uppercase tracking-wider border-b border-zinc-800">
                  <tr>
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
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-zinc-800/60 transition-colors group cursor-pointer"
                        onClick={() => setEditingTransaction(item)}
                      >
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          {item.date}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTypeBadgeColor(item.type)}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const catObj = categories.find(c => c.id === item.category);
                              const catColor = catObj?.color || '#a1a1aa'; // default zinc-400
                              return (
                                <span 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors hover:opacity-80" 
                                  style={{ 
                                    backgroundColor: `${catColor}15`, 
                                    color: catColor, 
                                    borderColor: `${catColor}30` 
                                  }}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }}></span>
                                  <span className="truncate max-w-[120px] sm:max-w-[160px]">{getCategoryName(item.category, categories, lang)}</span>
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
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title={t('edit')}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTransaction(item.id);
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
              </table>
            </div>

            {isDashboardSnapshot && onViewAllLedger && (
              <div className="p-4 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  {lang === 'bg' ? 'Показване на най-скорошните транзакции' : 'Showing most recent transactions'}
                </span>
                <button
                  onClick={onViewAllLedger}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  <span>{lang === 'bg' ? 'Виж Всички в Дневник →' : 'View All in Ledger →'}</span>
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        /* Category Summary Stats View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryStats.map((stat) => {
            const catName = getCategoryName(stat.categoryId, categories, lang);
            const percentage = totalFilteredSum > 0 ? (stat.totalAmount / totalFilteredSum) * 100 : 0;

            return (
              <div key={stat.categoryId} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getTypeBadgeColor(stat.type)}`}>
                    {stat.type}
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
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold border" 
                          style={{ 
                            backgroundColor: `${catColor}15`, 
                            color: catColor, 
                            borderColor: `${catColor}30` 
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }}></span>
                          <span className="truncate">{catName}</span>
                        </span>
                      )
                    })()}
                  </div>
                  <p className="text-2xl font-black text-amber-400 font-display mt-1">
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
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
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
          onDelete={onDeleteTransaction}
        />
      )}
    </div>
  );
};
