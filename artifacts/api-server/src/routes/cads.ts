import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, cadsTable } from "@workspace/db";
import {
  CreateCadBody,
  UpdateCadBody,
  UpdateCadParams,
  GetCadsResponse,
  UpdateCadResponse,
  GetCadPaymentSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/cads", async (_req, res): Promise<void> => {
  const rows = await db.select().from(cadsTable).orderBy(sql`${cadsTable.createdAt} desc`);
  const items = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  res.json(GetCadsResponse.parse(items));
});

router.get("/cads/payment-summary", async (_req, res): Promise<void> => {
  const allCads = await db.select().from(cadsTable);
  const totalFobUsd = allCads.reduce((s, c) => s + c.fobUsd, 0);
  const received = allCads.filter((c) => c.status === "received");
  const receivedUsd = received.reduce((s, c) => s + c.fobUsd, 0);
  const usdRetained = received.reduce((s, c) => s + (c.usdRetained ?? c.fobUsd * 0.3), 0);
  const etbConverted = received.reduce((s, c) => s + (c.etbConverted ?? 0), 0);

  res.json(
    GetCadPaymentSummaryResponse.parse({
      totalFobUsd,
      receivedUsd,
      outstandingUsd: totalFobUsd - receivedUsd,
      usdRetained,
      etbConverted,
      activeCads: allCads.filter((c) => c.status === "active").length,
      pendingPayment: allCads.filter((c) => c.status === "awaiting_payment").length,
      paymentsReceived: received.length,
    })
  );
});

router.post("/cads", async (req, res): Promise<void> => {
  const parsed = CreateCadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(cadsTable).values(parsed.data).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/cads/:id", async (req, res): Promise<void> => {
  const params = UpdateCadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(cadsTable)
    .set(parsed.data)
    .where(eq(cadsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "CAD not found" });
    return;
  }
  res.json(UpdateCadResponse.parse({ ...row, createdAt: row.createdAt.toISOString() }));
});

export default router;
