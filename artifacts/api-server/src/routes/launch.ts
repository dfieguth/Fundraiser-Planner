import { Router, type IRouter } from "express";
import { createHash, timingSafeEqual } from "node:crypto";

const router: IRouter = Router();
const VALID_EVENTS = new Set([
  "planner_started",
  "planner_completed",
  "checkout_clicked",
  "purchase_succeeded",
]);

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

router.post("/access-code", (req, res) => {
  const submitted = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
  const secret = process.env.SESSION_SECRET;
  if (!secret) return res.status(503).json({ error: "Access code validation is not configured" });

  // Keep the early-access value out of the browser bundle. The session secret
  // also makes this comparison useless outside this server environment.
  const expected = digest("DEVINTEST:" + secret);
  const actual = digest(submitted + ":" + secret);
  const valid = submitted.length > 0 && timingSafeEqual(expected, actual);
  return res.json(valid ? { valid: true, durationDays: 30 } : { valid: false });
});

router.post("/analytics", (req, res) => {
  const event = req.body?.event;
  if (typeof event !== "string" || !VALID_EVENTS.has(event)) {
    return res.status(400).json({ error: "Invalid event" });
  }
  req.log.info({ event }, "Funnel event");
  return res.status(204).end();
});

export default router;