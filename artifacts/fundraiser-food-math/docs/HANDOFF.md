# Fundraiser Food Math Handoff

## Current stable status
Fundraiser Food Math is in a stable MVP state. The core planning flow works: users can build a plan, view results, print the full pack, and use the idea finder. The app has been hardened against empty states and invalid inputs, with null-safe fallbacks in results and print views.

## Major features built
- Meal fundraiser planner with sample templates
- Rules-based idea finder
- Calculator for quantities, cost ranges, profit estimates, volunteers, timeline, risks, and communication copy
- Results page with locked/free preview behavior
- Access-code unlock flow with 30-day reusable tester code (`DEVINTEST`)
- Stripe-linked paid unlock flow
- Print-ready full event pack and executive summary
- Copyable key summary and pricing sensitivity tools
- Launch and owner docs

## Known config values
- `SUPPORT_EMAIL`: `devin@ghfc.org`
- `USE_STRIPE_TEST_MODE`: `true`
- `ENABLE_DEMO_UNLOCK`: `false`
- `LIVE_FULL_EVENT_PACK_LINK`: `https://buy.stripe.com/28E7sF4DPgWw8pVgvE9EI00`
- `TEST_FULL_EVENT_PACK_LINK`: `https://buy.stripe.com/test_28E7sF4DPgWw8pVgvE9EI00`
- `DEVINTEST` unlocks the full pack for 30 days and refreshes when re-entered
- Vite reads `PORT` from the environment and uses `5173` if unset
- Vite uses `BASE_PATH` and falls back to `/` if unset

## Known testing status
- TypeScript/type-checking passes
- Production build passes
- No automated test suite is configured here
- Manual verification has focused on unlock, print, results, and idea-finder flows

## Stripe live/test setup explanation
The app uses a client-side redirect unlock model. Users click the Stripe payment link, Stripe redirects back to `/success?unlock=full-event-pack`, and the app marks the pack as unlocked in localStorage.

- Test mode uses the Stripe test link
- Live mode uses the live Stripe link
- The success redirect URL must match the deployed domain and include `?unlock=full-event-pack`
- The backend verifies Stripe sessions, processes signed webhooks, stores durable purchases, and sends confirmation email through the configured mail transport

## Current launch blockers
No hard launch blocker is currently known in the app itself. The main launch dependencies are operational:
- real payment links must stay correct
- redirect URL must match the deployed domain
- `USE_STRIPE_TEST_MODE` must be switched appropriately before launch

## Recommended next steps
- Keep testing the end-to-end success redirect in the deployed domain
- Review pricing copy before going live
- If sales volume grows, replace client-side unlock with server-verified payment confirmation
- Keep the launch checklist in sync with real deployment values

## Features intentionally deferred
- Server-verified Stripe fulfillment
- Production coupon/code validation on the backend
- Complex subscription or account system
- Broader payment provider integrations beyond the current MVP flow
- Major UX redesigns

## File map of important files
- Payment config: `src/config/paymentLinks.ts`
- Unlock helper: `src/lib/unlock.ts`
- Calculator: `src/lib/calculator.ts`
- Meal assumptions: `src/lib/mealAssumptions.ts`
- Sample templates: `src/lib/sampleTemplates.ts`
- Idea finder: `src/pages/IdeaFinderPage.tsx`
- Main pages: `src/pages/LandingPage.tsx`, `src/pages/PlannerPage.tsx`, `src/pages/ResultsPage.tsx`, `src/pages/SuccessPage.tsx`
- Print page: `src/pages/PrintPage.tsx`

## If importing into another Replit account
- Check the deployed domain
- Check the Stripe redirect URL
- Check env/config values
- Run type check/build
- Test the success redirect end to end
