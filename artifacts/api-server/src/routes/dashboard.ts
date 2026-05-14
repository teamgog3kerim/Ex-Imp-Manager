import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  lcsTable,
  shipmentsTable,
  inventoryTable,
  salesTable,
  exportLotsTable,
  cadsTable,
  activityTable,
} from "@workspace/db";
import { sql, eq } from "drizzle-orm";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
  GetTradeVolumeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const [shipmentCount] = await db.select({ count: sql<number>`count(*)` }).from(shipmentsTable);
  const [activeLcCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(lcsTable)
    .where(eq(lcsTable.status, "approved"));
  const [inventoryVal] = await db
    .select({ total: sql<number>`coalesce(sum(total_value_etb), 0)` })
    .from(inventoryTable);
  const [salesTotal] = await db
    .select({ total: sql<number>`coalesce(sum(amount_etb), 0)` })
    .from(salesTable);

  const summary = {
    totalShipments: Number(shipmentCount?.count ?? 0),
    activeLcs: Number(activeLcCount?.count ?? 0),
    customsAtRisk: 2,
    totalRevenue: Number(salesTotal?.total ?? 0),
    efficiencyScore: 87,
    onTimeRate: 78.5,
    lcProcessingDays: 4.2,
    customsClearanceRate: 94.3,
    shipmentDelayRisk: 23.0,
    costOptimization: 12.5,
    marketVolatility: 34.2,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(activityTable)
    .orderBy(sql`${activityTable.createdAt} desc`)
    .limit(20);

  const items = rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    timestamp: r.createdAt.toISOString(),
    severity: r.severity,
  }));

  res.json(GetRecentActivityResponse.parse(items));
});

router.get("/dashboard/trade-volume", async (_req, res): Promise<void> => {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  const importValues = [4.2, 5.1, 3.8, 6.2, 5.5, 7.1, 4.9];
  const exportValues = [2.1, 3.4, 2.8, 4.1, 3.7, 5.2, 3.8];

  const data = months.map((month, i) => ({
    month,
    imports: importValues[i],
    exports: exportValues[i],
  }));

  res.json(GetTradeVolumeResponse.parse(data));
});

export default router;
