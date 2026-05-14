import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lcsTable = pgTable("lcs", {
  id: serial("id").primaryKey(),
  lcNumber: text("lc_number").notNull(),
  piNumber: text("pi_number").notNull(),
  supplier: text("supplier").notNull(),
  bank: text("bank").notNull(),
  valueUsd: real("value_usd").notNull(),
  terms: text("terms").notNull(),
  marginPct: real("margin_pct"),
  status: text("status").notNull().default("draft"),
  openingCostEtb: real("opening_cost_etb").notNull(),
  settlementCostEtb: real("settlement_cost_etb"),
  freightCostEtb: real("freight_cost_etb"),
  ecNumber: text("ec_number"),
  ecExpiry: text("ec_expiry"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLcSchema = createInsertSchema(lcsTable).omit({ id: true, createdAt: true });
export type InsertLc = z.infer<typeof insertLcSchema>;
export type Lc = typeof lcsTable.$inferSelect;
