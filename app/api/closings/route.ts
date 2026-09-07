import { dailyClosings } from '@/db/schema';
import { getDb } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { isValidBusinessDate } from '@/lib/validation';

export async function GET() {
  const rows = await getDb().select().from(dailyClosings).orderBy(desc(dailyClosings.businessDate));
  return Response.json(rows);
}

export async function POST(request: Request) {
  if (request.method === 'POST') {
    return Response.json({ error: 'Dashboard นี้เป็นแบบอ่านอย่างเดียว' }, { status: 405 });
  }
  const input = await request.json() as Record<string, unknown>;
  const required = ['businessDate', 'netSales', 'bills', 'items', 'cashExpected', 'cashActual'];
  for (const key of required) {
    if (input[key] === undefined || input[key] === '') {
      return Response.json({ error: `missing ${key}` }, { status: 400 });
    }
  }
  if (!isValidBusinessDate(input.businessDate)) {
    return Response.json({ error: 'วันที่ไม่ถูกต้อง' }, { status: 400 });
  }
  const numericFields = ['netSales', 'bills', 'items', 'cashExpected', 'cashActual'];
  const optionalNumericFields = ['grossSales', 'discount', 'refund', 'categoryTotal', 'paymentTotal'];
  if (numericFields.some((key) => !Number.isFinite(Number(input[key])) || Number(input[key]) < 0)
    || optionalNumericFields.some((key) => input[key] !== undefined && (!Number.isFinite(Number(input[key])) || Number(input[key]) < 0))) {
    return Response.json({ error: 'ตัวเลขต้องเป็นศูนย์หรือมากกว่า' }, { status: 400 });
  }
  if (!Number.isInteger(Number(input.bills)) || !Number.isInteger(Number(input.items))) {
    return Response.json({ error: 'จำนวนบิลและสินค้าต้องเป็นจำนวนเต็ม' }, { status: 400 });
  }
  const [existing] = await getDb().select().from(dailyClosings).where(eq(dailyClosings.businessDate, String(input.businessDate)));
  if (existing && input.overwrite !== true) {
    return Response.json({ error: 'duplicate_date', existing }, { status: 409 });
  }
  const record = {
    businessDate: String(input.businessDate),
    openingTime: input.openingTime || null,
    closingTime: input.closingTime || null,
    items: Number(input.items),
    bills: Number(input.bills),
    grossSales: Number(input.grossSales ?? input.netSales),
    discount: Number(input.discount ?? 0),
    refund: Number(input.refund ?? 0),
    netSales: Number(input.netSales),
    cashExpected: Number(input.cashExpected),
    cashActual: Number(input.cashActual),
    cashDifference: Number(input.cashActual) - Number(input.cashExpected),
    categoryTotal: Number(input.categoryTotal ?? input.netSales),
    paymentTotal: Number(input.paymentTotal ?? input.netSales),
    sourceImageKey: input.sourceImageKey || null,
    note: input.note || null,
    syncStatus: 'pending',
  };
  await getDb().insert(dailyClosings).values(record).onConflictDoUpdate({
    target: dailyClosings.businessDate,
    set: record,
  });
  let [saved] = await getDb().select().from(dailyClosings).where(eq(dailyClosings.businessDate, record.businessDate));
  if (await trySheetSync('closing', saved)) {
    await getDb().update(dailyClosings).set({ syncStatus: 'synced' }).where(eq(dailyClosings.businessDate, record.businessDate));
    [saved] = await getDb().select().from(dailyClosings).where(eq(dailyClosings.businessDate, record.businessDate));
  }
  return Response.json(saved, { status: 201 });
}

async function trySheetSync(type: string, record: unknown): Promise<boolean> {
  const url = (env as unknown as { GOOGLE_SHEETS_WEBHOOK_URL?: string }).GOOGLE_SHEETS_WEBHOOK_URL;
  if (!url) return false;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type, record }),
    });
    if (!response.ok) return false;
    const result = await response.json() as { ok?: boolean };
    return result.ok === true;
  } catch {
    return false;
  }
}
