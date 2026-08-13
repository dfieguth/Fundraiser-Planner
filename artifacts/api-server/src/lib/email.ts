const RESEND_API_URL = "https://api.resend.com/emails";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const appUrl = (process.env.APP_URL ?? "https://fundraiser-planner.replit.app").replace(/\/$/, "");

type SendPlanConfirmationInput = {
  customerEmail: string;
  planId: string;
  stripeSessionId: string;
};

export type SendPlanConfirmationResult =
  | { sent: true }
  | { sent: false; reason: "unconfigured" };

export async function sendPlanConfirmationEmail({
  customerEmail,
  planId,
  stripeSessionId,
}: SendPlanConfirmationInput): Promise<SendPlanConfirmationResult> {
  if (!resendApiKey || !resendFromEmail) {
    return { sent: false, reason: "unconfigured" };
  }

  const planUrl = `${appUrl}/plan/${planId}`;
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `fundraiser-plan-${stripeSessionId}`,
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [customerEmail],
      subject: "Your Fundraiser Food Math plan is ready",
      text: [
        "Thank you for using Fundraiser Food Math.",
        "",
        "Your permanent plan link is ready:",
        planUrl,
        "",
        "Bookmark or save this link. It is the only way to return to your plan later.",
        "",
        "We hope your fundraiser goes smoothly!",
      ].join("\n"),
      html: [
        "<p>Thank you for using Fundraiser Food Math.</p>",
        "<p>Your permanent plan link is ready:</p>",
        `<p><a href="${planUrl}">Open my fundraiser plan</a></p>`,
        "<p><strong>Bookmark or save this link. It is the only way to return to your plan later.</strong></p>",
        "<p>We hope your fundraiser goes smoothly!</p>",
      ].join(""),
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`Resend request failed with status ${response.status}: ${responseBody.slice(0, 300)}`);
  }

  return { sent: true };
}
