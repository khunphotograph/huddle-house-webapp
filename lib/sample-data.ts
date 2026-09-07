import type { Closing, Expense } from './types';

export const sampleClosings: Closing[] = [
  { id: 'sheet-3', businessDate: '2026-09-03', closingTime: '17:55', items: 16, bills: 9, grossSales: 1420, discount: 0, refund: 0, netSales: 1420, cashExpected: 518, cashActual: 518, cashDifference: 0, categoryTotal: 1420, paymentTotal: 1420, note: 'ข้อมูลล่าสุดจาก Google Sheet', syncStatus: 'synced' },
  { id: 'sheet-2', businessDate: '2026-09-02', openingTime: '08:57', closingTime: '17:39', items: 19, bills: 9, grossSales: 1815, discount: 0, refund: 0, netSales: 1815, cashExpected: 568, cashActual: 1815, cashDifference: 1247, categoryTotal: 1815, paymentTotal: 1815, note: 'พบเงินสดเกิน ต้องตรวจสอบ', syncStatus: 'synced' },
  { id: 'sheet-1', businessDate: '2026-09-01', openingTime: '08:55', closingTime: '18:05', items: 27, bills: 12, grossSales: 2483, discount: 0, refund: 0, netSales: 2483, cashExpected: 1457, cashActual: 1457, cashDifference: 0, categoryTotal: 2483, paymentTotal: 2483, note: 'ข้อมูลล่าสุดจาก Google Sheet', syncStatus: 'synced' },
];

export const sampleExpenses: Expense[] = [];
