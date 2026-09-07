import { sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const dailyClosings = sqliteTable('daily_closings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  businessDate: text('business_date').notNull().unique(),
  openingTime: text('opening_time'),
  closingTime: text('closing_time'),
  items: integer('items').notNull().default(0),
  bills: integer('bills').notNull().default(0),
  grossSales: real('gross_sales').notNull().default(0),
  discount: real('discount').notNull().default(0),
  refund: real('refund').notNull().default(0),
  netSales: real('net_sales').notNull().default(0),
  cashExpected: real('cash_expected').notNull().default(0),
  cashActual: real('cash_actual').notNull().default(0),
  cashDifference: real('cash_difference').notNull().default(0),
  categoryTotal: real('category_total').notNull().default(0),
  paymentTotal: real('payment_total').notNull().default(0),
  sourceImageKey: text('source_image_key'),
  note: text('note'),
  syncStatus: text('sync_status').notNull().default('pending'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  businessDate: text('business_date').notNull(),
  payee: text('payee').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  paymentMethod: text('payment_method').notNull(),
  amount: real('amount').notNull(),
  receiptKey: text('receipt_key'),
  note: text('note'),
  syncStatus: text('sync_status').notNull().default('pending'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});
