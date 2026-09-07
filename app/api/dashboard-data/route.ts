const SPREADSHEET_ID = '1SCDLt0GhCpEuIIZv3TuAdHRgwrN5DMGJvb1mn1SDoo4';

const SOURCES = {
  closings: 'ปิดยอดรายวัน',
  categories: 'ยอดขายตามหมวด',
  payments: 'การชำระเงิน',
  expenses: 'รายจ่าย',
  purchases: 'ซื้อวัตถุดิบ',
  stock: 'สต็อก',
  staff: 'พนักงาน',
  monthlyHistory: 'ประวัติ - สรุปรายเดือน',
} as const;

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (quoted) {
      if (char === '"' && csv[i + 1] === '"') { value += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else value += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') { row.push(value); value = ''; }
    else if (char === '\n') { row.push(value.replace(/\r$/, '')); rows.push(row); row = []; value = ''; }
    else value += char;
  }
  if (value || row.length) { row.push(value.replace(/\r$/, '')); rows.push(row); }
  return rows.filter((item) => item.some(Boolean));
}

async function readSheet(sheet: string) {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`อ่านชีท ${sheet} ไม่สำเร็จ`);
  return parseCsv(await response.text());
}

export async function GET() {
  try {
    const entries = await Promise.all(Object.entries(SOURCES).map(async ([key, sheet]) => [key, await readSheet(sheet)] as const));
    return Response.json(
      { ...Object.fromEntries(entries), refreshedAt: new Date().toISOString() },
      { headers: { 'cache-control': 'public, max-age=60, s-maxage=300' } },
    );
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'อ่านข้อมูลไม่สำเร็จ' }, { status: 502 });
  }
}
