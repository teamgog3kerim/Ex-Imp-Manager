import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shipmentsTable = pgTable("shipments", {
  id: serial("id").primaryKey(),
  shipmentRef: text("shipment_ref").notNull(),
  type: text("type").notNull(),
  origin: text("origin").notNull(),
  destination: text("destination").notNull(),
  status: text("status").notNull(),
  eta: text("eta").notNull(),
  blNumber: text("bl_number"),
  decNumber: text("dec_number"),
  description: text("description"),
  progressPct: integer("progress_pct").notNull().default(0),
  vessel: text("vessel"),
  forwarder: text("forwarder"),
  freightUsd: real("freight_usd"),
  linkedLcId: integer("linked_lc_id"),
  linkedCadId: integer("linked_cad_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShipmentSchema = createInsertSchema(shipmentsTable).omit({ id: true, createdAt: true });
export type InsertShipment = z.infer<typeof insertShipmentSchema>;
export type Shipment = typeof shipmentsTable.$inferSelect;
