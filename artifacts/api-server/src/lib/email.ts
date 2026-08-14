import nodemailer from "nodemailer";

const appUrl = (process.env.APP_URL ?? "https://fundraiserplanner.online").replace(/\/$/, "");

type SendPlanConfirmationInput = {
  customerEmail: string;
  planId: string;
  stripeSessionId: string;
};

export async function sendPlanConfirmationEmail({
  customerEmail,
  planId,
  stripeSessionId,
}: SendPlanConfirmationInput): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  const smtpAppPassword = process.env.SMTP_APP_PASSWORD;
  if (!smtpUser || !smtpAppPassword) {
    throw new Error("SMTP_USER and SMTP_APP_PASSWORD are not configured for Fundraiser Food Math");
  }

  const planUrl = `${appUrl}/plan/${planId}`;
  const text = [
    "Thank you for using Fundraiser Food Math.",
    "",
    "Your permanent plan link is ready:",
    planUrl,
    "",
    "Bookmark or save this link, it is the only way to return to your plan later.",
    "",
    "We hope your fundraiser goes smoothly!",
  ].join("\n");
  const html = [
    "<p>Thank you for using Fundraiser Food Math.</p>",
    "<p>Your permanent plan link is ready:</p>",
    `<p><a href="${planUrl}">Open my fundraiser plan</a></p>`,
    "<p><strong>Bookmark or save this link, it is the only way to return to your plan later.</strong></p>",
    "<p>We hope your fundraiser goes smoothly!</p>",
  ].join("");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpAppPassword,
    },
  });

  await transporter.sendMail({
    from: {
      name: "Fundraiser Food Math",
      address: smtpUser,
    },
    to: customerEmail,
    subject: "Your Fundraiser Food Math plan is ready",
    text,
    html,
    messageId: `<fundraiser-plan-${stripeSessionId}@fundraiserplanner.online>`,
  });
}
