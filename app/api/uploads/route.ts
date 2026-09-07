import { env } from 'cloudflare:workers';

export async function POST(request: Request) {
  if (request.method === 'POST') {
    return Response.json({ error: 'Dashboard นี้เป็นแบบอ่านอย่างเดียว' }, { status: 405 });
  }
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
  if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'รองรับรูปภาพไม่เกิน 10 MB' }, { status: 400 });
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `evidence/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}`;
  await env.FILES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return Response.json({ key });
}
