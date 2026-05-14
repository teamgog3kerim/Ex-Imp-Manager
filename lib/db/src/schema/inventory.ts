import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const inventoryTable = pgTable("inventory", {
  id: serial("id").primaryKey(),
  invId: text("inv_id").notNull(),
  product: text("product").notNull(),
  description: text("description"),
  shipmentRef: text("shipment_ref").notNull(),
  quantity: integer("quantity").notNull(),
  warehouse: text("warehouse").notNull(),
  status: text("status").notNull().default("in_stock"),
  unitPriceEtb: real("unit_price_etb").notNull(),
  landedCostEtb: real("landed_cost_etb").notNull(),
  totalValueEtb: real("total_value_etb").notNull(),
  salesPriceEtb: real("sales_price_etb"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  saleId: text("sale_id").notNull(),
  customer: text("customer").notNull(),
  inventoryItemId: integer("inventory_item_id").notNull(),
  product: text("product").notNull(),
  quantity: integer("quantity").notNull(),
  amountEtb: real("amount_etb").notNull(),
  date: text("date").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventorySchema = createInsertSchema(inventoryTable).omit({ id: true, createdAt: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type InventoryItem = typeof inventoryTable.$inferSelect;

export const insertSaleSchema = createInsertSchema(salesTable).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
