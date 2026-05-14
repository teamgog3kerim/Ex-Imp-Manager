import { Router, type IRouter } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, exportLotsTable } from "@workspace/db";
import {
  CreateExportLotBody,
  UpdateExportLotBody,
  UpdateExportLotParams,
  GetExportLotsResponse,
  UpdateExportLotResponse,
  GetExportStockSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/export-lots", async (req, res): Promise<void> => {
  const { commodity, status } = req.query as { commodity?: string; status?: string };
  const conditions = [];
  if (commodity) conditions.push(eq(exportLotsTable.commodity, commodity));
  if (status) conditions.push(eq(exportLotsTable.status, status));

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(exportLotsTable)
          .where(and(...conditions))
          .orderBy(sql`${exportLotsTable.createdAt} desc`)
      : await db.select().from(exportLotsTable).orderBy(sql`${exportLotsTable.createdAt} desc`);

  const items = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  res.json(GetExportLotsResponse.parse(items));
});

router.get("/export-lots/stock-summary", async (_req, res): Promise<void> => {
  const allLots = await db.select().from(exportLotsTable);

  const coffeeMt = allLots
    .filter((l) => l.commodity.toLowerCase() === "coffee")
    .reduce((s, l) => s + l.quantityMt, 0);
  const oilseedsMt = allLots
    .filter((l) => ["sesame", "flaxseed"].includes(l.commodity.toLowerCase()))
    .reduce((s, l) => s + l.quantityMt, 0);
  const pulsesMt = allLots
    .filter((l) => ["lentils", "chickpeas"].includes(l.commodity.toLowerCase()))
    .reduce((s, l) => s + l.quantityMt, 0);
  const totalPurchaseValueEtb = allLots.reduce((s, l) => s + l.totalCostEtb, 0);

  // Group breakdown
  const byComm: Record<string, { quantityMt: number; valueEtb: number }> = {};
  for (const l of allLots) {
    if (!byComm[l.commodity]) byComm[l.commodity] = { quantityMt: 0, valueEtb: 0 };
    byComm[l.commodity].quantityMt += l.quantityMt;
    byComm[l.commodity].valueEtb += l.totalCostEtb;
  }
  const breakdown = Object.entries(byComm).map(([commodity, v]) => ({ commodity, ...v }));

  res.json(
    GetExportStockSummaryResponse.parse({ coffeeMt, oilseedsMt, pulsesMt, totalPurchaseValueEtb, breakdown })
  );
});

router.post("/export-lots", async (req, res): Promise<void> => {
  const parsed = CreateExportLotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const totalCostEtb = (parsed.data.quantityMt ?? 0) * 1000 * (parsed.data.priceEtbPerKg ?? 0);
  const estimatedFobUsd = parsed.data.fobPriceUsdMt
    ? (parsed.data.quantityMt ?? 0) * parsed.data.fobPriceUsdMt
    : null;
  const [row] = await db
    .insert(exportLotsTable)
    .values({ ...parsed.data, totalCostEtb, estimatedFobUsd })
    .returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/export-lots/:id", async (req, res): Promise<void> => {
  const params = UpdateExportLotParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateExportLotBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(exportLotsTable)
    .set(parsed.data)
    .where(eq(exportLotsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Export lot not found" });
    return;
  }
  res.json(UpdateExportLotResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

export default router;
