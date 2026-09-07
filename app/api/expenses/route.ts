import { expenses } from '@/db/schema';
import { getDb } from '@/db';
import { desc, eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { isValidBusinessDate } from '@/lib/validation';

export async function GET() {
  return Response.json(await getDb().select().from(expenses).orderBy(desc(expenses.businessDate), desc(expenses.id)));
}

export async function POST(request: Request) {
  if (request.method === 'POST') {
    return Response.json({ error: 'Dashboard นี้เป็นแบบอ่านอย่างเดียว' }, { status: 405 });
  }
  const input = await request.json() as Record<string, unknown>;
  if (!input.businessDate || !input.description || !input.amount) {
    return Response.json({ error: 'กรอกข้อมูลไม่ครบ' }, { status: 400 });
  }
  if (!isValidBusinessDate(input.businessDate)) {
    return Response.json({ error: 'วันที่ไม่ถูกต้อง' }, { status: 400 });
  }
  if (!Number.isFinite(Number(input.amount)) || Number(input.amount) <= 0) {
    return Response.json({ error: 'จำนวนเงินต้องมากกว่าศูนย์' }, { status: 400 });
  }
  const record = {
    businessDate: String(input.businessDate),
    payee: String(input.payee || '-'),
    category: String(input.category || 'อื่น ๆ'),
    description: String(input.description),
    paymentMethod: String(input.paymentMethod || 'โอน/QR'),
    amount: Number(input.amount),
    receiptKey: input.receiptKey || null,
    note: input.note || null,
    syncStatus: 'pending',
  };
  let [saved] = await getDb().insert(expenses).values(record).returning();
  const url = (env as unknown as { GOOGLE_SHEETS_WEBHOOK_URL?: string }).GOOGLE_SHEETS_WEBHOOK_URL;
  if (url) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'expense', record: saved }),
      });
      const result = response.ok ? await response.json() as { ok?: boolean } : null;
      if (result?.ok === true) {
        await getDb().update(expenses).set({ syncStatus: 'synced' }).where(eq(expenses.id, saved.id));
        [saved] = await getDb().select().from(expenses).where(eq(expenses.id, saved.id));
      }
    } catch {
      // Keep the record as pending so it can be retried later.
    }
  }
  return Response.json(saved, { status: 201 });
}
