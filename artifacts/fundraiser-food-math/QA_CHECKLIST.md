# Fundraiser Food Math — Manual QA Checklist

Use this checklist before every release to verify the calculator,
monetization flow, and print/unlock experience all work correctly.

---

## 1. Calculator — All Meal Types

For each meal type below, complete the planner form with:
- Attendance: 100
- Adult %: 60 / Kid %: 40
- Suggested donation: $10
- Volunteers: 6 adult, 4 student
- Prep: 10:00 AM / Serve: 12:00–2:00 PM

| Meal Type | Loads without error | Shopping list shown | Supplies list shown | Volunteer plan shown | Profit card shown | Risk warnings shown |
|---|---|---|---|---|---|---|
| Hot Dogs | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Burgers | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Baked Potatoes | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Breakfast Burritos | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Tacos | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Spaghetti Dinner | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Pancake Breakfast | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Custom Meal | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## 2. Quantity & Package Math

Run a Hot Dogs event at 100 guests (60 adult / 40 kids):

- [ ] Shopping list shows both "needed" quantity and "buying" quantity per item
  - Expected: e.g. "18 × 10-pack (168 hot dogs needed → 180 buying)"
- [ ] Food Quantities table shows the same breakdown
- [ ] Changing attendance from 100 → 200 roughly doubles quantities
- [ ] Changing adult % from 60 → 80 increases quantities (adults eat more)
- [ ] Changing adult % from 60 → 20 decreases quantities (kids eat less)

---

## 3. Revenue, Cost & Profit

| Test Case | Expected Result |
|---|---|
| 100 guests × $10 donation | Revenue = $1,000 |
| 100 guests × $1 donation | Profit is negative — red error card shown |
| 100 guests × $10, attendance raised to 200 | Revenue doubles to $2,000 |
| Very low price ($2/person) | "price may be too low" info warning appears |
| Profit barely positive | "margin is tight" warning appears |

- [ ] Revenue card shows correct calculation
- [ ] Cost range shows low–high estimate
- [ ] Profit card shows correct range
- [ ] Profit card color changes (red for loss, yellow for risky, green for positive)

---

## 4. Risk Warnings

| Scenario | Expected Warning |
|---|---|
| 0 adult volunteers entered | ERROR: "No Adult Volunteers are listed" |
| 1 volunteer total, 50+ guests | ERROR: "not enough to safely run" |
| 5 volunteers, 200 guests | WARNING: volunteer ratio too high |
| Prep start = serve start | ERROR: no prep time |
| Prep window < 60 min | WARNING: prep time too short |
| Spaghetti + prep < 90 min | WARNING: complex meal, start earlier |
| Serve window < 60 min, 150+ guests | WARNING: serve window short |
| Donation price < $5 | INFO: price on the low end |
| Attendance > 150 | INFO: sizeable crowd note |
| Attendance > 300 | WARNING: large event |
| Kids % > 60 | INFO: allergy consideration note |
| Spaghetti + < 3 adult volunteers | WARNING: complex meal needs more adults |
| Custom meal selected | INFO: limited accuracy notice |
| Adult % + Kid % ≠ 100 | INFO: remainder treated as adults |

- [ ] Each warning type (error / warning / info) renders with correct color/icon
- [ ] Warnings appear in the free preview (not locked)

---

## 5. Volunteer Plan

- [ ] Every role uses approved terminology: "Adult Volunteer", "Parent Volunteer", "Parent Oversight", "Student Volunteer", "Student Runner"
- [ ] "Parent Helper" does NOT appear anywhere in the output
- [ ] Volunteer roles change based on meal type (e.g. "Grill Master" for burgers, "Griddle Operator" for pancakes, "Pasta Station Lead" for spaghetti)
- [ ] With very few volunteers entered (e.g. 2 total), role counts scale down
- [ ] Email blurb lists all volunteer roles with count

---

## 6. Prep Timeline

- [ ] Timeline starts at prep start time
- [ ] Timeline ends after serve end time + 30–45 min cleanup
- [ ] Mid-service check appears at roughly the halfway point
- [ ] All timeline entries have a "who" label and a duration
- [ ] No negative duration values appear (prep start before serve start)

---

## 7. Free Preview vs. Locked State

- [ ] Free preview shows first 5 shopping list items (top of list)
- [ ] A "X more items included in the Full Event Pack" locked row appears
- [ ] Summary cards (revenue, cost, profit, attendance) are visible in free preview
- [ ] Risk warnings are visible in free preview
- [ ] Full content (food quantities, tabs, volunteer plan, email blurb) is hidden until unlocked
- [ ] Print button is hidden until unlocked
- [ ] Payment CTA shows: "Get the Full Event Pack — $19"
- [ ] `ENABLE_DEMO_UNLOCK = true` shows the demo unlock button
- [ ] `ENABLE_DEMO_UNLOCK = false` hides the demo unlock button completely

---

## 8. Unlock & Payment Flow

- [ ] Clicking "Demo: Unlock Full Plan" (when enabled) reveals full content
- [ ] Full content tabs work: Shopping List, Supplies, Timeline, Volunteers, Email
- [ ] Volunteer sign-up table renders correctly with one row per role × count
- [ ] Email blurb copy button works (copies to clipboard)
- [ ] Print button appears after unlock
- [ ] Print page (`/print`) loads the full plan correctly when unlocked
- [ ] `/success?unlock=full-event-pack` grants access and shows success state
- [ ] `/success` (no param) shows unconfirmed payment state with mailto link
- [ ] Support "contact us" mailto links open email client with pre-filled subject + body

---

## 9. Print Page

- [ ] Print page loads without error when unlocked
- [ ] Print page shows full shopping list (all items, not just top 5)
- [ ] Print page shows supplies list
- [ ] Print page shows prep timeline
- [ ] Print page shows volunteer plan
- [ ] Print page shows email blurb
- [ ] Print page shows disclaimer text
- [ ] Print page is locked (shows CTA) when not unlocked
- [ ] Ctrl+P / Cmd+P produces a clean printable layout

---

## 10. Edge Cases

| Edge Case | Expected Behavior |
|---|---|
| Attendance = 1 | Plan generates; no division by zero |
| Attendance = 500 | Plan generates; large event warning shown |
| 100% adult (0% kids) | Kids = 0; plan uses only adult servings |
| 100% kids (0% adults) | Adults = 0; plan uses only kid servings |
| Prep start after serve start | Error warning; no negative timeline durations |
| mealPrice = 0 | Revenue = $0; profit is negative; error warning shown |
| Custom meal with no name | Falls back to "Custom Meal" label |

---

## 11. Disclaimer

- [ ] "These are planning estimates. Adjust for your group, appetite, store prices, and local context." appears on the results page
- [ ] Disclaimer appears on the print page

---

*Last reviewed: (fill in before release)*
*Reviewed by: (fill in)*
