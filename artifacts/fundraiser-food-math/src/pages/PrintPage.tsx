import { useEffect, useState } from "react";
import type { FundraiserPlan, PlannerFormData } from "@/lib/types";
import { PAYMENT_LINKS } from "@/config/paymentLinks";
import { getUnlocked, getStoredPlan } from "@/lib/unlock";

// ── Print-friendly plan page ──────────────────────────────────
// Opened in a new tab from the Results page.
// Plan data is read from sessionStorage (written by savePlanBeforePayment /
// ResultsPage). Unlock state is read from localStorage via getUnlocked().

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatTime12(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

const MEAL_LABELS: Record<string, string> = {
  hotdogs: "Hot Dogs",
  burgers: "Burgers",
  bakedPotatoes: "Baked Potatoes",
  breakfastBurritos: "Breakfast Burritos",
  tacos: "Tacos",
  spaghetti: "Spaghetti",
  pancakes: "Pancakes",
  custom: "Custom Meal",
};

function buildDayOfChecklist(mealType: string): string[] {
  const mealPrepItem: Partial<Record<string, string>> = {
    hotdogs:          "Light grill(s) at least 30 min before serving; bring to medium-high heat",
    burgers:          "Light grill(s) at least 30 min before serving; form all patties before doors open",
    bakedPotatoes:    "Load first oven batch — potatoes need 60–75 min and cannot be rushed",
    breakfastBurritos:"Begin egg, sausage, and hash brown prep at least 60 min before serving",
    spaghetti:        "Start pasta water and begin warming sauce at least 90 min before serving",
    pancakes:         "Preheat electric griddle and mix first batter batch 30 min before serving",
    tacos:            "Begin browning and seasoning taco meat at least 45 min before serving",
    custom:           "Begin all food prep per your recipe's required lead time",
  };

  const needsTempMonitor = ["hotdogs", "burgers", "tacos", "breakfastBurritos", "spaghetti", "bakedPotatoes"].includes(mealType);

  const items = [
    "Confirm all adult volunteers are present — have a backup contact list ready",
    "Confirm all student helpers are present and paired with adult supervisors",
    "Confirm all ingredients and supplies are on site",
    mealPrepItem[mealType] ?? "Begin all food prep per your recipe's required lead time",
    "Set up serving line — tables, covers, serving utensils, napkins, and plates",
    "Set up donation / payment station with secure cash box or card reader",
    "Brief all volunteers on their roles (use the Volunteer Briefing Script in this plan)",
    "Assign Student Runners to their stations",
    "Check all hot foods reach 165°F before opening the serving line",
    "Open serving line at the scheduled start time",
    "Restock condiments, napkins, and utensils continuously throughout service",
    "Alert the cooking crew before food at the serving line runs low",
    ...(needsTempMonitor ? ["Check food temperatures every 30 min during service — hold at 140°F or above"] : []),
    "Guide guests to the shortest queue and keep the line moving",
    "Close the serving line at the scheduled end time",
    "Package or discard leftovers per the Leftover Plan in this document",
    "Collect and secure all donations and cash immediately after service ends",
    "Clean the kitchen and serving area — Cleanup Team per the Volunteer Plan",
    "Thank all volunteers personally before they leave",
    "Count donations and compare result against the estimated profit in this plan",
  ];

  return items.filter(Boolean) as string[];
}

// ── Shared sub-components ─────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="print-section-title">{children}</h2>;
}

function KVTable({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <table className="print-table print-kv-table">
      <tbody>
        {rows.map(([key, val]) => (
          <tr key={key}>
            <td className="print-kv-label">{key}</td>
            <td>{val}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function PrintPage() {
  const [plan, setPlan] = useState<FundraiserPlan | null>(null);
  const [formData, setFormData] = useState<PlannerFormData | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(getUnlocked());
    try {
      const raw = sessionStorage.getItem("ffm_plan");
      if (raw) {
        const parsed = JSON.parse(raw) as { plan: FundraiserPlan; formData: PlannerFormData };
        setPlan(parsed.plan);
        setFormData(parsed.formData ?? null);
      } else {
        const saved = getStoredPlan();
        if (saved) {
          setPlan(saved.plan);
          setFormData(saved.formData ?? null);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  if (!plan) {
    return (
      <div className="print-page" data-testid="print-page-empty">
        <div className="no-print print-toolbar">
          <a href="/" className="btn-secondary">Back to Home</a>
        </div>
        <div className="print-locked-message">
          <h2>No plan found.</h2>
          <p>Please <a href="/planner">build a plan first</a>, then return here.</p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="print-page" data-testid="print-page-locked">
        <div className="no-print print-toolbar">
          <a href="/" className="btn-secondary" data-testid="button-back-home-locked">Back to Home</a>
        </div>
        <div className="print-locked-message" data-testid="print-locked-content">
          <div className="print-locked-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="print-locked-title">Your printable event plan is part of the Full Event Pack.</h2>
          <p className="print-locked-desc">
            The Founding Event Pack includes your food quantities, shopping list, prep timeline, volunteer plan,
            basic budget range, announcement copy, Canva flyer brief, sign-up sheet, and this print-ready plan — all for a one-time $19 purchase.
          </p>
          <div className="print-locked-actions">
            <a
              href={PAYMENT_LINKS.fullEventPack ?? "#"}
              className="btn-locked-cta"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="button-get-full-pack"
            >
              Get the Founding Event Pack — $19
            </a>
            <a href="/results" className="btn-secondary" data-testid="button-back-results">Back to Results</a>
          </div>
          <p className="print-locked-note">One-time purchase. No account required. Instant access.</p>
        </div>
      </div>
    );
  }

  const mealLabel = MEAL_LABELS[plan.summary.mealType] ?? plan.summary.mealType;
  const checklist  = buildDayOfChecklist(plan.summary.mealType);

  function printExecSummary() {
    const prevTitle = document.title;
    document.title = `${plan?.summary.eventName || "Fundraiser"} — Executive Summary`;
    document.body.classList.add("printing-exec");
    window.print();
    document.body.classList.remove("printing-exec");
    document.title = prevTitle;
  }

  return (
    <div className="print-page" data-testid="print-page">

      {/* ── Toolbar (hidden during print) ── */}
      <div className="no-print print-toolbar">
        <div className="print-toolbar-actions">
          <button onClick={() => window.print()} className="btn-primary" data-testid="button-print-action">
            Print or Save as PDF
          </button>
          <button onClick={printExecSummary} className="btn-secondary" data-testid="button-exec-summary">
            Print Executive Summary
          </button>
        </div>
        <a href="/" className="btn-secondary" data-testid="button-back-home">Back to Home</a>
      </div>

      {/* ── Full plan (hidden in exec print mode) ── */}
      <div className="print-full-plan">

      {/* ── Document header ── */}
      <div className="print-header">
        <div className="print-brand">Fundraiser Food Math</div>
        <h1 className="print-title">{plan.summary.eventName || "Fundraiser Plan"}</h1>
        <p className="print-meta">
          {mealLabel} · {plan.summary.attendance} guests · {plan.summary.orgType}
        </p>
      </div>

      {/* ── 1. Event Overview ── */}
      <div className="print-section">
        <SectionTitle>Event Overview</SectionTitle>
        <KVTable rows={[
          ["Event Name",      plan.summary.eventName || "—"],
          ["Organization",    plan.summary.orgType],
          ["Meal Type",       mealLabel],
          ["Attendance",      `${plan.summary.attendance} guests (${plan.summary.adults} adults, ${plan.summary.kids} kids)`],
          ...(formData?.notes ? [["Notes", formData.notes] as [string, React.ReactNode]] : []),
        ]} />
      </div>

      {/* ── 2. Key Assumptions ── */}
      {formData && (
        <div className="print-section">
          <SectionTitle>Key Assumptions</SectionTitle>
          <KVTable rows={[
            ["Serving Window",   `${formatTime12(formData.serveStartTime)} – ${formatTime12(formData.serveEndTime)}`],
            ["Prep Start",       formatTime12(formData.prepStartTime)],
            ["Audience Mix",     `${formData.adultPercent}% adults · ${formData.kidPercent}% kids`],
            ["Adult Volunteers", String(formData.adultVolunteers)],
            ["Student Volunteers", String(formData.studentVolunteers)],
          ]} />
          <p className="print-assumption-note">
            These inputs drive all quantities, timelines, and estimates in this plan.
            Adjust values if your situation changes before the event.
          </p>
          <div className="print-advisory-callout">
            <strong>Plan for fewer guests than you expect.</strong> Free and suggested-donation events typically draw 20 to 30 percent fewer people than RSVPs or estimates. If you are unsure, enter your realistic number, not your hopeful number. It is easier to serve a smaller crowd well than to throw away food.
          </div>
        </div>
      )}

      {/* ── 3. Guest Summary ── */}
      <div className="print-summary-grid">
        <div className="print-summary-card">
          <div className="print-label">Guests</div>
          <div className="print-value">{plan.summary.adults}A + {plan.summary.kids}K</div>
        </div>
      </div>

      {/* ── 4. Strategy Summary ── */}
      <div className="print-section">
        <SectionTitle>Fundraiser Strategy Summary</SectionTitle>
        <div className="print-strategy-grid">
          {[
            { label: "Best Fit",            value: plan.strategySummary?.bestFit ?? "—" },
            { label: "Main Profit Driver",  value: plan.strategySummary?.mainProfitDriver ?? "—" },
            { label: "Main Execution Risk", value: plan.strategySummary?.mainExecutionRisk ?? "—" },
            { label: "Recommended Focus",   value: plan.strategySummary?.recommendedFocus ?? "—" },
          ].map((card) => (
            <div key={card.label} className="print-strategy-card">
              <div className="print-strategy-label">{card.label}</div>
              <p className="print-strategy-text">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Shopping List (grouped by category) ── */}
      <div className="print-section print-section--breakable">
        <SectionTitle>Shopping List</SectionTitle>

        {/* Food Quantity Estimates */}
        <p className="print-sub-heading">Ingredient Quantities</p>
        <table className="print-table" style={{ marginBottom: "1.25rem" }}>
          <thead>
            <tr><th>Ingredient</th><th>Quantity Needed</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {plan.foodQuantities.map((q, i) => (
              <tr key={i}>
                <td>{q.ingredient}</td>
                <td><strong>{q.quantity}</strong></td>
                <td>{q.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Shopping list grouped */}
        <p className="print-sub-heading">Shopping List</p>
        {plan.shoppingListGrouped.length > 0 ? (
          <table className="print-table">
            <thead>
              <tr><th>Item</th><th>Quantity</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {plan.shoppingListGrouped.map((group) => (
                <>
                  <tr key={`cat-${group.label}`} className="print-table-category-row">
                    <td colSpan={3}>{group.label}</td>
                  </tr>
                  {group.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.item}</td>
                      <td>{item.quantity}</td>
                      <td>{item.notes ?? ""}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="print-table">
            <thead>
              <tr><th>Item</th><th>Quantity</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {plan.shoppingList.map((item, i) => (
                <tr key={i}>
                  <td>{item.item}</td>
                  <td>{item.quantity}</td>
                  <td>{item.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── 6. Supplies List ── */}
      <div className="print-section">
        <SectionTitle>Supplies List</SectionTitle>
        <table className="print-table">
          <thead>
            <tr><th>Supply Item</th><th>Quantity</th></tr>
          </thead>
          <tbody>
            {plan.suppliesList.map((item, i) => (
              <tr key={i}>
                <td>{item.item}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 7. Drinks ── */}
      {plan.drinksList && plan.drinksList.length > 0 && (
        <div className="print-section">
          <SectionTitle>Drinks</SectionTitle>
          <p className="print-assumption-note" style={{ marginBottom: "8px" }}>
            A $1 to $2 drink donation station is the easiest revenue add at any food fundraiser.
          </p>
          <table className="print-table">
            <thead>
              <tr><th>Item</th><th>Quantity</th></tr>
            </thead>
            <tbody>
              {plan.drinksList.map((drink, i) => (
                <tr key={i}>
                  <td>{drink.item}</td>
                  <td>{drink.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 8. Prep Timeline ── */}
      <div className="print-section print-section--breakable print-page-break">
        <SectionTitle>Prep Timeline</SectionTitle>
        <table className="print-table">
          <thead>
            <tr><th>Time</th><th>Task</th><th>Who</th><th>Duration</th><th>Leader Notes</th></tr>
          </thead>
          <tbody>
            {plan.prepTimeline.map((step, i) => (
              <tr key={i}>
                <td><strong>{step.time}</strong></td>
                <td>{step.task}</td>
                <td>{step.who}</td>
                <td>{step.duration}</td>
                <td className="print-timeline-notes">
                  {step.leaderNote ?? ""}
                  {step.watchOut
                    ? <span className="print-timeline-watchout">Watch: {step.watchOut}</span>
                    : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 8. Volunteer Role Plan ── */}
      <div className="print-section">
        <SectionTitle>Volunteer Role Plan</SectionTitle>
        <table className="print-table">
          <thead>
            <tr><th>Role</th><th>Type</th><th>#</th><th>Duties</th></tr>
          </thead>
          <tbody>
            {plan.volunteerPlan.map((role, i) => (
              <tr key={i}>
                <td><strong>{role.role}</strong></td>
                <td>{role.type}</td>
                <td>{role.count}</td>
                <td>{role.duties.join("; ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Volunteer Sign-Up Sheet ── */}
      <div className="print-section print-page-break">
        <SectionTitle>Volunteer Sign-Up Sheet</SectionTitle>
        <table className="print-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Adult / Student</th>
              <th>Phone / Email</th>
              <th>Confirmed</th>
            </tr>
          </thead>
          <tbody>
            {plan.volunteerPlan.flatMap((role) =>
              Array.from({ length: Math.max(role.count, 2) }).map((_, j) => (
                <tr key={`${role.role}-${j}`} className="print-signup-row">
                  <td></td>
                  <td>{role.role}</td>
                  <td>{role.type}</td>
                  <td></td>
                  <td></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── 9. Setup Layout ── */}
      <div className="print-section">
        <SectionTitle>Event Setup Layout</SectionTitle>
        <table className="print-table">
          <thead>
            <tr><th>#</th><th>Station</th><th>Setup Notes</th></tr>
          </thead>
          <tbody>
            {plan.setupLayout.map((station, i) => (
              <tr key={i}>
                <td><strong>{station.position}</strong></td>
                <td><strong>{station.label}</strong></td>
                <td>{station.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 10. Risk Plan with Fixes ── */}
      {plan.riskPlan.length > 0 && (
        <div className="print-section">
          <SectionTitle>Risk Plan with Fixes</SectionTitle>
          {plan.riskPlan.map((item, i) => (
            <div key={i} className={`print-risk-item print-risk-item--${item.level}`}>
              <p className="print-risk-warning">
                {item.level === "error" ? "▲ " : item.level === "warning" ? "▲ " : "● "}{item.warning}
              </p>
              <p className="print-risk-fix">Fix: {item.fix}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 12. Parent & Student Communication Pack ── */}
      <div className="print-section print-page-break">
        <SectionTitle>Parent &amp; Student Communication Pack</SectionTitle>
        {[
          { label: "Event Announcement",    text: plan.commsPack?.announcement ?? "" },
          { label: "Volunteer Request",     text: plan.commsPack?.volunteerRequest ?? "" },
          { label: "Day-Before Reminder",   text: plan.commsPack?.dayBeforeReminder ?? "" },
          { label: "Thank-You Message",     text: plan.commsPack?.thankYou ?? "" },
        ].map(({ label, text }) => (
          <div key={label} className="print-comms-block">
            <p className="print-comms-label">{label}</p>
            <pre className="print-email">{text || "—"}</pre>
          </div>
        ))}
      </div>

      {/* ── 13. Volunteer Briefing ── */}
      <div className="print-section">
        <SectionTitle>Volunteer Briefing Script</SectionTitle>
        <pre className="print-email">{plan.volunteerBriefing ?? ""}</pre>
      </div>

      {/* ── 14. Leftover Plan ── */}
      <div className="print-section">
        <SectionTitle>Leftover Food Plan</SectionTitle>
        <KVTable rows={[
          ["Can Be Saved",
            <ul className="print-kv-list">
              {(plan.leftoverPlan?.canSave ?? []).map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ],
          ["Must Discard",
            <ul className="print-kv-list">
              {(plan.leftoverPlan?.discard ?? []).map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ],
          ["Packaging",   plan.leftoverPlan?.packaging ?? "—"],
          ["Who Decides", plan.leftoverPlan?.whoDecides ?? "—"],
        ]} />
      </div>

      {/* ── 15. Day-of Checklist ── */}
      <div className="print-section print-page-break">
        <SectionTitle>Day-of Checklist</SectionTitle>
        <table className="print-table print-checklist-table">
          <thead>
            <tr>
              <th className="print-checklist-check-col">✓</th>
              <th>Item</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((item, i) => (
              <tr key={i} className="print-checklist-row">
                <td className="print-checklist-box">□</td>
                <td>{item}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="print-assumption-note">
          Check off each item before, during, and after your event.
          Add your own notes in the margins for items specific to your venue.
        </p>
      </div>

      {/* ── Footer ── */}
      <div className="print-footer">
        <p><strong>Generated by Fundraiser Food Math</strong> · fundraiserfoodmath.com</p>
        <p>
          {plan.disclaimer
            ?? "These are planning estimates. Adjust for your group, appetite, and local context."}
        </p>
      </div>

      </div>{/* end .print-full-plan */}

      {/* ── Executive Summary (one-page, exec print mode only) ── */}
      <div className="exec-summary" data-testid="exec-summary">

        <div className="exec-header">
          <div className="exec-brand">Fundraiser Food Math · Executive Summary</div>
          <h1 className="exec-title">{plan.summary.eventName || "Fundraiser Plan"}</h1>
          <p className="exec-subtitle">
            {mealLabel} · {plan.summary.orgType} · {plan.summary.attendance} guests
          </p>
        </div>

        <div className="exec-body">
          <div className="exec-col">
            <div className="exec-block">
              <div className="exec-block-title">Event Details</div>
              <table className="exec-table">
                <tbody>
                  {formData && (
                    <>
                      <tr>
                        <td className="exec-key">Serving Window</td>
                        <td>{formatTime12(formData.serveStartTime)} – {formatTime12(formData.serveEndTime)}</td>
                      </tr>
                      <tr>
                        <td className="exec-key">Prep Starts</td>
                        <td>{formatTime12(formData.prepStartTime)}</td>
                      </tr>
                      <tr>
                        <td className="exec-key">Adult Volunteers</td>
                        <td>{formData.adultVolunteers}</td>
                      </tr>
                      <tr>
                        <td className="exec-key">Student Helpers</td>
                        <td>{formData.studentVolunteers}</td>
                      </tr>
                    </>
                  )}
                  <tr>
                    <td className="exec-key">Audience Mix</td>
                    <td>{plan.summary.adults} adults · {plan.summary.kids} kids</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          <div className="exec-col">
            <div className="exec-block">
              <div className="exec-block-title">Main Execution Risk</div>
              <p className="exec-text">{plan.strategySummary.mainExecutionRisk}</p>
            </div>
            <div className="exec-block">
              <div className="exec-block-title">Recommended Leader Focus</div>
              <p className="exec-text">{plan.strategySummary.recommendedFocus}</p>
            </div>
            <div className="exec-block">
              <div className="exec-block-title">Main Profit Driver</div>
              <p className="exec-text">{plan.strategySummary.mainProfitDriver}</p>
            </div>
          </div>
        </div>

        <div className="exec-disclaimer">
          <strong>Generated by Fundraiser Food Math</strong> · fundraiserfoodmath.com
          {" · "}
          {plan.disclaimer
            ?? "These are planning estimates. Adjust for your group, appetite, and local context."}
        </div>

      </div>{/* end .exec-summary */}

    </div>
  );
}
