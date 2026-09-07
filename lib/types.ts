export type Closing = {
  id: number | string;
  businessDate: string;
  openingTime?: string | null;
  closingTime?: string | null;
  items: number;
  bills: number;
  grossSales: number;
  discount: number;
  refund: number;
  netSales: number;
  cashExpected: number;
  cashActual: number;
  cashDifference: number;
  categoryTotal: number;
  paymentTotal: number;
  sourceImageKey?: string | null;
  note?: string | null;
  syncStatus?: string;
};

export type Expense = {
  id: number | string;
  businessDate: string;
  payee: string;
  category: string;
  description: string;
  paymentMethod: string;
  amount: number;
  receiptKey?: string | null;
  note?: string | null;
  syncStatus?: string;
};
