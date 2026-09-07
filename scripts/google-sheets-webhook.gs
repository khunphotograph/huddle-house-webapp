const CONFIG = {
  spreadsheetId: '1SCDLt0GhCpEuIIZv3TuAdHRgwrN5DMGJvb1mn1SDoo4',
  token: PropertiesService.getScriptProperties().getProperty('WEBHOOK_TOKEN'),
  closingSheet: 'ปิดยอดรายวัน',
  expenseSheet: 'รายจ่าย',
};

function doGet(e) {
  if (!e || !e.parameter || e.parameter.token !== CONFIG.token) {
    return json_({ ok: false, error: 'unauthorized' });
  }
  return json_({ ok: true, service: 'Huddle House Sheet Sync' });
}

function doPost(e) {
  try {
    if (!e || !e.parameter || e.parameter.token !== CONFIG.token) {
      return json_({ ok: false, error: 'unauthorized' });
    }
    const payload = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (!payload.record || !payload.type) {
      throw new Error('ข้อมูลไม่ครบ');
    }
    if (payload.type === 'closing') {
      return json_(syncClosing_(payload.record));
    }
    if (payload.type === 'expense') {
      return json_(syncExpense_(payload.record));
    }
    throw new Error('ไม่รู้จักประเภทรายการ');
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message || error) });
  }
}

function syncClosing_(record) {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.closingSheet);
  if (!sheet) throw new Error('ไม่พบชีทปิดยอดรายวัน');
  const businessDate = requireDate_(record.businessDate);
  let row = findDateRow_(sheet, businessDate);
  if (!row) row = Math.max(sheet.getLastRow() + 1, 2);
  prepareRow_(sheet, row, 17);
  const values = [[
    businessDate,
    'Huddle House',
    timeValue_(record.openingTime),
    timeValue_(record.closingTime),
    number_(record.items),
    number_(record.bills),
    number_(record.grossSales),
    number_(record.discount),
    number_(record.refund),
    '',
    '',
    number_(record.cashActual),
    number_(record.cashExpected),
    '',
    '',
    '',
    record.note || '',
  ]];
  sheet.getRange(row, 1, 1, 17).setValues(values);
  sheet.getRange(row, 10).setFormulaR1C1('=IF(RC[-9]="","",RC[-3]-RC[-2]-RC[-1])');
  sheet.getRange(row, 11).setFormulaR1C1('=IFERROR(RC[-1]/RC[-5],0)');
  sheet.getRange(row, 14).setFormulaR1C1('=IF(OR(RC[-2]="",RC[-1]=""),"",RC[-2]-RC[-1])');
  sheet.getRange(row, 15).setFormula("=SUMIF('ยอดขายตามหมวด'!$A$2:$A$5000,A" + row + ",'ยอดขายตามหมวด'!$D$2:$D$5000)");
  sheet.getRange(row, 16).setFormula("=SUMIF('ยอดขายตามการชำระ'!$A$2:$A$5000,A" + row + ",'ยอดขายตามการชำระ'!$D$2:$D$5000)");
  return { ok: true, type: 'closing', row: row };
}

function syncExpense_(record) {
  const sheet = SpreadsheetApp.openById(CONFIG.spreadsheetId).getSheetByName(CONFIG.expenseSheet);
  if (!sheet) throw new Error('ไม่พบชีทรายจ่าย');
  const sourceId = record.id ? 'webapp-expense-' + record.id : '';
  if (sourceId) {
    const notes = sheet.getRange(2, 9, Math.max(sheet.getLastRow() - 1, 1), 1).getNotes();
    for (let i = 0; i < notes.length; i++) {
      if (notes[i][0] === sourceId) return { ok: true, type: 'expense', row: i + 2, duplicate: true };
    }
  }
  const row = Math.max(sheet.getLastRow() + 1, 2);
  prepareRow_(sheet, row, 9);
  const allowedCategories = ['วัตถุดิบ','บรรจุภัณฑ์','ค่าเช่า','ค่าน้ำ','ค่าไฟ','ค่าเน็ต','ค่าแรง','การตลาด','ซ่อมบำรุง','เบ็ดเตล็ด'];
  const category = allowedCategories.indexOf(record.category) >= 0 ? record.category : 'เบ็ดเตล็ด';
  sheet.getRange(row, 1, 1, 9).setValues([[
    requireDate_(record.businessDate),
    record.payee || '-',
    category,
    record.description || '',
    record.paymentMethod || 'โอน/QR',
    number_(record.amount),
    record.costType || 'ผันแปร',
    record.receiptKey || '',
    record.note || '',
  ]]);
  if (sourceId) sheet.getRange(row, 9).setNote(sourceId);
  return { ok: true, type: 'expense', row: row };
}

function findDateRow_(sheet, date) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const target = Utilities.formatDate(date, 'Asia/Bangkok', 'yyyy-MM-dd');
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] instanceof Date && Utilities.formatDate(values[i][0], 'Asia/Bangkok', 'yyyy-MM-dd') === target) {
      return i + 2;
    }
  }
  return 0;
}

function prepareRow_(sheet, row, columns) {
  if (row <= 2) return;
  const source = sheet.getRange(row - 1, 1, 1, columns);
  const target = sheet.getRange(row, 1, 1, columns);
  source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  source.copyTo(target, SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION, false);
}

function parseDate_(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const result = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (result.getFullYear() !== Number(match[1]) || result.getMonth() !== Number(match[2]) - 1 || result.getDate() !== Number(match[3])) return null;
  return result;
}

function timeValue_(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return '';
  return new Date(1899, 11, 30, Number(match[1]), Number(match[2]), 0);
}

function requireDate_(value) {
  const result = parseDate_(value);
  if (!result) throw new Error('วันที่ไม่ถูกต้อง');
  return result;
}

function number_(value) {
  const result = Number(value || 0);
  if (!Number.isFinite(result)) throw new Error('ตัวเลขไม่ถูกต้อง');
  return result;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
