import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cadsTable = pgTable("cads", {
  id: serial("id").primaryKey(),
  cadRef: text("cad_ref").notNull(),
  cadType: text("cad_type").notNull(),
  buyer: text("buyer").notNull(),
  buyerCountry: text("buyer_country").notNull(),
  destination: text("destination").notNull(),
  commodity: text("commodity").notNull(),
  quantityMt: real("quantity_mt"),
  fobUsd: real("fob_usd").notNull(),
  etbEquiv: real("etb_equiv"),
  usdRetained: real("usd_retained"),
  etbConverted: real("etb_converted"),
  paymentTerms: text("payment_terms").notNull(),
  dueDate: text("due_date"),
  receivedDate: text("received_date"),
  status: text("status").notNull().default("active"),
  linkedLotId: integer("linked_lot_id"),
  linkedShipmentId: integer("linked_shipment_id"),
  missingDocs: text("missing_docs"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCadSchema = createInsertSchema(cadsTable).omit({ id: true, createdAt: true });
export type InsertCad = z.infer<typeof insertCadSchema>;
export type Cad = typeof cadsTable.$inferSelect;
