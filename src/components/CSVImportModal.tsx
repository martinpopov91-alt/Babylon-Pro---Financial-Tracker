import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, Trash2, Edit3, Save, FileCode, FileText, Code2, Copy, Check } from 'lucide-react';
import { Category, Transaction, Language } from '../types';
import { getTranslation } from '../constants/translations';
import { getCategoryName } from '../utils/calculations';
import { parseXMLTransactions } from '../utils/xmlParser';

interface CSVImportModalProps {
  categories: Category[];
  currency: string;
  lang: Language;
  onClose: () => void;
  onImport: (transactions: Omit<Transaction, 'id'>[]) => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  categories,
  currency,
  lang,
  onClose,
  onImport,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(lang, key);
  
  const [parsedTransactions, setParsedTransactions] = useState<Omit<Transaction, 'id'>[]>([]);
  const [detectedFormat, setDetectedFormat] = useState<'csv' | 'xml' | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Omit<Transaction, 'id'> | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTabFormat, setActiveTabFormat] = useState<'all' | 'xml' | 'csv'>('all');
  const [copiedSample, setCopiedSample] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMessage(null);
    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      
      if (!text.trim()) {
        setErrorMessage(lang === 'bg' ? 'Файлът е празен.' : 'The selected file is empty.');
        return;
      }

      // Detect XML vs CSV
      const isXML = fileName.endsWith('.xml') || text.trim().startsWith('<');

      if (isXML) {
        try {
          const results = parseXMLTransactions(text, categories);
          if (results.length === 0) {
            setErrorMessage(lang === 'bg' ? 'Няма намерени валидни транзакции в XML файла.' : 'No valid transaction records found in the XML file.');
            return;
          }
          setParsedTransactions(results);
          setDetectedFormat('xml');
        } catch (err: any) {
          console.error('XML parsing error:', err);
          setErrorMessage(
            lang === 'bg' 
              ? `Грешка при обработка на XML: ${err.message || 'Невалиден XML формат.'}` 
              : `XML Parsing Error: ${err.message || 'Invalid XML format.'}`
          );
        }
      } else {
        // Parse CSV
        try {
          const results = parseCSV(text);
          if (results.length === 0) {
            setErrorMessage(lang === 'bg' ? 'Няма намерени данни за импортиране в CSV файла.' : 'No data found to import in the CSV file.');
            return;
          }
          setParsedTransactions(results);
          setDetectedFormat('csv');
        } catch (err: any) {
          console.error('CSV parsing error:', err);
          setErrorMessage(
            lang === 'bg' 
              ? 'Грешка при разчитане на CSV файла.' 
              : 'Error parsing the CSV file.'
          );
        }
      }
    };

    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const parseCSV = (text: string): Omit<Transaction, 'id'>[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];

    const transactions: Omit<Transaction, 'id'>[] = [];
    
    // Skip header line (index 0)
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVRow(lines[i]);
      if (row.length >= 5) {
        let dateStr = row[0].trim();
        const typeRaw = row[1].trim().toLowerCase();
        let typeStr: Transaction['type'] = 'needs';
        if (['needs', 'wants', 'savings', 'income', 'bills', 'debt'].includes(typeRaw)) {
          typeStr = typeRaw as Transaction['type'];
        }
        
        let catStr = row[2].trim();
        const exists = categories.find(c => c.id === catStr || c.nameEn.toLowerCase() === catStr.toLowerCase() || c.nameBg.toLowerCase() === catStr.toLowerCase());
        if (exists) {
          catStr = exists.id;
        } else {
          catStr = 'cat_other_expense';
        }
        
        const noteStr = row[3].trim();
        let amountNum = parseFloat(row[4].trim());
        if (isNaN(amountNum)) amountNum = 0;

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          dateStr = new Date().toISOString().split('T')[0];
        }

        transactions.push({
          date: dateStr,
          type: typeStr,
          category: catStr,
          note: noteStr,
          amount: Math.abs(amountNum)
        });
      }
    }
    
    return transactions;
  };

  const parseCSVRow = (text: string) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"') {
        if (inQuotes && text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...parsedTransactions[index] });
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editForm) {
      const updated = [...parsedTransactions];
      updated[editingIndex] = editForm;
      setParsedTransactions(updated);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const handleDelete = (index: number) => {
    const updated = parsedTransactions.filter((_, i) => i !== index);
    setParsedTransactions(updated);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleConfirmImport = () => {
    if (parsedTransactions.length > 0) {
      onImport(parsedTransactions);
      onClose();
    }
  };

  const sampleXML = `<?xml version="1.0" encoding="UTF-8"?>
<AccountMovements>
  <AccountMovement>
    <ValueDate>12.08.2026</ValueDate>
    <Reason>474835xxxxxx9054 ПОС 12.08.2026 23:03&lt;br/&gt;Авт. код: 3ME1BV</Reason>
    <OppositeSideName>BGR GR SOFIYA SPEEDY PLC</OppositeSideName>
    <OppositeSideAccount/>
    <MovementType>Debit</MovementType>
    <Amount>59,38</Amount>
  </AccountMovement>
  <AccountMovement>
    <ValueDate>13.08.2026</ValueDate>
    <Reason>ПОГАСЯВАНЕ НА ЗАДЪЛЖЕНИЕ</Reason>
    <OppositeSideName>МАРТИН БОРИСЛАВОВ ПОПОВ</OppositeSideName>
    <OppositeSideAccount>BG03STSA93000029179188</OppositeSideAccount>
    <MovementType>Credit</MovementType>
    <Amount>52,69</Amount>
  </AccountMovement>
</AccountMovements>`;

  const copySampleXML = () => {
    navigator.clipboard.writeText(sampleXML);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col my-8 shadow-2xl relative" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 p-6 shrink-0">
          <div>
            <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              <span>{lang === 'bg' ? 'Импортиране на Файл (XML & CSV)' : 'Import Transactions (XML & CSV)'}</span>
            </h3>
            <p className="text-sm text-zinc-400 mt-1">
              {lang === 'bg' 
                ? 'Качете XML или CSV файл, прегледайте и редактирайте преди импорт.' 
                : 'Upload an XML or CSV file, preview and edit before importing.'}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grow space-y-6">
          {errorMessage && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)} className="text-xs underline hover:text-rose-300">
                {lang === 'bg' ? 'Затвори' : 'Dismiss'}
              </button>
            </div>
          )}

          {parsedTransactions.length === 0 ? (
            <div className="space-y-6">
              {/* Dropzone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center transition-all ${
                  isDragOver 
                    ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]' 
                    : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <FileCode className="w-7 h-7" />
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <FileText className="w-7 h-7" />
                  </div>
                </div>

                <h4 className="text-zinc-200 font-bold text-base mb-1">
                  {lang === 'bg' ? 'Плъзнете XML или CSV файл тук' : 'Drag & drop XML or CSV file here'}
                </h4>
                <p className="text-xs text-zinc-500 mb-6 max-w-md">
                  {lang === 'bg' 
                    ? 'Поддържа стандартни XML структури, банкови извлечения и CSV формати (Дата, Тип, Категория, Бележка, Сума).' 
                    : 'Supports standard XML files, bank statements, and CSV formats (Date, Type, Category, Note, Amount).'}
                </p>

                <input
                  type="file"
                  accept=".xml,.csv,text/xml,application/xml,text/csv"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="transaction-file-upload"
                />
                
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <label 
                    htmlFor="transaction-file-upload"
                    className="px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm cursor-pointer transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{lang === 'bg' ? 'Избери XML / CSV Файл' : 'Choose XML / CSV File'}</span>
                  </label>
                </div>
              </div>

              {/* Sample XML Guide Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-purple-400" />
                    <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      {lang === 'bg' ? 'Примерен XML Формат' : 'Sample XML Format'}
                    </h5>
                  </div>
                  <button
                    type="button"
                    onClick={copySampleXML}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
                  >
                    {copiedSample ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSample ? (lang === 'bg' ? 'Копирано!' : 'Copied!') : (lang === 'bg' ? 'Копирай' : 'Copy')}</span>
                  </button>
                </div>

                <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-mono text-purple-300 overflow-x-auto">
                  {sampleXML}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-bold text-zinc-100 flex items-center gap-2">
                    <span>{lang === 'bg' ? 'Преглед на транзакциите' : 'Transactions Preview'}</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20 font-bold">
                      {parsedTransactions.length}
                    </span>
                  </h4>

                  {detectedFormat && (
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                      detectedFormat === 'xml' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                    }`}>
                      {detectedFormat.toUpperCase()} {lang === 'bg' ? 'Формат' : 'Format'}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setParsedTransactions([]);
                    setDetectedFormat(null);
                    setErrorMessage(null);
                  }}
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  {lang === 'bg' ? 'Изчисти и качи друг файл' : 'Clear and upload another file'}
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-zinc-300 min-w-[650px]">
                    <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{t('date')}</th>
                        <th className="py-3 px-4">{t('type')}</th>
                        <th className="py-3 px-4">{t('category')}</th>
                        <th className="py-3 px-4">{t('notes')}</th>
                        <th className="py-3 px-4 text-right">{t('amount')} ({currency})</th>
                        <th className="py-3 px-4 text-center">{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {parsedTransactions.map((tx, idx) => {
                        const isEditing = editingIndex === idx;

                        return (
                          <tr key={idx} className={isEditing ? 'bg-zinc-800/50' : 'hover:bg-zinc-900/50'}>
                            <td className="py-2.5 px-4 font-mono">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editForm?.date || ''}
                                  onChange={e => setEditForm(prev => prev ? { ...prev, date: e.target.value } : null)}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
                                />
                              ) : tx.date}
                            </td>
                            <td className="py-2.5 px-4">
                              {isEditing ? (
                                <select
                                  value={editForm?.type || 'needs'}
                                  onChange={e => setEditForm(prev => prev ? { ...prev, type: e.target.value as Transaction['type'] } : null)}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
                                >
                                  <option value="needs">{t('needs')}</option>
                                  <option value="wants">{t('wants')}</option>
                                  <option value="savings">{t('savings')}</option>
                                  <option value="income">{t('income')}</option>
                                  <option value="bills">{t('bills')}</option>
                                  <option value="debt">{t('debt')}</option>
                                </select>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 border border-zinc-700 text-zinc-300">
                                  {tx.type}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              {isEditing ? (
                                <select
                                  value={editForm?.category || ''}
                                  onChange={e => setEditForm(prev => prev ? { ...prev, category: e.target.value } : null)}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>
                                      {lang === 'bg' ? c.nameBg : c.nameEn}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="font-medium text-zinc-200">
                                  {getCategoryName(tx.category, categories, lang)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm?.note || ''}
                                  onChange={e => setEditForm(prev => prev ? { ...prev, note: e.target.value } : null)}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100"
                                />
                              ) : (
                                <span className="text-zinc-400 max-w-[180px] truncate block" title={tx.note}>
                                  {tx.note || '-'}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm?.amount || 0}
                                  onChange={e => setEditForm(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-right font-bold text-emerald-400"
                                />
                              ) : (
                                <span className={`font-bold font-display ${tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-100'}`}>
                                  {tx.amount.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {isEditing ? (
                                <button
                                  onClick={handleSaveEdit}
                                  className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                                  title={t('save')}
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleEditClick(idx)}
                                    className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                    title={t('editBill')}
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(idx)}
                                    className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                    title={t('delete')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
          
          <button
            disabled={parsedTransactions.length === 0}
            onClick={handleConfirmImport}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all ${
              parsedTransactions.length === 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 cursor-pointer shadow-emerald-500/20'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {lang === 'bg' ? `Импортирай ${parsedTransactions.length} записа` : `Import ${parsedTransactions.length} records`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
