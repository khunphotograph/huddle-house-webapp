'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { evidenceUrls } from '@/lib/history';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function PosSlips({ days }: { days: { date: string; net: number; note: string }[] }) {
  const [opened, setOpened] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const dateLabel = (date: string) => new Intl.DateTimeFormat('th-TH', { dateStyle: 'long' }).format(new Date(`${date}T12:00:00`));
  const rows = days.map(day => ({ ...day, urls: evidenceUrls(day.note) }));
  return <section id="pos-slips" className="scroll-mt-24 space-y-4" aria-labelledby="pos-slips-title">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">รูปหลักฐานรายวัน</p><h2 id="pos-slips-title" className="text-2xl font-semibold">สลิป POS ย้อนหลัง</h2></div><Button type="button" variant="outline" size="icon" aria-label={expanded ? 'ย่อสลิป POS ย้อนหลัง' : 'ขยายสลิป POS ย้อนหลัง'} aria-expanded={expanded} aria-controls="pos-slips-content" title={expanded ? 'ย่อรายการสลิป' : 'ขยายรายการสลิป'} onClick={() => setExpanded(value => !value)}>{expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</Button></div>
    <p className="text-sm text-muted-foreground">ตามวันหรือช่วงวันที่เลือกด้านบน • {rows.length} วัน • มีรูป {rows.filter(r => r.urls.length).length} วัน</p>
    {!rows.length && <p role="status" className="rounded-2xl border bg-white/70 p-6">ไม่มีรายการปิดยอดในช่วงวันที่เลือก</p>}
    {expanded && <div id="pos-slips-content" className="grid gap-4 md:grid-cols-2">
      {rows.map(day => <Card key={day.date}>
        <CardHeader><CardTitle>{dateLabel(day.date)}</CardTitle><CardDescription>ยอดขายสุทธิ {day.net.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท • {day.urls.length} รูป</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {!day.urls.length && <p className="text-sm text-muted-foreground">ยังไม่มีรูปสลิปแนบในชีทของวันนี้</p>}
          {day.urls.map((url, index) => {
            const id = new URL(url).pathname.match(/^\/file\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)?.[1];
            const key = `${day.date}-${url}`;
            return <div key={url} className="space-y-3 rounded-xl border bg-background/70 p-3">
              <div className="flex flex-wrap items-center gap-3">
                {id && <Button variant="outline" aria-expanded={opened === key} aria-controls={`pos-${day.date}-${index}`} onClick={() => setOpened(opened === key ? null : key)}>{opened === key ? 'ปิดรูป' : 'ดูสลิป'} {index + 1}</Button>}
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">เปิดต้นฉบับ {index + 1}</a>
              </div>
              {id && opened === key && <div id={`pos-${day.date}-${index}`} className="space-y-2">
                <iframe src={`https://drive.google.com/file/d/${id}/preview`} title={`สลิป POS ${dateLabel(day.date)} รูปที่ ${index + 1}`} className="h-[560px] w-full rounded-lg border bg-white" allowFullScreen />
                <p className="text-sm text-muted-foreground">หากรูปไม่แสดง กดเปิดต้นฉบับและลงชื่อเข้าใช้ Google บัญชีที่มีสิทธิ์ดูรูป</p>
              </div>}
            </div>;
          })}
        </CardContent>
      </Card>)}
    </div>}
  </section>;
}
