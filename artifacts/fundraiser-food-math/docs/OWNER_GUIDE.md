# Owner Guide

## What the app does
Fundraiser Food Math helps you plan a food fundraiser by generating:
- a shopping list
- supplies list
- prep timeline
- volunteer plan
- revenue and profit estimates
- print-ready event pack
- executive summary
- copyable summary text
- pricing sensitivity and break-even estimates
- access-code unlocks for testing

## How to update Stripe live/test links
Open `src/config/paymentLinks.ts` and update:
- `LIVE_FULL_EVENT_PACK_LINK`
- `TEST_FULL_EVENT_PACK_LINK`
- `PAYMENT_LINKS.fullEventPack` should continue pointing to `USE_STRIPE_TEST_MODE ? TEST_FULL_EVENT_PACK_LINK : LIVE_FULL_EVENT_PACK_LINK`

Do not change the redirect format. Stripe should still return to:
`/success?unlock=full-event-pack`

## How to switch USE_STRIPE_TEST_MODE true/false
In `src/config/paymentLinks.ts`, set:
- `USE_STRIPE_TEST_MODE = true` for test mode
- `USE_STRIPE_TEST_MODE = false` for live mode

This controls which Full Event Pack Stripe link is used.

## How to update SUPPORT_EMAIL
In `src/config/paymentLinks.ts`, update:
- `SUPPORT_EMAIL`

This email is shown on the success page if payment confirmation or saved plan recovery fails.

## How DEVINTEST access code works
`DEVINTEST` is a client-side tester code in `src/config/paymentLinks.ts`.

When entered on the locked Results page:
- it unlocks the Full Event Pack for 30 days
- the expiration timestamp is stored locally on the device/browser
- re-entering the same valid code refreshes the 30-day window
- the code is case-insensitive and trims spaces

## How to update or remove access codes
Edit `ACCESS_CODES` in `src/config/paymentLinks.ts`.

To add a code:
- add a new object with `code`, `label`, and `durationDays`

To remove a code:
- delete that object from the array

Tester codes are reusable. Reapplying a valid code refreshes the unlock window from the time of application.

## How to update meal assumptions
Meal assumptions live in the planner/calculator code, mainly in:
- `src/lib/calculator.ts`
- `src/lib/types.ts`

Update these carefully because they affect the shopping math, profit estimates, print pack, and summary outputs.

## How to test the planner
1. Open the planner.
2. Build a manual plan.
3. Select a sample template and edit at least one field.
4. Try the Idea Finder flow and build a plan from the quiz result.
5. Confirm the generated results page reflects the entered values.

## How to test the Stripe success redirect
1. Open the Full Event Pack checkout flow.
2. Complete payment in test mode.
3. Confirm the app lands on the success route with:
   `/success?unlock=full-event-pack`
4. Confirm the plan unlocks after the redirect.

## How to test print and Executive Summary
1. Unlock the Full Event Pack.
2. Open the Print page.
3. Use the main print/save button.
4. Use the Executive Summary print button.
5. Confirm both modes render correctly.

## What not to change before launch
Do not change:
- Stripe redirect format
- unlock logic
- access-code behavior without testing
- SUPPORT_EMAIL without confirming ownership
- `USE_STRIPE_TEST_MODE` unless you are intentionally switching modes
- `ENABLE_DEMO_UNLOCK` unless you are testing only
- print/export layout unless you recheck the output
