import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, exchangeRatesTable } from "@workspace/db";
import {
  UpsertExchangeRateBody,
  GetExchangeRatesResponse,
  UpsertExchangeRateResponse,
  GetBestRatesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/exchange-rates", async (_req, res): Promise<void> => {
  const rows = await db.select().from(exchangeRatesTable).orderBy(sql`${exchangeRatesTable.updatedAt} desc`);
  const items = rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
  res.json(GetExchangeRatesResponse.parse(items));
});

router.get("/exchange-rates/best", async (_req, res): Promise<void> => {
  const rows = await db.select().from(exchangeRatesTable).where(eq(exchangeRatesTable.currency, "USD"));
  if (!rows.length) {
    res.json(
      GetBestRatesResponse.parse({
        bestBuyRate: 0,
        bestBuyBank: "N/A",
        bestSellRate: 0,
        bestSellBank: "N/A",
        averageRate: 0,
        monitoredBanks: 0,
      })
    );
    return;
  }

  const bestBuy = rows.reduce((a, b) => (a.buyRate > b.buyRate ? a : b));
  const bestSell = rows.reduce((a, b) => (a.sellRate < b.sellRate ? a : b));
  const avgRate = rows.reduce((s, r) => s + r.buyRate, 0) / rows.length;

  res.json(
    GetBestRatesResponse.parse({
      bestBuyRate: bestBuy.buyRate,
      bestBuyBank: bestBuy.bank,
      bestSellRate: bestSell.sellRate,
      bestSellBank: bestSell.bank,
      averageRate: Math.round(avgRate * 100) / 100,
      monitoredBanks: rows.length,
    })
  );
});

router.post("/exchange-rates", async (req, res): Promise<void> => {
  const parsed = UpsertExchangeRateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const spread = parsed.data.sellRate - parsed.data.buyRate;
  const existing = await db
    .select()
    .from(exchangeRatesTable)
    .where(
      and(
        eq(exchangeRatesTable.bank, parsed.data.bank),
        eq(exchangeRatesTable.currency, parsed.data.currency)
      )
    );

  let row;
  if (existing.length > 0) {
    [row] = await db
      .update(exchangeRatesTable)
      .set({ ...parsed.data, spread, updatedAt: new Date() })
      .where(eq(exchangeRatesTable.id, existing[0].id))
      .returning();
  } else {
    [row] = await db
      .insert(exchangeRatesTable)
      .values({ ...parsed.data, spread })
      .returning();
  }
  res.json(UpsertExchangeRateResponse.parse({ ...row, updatedAt: row.updatedAt.toISOString() }));
});

export default router;
