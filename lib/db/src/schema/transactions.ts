import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  date: text("date").notNull(),
  type: text("type").notNull(),
  amountEtb: real("amount_etb").notNull(),
  direction: text("direction").notNull(),
  status: text("status").notNull().default("completed"),
  reference: text("reference"),
  bank: text("bank"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pettyCashTable = pgTable("petty_cash", {
  id: serial("id").primaryKey(),
  voucherNumber: text("voucher_number").notNull(),
  date: text("date").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  requestedBy: text("requested_by").notNull(),
  approvedBy: text("approved_by").notNull().default(""),
  amountEtb: real("amount_etb").notNull(),
  balanceAfterEtb: real("balance_after_etb").notNull().default(0),
  receiptStatus: text("receipt_status").notNull().default("none"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

export const insertPettyCashSchema = createInsertSchema(pettyCashTable).omit({ id: true, createdAt: true });
export type InsertPettyCash = z.infer<typeof insertPettyCashSchema>;
export type PettyCash = typeof pettyCashTable.$inferSelect;
