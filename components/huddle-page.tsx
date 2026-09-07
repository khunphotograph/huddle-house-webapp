'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { PosSlips } from '@/components/pos-slips';
import { SeasonalSprinkles } from '@/components/seasonal-sprinkles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { inDateRange, evidenceUrls, monthInRange } from '@/lib/history';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle, BarChart3, Boxes, CheckCircle2, ChevronLeft, ChevronRight, Coffee,
  FileText, LoaderCircle, PackageCheck, ShoppingCart, Store, WalletCards,
} from 'lucide-react';

type SheetRows = string[][];
type DashboardData = {
  closings: SheetRows; categories: SheetRows; payments: SheetRows; expenses: SheetRows;
  monthlyHistory?: SheetRows; purchases: SheetRows; stock: SheetRows; staff: SheetRows; refreshedAt: string;
};
type Closing = { date: string; opening: string; closing: string; items: number; bills: number; gross: number; discount: number; net: number; avg: number; cashActual: number | null; cashPos: number | null; cashDiff: number | null; note: string };
type Category = { date: string; name: string; qty: number; amount: number };
type Payment = { date: string; name: string; bills: number; amount: number };
type Expense = { date: string; payee: string; category: string; detail: string; payment: string; amount: number; kind: string; evidence: string; note: string };
type Purchase = { date: string; item: string; qty: number; unit: string; unitPrice: number; total: number; vendor: string; note: string };
type Stock = { code: string; item: string; category: string; unit: string; opening: number; bought: number; used: number; waste: number; remaining: number; reorder: number; status: string; value: number };
type Staff = { date: string; name: string; type: string; net: number; note: string };

const money = (value: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
const num = (value = '') => Number(value.replace(/,/g, '').replace(/[^0-9.-]/g, '')) || 0;
const isoDate = (value = '') => { const [day, month, year] = value.split('/'); return day && month && year ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}` : ''; };
const optionalMoney = (value: number | null | undefined) => value == null ? 'ไม่ระบุ' : money(value);
const shortDate = (iso: string) => iso ? new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00`)) : '-';
const longDate = (iso: string) => iso ? new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00`)) : '-';
const dataRows = (data?: SheetRows) => (data || []).slice(1);
const byDate = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

export function HuddlePage(_: { view?: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/dashboard-data', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('load');
        return response.json() as Promise<DashboardData>;
      })
      .then((payload) => { if (active) setData(payload); })
      .catch(() => { if (active) setError('ยังอ่านข้อมูลจาก Google Sheet ไม่ได้ กรุณาลองใหม่'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!data) return;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [data]);

  const model = useMemo(() => {
    if (!data) return null;
    const closings: Closing[] = dataRows(data.closings).map((r) => ({ date: isoDate(r[0]), opening: r[2] || '', closing: r[3] || '', items: num(r[4]), bills: num(r[5]), gross: num(r[6]), discount: num(r[7]), net: num(r[9]), avg: num(r[10]), cashActual: r[11] ? num(r[11]) : null, cashPos: r[12] ? num(r[12]) : null, cashDiff: r[13] ? num(r[13]) : null, note: r[16] || '' })).filter((r) => r.date).sort(byDate);
    const categories: Category[] = dataRows(data.categories).map((r) => ({ date: isoDate(r[0]), name: r[1] || 'ไม่ระบุ', qty: num(r[2]), amount: num(r[3]) })).filter((r) => r.date);
    const payments: Payment[] = dataRows(data.payments).map((r) => ({ date: isoDate(r[0]), name: r[1] || 'ไม่ระบุ', bills: num(r[2]), amount: num(r[3]) })).filter((r) => r.date);
    const expenses: Expense[] = dataRows(data.expenses).map((r) => ({ date: isoDate(r[0]), payee: r[1] || '-', category: r[2] || 'ไม่ระบุ', detail: r[3] || '-', payment: r[4] || '-', amount: num(r[5]), kind: r[6] || '-', evidence: r[7] || '', note: r[8] || '' })).filter((r) => r.amount || r.detail !== '-');
    const purchases: Purchase[] = dataRows(data.purchases).map((r) => ({ date: isoDate(r[0]), item: r[1] || '-', qty: num(r[2]), unit: r[3] || '-', unitPrice: num(r[4]), total: num(r[5]), vendor: r[6] || '-', note: r[7] || '' })).filter((r) => r.total || r.item !== '-');
    const stock: Stock[] = dataRows(data.stock).map((r) => ({ code: r[0] || '-', item: r[1] || '-', category: r[2] || 'ไม่ระบุ', unit: r[3] || '-', opening: num(r[4]), bought: num(r[5]), used: num(r[6]), waste: num(r[7]), remaining: num(r[8]), reorder: num(r[9]), status: r[10] || 'ปกติ', value: num(r[15]) })).filter((r) => r.item !== '-');
    const staff: Staff[] = dataRows(data.staff).map((r) => ({ date: isoDate(r[0]), name: r[1] || 'ไม่ระบุ', type: r[2] || '-', net: num(r[7]), note: r[8] || '' })).filter((r) => r.date);
    const availableMonths = [...new Set(closings.map((r) => r.date.slice(0, 7)))].sort().reverse();
    return { closings, categories, payments, expenses, purchases, stock, staff, availableMonths };
  }, [data]);
  if (!model || !data) return <LoadingState loading={loading} error={error} />;
  const selected = (r: { date: string }) => inDateRange(r.date, startDate, endDate);
  const invalidRange = Boolean(startDate && endDate && startDate > endDate);
  const closingRows = model.closings.filter(selected);
  const showingAll = !startDate && !endDate;
  const dateOptions = [...new Set(model.closings.map((r) => r.date))].sort();
  const selectedDay = startDate && startDate === endDate ? startDate : '';
  const selectedDayIndex = selectedDay ? dateOptions.indexOf(selectedDay) : -1;
  const previousDay = selectedDayIndex > 0 ? dateOptions[selectedDayIndex - 1] : selectedDayIndex < 0 ? dateOptions.at(-1) || '' : '';
  const nextDay = selectedDayIndex >= 0 && selectedDayIndex < dateOptions.length - 1 ? dateOptions[selectedDayIndex + 1] : '';
  const chooseDay = (date: string) => { if (date) { setStartDate(date); setEndDate(date); window.scrollTo({ top: 0, behavior: 'smooth' }); } };
  const expenseRows = model.expenses.filter(selected);
  const purchaseRows = model.purchases.filter(selected);
  const staffRows = model.staff.filter(selected);
  const payroll = staffRows.filter((r) => r.type === 'จ่ายเงินเดือน').reduce((s, r) => s + r.net, 0);
  const sales = closingRows.reduce((s, r) => s + r.net, 0);
  const expenses = expenseRows.reduce((s, r) => s + r.amount, 0);
  const purchases = purchaseRows.reduce((s, r) => s + r.total, 0);
  const operatingCost = expenses + purchases + payroll;
  const operatingResult = sales - operatingCost;
  const bills = closingRows.reduce((s, r) => s + r.bills, 0);
  const latest = closingRows[0];
  const orderItems = model.stock.filter((r) => r.status.includes('สั่งซื้อ') || (r.reorder > 0 && r.remaining <= r.reorder));
  const outOfStock = model.stock.filter((r) => r.remaining <= 0);
  const missingEvidence = model.expenses.filter((r) => !r.evidence.trim()).length;
  const cashIssueRows = model.closings.filter((r) => r.cashDiff != null && Math.abs(r.cashDiff) > 0);
  const taskItems = [
    orderItems.length ? { title: `สั่งซื้อสต็อก ${orderItems.length} รายการ`, text: 'มีของหมดหรือถึงจุดสั่งซื้อแล้ว', tone: 'amber' } : null,
    missingEvidence ? { title: `เติมรูปหลักฐาน ${missingEvidence} รายการ`, text: 'รายจ่ายบางรายการยังไม่มีหลักฐานแนบ', tone: 'rose' } : null,
    cashIssueRows.length ? { title: `ยืนยันเงินสด ${cashIssueRows.length} วัน`, text: 'มีวันที่ยอดเงินสดนับจริงต่างจาก POS', tone: 'blue' } : null,
  ].filter((item): item is { title: string; text: string; tone: string } => Boolean(item));
  const stockValue = model.stock.reduce((s, r) => s + r.value, 0);
  const monthCategories = group(model.categories.filter(selected), 'name', 'amount');
  const monthPayments = group(model.payments.filter(selected), 'name', 'amount');
  const expenseGroups = group(expenseRows, 'category', 'amount');
  const trend = [...closingRows].sort((a, b) => a.date.localeCompare(b.date));
  const trendMax = Math.max(...trend.map((r) => r.net), 1);
  const monthLabel = !startDate && !endDate ? 'ย้อนหลังทั้งหมด' : startDate === endDate ? longDate(startDate) : `${startDate ? longDate(startDate) : 'เริ่มต้น'} – ${endDate ? longDate(endDate) : 'ล่าสุด'}`;

  return <><SeasonalSprinkles /><div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
    <aside className="noise fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col overflow-hidden bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-6 py-6"><div className="grid size-11 rotate-[-3deg] place-items-center rounded-2xl bg-[#ffd95a] text-[#3a3422] shadow-md"><Coffee className="size-6" /></div><div><p className="text-lg font-semibold">Huddle House</p><p className="text-xs text-white/60">Dashboard ร้านกาแฟ</p></div></div>
      <div className="flex-1 space-y-1 p-4" aria-label="ส่วนของ Dashboard"><Nav icon={BarChart3}>ภาพรวม</Nav><Nav icon={Store}>ยอดขาย</Nav><Nav icon={WalletCards}>ต้นทุนและรายจ่าย</Nav><Nav icon={Boxes}>สต็อกและสั่งซื้อ</Nav><Nav icon={FileText}>รายละเอียด</Nav><a href="#pos-slips" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white hover:bg-white/10"><FileText className="size-5" />สลิป POS ย้อนหลัง</a></div>
      <div className="relative m-4 overflow-hidden rounded-[24px] border border-white/15 bg-white/8 p-4 text-sm text-white/75"><p className="relative z-10 max-w-32">แสดงข้อมูลจาก Google Sheet แบบอ่านอย่างเดียว</p><Image src="/sunflower-handdrawn-v2.png" alt="" width={779} height={800} className="mascot-float pointer-events-none absolute -bottom-7 -right-8 h-auto w-28 rotate-[-8deg] opacity-85" /></div>
    </aside>
    <main className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur-xl sm:px-8"><div className="flex min-w-0 items-center gap-2 sm:gap-3"><Image src="/huddle-house-logo.png" alt="Huddle House Cafe" width={316} height={186} priority className="brand-logo h-11 w-[4.7rem] shrink-0 object-contain sm:h-14 sm:w-24" /><div className="min-w-0"><div className="flex items-center gap-2"><h1 className="font-semibold">Dashboard ภาพรวมร้าน</h1></div><p className="text-[11px] font-medium text-muted-foreground">ข้อมูลจาก Google Sheet • อ่านอย่างเดียว</p></div></div><Badge variant="outline" className="shrink-0 border-[#dfc65f] bg-[#fff4b8] text-[#5b4a13]">{monthLabel}</Badge></header>
      <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        <a href="#pos-slips" className="inline-flex items-center gap-2 rounded-xl border bg-white/70 px-4 py-3 text-sm font-medium text-primary"><FileText className="size-4" />สลิป POS ย้อนหลัง</a>
        <Card data-reveal><CardHeader><CardTitle>เลือกวันที่ดูย้อนหลัง</CardTitle><CardDescription>เลือกวันเดียว หรือกำหนดช่วงวันที่ • เว้นว่างเพื่อดูทั้งหมด</CardDescription></CardHeader><CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><label className="block text-sm font-medium" htmlFor="single-day">วันเดียว</label><div className="flex items-center gap-2"><Button type="button" variant="outline" size="icon" aria-label="ย้อนกลับหนึ่งวัน" title="วันก่อนหน้า" disabled={!previousDay} onClick={() => chooseDay(previousDay)}><ChevronLeft className="size-4" /></Button><Input id="single-day" type="date" aria-label="เลือกวันเดียว" value={selectedDay} onChange={(e) => chooseDay(e.target.value)} /><Button type="button" variant="outline" size="icon" aria-label="ไปข้างหน้าหนึ่งวัน" title="วันถัดไป" disabled={!nextDay} onClick={() => chooseDay(nextDay)}><ChevronRight className="size-4" /></Button></div><p className="text-xs text-muted-foreground">ซ้าย = ย้อนวัน • ขวา = วันถัดไป</p></div>
            <label className="space-y-2 text-sm font-medium">ตั้งแต่วันที่<Input type="date" aria-label="ตั้งแต่วันที่" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
            <label className="space-y-2 text-sm font-medium">ถึงวันที่<Input type="date" aria-label="ถึงวันที่" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
          </div>
          <div className="flex flex-wrap items-center gap-3"><Button variant="default" onClick={() => chooseDay(dateOptions.at(-1) || '')}>ดูข้อมูลปัจจุบันเท่านั้น</Button><Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }}>ดูทั้งหมด</Button><p aria-live="polite" className="text-sm text-muted-foreground">{monthLabel} • พบยอดขาย {closingRows.length} วัน</p></div>
          {invalidRange && <p role="alert" className="text-sm text-red-700">วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด</p>}
          {!invalidRange && !closingRows.length && <p role="status" className="rounded-xl bg-muted p-3 text-sm">ไม่มีข้อมูลปิดยอดในช่วงนี้ จึงยังสรุปยอดขายไม่ได้</p>}
          <p className="text-sm text-muted-foreground">สต็อกแสดงยอดล่าสุดที่บันทึกในชีท ไม่ใช่สต็อกย้อนหลังตามวันที่เลือก • รายการไม่ระบุวันที่จะแสดงเฉพาะเมื่อดูทั้งหมด</p>
        </CardContent></Card>
        <section id="overview" data-reveal className="scroll-mt-24 space-y-4">
          <div className="sunflower-wash relative overflow-hidden rounded-[34px] border-2 border-dashed border-[#dfbd39] bg-[#fff0a8] p-6 text-[#3c311f] shadow-xl shadow-[#8d6d20]/12 sm:p-8"><div className="relative z-10 flex min-h-44 flex-wrap items-start justify-between gap-6 pr-0 sm:pr-64"><div><p className="text-sm font-medium text-[#816b20]">{showingAll ? 'กำไร/ขาดทุนสุทธิ • ย้อนหลังทั้งหมด' : `ยอดล่าสุด • ${longDate(latest?.date)}`}</p><p className={`mt-2 text-4xl font-semibold tracking-tight sm:text-5xl ${showingAll && operatingResult < 0 ? 'text-red-800' : ''}`}>{showingAll ? money(operatingResult) : money(latest?.net || 0)}</p><p className="mt-2 text-sm text-[#6d5b23]">{showingAll ? `ยอดขาย ${money(sales)} − ต้นทุนที่บันทึก ${money(operatingCost)} • ${closingRows.length} วันที่ปิดยอด` : `${latest?.bills || 0} บิล • ${latest?.items || 0} รายการ • ปิด ${latest?.closing || '-'}`}</p></div><div className="rotate-[1deg] rounded-2xl border-2 border-[#e6cf77] bg-white/70 px-4 py-3 text-right shadow-sm"><p className="text-xs text-[#7a6a3c]">{showingAll ? 'สถานะผลรวม' : 'เงินสดขาด/เกิน'}</p><p className={`mt-1 text-2xl font-semibold ${showingAll ? (operatingResult < 0 ? 'text-red-700' : 'text-emerald-700') : (latest?.cashDiff ? 'text-amber-700' : 'text-emerald-700')}`}>{showingAll ? (operatingResult < 0 ? 'ขาดทุน' : 'กำไร') : `${(latest?.cashDiff ?? 0) > 0 ? '+' : ''}${optionalMoney(latest?.cashDiff)}`}</p></div></div><Image src="/sunflower-handdrawn-v2.png" alt="" width={779} height={800} priority className="mascot-float pointer-events-none absolute -bottom-20 -right-16 h-auto w-56 rotate-[-9deg] opacity-75 sm:w-72" /><Image src="/pet-chihuahua-sit.png" alt="ชิวาวาวาดมือ" width={742} height={900} priority className="mascot-float pointer-events-none absolute -bottom-8 right-2 h-auto w-28 rotate-[2deg] drop-shadow-sm sm:right-8 sm:w-36" /></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Kpi icon={Store} label={`ยอดขาย ${monthLabel}`} value={closingRows.length ? money(sales) : "ไม่มีข้อมูล"} detail={`${closingRows.length} วันที่ปิดยอด`} /><Kpi icon={WalletCards} label="ต้นทุนที่บันทึก" value={money(operatingCost)} detail={`รายจ่าย ${money(expenses)} • ซื้อของ ${money(purchases)}`} /><Kpi icon={BarChart3} label="ผลต่างก่อนจัดสรร" value={closingRows.length ? money(operatingResult) : "ไม่มีข้อมูล"} detail="ยอดขาย − รายจ่าย − ซื้อของ − ค่าแรง • ไม่ใช่กำไรสุทธิ" positive={operatingResult >= 0} /><Kpi icon={FileText} label="จำนวนบิล" value={`${bills} บิล`} detail={`เฉลี่ย ${money(bills ? sales / bills : 0)} ต่อบิล`} /><Kpi icon={Boxes} label="มูลค่าสต็อก" value={money(stockValue)} detail={`${model.stock.length} รายการในระบบ`} /></div>
          <div className="grid gap-3 md:grid-cols-3"><AlertCard tone="red" icon={AlertTriangle} title={`ของหมด ${outOfStock.length} รายการ`} text="คงเหลือเป็นศูนย์หรือติดลบ" /><AlertCard tone="amber" icon={ShoppingCart} title={`ต้องสั่งซื้อ ${orderItems.length} รายการ`} text="ตามสถานะและจุดสั่งซื้อในชีท" /><AlertCard tone="green" icon={CheckCircle2} title={latest ? "มีข้อมูลปิดยอด" : "ยังไม่มีข้อมูลปิดยอด"} text={latest ? `ล่าสุดในช่วงที่เลือก ${longDate(latest.date)}` : "ไม่มีข้อมูลในช่วงวันที่เลือก"} /></div>
        </section>
        <Card data-reveal className="paper-card border-[#e8d676] bg-[#fffaf0]"><CardHeader><CardTitle>สิ่งที่ต้องทำวันนี้</CardTitle><CardDescription>สรุปจากข้อมูลล่าสุดในชีท เพื่อช่วยไล่เช็กงานค้าง</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">{taskItems.length ? taskItems.map((task) => <div key={task.title} className={`rounded-2xl border p-4 ${task.tone === 'amber' ? 'border-amber-200 bg-amber-50/80' : task.tone === 'rose' ? 'border-rose-200 bg-rose-50/80' : 'border-sky-200 bg-sky-50/80'}`}><div className="mb-2 flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-white/80 text-sm">•</span><p className="font-semibold">{task.title}</p></div><p className="text-sm text-muted-foreground">{task.text}</p></div>) : <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 md:col-span-3"><p className="font-semibold text-emerald-900">วันนี้ยังไม่มีรายการต้องทำเร่งด่วน</p><p className="mt-1 text-sm text-emerald-800/75">ข้อมูลสต็อก หลักฐาน และเงินสดอยู่ในเกณฑ์ที่บันทึกไว้</p></div>}</CardContent></Card>
        <section id="sales" data-reveal className="scroll-mt-24 space-y-4"><MascotTitle eyebrow="ยอดขาย" title={`แนวโน้ม ${monthLabel}`} src="/pet-chihuahua-fluffy.png" alt="ชิวาวาขนยาววาดมือ" width={900} height={600} className="w-28 sm:w-36" /><div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
          <Card><CardHeader><CardTitle>ยอดขายรายวัน</CardTitle><CardDescription>ยอดสุทธิและจำนวนบิลในแต่ละวัน</CardDescription></CardHeader><CardContent><div className="flex h-72 items-end gap-2 overflow-x-auto border-b border-l px-3 pt-8">{trend.map((r) => <div key={r.date} className="flex h-full min-w-12 flex-1 flex-col justify-end gap-2"><p className="text-center text-[11px] font-medium">{Math.round(r.net).toLocaleString('th-TH')}</p><div className="mx-auto w-full max-w-16 rounded-t-lg bg-gradient-to-t from-[#7a482d] to-[#d99563]" style={{ height: `${Math.max(8, (r.net / trendMax) * 78)}%` }} title={`${shortDate(r.date)} ${money(r.net)}`} /><p className="pb-2 text-center text-xs text-muted-foreground">{shortDate(r.date)}</p></div>)}</div></CardContent></Card>
          <Card><CardHeader><CardTitle>ยอดขายตามหมวด</CardTitle><CardDescription>{monthLabel}</CardDescription></CardHeader><CardContent className="space-y-4">{monthCategories.map((item) => <ProgressRow key={item.name} name={item.name} value={item.value} max={monthCategories[0]?.value || 1} />)}</CardContent></Card>
        </div><div className="grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>ช่องทางชำระเงิน</CardTitle></CardHeader><CardContent className="space-y-3">{monthPayments.map((item) => <AmountRow key={item.name} label={item.name} amount={item.value} />)}</CardContent></Card><Card><CardHeader><CardTitle>ปิดยอดล่าสุด</CardTitle></CardHeader><CardContent className="space-y-3"><AmountRow label="ยอดก่อนส่วนลด" amount={latest?.gross || 0} /><AmountRow label="ส่วนลด" amount={latest?.discount || 0} negative /><AmountRow label="ยอดขายสุทธิ" amount={latest?.net || 0} strong /><AmountRow label="เงินสดตาม POS" amount={latest?.cashPos || 0} /><AmountRow label="เงินสดนับจริง" amount={latest?.cashActual || 0} /><p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">{latest?.note || 'ไม่มีหมายเหตุ'}</p></CardContent></Card></div></section>
        <div data-reveal><PosSlips days={closingRows} /></div>
        <section id="costs" data-reveal className="scroll-mt-24 space-y-4"><MascotTitle eyebrow="ค่าใช้จ่าย" title="เงินออกและต้นทุน" src="/pet-orange-cat.png" alt="แมวส้มวาดมือยกอุ้งเท้า" width={600} height={900} className="w-20 sm:w-24" /><div className="grid gap-5 lg:grid-cols-3"><Card><CardHeader><CardDescription>รายจ่ายทั่วไป</CardDescription><CardTitle className="text-3xl">{money(expenses)}</CardTitle></CardHeader><CardContent className="space-y-3">{expenseGroups.map((item) => <AmountRow key={item.name} label={item.name} amount={item.value} />)}</CardContent></Card><Card><CardHeader><CardDescription>ซื้อวัตถุดิบ</CardDescription><CardTitle className="text-3xl">{money(purchases)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{purchaseRows.length} รายการในช่วงที่เลือก</p></CardContent></Card><Card><CardHeader><CardDescription>เงินเดือนที่บันทึก</CardDescription><CardTitle className="text-3xl">{money(payroll)}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">นับเฉพาะรายการ “จ่ายเงินเดือน”</p></CardContent></Card></div>
          <div className="grid gap-5 xl:grid-cols-2"><DetailTable title={`รายจ่ายทั้งหมด ${expenseRows.length} รายการ`} headers={['วันที่', 'รายการ', 'หมวด', 'จำนวน', 'หลักฐาน']} rows={[...expenseRows].sort(byDate).map((r) => [longDate(r.date), r.detail, r.category, money(r.amount), <Evidence key={r.date + r.detail} text={r.evidence + ' ' + r.note} />])} /><DetailTable title={`ซื้อวัตถุดิบทั้งหมด ${purchaseRows.length} รายการ`} headers={['วันที่', 'วัตถุดิบ', 'จำนวน', 'ยอดรวม', 'หลักฐาน']} rows={[...purchaseRows].sort(byDate).map((r) => [longDate(r.date), r.item, `${r.qty.toLocaleString('th-TH')} ${r.unit}`, money(r.total), <Evidence key={r.date + r.item} text={r.note} />])} /></div>
        </section>
        <section id="inventory" data-reveal className="scroll-mt-24 space-y-4"><MascotTitle eyebrow="คลังสินค้า" title="ของขาดและรายการที่ต้องซื้อ" src="/pet-chihuahua-face.png" alt="หน้าชิวาวาวาดมือ" width={843} height={900} className="w-20 rotate-[5deg] sm:w-24" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{orderItems.map((r) => <Card key={r.code} className={r.remaining <= 0 ? 'border-red-200 bg-red-50/70' : 'border-amber-200 bg-amber-50/60'}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardDescription>{r.category}</CardDescription><CardTitle className="mt-1 text-lg">{r.item}</CardTitle></div><Badge variant="outline" className={`stock-sticker ${r.remaining <= 0 ? 'border-red-300 text-red-800' : 'border-amber-300 text-amber-800'}`}>{r.remaining <= 0 ? 'ของหมด' : 'ต้องสั่งซื้อ'}</Badge></div></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">คงเหลือ</p><p className="text-2xl font-semibold">{r.remaining.toLocaleString('th-TH')} <span className="text-sm font-normal text-muted-foreground">{r.unit}</span></p></div><div className="text-right"><p className="text-xs text-muted-foreground">จุดสั่งซื้อ</p><p className="font-medium">{r.reorder.toLocaleString('th-TH')}</p></div></div></CardContent></Card>)}{!orderItems.length && <Card className="sm:col-span-2 xl:col-span-3"><CardContent className="grid min-h-40 place-items-center text-center"><div><PackageCheck className="mx-auto mb-2 size-10 text-emerald-600" /><p className="font-semibold">ยังไม่มีรายการต้องสั่งซื้อ</p></div></CardContent></Card>}</div>
          <DetailTable title={`สต็อกทั้งหมด ${model.stock.length} รายการ`} headers={['วัตถุดิบ', 'หมวด', 'ยกมา', 'ซื้อเข้า', 'ใช้ไป', 'เสีย', 'คงเหลือ', 'สถานะ', 'มูลค่า']} rows={[...model.stock].sort((a, b) => (a.status === 'สั่งซื้อ' ? -1 : 1) - (b.status === 'สั่งซื้อ' ? -1 : 1) || a.category.localeCompare(b.category, 'th')).map((r) => [r.item, r.category, r.opening.toLocaleString('th-TH'), r.bought.toLocaleString('th-TH'), r.used.toLocaleString('th-TH'), r.waste.toLocaleString('th-TH'), `${r.remaining.toLocaleString('th-TH')} ${r.unit}`, r.status, money(r.value)])} wide />
        </section>
        <section id="details" data-reveal className="scroll-mt-24 space-y-4"><SectionTitle eyebrow="ตรวจสอบย้อนหลัง" title="รายละเอียดทั้งหมด" /><div className="grid gap-5 xl:grid-cols-2"><DetailTable title={`ประวัติปิดยอด ${closingRows.length} วัน`} headers={['วันที่', 'ก่อนส่วนลด', 'ส่วนลด', 'ยอดสุทธิ', 'บิล', 'สินค้า', 'เงินสดนับจริง', 'เงินสดตาม POS', 'เงินสดต่าง', 'รายละเอียด / POS']} rows={closingRows.map((r) => [<Button key={r.date} variant="link" onClick={() => { setStartDate(r.date); setEndDate(r.date); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{longDate(r.date)}</Button>, money(r.gross), money(r.discount), money(r.net), r.bills.toLocaleString('th-TH'), r.items.toLocaleString('th-TH'), optionalMoney(r.cashActual), optionalMoney(r.cashPos), `${(r.cashDiff ?? 0) > 0 ? '+' : ''}${optionalMoney(r.cashDiff)}`, <div key={r.date} className="min-w-64 whitespace-normal"><p>{r.note.replace(/https:\/\/\S+/g, '') || 'ไม่มีหมายเหตุ'}</p><Evidence text={r.note} /></div>])} /><DetailTable title={`รายการพนักงาน ${staffRows.length} รายการ`} headers={['วันที่', 'พนักงาน', 'รายการ', 'สุทธิ']} rows={[...staffRows].sort(byDate).map((r) => [longDate(r.date), r.name, r.type, money(r.net)])} /></div></section>
        <section data-reveal className="space-y-4"><SectionTitle eyebrow="แยกรายวัน" title="หมวดสินค้าและการรับชำระย้อนหลัง" /><div className="grid gap-5 xl:grid-cols-2">
          <DetailTable title="ยอดขายตามหมวดทุกรายการ" headers={['วันที่', 'หมวด', 'จำนวน', 'ยอดขาย']} rows={[...model.categories].filter(selected).sort(byDate).map(r => [longDate(r.date), r.name, String(r.qty), money(r.amount)])} />
          <DetailTable title="การชำระเงินทุกรายการ" headers={['วันที่', 'ช่องทาง', 'บิล', 'ยอดเงิน']} rows={[...model.payments].filter(selected).sort(byDate).map(r => [longDate(r.date), r.name, String(r.bills), money(r.amount)])} />
        </div></section>
        <section data-reveal className="space-y-4"><SectionTitle eyebrow="บัญชีเดิม" title="สรุปรายเดือนย้อนหลัง" /><p className="text-sm text-muted-foreground">แสดงยอดเต็มเดือนที่ทับซ้อนกับช่วงวันที่เลือก ข้อมูลเก่าที่มีเพียงสรุปรายเดือนไม่สามารถแยกเป็นยอดรายวัน และไม่นำมาบวกซ้ำในยอดรายวันด้านบน ต้นทุน มิ.ย. 2025 ยังรอยืนยันส่วนต่าง 1,314 บาท</p>
          <DetailTable title="ประวัติรายเดือนจากชีทเดิม" headers={(data.monthlyHistory?.[0] || []).slice(0, 10)} rows={dataRows(data.monthlyHistory).filter(r => monthInRange(r[0], startDate, endDate)).map(r => r.slice(0, 10))} wide />
        </section>
        <footer data-reveal className="flex flex-wrap items-center justify-between gap-3 border-t py-5 text-sm text-muted-foreground"><p>อ่านอย่างเดียว • อ้างอิงข้อมูลจาก Google Sheet</p><p>รีเฟรชล่าสุด {new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.refreshedAt))}</p></footer>
      </div>
    </main>
  </div></>;
}

function group<T extends Record<string, string | number>>(items: T[], nameKey: keyof T, valueKey: keyof T) { const values = new Map<string, number>(); items.forEach((item) => values.set(String(item[nameKey]), (values.get(String(item[nameKey])) || 0) + Number(item[valueKey]))); return [...values].map(([name, value]) => ({ name, value })).filter((r) => r.value !== 0).sort((a, b) => b.value - a.value); }
function Nav({ icon: Icon, children }: { icon: typeof BarChart3; children: React.ReactNode }) { return <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/65"><Icon className="size-5" />{children}</div>; }
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { const coffee = eyebrow === 'ยอดขาย' || eyebrow === 'ค่าใช้จ่าย'; return <div className="relative pr-10"><p className="text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p><h2 className="mt-1 text-2xl font-semibold">{title}</h2>{coffee && <span className="coffee-doodle" aria-hidden="true"><i className="coffee-steam coffee-steam-one" /><i className="coffee-steam coffee-steam-two" /><i className="coffee-bean coffee-bean-one" /><i className="coffee-bean coffee-bean-two" /></span>}</div>; }
function MascotTitle({ eyebrow, title, src, alt, width, height, className }: { eyebrow: string; title: string; src: string; alt: string; width: number; height: number; className: string }) { return <div className="paper-card flex min-h-24 items-center justify-between overflow-hidden rounded-[24px] border bg-white/60 px-5"><SectionTitle eyebrow={eyebrow} title={title} /><Image src={src} alt={alt} width={width} height={height} className={`mascot-float pointer-events-none h-auto self-end drop-shadow-sm ${className}`} /></div>; }
function Kpi({ icon: Icon, label, value, detail, positive }: { icon: typeof Store; label: string; value: string; detail: string; positive?: boolean }) { return <Card className="paper-card"><CardHeader className="pb-3"><div className="mb-2 grid size-10 rotate-[-2deg] place-items-center rounded-2xl bg-[#fff0a8] text-[#7b5e08]"><Icon className="size-4" /></div><CardDescription>{label}</CardDescription><CardTitle className={`text-2xl ${positive === false ? 'text-red-700' : ''}`}>{value}</CardTitle></CardHeader><CardContent className="text-xs text-muted-foreground">{detail}</CardContent></Card>; }
function AlertCard({ tone, icon: Icon, title, text }: { tone: 'red' | 'amber' | 'green'; icon: typeof AlertTriangle; title: string; text: string }) { const style = tone === 'red' ? 'border-red-200 bg-red-50 text-red-900' : tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'; return <div className={`flex items-center gap-3 rounded-2xl border p-4 ${style}`}><Icon className="size-5 shrink-0" /><div><p className="font-semibold">{title}</p><p className="text-xs opacity-70">{text}</p></div></div>; }
function ProgressRow({ name, value, max }: { name: string; value: number; max: number }) { return <div><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="truncate">{name}</span><span className="font-medium">{money(value)}</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#b96d43]" style={{ width: `${Math.max(3, (value / max) * 100)}%` }} /></div></div>; }
function AmountRow({ label, amount, negative, strong }: { label: string; amount: number; negative?: boolean; strong?: boolean }) { return <div className={`flex items-center justify-between gap-4 border-b pb-2 last:border-0 ${strong ? 'font-semibold' : 'text-sm'}`}><span className="truncate">{label}</span><span className={negative ? 'text-red-700' : ''}>{negative && amount ? '-' : ''}{money(amount)}</span></div>; }
function DetailTable({ title, headers, rows, wide }: { title: string; headers: string[]; rows: React.ReactNode[][]; wide?: boolean }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="p-0"><div className={`overflow-auto ${wide ? 'max-h-[620px]' : 'max-h-[460px]'}`}><table className="w-full min-w-[620px] text-left text-sm"><thead className="sticky top-0 z-10 bg-muted"><tr>{headers.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{!rows.length && <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-muted-foreground">ไม่มีรายการในช่วงวันที่เลือก</td></tr>}{rows.map((row, i) => <tr key={`${row[0]}-${i}`} className="border-t hover:bg-muted/35">{row.map((cell, j) => <td key={j} className={`px-4 py-3 ${j === row.length - 1 ? 'text-right font-medium' : ''}`}>{cell}</td>)}</tr>)}</tbody></table></div></CardContent></Card>; }
function LoadingState({ loading, error }: { loading: boolean; error: string }) { return <main className="grid min-h-screen place-items-center p-6"><Card className="w-full max-w-md"><CardContent className="grid min-h-56 place-items-center text-center"><div>{loading ? <LoaderCircle className="mx-auto mb-4 size-9 animate-spin text-primary" /> : <AlertTriangle className="mx-auto mb-4 size-9 text-red-700" />}<p className="font-semibold">{loading ? 'กำลังอ่านข้อมูลจาก Google Sheet' : error}</p></div></CardContent></Card></main>; }

function Evidence({ text }: { text: string }) { const urls = evidenceUrls(text); return urls.length ? <div className="flex flex-wrap gap-3">{urls.map((url, i) => <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-sm text-primary underline">หลักฐาน {i + 1}</a>)}</div> : <span className="text-sm text-muted-foreground">ยังไม่มีรูปหลักฐาน</span>; }
