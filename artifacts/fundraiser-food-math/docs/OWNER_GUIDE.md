# Owner Guide

## What the app does
Fundraiser Food Math helps plan a food fundraiser by generating:
- shopping lists
- supplies lists
- prep timelines
- volunteer plans
- revenue/profit estimates
- a print-ready event pack
- an executive summary
- copyable summary text
- pricing sensitivity and break-even estimates

## How to update Stripe live/test links
Edit `src/config/paymentLinks.ts`:
- `LIVE_FULL_EVENT_PACK_LINK`
- `TEST_FULL_EVENT_PACK_LINK`

Keep `PAYMENT_LINKS.fullEventPack` pointed at:
`USE_STRIPE_TEST_MODE ? TEST_FULL_EVENT_PACK_LINK : LIVE_FULL_EVENT_PACK_LINK`

Keep the Stripe redirect URL:
`/success?unlock=full-event-pack`

## How to switch USE_STRIPE_TEST_MODE true/false
In `src/config/paymentLinks.ts`:
- `true` = test payment link
- `false` = live payment link

## How to update SUPPORT_EMAIL
Edit `SUPPORT_EMAIL` in `src/config/paymentLinks.ts`.
That address appears on the success page for payment/help issues.

## How DEVINTEST access code works
`DEVINTEST` is defined in `ACCESS_CODES` in `src/config/paymentLinks.ts`.
When entered on the locked Results page:
- it unlocks the Full Event Pack for 30 days
- the expiration is stored locally in the browser
- reapplying the code refreshes the 30-day window
- matching ignores case and surrounding spaces

## How to update or remove access codes
Edit the `ACCESS_CODES` array in `src/config/paymentLinks.ts`.
- Add a code: add `{ code, label, durationDays }`
- Remove a code: delete that entry

## How to update meal assumptions
Update meal math in `src/lib/mealAssumptions.ts`.
This file controls serving assumptions, ingredients, supplies, and costs.
Use care because it affects calculator, results, and print output.

## How to test the planner
1. Open the planner.
2. Fill out a manual plan.
3. Try a sample template.
4. Edit a template field after selecting it.
5. Use the Idea Finder and build from a recommendation.
6. Confirm results match the entered values.

## How to test the Stripe success redirect
1. Use the Full Event Pack checkout flow.
2. Complete a test purchase.
3. Confirm redirect to:
   `/success?unlock=full-event-pack`
4. Confirm the results page unlocks afterward.

## How to test print and Executive Summary
1. Unlock the Full Event Pack.
2. Open `/print`.
3. Use Print / Save PDF.
4. Use Print Executive Summary.
5. Confirm both views render correctly.

## What not to change before launch
Do not change:
- Stripe redirect format
- unlock logic
- `USE_STRIPE_TEST_MODE` unless intentionally switching modes
- `ENABLE_DEMO_UNLOCK` unless testing
- `SUPPORT_EMAIL` without confirming ownership
- payment links without verifying them
- print/export layout without rechecking output
