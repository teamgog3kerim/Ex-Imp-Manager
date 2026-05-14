import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, lcsTable } from "@workspace/db";
import {
  CreateLcBody,
  UpdateLcBody,
  UpdateLcParams,
  DeleteLcParams,
  GetLcParams,
  GetLcsResponse,
  GetLcResponse,
  UpdateLcResponse,
  GetLcSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/lcs", async (req, res): Promise<void> => {
  const { status } = req.query as { status?: string };
  let rows;
  if (status) {
    rows = await db.select().from(lcsTable).where(eq(lcsTable.status, status)).orderBy(sql`${lcsTable.createdAt} desc`);
  } else {
    rows = await db.select().from(lcsTable).orderBy(sql`${lcsTable.createdAt} desc`);
  }

  const items = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));
  res.json(GetLcsResponse.parse(items));
});

router.get("/lcs/summary", async (_req, res): Promise<void> => {
  const [opened] = await db.select({ total: sql<number>`coalesce(sum(value_usd), 0)` }).from(lcsTable);
  const [settled] = await db
    .select({ total: sql<number>`coalesce(sum(settlement_cost_etb), 0)` })
    .from(lcsTable)
    .where(eq(lcsTable.status, "settled"));

  const creditFacility = 5000000;
  const [usedRow] = await db
    .select({ total: sql<number>`coalesce(sum(value_usd), 0)` })
    .from(lcsTable)
    .where(eq(lcsTable.status, "approved"));

  const creditUsed = Number(usedRow?.total ?? 0);
  const creditAvailable = creditFacility - creditUsed;

  res.json(
    GetLcSummaryResponse.parse({
      totalOpened: Number(opened?.total ?? 0),
      totalSettled: Number(settled?.total ?? 0),
      creditFacility,
      creditUsed,
      creditAvailable,
      utilizationPct: creditFacility > 0 ? (creditUsed / creditFacility) * 100 : 0,
    })
  );
});

router.get("/lcs/:id", async (req, res): Promise<void> => {
  const params = GetLcParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(lcsTable).where(eq(lcsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "LC not found" });
    return;
  }
  res.json(GetLcResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

router.post("/lcs", async (req, res): Promise<void> => {
  const parsed = CreateLcBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(lcsTable).values(parsed.data).returning();
  res.status(201).json(GetLcResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

router.patch("/lcs/:id", async (req, res): Promise<void> => {
  const params = UpdateLcParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateLcBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(lcsTable)
    .set(parsed.data)
    .where(eq(lcsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "LC not found" });
    return;
  }
  res.json(UpdateLcResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

router.delete("/lcs/:id", async (req, res): Promise<void> => {
  const params = DeleteLcParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(lcsTable).where(eq(lcsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "LC not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
