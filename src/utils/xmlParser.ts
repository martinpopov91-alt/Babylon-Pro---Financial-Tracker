import { Category, Transaction } from '../types';

export const parseXMLTransactions = (
  xmlText: string,
  categories: Category[]
): Omit<Transaction, 'id'>[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error('XML Parsing error: ' + parseError.textContent);
  }

  // Potential tags representing individual transaction nodes
  const candidateTags = [
    'AccountMovement', 'accountMovement', 'accountmovement', 'ACCOUNTMOVEMENT',
    'transaction', 'Transaction', 'TRANSACTION',
    'item', 'Item', 'ITEM',
    'record', 'Record', 'RECORD',
    'entry', 'Entry', 'ENTRY',
    'ntry', 'Ntry', 'NTRY',
    'stmttrn', 'STMTTRN',
    'row', 'Row', 'ROW',
    'tx', 'Tx', 'TX'
  ];

  let nodes: Element[] = [];

  for (const tag of candidateTags) {
    let found = Array.from(xmlDoc.getElementsByTagName(tag));
    if (found.length === 0) {
      found = Array.from(xmlDoc.getElementsByTagNameNS('*', tag));
    }
    if (found.length > 0) {
      nodes = found;
      break;
    }
  }

  // Fallback: search for child elements of root if no specific candidate tag matched
  if (nodes.length === 0) {
    const rootChildren = Array.from(xmlDoc.documentElement.children);
    nodes = rootChildren.filter(child => {
      // Must contain at least a date or amount child or attribute
      return getFirstTagOrAttr(child, [
        'ValueDate', 'valueDate', 'valuedate', 'date', 'dt',
        'Amount', 'amount', 'amt', 'sum', 'val'
      ]) !== null;
    });
  }

  if (nodes.length === 0) {
    throw new Error('No transaction elements found in the XML document.');
  }

  const results: Omit<Transaction, 'id'>[] = [];

  for (const node of nodes) {
    const tx = extractTransactionFromNode(node, categories);
    if (tx) {
      results.push(tx);
    }
  }

  return results;
};

// Helper to get text content from child tags or attributes
function getFirstTagOrAttr(
  node: Element,
  tagOrAttrNames: string[]
): string | null {
  for (const name of tagOrAttrNames) {
    // Check attribute first
    const attrVal = node.getAttribute(name) || node.getAttribute(name.toLowerCase()) || node.getAttribute(name.toUpperCase());
    if (attrVal && attrVal.trim()) {
      return attrVal.trim();
    }

    // Check direct or nested tag
    let elements = Array.from(node.getElementsByTagName(name));
    if (elements.length === 0) {
      elements = Array.from(node.getElementsByTagName(name.toLowerCase()));
    }
    if (elements.length === 0) {
      elements = Array.from(node.getElementsByTagName(name.toUpperCase()));
    }
    if (elements.length === 0) {
      elements = Array.from(node.getElementsByTagNameNS('*', name));
    }

    if (elements.length > 0) {
      const el = elements[0];
      // Convert <br/> tags to " - " or spaces for clean multi-line notes (e.g. <Reason>)
      const htmlContent = el.innerHTML || '';
      if (htmlContent.includes('<br') || htmlContent.includes('<BR')) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent.replace(/<br\s*[\/]?>/gi, ' - ');
        const text = tempDiv.textContent || tempDiv.innerText || '';
        if (text.trim()) return cleanText(text);
      }

      const text = el.textContent?.trim();
      if (text) return cleanText(text);
    }
  }
  return null;
}

function cleanText(str: string): string {
  return str.replace(/\s+/g, ' ').replace(/(?:\s*-\s*)+/g, ' - ').trim();
}

function extractTransactionFromNode(
  node: Element,
  categories: Category[]
): Omit<Transaction, 'id'> | null {
  // Extract Date (supports ValueDate, date, etc.)
  const rawDate = getFirstTagOrAttr(node, [
    'ValueDate', 'valueDate', 'valuedate', 'VALUEDATE',
    'date', 'Date', 'DATE', 'txDate', 'txdate', 'bookingDate', 'bookingdate',
    'bookgDt', 'bookgdt', 'dt', 'Dt', 'dtPosted', 'dtposted', 'valDt', 'valdt',
    'timestamp', 'time', 'createdat'
  ]);

  let dateStr = parseDateString(rawDate);

  // Extract Amount (supports comma as decimal e.g. "59,38")
  const rawAmount = getFirstTagOrAttr(node, [
    'Amount', 'amount', 'AMOUNT', 'amt', 'Amt', 'sum', 'Sum', 'val', 'Value', 'value',
    'price', 'cost', 'total', 'trnAmt', 'trnamt'
  ]);

  if (!rawAmount) return null;

  let amountNum = parseAmountNumber(rawAmount);
  if (isNaN(amountNum) || amountNum === 0) return null;

  // Extract Credit/Debit Indicator or Type (supports MovementType e.g. Debit/Credit)
  const rawCdtDbt = getFirstTagOrAttr(node, [
    'MovementType', 'movementType', 'movementtype', 'MOVEMENTTYPE',
    'cdtDbtInd', 'cdtdbtind', 'trnType', 'trntype', 'creditDebit', 'type', 'Type'
  ]);

  const isCredit = (rawCdtDbt && /crdt|credit|income/i.test(rawCdtDbt)) || (amountNum > 0 && /income/i.test(rawCdtDbt || ''));
  const isDebit = (rawCdtDbt && /dbit|debit|expense/i.test(rawCdtDbt)) || amountNum < 0;

  // Make amount strictly positive
  amountNum = Math.abs(amountNum);

  // Extract Type
  const rawType = getFirstTagOrAttr(node, ['type', 'Type', 'txType', 'txtype', 'transactionType']);
  let typeStr: Transaction['type'] = 'needs';

  if (rawType && ['needs', 'wants', 'savings', 'income', 'bills', 'debt'].includes(rawType.toLowerCase())) {
    typeStr = rawType.toLowerCase() as Transaction['type'];
  } else if (isCredit) {
    typeStr = 'income';
  } else if (isDebit) {
    typeStr = 'needs';
  }

  // Extract Note / Reason / Opposite Side Info
  const rawReason = getFirstTagOrAttr(node, [
    'Reason', 'reason', 'REASON', 'note', 'Note', 'memo', 'Memo',
    'description', 'Description', 'desc', 'Desc', 'details', 'Details',
    'ustrd', 'Ustrd', 'narration', 'Narration'
  ]) || '';

  const rawOppositeName = getFirstTagOrAttr(node, [
    'OppositeSideName', 'oppositeSideName', 'oppositesidename',
    'Payee', 'payee', 'Name', 'name', 'cdtrNm', 'dbtrNm'
  ]) || '';

  const rawOppositeAccount = getFirstTagOrAttr(node, [
    'OppositeSideAccount', 'oppositeSideAccount', 'oppositesideaccount'
  ]) || '';

  // Construct combined note
  let noteParts: string[] = [];
  if (rawOppositeName) noteParts.push(rawOppositeName);
  if (rawReason) noteParts.push(rawReason);
  if (rawOppositeAccount && !rawOppositeName) noteParts.push(`Acc: ${rawOppositeAccount}`);

  let combinedNote = noteParts.join(' - ') || 'Transaction';

  // Extract Category
  const rawCat = getFirstTagOrAttr(node, ['category', 'Category', 'cat', 'Cat', 'group', 'Group', 'cd', 'Cd']);
  let catStr = matchCategory(rawCat, combinedNote, typeStr, categories);

  return {
    date: dateStr,
    type: typeStr,
    category: catStr,
    note: combinedNote,
    amount: amountNum
  };
}

function parseAmountNumber(rawAmount: string): number {
  let cleaned = rawAmount.trim();

  // Handle European comma as decimal separator e.g. "59,38" -> "59.38" or "1 234,56"
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(/\s+/g, '').replace(',', '.');
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(/\s+/g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '').replace(/\s+/g, '');
    }
  } else {
    cleaned = cleaned.replace(/\s+/g, '');
  }

  const num = parseFloat(cleaned.replace(/[^0-9.-]+/g, ''));
  return isNaN(num) ? 0 : num;
}

function parseDateString(rawDate: string | null): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];

  const cleaned = rawDate.trim();

  // Handle DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY (e.g. "12.08.2026")
  const ddmmyyyyMatch = cleaned.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD or YYYY.MM.DD
  const yyyymmddMatch = cleaned.match(/^(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2].padStart(2, '0');
    const day = yyyymmddMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // YYYYMMDD (OFX format)
  if (/^\d{8}$/.test(cleaned)) {
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 6)}-${cleaned.substring(6, 8)}`;
  }

  // ISO string (e.g. 2026-08-11T12:00:00Z)
  if (cleaned.includes('T')) {
    return cleaned.split('T')[0];
  }

  // Fallback JS Date
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

function matchCategory(
  rawCat: string | null,
  note: string,
  type: Transaction['type'],
  categories: Category[]
): string {
  if (rawCat) {
    const trimmed = rawCat.trim();

    // 1. Exact ID match
    const matchId = categories.find(c => c.id === trimmed);
    if (matchId) return matchId.id;

    // 2. Name match (En or Bg)
    const matchName = categories.find(c => 
      c.nameEn.toLowerCase() === trimmed.toLowerCase() ||
      c.nameBg.toLowerCase() === trimmed.toLowerCase()
    );
    if (matchName) return matchName.id;

    // 3. Partial name match
    const matchPartial = categories.find(c => 
      c.nameEn.toLowerCase().includes(trimmed.toLowerCase()) ||
      c.nameBg.toLowerCase().includes(trimmed.toLowerCase()) ||
      trimmed.toLowerCase().includes(c.nameEn.toLowerCase()) ||
      trimmed.toLowerCase().includes(c.nameBg.toLowerCase())
    );
    if (matchPartial) return matchPartial.id;
  }

  // Fallback depending on type
  if (type === 'income') {
    const salaryCat = categories.find(c => c.id === 'cat_salary' || c.type === 'income');
    return salaryCat?.id || 'cat_salary';
  }

  // Check debt/bills keywords in Bulgarian/English
  const lowerNote = note.toLowerCase();
  if (lowerNote.includes('задължение') || lowerNote.includes('погасяване') || lowerNote.includes('кредит') || lowerNote.includes('debt')) {
    const debtCat = categories.find(c => c.type === 'debt' || c.id.includes('debt'));
    if (debtCat) return debtCat.id;
  }

  // Match by keywords in note if note available
  if (note) {
    for (const cat of categories) {
      if (lowerNote.includes(cat.nameEn.toLowerCase()) || lowerNote.includes(cat.nameBg.toLowerCase())) {
        return cat.id;
      }
    }
  }

  return 'cat_other_expense';
}

