import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, transactionsTable, pettyCashTable, lcsTable, inventoryTable, salesTable, cadsTable } from "@workspace/db";
import {
  CreateTransactionBody,
  CreatePettyCashEntryBody,
  GetTransactionsResponse,
  GetFinanceSummaryResponse,
  GetCashFlowResponse,
  GetPettyCashEntriesResponse,
  GetPettyCashSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const { type } = req.query as { type?: string };
  const rows = type
    ? await db.select().from(transactionsTable).where(eq(transactionsTable.type, type)).orderBy(sql`${transactionsTable.createdAt} desc`)
    : await db.select().from(transactionsTable).orderBy(sql`${transactionsTable.createdAt} desc`);

  res.json(GetTransactionsResponse.parse(rows));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(transactionsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.get("/finance/summary", async (_req, res): Promise<void> => {
  const [inventoryVal] = await db
    .select({ total: sql<number>`coalesce(sum(total_value_etb), 0)` })
    .from(inventoryTable);
  const [salesTotal] = await db
    .select({ total: sql<number>`coalesce(sum(amount_etb), 0)` })
    .from(salesTable);
  const [lcCredit] = await db
    .select({ total: sql<number>`coalesce(sum(value_usd), 0)` })
    .from(lcsTable)
    .where(eq(lcsTable.status, "approved"));
  const [cadReceivable] = await db
    .select({ total: sql<number>`coalesce(sum(fob_usd), 0)` })
    .from(cadsTable)
    .where(eq(cadsTable.status, "awaiting_payment"));

  const salesTotalNum = Number(salesTotal?.total ?? 0);
  const inventoryValNum = Number(inventoryVal?.total ?? 0);
  const netProfit = salesTotalNum - inventoryValNum * 0.7;
  const netProfitMargin = salesTotalNum > 0 ? (netProfit / salesTotalNum) * 100 : 0;

  const summary = {
    mainAccountEtb: 12450000,
    lcCreditFacilityUsd: 5000000,
    lcCreditUsedUsd: Number(lcCredit?.total ?? 0),
    nbeRetentionUsd: Number(cadReceivable?.total ?? 0) * 0.3,
    importPayablesEtb: 8200000,
    exportReceivablesUsd: Number(cadReceivable?.total ?? 0),
    inventoryValueEtb: inventoryValNum,
    totalSalesEtb: salesTotalNum,
    netProfitMargin: Math.round(netProfitMargin * 100) / 100,
    netProfitEtb: Math.round(netProfit),
    upcomingObligations: [
      { label: "LC Settlement - CBE", amount: 285000, currency: "USD", dueDate: "2026-05-20", severity: "high" as const },
      { label: "Freight Invoice - DHL", amount: 1250000, currency: "ETB", dueDate: "2026-05-25", severity: "medium" as const },
      { label: "CAD Payment - Olam", amount: 180000, currency: "USD", dueDate: "2026-06-01", severity: "low" as const },
    ],
  };

  res.json(GetFinanceSummaryResponse.parse(summary));
});

router.get("/finance/cash-flow", async (_req, res): Promise<void> => {
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  const inflows =  [8.2, 9.5, 7.1, 11.3, 10.2, 13.5, 9.8];
  const outflows = [6.1, 7.3, 5.8, 8.9, 7.7, 10.2, 7.4];

  const data = months.map((month, i) => ({
    month,
    inflow: inflows[i],
    outflow: outflows[i],
  }));
  res.json(GetCashFlowResponse.parse(data));
});

// Petty cash
router.get("/petty-cash", async (_req, res): Promise<void> => {
  const rows = await db.select().from(pettyCashTable).orderBy(sql`${pettyCashTable.createdAt} desc`);
  res.json(GetPettyCashEntriesResponse.parse(rows));
});

router.post("/petty-cash", async (req, res): Promise<void> => {
  const parsed = CreatePettyCashEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // compute running balance
  const [lastRow] = await db.select().from(pettyCashTable).orderBy(sql`${pettyCashTable.createdAt} desc`).limit(1);
  const prevBalance = lastRow?.balanceAfterEtb ?? 15000;
  const newBalance = prevBalance - (parsed.data.amountEtb ?? 0);

  const data = {
    voucherNumber: parsed.data.voucherNumber ?? `PC-${Date.now()}`,
    date: parsed.data.date,
    description: parsed.data.description,
    category: parsed.data.category,
    requestedBy: parsed.data.requestedBy,
    approvedBy: parsed.data.approvedBy ?? "",
    amountEtb: parsed.data.amountEtb,
    balanceAfterEtb: newBalance,
    receiptStatus: parsed.data.receiptStatus ?? "pending",
  };

  const [row] = await db.insert(pettyCashTable).values(data).returning();
  res.status(201).json(row);
});

router.get("/petty-cash/summary", async (_req, res): Promise<void> => {
  const rows = await db.select().from(pettyCashTable).orderBy(sql`${pettyCashTable.createdAt} asc`);
  const totalDisbursed = rows.reduce((s, r) => s + r.amountEtb, 0);
  const closingBalance = rows.length > 0 ? rows[rows.length - 1].balanceAfterEtb : 15000;

  // category breakdown
  const byCategory: Record<string, number> = {};
  for (const r of rows) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amountEtb;
  }
  const categoryBreakdown = Object.entries(byCategory).map(([category, amountEtb]) => ({
    category,
    amountEtb,
  }));

  res.json(
    GetPettyCashSummaryResponse.parse({
      openingBalance: 15000,
      totalDisbursed,
      replenishments: 0,
      closingBalance,
      ceiling: 15000,
      maxPerVoucher: 2000,
      replenishTrigger: 3000,
      categoryBreakdown,
    })
  );
});

export default router;
