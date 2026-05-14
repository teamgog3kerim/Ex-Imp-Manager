import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, shipmentsTable } from "@workspace/db";
import {
  CreateShipmentBody,
  UpdateShipmentBody,
  UpdateShipmentParams,
  GetShipmentParams,
  GetShipmentsResponse,
  GetShipmentResponse,
  UpdateShipmentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/shipments", async (req, res): Promise<void> => {
  const { type, status } = req.query as { type?: string; status?: string };
  const conditions = [];
  if (type) conditions.push(eq(shipmentsTable.type, type));
  if (status) conditions.push(eq(shipmentsTable.status, status));

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(shipmentsTable)
          .where(and(...conditions))
          .orderBy(sql`${shipmentsTable.createdAt} desc`)
      : await db.select().from(shipmentsTable).orderBy(sql`${shipmentsTable.createdAt} desc`);

  const items = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  res.json(GetShipmentsResponse.parse(items));
});

router.get("/shipments/:id", async (req, res): Promise<void> => {
  const params = GetShipmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(shipmentsTable).where(eq(shipmentsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Shipment not found" });
    return;
  }
  res.json(GetShipmentResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

router.post("/shipments", async (req, res): Promise<void> => {
  const parsed = CreateShipmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(shipmentsTable).values(parsed.data).returning();
  res.status(201).json(GetShipmentResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

router.patch("/shipments/:id", async (req, res): Promise<void> => {
  const params = UpdateShipmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateShipmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(shipmentsTable)
    .set(parsed.data)
    .where(eq(shipmentsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Shipment not found" });
    return;
  }
  res.json(UpdateShipmentResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

export default router;
