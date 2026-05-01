import { useState } from "react";
import { Link } from "wouter";
import type { FundraiserPlan } from "@/lib/types";
import type { PlannerFormData } from "@/lib/types";
import {
  ArrowLeft, Printer, RefreshCw, Copy, CheckCircle2,
  AlertTriangle, AlertCircle, Info, Lock, ShoppingCart,
  Clock, Users, Mail, FileText, ChevronRight,
} from "lucide-react";
import { PAYMENT_LINKS, ENABLE_DEMO_UNLOCK } from "@/config/paymentLinks";

// ── FREE PREVIEW LIMITS ───────────────────────────────────────
// Change these numbers to adjust what the free preview shows.
const FREE_SHOPPING_ITEMS = 5;  // how many shopping list rows to show
const FREE_WARNINGS_SHOWN = 3;  // how many risk warnings to show

interface ResultsPageProps {
  plan: FundraiserPlan;
  formData: PlannerFormData;
  onReset: () => void;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ── UNLOCK HELPER ────────────────────────────────────────────
// MVP unlock flow: this is based on post-payment redirect and is not server-verified.
// For higher-volume sales, replace with Stripe webhook verification.
//
// Currently unlock state lives in sessionStorage only — it resets when the
// browser tab closes and cannot be forged across sessions in a meaningful way
// for a simple redirect-based flow. This is acceptable for early MVP volume.
// If you add a URL-param unlock (?unlocked=true after Stripe redirect), read
// that param here and write it to sessionStorage so the state persists within
// the session.
const UNLOCK_KEY = "ffm_unlocked";

function getUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === "true";
  } catch {
    return false;
  }
}

function setUnlocked() {
  try {
    sessionStorage.setItem(UNLOCK_KEY, "true");
  } catch {
    // ignore
  }
}

export default function ResultsPage({ plan, formData, onReset }: ResultsPageProps) {
  const [copied, setCopied] = useState(false);
  const [unlocked, setUnlockedState] = useState<boolean>(getUnlocked);
  const [activeTab, setActiveTab] = useState<"shopping" | "supplies" | "timeline" | "volunteers" | "email">("shopping");

  const profit = plan.estimatedProfit;
  const profitStatus = profit[1] < 0 ? "loss" : profit[0] < 0 ? "risky" : "good";

  const handleDemoUnlock = () => {
    setUnlocked();
    setUnlockedState(true);
    // Also persist plan so the print page picks up unlock status.
    try {
      sessionStorage.setItem("ffm_plan", JSON.stringify({ plan, formData }));
    } catch {
      // ignore
    }
  };

  const handlePrintClick = () => {
    try {
      sessionStorage.setItem("ffm_plan", JSON.stringify({ plan, formData }));
    } catch {
      // ignore
    }
  };

  const copyEmailBlurb = () => {
    navigator.clipboard.writeText(plan.emailBlurb).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Free preview: top N shopping items
  const previewItems = plan.shoppingList.slice(0, FREE_SHOPPING_ITEMS);
  const hiddenItemCount = plan.shoppingList.length - FREE_SHOPPING_ITEMS;

  // Free preview: up to N warnings
  const visibleWarnings = plan.riskWarnings.slice(0, FREE_WARNINGS_SHOWN);

  return (
    <div className="results-page" data-testid="results-page">
      {/* Header */}
      <div className="results-header">
        <div className="results-header-inner">
          <Link href="/" className="back-link" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to home
          </Link>
          <h1 className="results-title" data-testid="results-title">{plan.summary.eventName}</h1>
          <p className="results-subtitle" data-testid="results-subtitle">
            {plan.summary.mealType} · {plan.summary.attendance} guests · {plan.summary.orgType}
          </p>
          <div className="results-actions">
            <button onClick={onReset} className="btn-secondary" data-testid="button-edit-plan">
              <RefreshCw className="w-4 h-4 mr-2" /> Edit Plan
            </button>
            {unlocked && (
              <a
                href="/print"
                onClick={handlePrintClick}
                className="btn-primary"
                target="_blank"
                data-testid="button-print-plan"
              >
                <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Risk Warnings — free preview shows up to FREE_WARNINGS_SHOWN */}
      {visibleWarnings.length > 0 && (
        <div className="warnings-section" data-testid="warnings-section">
          {visibleWarnings.map((w, i) => (
            <div key={i} className={`warning-banner warning-banner--${w.level}`} data-testid={`warning-banner-${i}`}>
              <span className="warning-icon">
                {w.level === "error" ? <AlertCircle className="w-5 h-5" /> :
                 w.level === "warning" ? <AlertTriangle className="w-5 h-5" /> :
                 <Info className="w-5 h-5" />}
              </span>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards — always visible */}
      <div className="summary-cards">
        <div className="summary-card" data-testid="card-revenue">
          <div className="summary-label">Expected Revenue</div>
          <div className="summary-value summary-value--revenue">{fmt(plan.estimatedRevenue)}</div>
          <div className="summary-note">{plan.summary.attendance} guests × ${plan.summary.mealPrice}</div>
        </div>
        <div className="summary-card" data-testid="card-cost">
          <div className="summary-label">Est. Total Cost</div>
          <div className="summary-value">{fmt(plan.costRange[0])} – {fmt(plan.costRange[1])}</div>
          <div className="summary-note">Food + supplies + 5% buffer</div>
        </div>
        <div className={`summary-card summary-card--${profitStatus}`} data-testid="card-profit">
          <div className="summary-label">Est. Profit</div>
          <div className={`summary-value summary-value--${profitStatus}`}>
            {fmt(profit[0])} – {fmt(profit[1])}
          </div>
          <div className="summary-note">
            {profitStatus === "loss" ? "Consider raising price or cutting costs" :
             profitStatus === "risky" ? "Margin is tight — watch costs" :
             "Looking good!"}
          </div>
        </div>
        <div className="summary-card" data-testid="card-attendance">
          <div className="summary-label">Attendance Split</div>
          <div className="summary-value">{plan.summary.adults} adults</div>
          <div className="summary-note">{plan.summary.kids} kids / students</div>
        </div>
      </div>

      {/* Shopping List Preview — always visible, limited */}
      <section className="results-section" data-testid="section-preview">
        <h2 className="section-heading">Shopping List Preview</h2>
        <p className="section-note">
          Showing {previewItems.length} of {plan.shoppingList.length} items.
          {!unlocked && " The complete list is included in the Full Event Pack."}
        </p>
        <div className="table-wrap">
          <table className="data-table" data-testid="table-shopping-preview">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Est. Cost Range</th>
              </tr>
            </thead>
            <tbody>
              {previewItems.map((item, i) => (
                <tr key={i} data-testid={`row-preview-${i}`}>
                  <td>{item.item}</td>
                  <td><strong>{item.quantity}</strong></td>
                  <td>{fmt(item.estimatedCost[0])} – {fmt(item.estimatedCost[1])}</td>
                </tr>
              ))}
              {!unlocked && hiddenItemCount > 0 && (
                <tr className="table-locked-row">
                  <td colSpan={3}>
                    <span className="table-locked-msg">
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      {hiddenItemCount} more item{hiddenItemCount !== 1 ? "s" : ""} included in the Full Event Pack
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── LOCKED SECTION ─────────────────────────────────────── */}
      {!unlocked && (
        <section className="locked-section" data-testid="locked-section">
          <div className="locked-inner">
            <div className="locked-header">
              <Lock className="locked-icon" />
              <h2 className="locked-title">Unlock the Full Event Pack</h2>
              <p className="locked-subtitle">
                Everything you need to run a smooth, well-organized fundraiser — ready to print and share.
              </p>
            </div>

            <div className="locked-features-grid">
              {[
                {
                  icon: <ShoppingCart className="w-5 h-5" />,
                  title: "Complete Shopping List",
                  desc: "Every ingredient and supply with quantities and cost estimates.",
                },
                {
                  icon: <FileText className="w-5 h-5" />,
                  title: "Supplies List",
                  desc: "Plates, utensils, foil, serving trays — nothing gets forgotten.",
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  title: "Step-by-Step Prep Timeline",
                  desc: "Exactly what to do, when to start, and who handles it.",
                },
                {
                  icon: <Users className="w-5 h-5" />,
                  title: "Volunteer Role Plan",
                  desc: "Role assignments for Adult Volunteers, Parent Oversight, and Student Volunteers.",
                },
                {
                  icon: <Users className="w-5 h-5" />,
                  title: "Parent & Student Sign-Up Sheet",
                  desc: "A ready-to-print sign-up table for recruiting your team.",
                },
                {
                  icon: <Mail className="w-5 h-5" />,
                  title: "Volunteer Recruitment Email",
                  desc: "A pre-written email blurb you can copy and send to parents and students.",
                },
                {
                  icon: <Printer className="w-5 h-5" />,
                  title: "Print-Ready Event Plan",
                  desc: "One clean document to hand to your team or keep in your binder.",
                },
              ].map((f, i) => (
                <div key={i} className="locked-feature">
                  <div className="locked-feature-icon">{f.icon}</div>
                  <div>
                    <div className="locked-feature-title">{f.title}</div>
                    <div className="locked-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="locked-cta-group">
              <a
                href={PAYMENT_LINKS.fullEventPack ?? "#"}
                className="btn-locked-cta"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="button-unlock-paid"
              >
                Get the Full Event Pack — $19
                <ChevronRight className="w-5 h-5 ml-1" />
              </a>
              <p className="locked-cta-note">
                One-time purchase. Instant access. No account required.
              </p>

              {/* ── DEMO UNLOCK ──────────────────────────────────────
                  Visible only when ENABLE_DEMO_UNLOCK = true in paymentLinks.ts.
                  Remove or set to false before going live.
              ─────────────────────────────────────────────────── */}
              {ENABLE_DEMO_UNLOCK && (
                <button
                  onClick={handleDemoUnlock}
                  className="btn-demo-unlock"
                  data-testid="button-demo-unlock"
                >
                  Demo: Unlock Full Plan
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── FULL CONTENT (unlocked only) ────────────────────────── */}
      {unlocked && (
        <>
          {/* Food Quantities */}
          <section className="results-section">
            <h2 className="section-heading">Food Quantity Plan</h2>
            <p className="section-note">
              Quantities include a waste/overage buffer. Adjust based on your knowledge of your crowd.
            </p>
            <div className="table-wrap">
              <table className="data-table" data-testid="table-food-quantities">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Quantity to Buy</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.foodQuantities.map((q, i) => (
                    <tr key={i} data-testid={`row-food-${i}`}>
                      <td>{q.ingredient}</td>
                      <td><strong>{q.quantity}</strong></td>
                      <td className="table-note">{q.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tabbed sections */}
          <section className="results-section results-section--tabbed">
            <div className="tab-bar" data-testid="tab-bar">
              {(["shopping", "supplies", "timeline", "volunteers", "email"] as const).map((tab) => (
                <button
                  key={tab}
                  className={`tab-btn ${activeTab === tab ? "tab-btn--active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  data-testid={`tab-btn-${tab}`}
                >
                  {tab === "shopping" ? "Shopping List" :
                   tab === "supplies" ? "Supplies List" :
                   tab === "timeline" ? "Prep Timeline" :
                   tab === "volunteers" ? "Volunteer Plan" : "Email Blurb"}
                </button>
              ))}
            </div>

            {activeTab === "shopping" && (
              <div className="tab-content" data-testid="tab-content-shopping">
                <p className="tab-intro">
                  Store preference: <strong>{plan.summary.storePreference}</strong>. Prices are estimates and vary by store and region.
                </p>
                <div className="table-wrap">
                  <table className="data-table" data-testid="table-shopping-list">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Est. Cost Range</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.shoppingList.map((item, i) => (
                        <tr key={i} data-testid={`row-shopping-${i}`}>
                          <td>{item.item}</td>
                          <td><strong>{item.quantity}</strong></td>
                          <td>{fmt(item.estimatedCost[0])} – {fmt(item.estimatedCost[1])}</td>
                          <td className="table-note">{item.notes || "—"}</td>
                        </tr>
                      ))}
                      <tr className="table-total">
                        <td colSpan={2}><strong>Total Food Cost Estimate</strong></td>
                        <td colSpan={2}><strong>{fmt(plan.costRange[0])} – {fmt(plan.costRange[1])}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "supplies" && (
              <div className="tab-content" data-testid="tab-content-supplies">
                <div className="table-wrap">
                  <table className="data-table" data-testid="table-supplies-list">
                    <thead>
                      <tr>
                        <th>Supply</th>
                        <th>Quantity</th>
                        <th>Est. Cost Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.suppliesList.map((item, i) => (
                        <tr key={i} data-testid={`row-supply-${i}`}>
                          <td>{item.item}</td>
                          <td><strong>{item.quantity}</strong></td>
                          <td>
                            {item.estimatedCost[0] === 0
                              ? "Already owned / donated"
                              : `${fmt(item.estimatedCost[0])} – ${fmt(item.estimatedCost[1])}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "timeline" && (
              <div className="tab-content" data-testid="tab-content-timeline">
                <div className="timeline-list">
                  {plan.prepTimeline.map((step, i) => (
                    <div key={i} className="timeline-item" data-testid={`timeline-step-${i}`}>
                      <div className="timeline-time">{step.time}</div>
                      <div className="timeline-dot" />
                      <div className="timeline-body">
                        <p className="timeline-task">{step.task}</p>
                        <div className="timeline-meta">
                          <span className={`volunteer-badge volunteer-badge--${step.who.replace(/\s/g, "-").toLowerCase()}`}>
                            {step.who}
                          </span>
                          <span className="timeline-duration">{step.duration}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "volunteers" && (
              <div className="tab-content" data-testid="tab-content-volunteers">
                <div className="volunteer-grid">
                  {plan.volunteerPlan.map((role, i) => (
                    <div key={i} className="volunteer-card" data-testid={`volunteer-role-${i}`}>
                      <div className="volunteer-card-header">
                        <h3 className="volunteer-role">{role.role}</h3>
                        <div className="volunteer-meta">
                          <span className={`volunteer-badge volunteer-badge--${role.type.replace(/\s/g, "-").toLowerCase()}`}>
                            {role.type}
                          </span>
                          <span className="volunteer-count">× {role.count}</span>
                        </div>
                      </div>
                      <ul className="volunteer-duties">
                        {role.duties.map((d, j) => (
                          <li key={j}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="signup-section">
                  <h3 className="signup-title">Parent / Student Sign-Up</h3>
                  <p className="signup-desc">
                    Share the email blurb below with your community to recruit volunteers.
                    You can also create a simple sign-up sheet using the printable plan.
                  </p>
                  <div className="signup-table-wrap">
                    <table className="data-table signup-table" data-testid="table-signup">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Phone / Email</th>
                          <th>Confirmed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.volunteerPlan.flatMap((role) =>
                          Array.from({ length: role.count }).map((_, j) => (
                            <tr key={`${role.role}-${j}`}>
                              <td className="signup-blank">___________________</td>
                              <td>{role.role}</td>
                              <td className="signup-blank">___________________</td>
                              <td className="signup-blank">___</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="tab-content" data-testid="tab-content-email">
                <p className="tab-intro">Copy this email to send to your community for volunteer sign-ups.</p>
                <div className="email-blurb-wrap">
                  <pre className="email-blurb" data-testid="text-email-blurb">{plan.emailBlurb}</pre>
                  <button
                    onClick={copyEmailBlurb}
                    className={`copy-btn ${copied ? "copy-btn--copied" : ""}`}
                    data-testid="button-copy-email"
                  >
                    {copied
                      ? <><CheckCircle2 className="w-4 h-4 mr-1" /> Copied!</>
                      : <><Copy className="w-4 h-4 mr-1" /> Copy to Clipboard</>}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Bottom CTA — only shown when unlocked */}
          <div className="results-footer">
            <div className="results-footer-inner">
              <div>
                <h3>Ready to share your plan?</h3>
                <p>Print your plan or save it as a PDF to hand out to your team.</p>
              </div>
              <div className="results-footer-actions">
                <button onClick={onReset} className="btn-secondary" data-testid="button-footer-start-over">Start Over</button>
                <a
                  href="/print"
                  onClick={handlePrintClick}
                  className="btn-primary"
                  target="_blank"
                  data-testid="button-footer-print"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
