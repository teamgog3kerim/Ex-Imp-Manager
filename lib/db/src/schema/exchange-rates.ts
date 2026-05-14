import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exchangeRatesTable = pgTable("exchange_rates", {
  id: serial("id").primaryKey(),
  bank: text("bank").notNull(),
  currency: text("currency").notNull(),
  buyRate: real("buy_rate").notNull(),
  sellRate: real("sell_rate").notNull(),
  spread: real("spread").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRatesTable).omit({ id: true, updatedAt: true });
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type ExchangeRate = typeof exchangeRatesTable.$inferSelect;
