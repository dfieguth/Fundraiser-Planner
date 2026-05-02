import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// /api/healthz — original route (keep for backwards compatibility)
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// /api/health — alias used by Fundraiser Food Math readiness checks
router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

export default router;
