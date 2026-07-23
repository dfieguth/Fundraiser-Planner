import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stripeRouter from "./stripe";
import purchasesRouter from "./purchases";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stripeRouter);
router.use(purchasesRouter);

export default router;
