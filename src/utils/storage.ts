import { AppState, Transaction, Category } from '../types';
import { INITIAL_APP_STATE } from '../constants/defaultData';

const STORAGE_KEY = 'babylon_react_app_v1';

export const loadAppState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_APP_STATE;
    }
    const parsed = JSON.parse(raw);
    
    // Ensure all default properties exist if schema updated
    // Combine default categories with custom ones from stored state
    const defaultIds = new Set(INITIAL_APP_STATE.categories.map(c => c.id));
    const customCategories = (parsed.categories || []).filter((c: Category) => c.isCustom || !defaultIds.has(c.id));
    const categories = [...INITIAL_APP_STATE.categories, ...customCategories];

    return {
      isNewUser: parsed.isNewUser ?? INITIAL_APP_STATE.isNewUser,
      settings: { ...INITIAL_APP_STATE.settings, ...(parsed.settings || {}) },
      goals: parsed.goals || INITIAL_APP_STATE.goals,
      bills: parsed.bills || INITIAL_APP_STATE.bills,
      debts: parsed.debts || INITIAL_APP_STATE.debts,
      transactions: parsed.transactions || INITIAL_APP_STATE.transactions,
      categories,
    };
  } catch (error) {
    console.error('Failed to load app state from localStorage:', error);
    return INITIAL_APP_STATE;
  }
};

export const saveAppState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save app state to localStorage:', error);
  }
};

export const exportToCSV = (transactions: Transaction[], currency: string = 'BGN'): void => {
  if (!transactions.length) {
    alert('No transactions to export!');
    return;
  }

  const headers = ['Date', 'Type', 'Category', 'Note', `Amount (${currency})`].join(',');
  const rows = transactions.map(t => {
    const safeNote = `"${(t.note || '').replace(/"/g, '""')}"`;
    return [t.date, t.type, t.category, safeNote, t.amount.toFixed(2)].join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Babylon_Pro_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToXML = (transactions: Transaction[], currency: string = 'BGN'): void => {
  if (!transactions.length) {
    alert('No transactions to export!');
    return;
  }

  const xmlRows = transactions.map(t => {
    const safeNote = (t.note || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const safeCat = (t.category || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `    <transaction>
      <date>${t.date}</date>
      <type>${t.type}</type>
      <category>${safeCat}</category>
      <note>${safeNote}</note>
      <amount>${t.amount.toFixed(2)}</amount>
    </transaction>`;
  }).join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<transactions currency="${currency}">\n${xmlRows}\n</transactions>`;
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Babylon_Pro_Ledger_${new Date().toISOString().split('T')[0]}.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportJSONBackup = (state: AppState): void => {
  const jsonContent = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Babylon_Pro_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
