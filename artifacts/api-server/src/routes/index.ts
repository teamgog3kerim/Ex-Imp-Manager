import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import lcsRouter from "./lcs";
import shipmentsRouter from "./shipments";
import inventoryRouter from "./inventory";
import exportLotsRouter from "./export-lots";
import cadsRouter from "./cads";
import exchangeRatesRouter from "./exchange-rates";
import financeRouter from "./finance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(lcsRouter);
router.use(shipmentsRouter);
router.use(inventoryRouter);
router.use(exportLotsRouter);
router.use(cadsRouter);
router.use(exchangeRatesRouter);
router.use(financeRouter);

export default router;
