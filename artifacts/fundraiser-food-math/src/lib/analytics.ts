export type FunnelEvent =
  | "planner_started"
  | "planner_completed"
  | "checkout_clicked"
  | "purchase_succeeded";

/** Sends event names only; never include plan, attendance, meal, or payment data. */
export function trackFunnelEvent(event: FunnelEvent): void {
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event }),
    keepalive: true,
  }).catch(() => {});
}