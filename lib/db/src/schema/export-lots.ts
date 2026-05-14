import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const exportLotsTable = pgTable("export_lots", {
  id: serial("id").primaryKey(),
  lotId: text("lot_id").notNull(),
  ecxReference: text("ecx_reference"),
  commodity: text("commodity").notNull(),
  grade: text("grade").notNull(),
  origin: text("origin").notNull(),
  processingMethod: text("processing_method"),
  quantityMt: real("quantity_mt").notNull(),
  bags: integer("bags").notNull(),
  priceEtbPerKg: real("price_etb_per_kg").notNull(),
  totalCostEtb: real("total_cost_etb").notNull(),
  warehouse: text("warehouse").notNull(),
  status: text("status").notNull().default("raw"),
  phytoExpiry: text("phyto_expiry"),
  certifications: text("certifications"),
  fobPriceUsdMt: real("fob_price_usd_mt"),
  estimatedFobUsd: real("estimated_fob_usd"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertExportLotSchema = createInsertSchema(exportLotsTable).omit({ id: true, createdAt: true });
export type InsertExportLot = z.infer<typeof insertExportLotSchema>;
export type ExportLot = typeof exportLotsTable.$inferSelect;
