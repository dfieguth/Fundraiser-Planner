import { pgTable, text, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Durable record of a completed purchase. Created when Stripe confirms
// payment (success redirect and/or webhook). The `id` UUID is the permanent
// plan key used in /plan/:planId links.
export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeSessionId: text("stripe_session_id").unique(),
  customerEmail: text("customer_email"),
  planData: jsonb("plan_data"),
  formData: jsonb("form_data"),
  confirmationEmailSentAt: timestamp("confirmation_email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchases.$inferSelect;
