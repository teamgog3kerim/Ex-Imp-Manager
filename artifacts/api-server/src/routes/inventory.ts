import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, inventoryTable, salesTable } from "@workspace/db";
import {
  CreateInventoryItemBody,
  UpdateInventoryItemBody,
  UpdateInventoryItemParams,
  CreateSaleBody,
  GetInventoryItemsResponse,
  UpdateInventoryItemResponse,
  GetInventorySummaryResponse,
  GetSalesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/inventory", async (_req, res): Promise<void> => {
  const rows = await db.select().from(inventoryTable).orderBy(sql`${inventoryTable.createdAt} desc`);
  const items = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  res.json(GetInventoryItemsResponse.parse(items));
});

router.get("/inventory/summary", async (_req, res): Promise<void> => {
  const [skuCount] = await db.select({ count: sql<number>`count(*)` }).from(inventoryTable);
  const [lowStockCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(inventoryTable)
    .where(eq(inventoryTable.status, "low_stock"));
  const [totalVal] = await db
    .select({ total: sql<number>`coalesce(sum(total_value_etb), 0)` })
    .from(inventoryTable);
  const warehouses = await db
    .selectDistinct({ warehouse: inventoryTable.warehouse })
    .from(inventoryTable);

  res.json(
    GetInventorySummaryResponse.parse({
      totalSkus: Number(skuCount?.count ?? 0),
      warehouseCount: warehouses.length,
      lowStockCount: Number(lowStockCount?.count ?? 0),
      totalValueEtb: Number(totalVal?.total ?? 0),
    })
  );
});

router.post("/inventory", async (req, res): Promise<void> => {
  const parsed = CreateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = {
    ...parsed.data,
    totalValueEtb: (parsed.data.unitPriceEtb ?? 0) * (parsed.data.quantity ?? 0),
  };
  const [row] = await db.insert(inventoryTable).values(data).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/inventory/:id", async (req, res): Promise<void> => {
  const params = UpdateInventoryItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateInventoryItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(inventoryTable)
    .set(parsed.data)
    .where(eq(inventoryTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Inventory item not found" });
    return;
  }
  res.json(UpdateInventoryItemResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

router.get("/sales", async (_req, res): Promise<void> => {
  const rows = await db.select().from(salesTable).orderBy(sql`${salesTable.createdAt} desc`);
  const items = rows.map((r) => ({ ...r, createdAt: undefined }));
  res.json(GetSalesResponse.parse(rows));
});

router.post("/sales", async (req, res): Promise<void> => {
  const parsed = CreateSaleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { saleId, ...rest } = parsed.data as typeof parsed.data & { saleId?: string };
  const data = {
    ...rest,
    saleId: saleId ?? `SALE-${Date.now()}`,
  };
  const [row] = await db.insert(salesTable).values(data).returning();
  res.status(201).json(row);
});

export default router;
