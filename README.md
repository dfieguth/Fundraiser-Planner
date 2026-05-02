# GuardrailKit

A production-ready food fundraiser planning tool for churches, schools, sports teams, and nonprofits. Users fill out a short form describing their event and instantly receive a complete fundraiser plan: shopping list, food quantities, prep timeline, volunteer roles, cost estimate, profit projection, and a print-ready PDF-friendly layout.

## What It Does

1. User fills a 3-step form (event info, timing & volunteers, review)
2. The calculator engine produces a fully itemized plan in-browser — no server required
3. A free preview shows summary cards, risk warnings, and the first 5 shopping items
4. The Full Event Pack ($19, one-time) unlocks the complete plan: full shopping list, supplies list, prep timeline, volunteer assignments, sign-up sheet, recruitment email, and printable layout
5. Payment is handled by Stripe; after payment the user is redirected back to `/success?unlock=full-event-pack` which grants access via localStorage

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 |
| Frontend | React 19 + Vite 7 |
| Routing | Wouter |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 + custom CSS properties |
| UI components | shadcn/ui |
| Payments | Stripe Payment Links (client-side redirect) |
| Storage | localStorage + sessionStorage (no database) |

## How to Run Locally

**Prerequisites:** Node.js 20+, pnpm 10+

```bash
# Install all workspace dependencies
pnpm install

# Start the fundraiser app dev server
pnpm --filter @workspace/fundraiser-food-math run dev
```

The app runs at `http://localhost:<PORT>` (port assigned by Vite from the `PORT` env var).

To run a full type check across all packages:

```bash
pnpm run typecheck
```

## Current MVP Features

- 8 supported meal types: Hot Dogs, Burgers, Baked Potatoes, Breakfast Burritos, Tacos, Spaghetti, Pancakes, Custom
- Per-meal food quantity calculations with adult/kid ratio splits and overage buffer
- Itemized shopping list with package-size math and per-item cost ranges
- Supplies list (plates, utensils, foil, trays, etc.)
- Step-by-step prep timeline generated from form times
- Volunteer role plan with role-specific duty lists (scales with headcount)
- Risk warning engine: flags low volunteer ratios, tight prep windows, low margins, large crowds, and more
- Revenue, cost range, and profit estimate summary cards
- Copyable volunteer recruitment email blurb
- Print-ready full plan layout (`/print`) triggered from the results page
- Stripe payment link integration with post-redirect unlock
- `ENABLE_DEMO_UNLOCK` flag for testing the full plan view without a payment
- `USE_STRIPE_TEST_MODE` flag to route to a Stripe test payment link
- Persistent plan storage: plan survives page refresh, tab close, and Stripe redirect round-trips via localStorage

## Configuration Before Going Live

All launch configuration lives in `artifacts/fundraiser-food-math/src/config/paymentLinks.ts`:

- Replace `LIVE_FULL_EVENT_PACK_LINK` with your real Stripe Payment Link
- Set `USE_STRIPE_TEST_MODE = false`
- Set `ENABLE_DEMO_UNLOCK = false`
- Replace `SUPPORT_EMAIL` with your real support address
- In your Stripe Payment Link settings, set the after-payment redirect to:
  `https://[your-domain]/success?unlock=full-event-pack`

## Known Limitations

- **Client-side unlock only** — the unlock flag is stored in localStorage after a URL param check. A determined user could spoof the unlock. Acceptable for early MVP; replace with server-verified webhook flow for high-volume sales.
- **No user accounts** — access is device/browser-bound. Clearing browser data resets unlock status.
- **Custom meal type uses generic estimates** — quantities and costs are approximated; users are warned to adjust manually.
- **No email delivery** — the recruitment email blurb is copy-paste only; there is no in-app send functionality.
- **Print relies on browser print dialog** — no server-side PDF generation; formatting depends on the user's browser and print settings.
- **No analytics or error tracking** — no telemetry is wired up in the MVP.

## Future Launch Tasks

- [ ] Replace Stripe test link with live link and set `USE_STRIPE_TEST_MODE = false`
- [ ] Set `ENABLE_DEMO_UNLOCK = false`
- [ ] Configure a real support email in `paymentLinks.ts`
- [ ] Set up a custom domain and update the Stripe redirect URL
- [ ] (Optional) Add server-side Stripe webhook verification for higher-volume unlock security
- [ ] (Optional) Add email delivery for the volunteer recruitment blurb
- [ ] (Optional) Add Google Analytics or Plausible for traffic/conversion tracking
- [ ] (Optional) Add a "save my plan" email capture so users can retrieve their plan on a new device
- [ ] Run the full QA checklist (`artifacts/fundraiser-food-math/QA_CHECKLIST.md`) before launch
