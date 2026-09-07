export function inDateRange(date: string, start: string, end: string) {
  if (start && end && start > end) return false;
  if (!date) return !start && !end;
  return (!start || date >= start) && (!end || date <= end);
}

export function evidenceUrls(text: string) {
  return [...new Set(text.match(/https:\/\/drive\.google\.com\/[^\s]+/g) || [])];
}

export function monthInRange(label: string, start: string, end: string) {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const [name, year] = label.trim().split(/\s+/);
  const month = months.indexOf(name) + 1;
  if (!month || !/^\d{4}$/.test(year)) return !start && !end;
  if (start && end && start > end) return false;
  const first = `${year}-${String(month).padStart(2, '0')}-01`;
  const last = `${year}-${String(month).padStart(2, '0')}-${new Date(Number(year), month, 0).getDate()}`;
  return (!start || last >= start) && (!end || first <= end);
}
