import { useEffect, useState } from "react";
import type { FundraiserPlan, PlannerFormData } from "@/lib/types";
import { PAYMENT_LINKS } from "@/config/paymentLinks";
import { getUnlocked, getStoredPlan } from "@/lib/unlock";

// ── Print-friendly plan page ──────────────────────────────────
// Opened in a new tab from the Results page.
// Plan data is read from sessionStorage (written by savePlanBeforePayment/
// ResultsPage). Unlock state is read from localStorage via getUnlocked()
// (see src/lib/unlock.ts).
// User can print to PDF from the browser (Ctrl+P / Cmd+P).

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function PrintPage() {
  const [plan, setPlan] = useState<FundraiserPlan | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setUnlocked(getUnlocked());
    try {
      const raw = sessionStorage.getItem("ffm_plan");
      if (raw) {
        const parsed = JSON.parse(raw) as { plan: FundraiserPlan; formData: PlannerFormData };
        setPlan(parsed.plan);
      } else {
        const saved = getStoredPlan();
        if (saved) setPlan(saved.plan);
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
            The Full Event Pack includes your complete shopping list, prep timeline, volunteer plan,
            sign-up sheet, and this print-ready plan — all for a one-time $19 purchase.
          </p>
          <div className="print-locked-actions">
            <a
              href={PAYMENT_LINKS.fullEventPack ?? "#"}
              className="btn-locked-cta"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="button-get-full-pack"
            >
              Get the Full Event Pack — $19
            </a>
            <a href="/results" className="btn-secondary" data-testid="button-back-results">
              Back to Results
            </a>
          </div>
          <p className="print-locked-note">
            One-time purchase. No account required. Instant access.
          </p>
        </div>
      </div>
    );
  }

  // Unlocked — show the full printable plan
  return (
    <div className="print-page" data-testid="print-page">
      <div className="no-print print-toolbar">
        <button onClick={() => window.print()} className="btn-primary" data-testid="button-print-action">
          Print / Save as PDF
        </button>
        <a href="/" className="btn-secondary" data-testid="button-back-home">Back to Home</a>
      </div>

      {/* Header */}
      <div className="print-header">
        <div className="print-brand">Fundraiser Food Math</div>
        <h1 className="print-title">{plan.summary.eventName}</h1>
        <p className="print-meta">
          {plan.summary.mealType} · {plan.summary.attendance} guests ·
          {" "}{plan.summary.orgType} · Store: {plan.summary.storePreference}
        </p>
      </div>

      {/* Summary */}
      <div className="print-summary-grid">
        <div className="print-summary-card">
          <div className="print-label">Expected Revenue</div>
          <div className="print-value">{fmt(plan.estimatedRevenue)}</div>
        </div>
        <div className="print-summary-card">
          <div className="print-label">Est. Cost Range</div>
          <div className="print-value">{fmt(plan.costRange[0])} – {fmt(plan.costRange[1])}</div>
        </div>
        <div className="print-summary-card">
          <div className="print-label">Est. Profit</div>
          <div className="print-value">{fmt(plan.estimatedProfit[0])} – {fmt(plan.estimatedProfit[1])}</div>
        </div>
        <div className="print-summary-card">
          <div className="print-label">Attendance</div>
          <div className="print-value">{plan.summary.adults} adults + {plan.summary.kids} kids</div>
        </div>
      </div>

      {/* Strategy Summary */}
      <div className="print-section">
        <h2 className="print-section-title">Fundraiser Strategy Summary</h2>
        <div className="print-strategy-grid">
          {[
            { label: "Best Fit", value: plan.strategySummary.bestFit },
            { label: "Main Profit Driver", value: plan.strategySummary.mainProfitDriver },
            { label: "Main Execution Risk", value: plan.strategySummary.mainExecutionRisk },
            { label: "Recommended Focus", value: plan.strategySummary.recommendedFocus },
          ].map((card, i) => (
            <div key={i} className="print-strategy-card">
              <div className="print-strategy-label">{card.label}</div>
              <p style={{ fontSize: "0.8rem", margin: 0 }}>{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Warnings */}
      {plan.riskWarnings.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Risks & Notes</h2>
          {plan.riskWarnings.map((w, i) => (
            <p key={i} className={`print-warning print-warning--${w.level}`}>
              {w.level === "error" ? "[!] " : w.level === "warning" ? "[!] " : "[i] "}{w.message}
            </p>
          ))}
        </div>
      )}

      {/* Risk Plan with Fixes */}
      {plan.riskPlan.length > 0 && (
        <div className="print-section">
          <h2 className="print-section-title">Risk Plan with Fixes</h2>
          {plan.riskPlan.map((item, i) => (
            <div
              key={i}
              className="print-risk-item"
              style={{
                borderLeftColor: item.level === "error" ? "#ef4444" : item.level === "warning" ? "#f59e0b" : "#3b82f6",
              }}
            >
              <p style={{ margin: "0 0 4px 0", fontSize: "0.82rem", fontWeight: 600 }}>
                {item.level === "error" ? "[!] " : item.level === "warning" ? "[!] " : "[i] "}{item.warning}
              </p>
              <p className="print-risk-fix" style={{ margin: 0, color: "#166534" }}>
                Fix: {item.fix}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Food Quantities */}
      <div className="print-section">
        <h2 className="print-section-title">Food Quantity Plan</h2>
        <table className="print-table">
          <thead>
            <tr><th>Ingredient</th><th>Quantity</th><th>Notes</th></tr>
          </thead>
          <tbody>
            {plan.foodQuantities.map((q, i) => (
              <tr key={i}>
                <td>{q.ingredient}</td>
                <td><strong>{q.quantity}</strong></td>
                <td>{q.notes || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shopping List — grouped by category */}
      <div className="print-section">
        <h2 className="print-section-title">Shopping List</h2>
        {plan.shoppingListGrouped.length > 0 ? (
          <table className="print-table">
            <thead>
              <tr><th>Item</th><th>Quantity</th><th>Est. Cost</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {plan.shoppingListGrouped.map((group) => (
                <>
                  <tr key={`group-${group.label}`}>
                    <td
                      colSpan={4}
                      style={{
                        background: "#f3f4f6",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#6b7280",
                        padding: "6px 8px",
                      }}
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.item}</td>
                      <td>{item.quantity}</td>
                      <td>{fmt(item.estimatedCost[0])} – {fmt(item.estimatedCost[1])}</td>
                      <td>{item.notes || ""}</td>
                    </tr>
                  ))}
                </>
              ))}
              <tr>
                <td colSpan={2}><strong>Total Food Cost</strong></td>
                <td colSpan={2}><strong>{fmt(plan.costRange[0])} – {fmt(plan.costRange[1])}</strong></td>
              </tr>
            </tbody>
          </table>
        ) : (
          <table className="print-table">
            <thead>
              <tr><th>Item</th><th>Quantity</th><th>Est. Cost</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {plan.shoppingList.map((item, i) => (
                <tr key={i}>
                  <td>{item.item}</td>
                  <td>{item.quantity}</td>
                  <td>{fmt(item.estimatedCost[0])} – {fmt(item.estimatedCost[1])}</td>
                  <td>{item.notes || ""}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2}><strong>Total Food Cost</strong></td>
                <td colSpan={2}><strong>{fmt(plan.costRange[0])} – {fmt(plan.costRange[1])}</strong></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {/* Supplies */}
      <div className="print-section">
        <h2 className="print-section-title">Supplies List</h2>
        <table className="print-table">
          <thead>
            <tr><th>Supply</th><th>Quantity</th><th>Est. Cost</th></tr>
          </thead>
          <tbody>
            {plan.suppliesList.map((item, i) => (
              <tr key={i}>
                <td>{item.item}</td>
                <td>{item.quantity}</td>
                <td>
                  {item.estimatedCost[0] === 0
                    ? "As needed"
                    : `${fmt(item.estimatedCost[0])} – ${fmt(item.estimatedCost[1])}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Prep Timeline with leader notes */}
      <div className="print-section print-page-break">
        <h2 className="print-section-title">Prep Timeline</h2>
        <table className="print-table">
          <thead>
            <tr><th>Time</th><th>Task</th><th>Who</th><th>Duration</th><th>Leader Note</th></tr>
          </thead>
          <tbody>
            {plan.prepTimeline.map((step, i) => (
              <tr key={i}>
                <td><strong>{step.time}</strong></td>
                <td>{step.task}</td>
                <td>{step.who}</td>
                <td>{step.duration}</td>
                <td style={{ fontSize: "0.78rem", color: "#374151" }}>
                  {step.leaderNote || ""}
                  {step.watchOut ? <span style={{ display: "block", color: "#92400e", marginTop: "2px" }}>Watch: {step.watchOut}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Volunteer Plan */}
      <div className="print-section">
        <h2 className="print-section-title">Volunteer Plan</h2>
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

      {/* Sign-Up Sheet */}
      <div className="print-section print-page-break">
        <h2 className="print-section-title">Volunteer Sign-Up Sheet</h2>
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
                <tr key={`${role.role}-${j}`} style={{ height: "30px" }}>
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

      {/* Event Setup Layout */}
      <div className="print-section">
        <h2 className="print-section-title">Event Setup Layout</h2>
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

      {/* Profit Strategy */}
      <div className="print-section">
        <h2 className="print-section-title">Profit Strategy</h2>
        <table className="print-table">
          <tbody>
            <tr>
              <td style={{ width: "22%", fontWeight: 700, fontSize: "0.8rem" }}>Price Check</td>
              <td>{plan.profitStrategy.priceCheck}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: "0.8rem" }}>Pricing Model</td>
              <td>{plan.profitStrategy.pricingModel}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: "0.8rem" }}>Upsell Ideas</td>
              <td>{plan.profitStrategy.upsellIdeas.join(" · ")}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: "0.8rem" }}>Donation Table</td>
              <td>{plan.profitStrategy.donationTableNote}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: "0.8rem" }}>Suggested Signs</td>
              <td>{plan.profitStrategy.signageLines.join(" / ")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Leftover Plan */}
      <div className="print-section">
        <h2 className="print-section-title">Leftover Food Plan</h2>
        <table className="print-table">
          <tbody>
            <tr>
              <td style={{ width: "20%", fontWeight: 700, fontSize: "0.8rem", verticalAlign: "top" }}>Can Be Saved</td>
              <td>
                <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.85rem" }}>
                  {plan.leftoverPlan.canSave.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: "0.8rem", verticalAlign: "top" }}>Must Discard</td>
              <td>
                <ul style={{ margin: 0, paddingLeft: "1.2em", fontSize: "0.85rem" }}>
                  {plan.leftoverPlan.discard.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: "0.8rem" }}>Packaging</td>
              <td>{plan.leftoverPlan.packaging}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, fontSize: "0.8rem" }}>Who Decides</td>
              <td>{plan.leftoverPlan.whoDecides}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Volunteer Briefing Script */}
      <div className="print-section print-page-break">
        <h2 className="print-section-title">Volunteer Briefing Script</h2>
        <pre className="print-email">{plan.volunteerBriefing}</pre>
      </div>

      {/* Communication Pack */}
      <div className="print-section">
        <h2 className="print-section-title">Parent &amp; Student Communication Pack</h2>
        {[
          { label: "Event Announcement", text: plan.commsPack.announcement },
          { label: "Volunteer Request", text: plan.commsPack.volunteerRequest },
          { label: "Day-Before Reminder", text: plan.commsPack.dayBeforeReminder },
          { label: "Thank-You Message", text: plan.commsPack.thankYou },
        ].map(({ label, text }) => (
          <div key={label} style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontWeight: 700, fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px", color: "#6b7280" }}>
              {label}
            </p>
            <pre className="print-email" style={{ marginBottom: 0 }}>{text}</pre>
          </div>
        ))}
      </div>

      {/* Email Blurb */}
      <div className="print-section">
        <h2 className="print-section-title">Volunteer Recruitment Email</h2>
        <pre className="print-email">{plan.emailBlurb}</pre>
      </div>

      {/* Footer */}
      <div className="print-footer">
        <p>Generated by Fundraiser Food Math · fundraiserfoodmath.com</p>
        <p>{plan.disclaimer ?? "These are planning estimates. Adjust for your group, appetite, store prices, and local context."}</p>
      </div>
    </div>
  );
}
