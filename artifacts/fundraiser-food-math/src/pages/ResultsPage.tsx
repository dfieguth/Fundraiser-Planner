import { useState } from "react";
import { Link } from "wouter";
import type { FundraiserPlan } from "@/lib/types";
import type { PlannerFormData } from "@/lib/types";
import {
  ArrowLeft, Printer, RefreshCw, Copy, CheckCircle2,
  AlertTriangle, AlertCircle, Info, Lock, ShoppingCart,
  Clock, Users, Mail, FileText, ChevronRight, Lightbulb,
  TrendingUp, MapPin, Package, MessageSquare, Shield,
} from "lucide-react";
import { PAYMENT_LINKS, ENABLE_DEMO_UNLOCK } from "@/config/paymentLinks";
import { getUnlocked, hasExpiredCodeUnlock, setUnlocked, savePlanBeforePayment, applyAccessCode } from "@/lib/unlock";

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

function safeNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export default function ResultsPage({ plan, formData, onReset }: ResultsPageProps) {
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [summaryFailed, setSummaryFailed] = useState(false);
  const expiredCodeUnlock = hasExpiredCodeUnlock();
  const safePlan = plan ?? null;
  const safeFormData = formData ?? null;
  const planSummary = safePlan?.summary;
  const safeAttendance = safeNumber(planSummary?.attendance, 0);
  const safeAdults = safeNumber(planSummary?.adults, 0);
  const safeKids = safeNumber(planSummary?.kids, 0);
  const safeMealPrice = safeNumber(planSummary?.mealPrice, 0);
  const safeCostRange: [number, number] = [
    safeNumber(plan?.costRange?.[0], 0),
    safeNumber(plan?.costRange?.[1], 0),
  ];
  const safeEstimatedRevenue = safeNumber(plan?.estimatedRevenue, 0);
  const safeEstimatedProfit: [number, number] = [
    safeNumber(plan?.estimatedProfit?.[0], 0),
    safeNumber(plan?.estimatedProfit?.[1], 0),
  ];
  const safeShoppingList = Array.isArray(plan?.shoppingList) ? plan.shoppingList : [];
  const safeRiskWarnings = Array.isArray(plan?.riskWarnings) ? plan.riskWarnings : [];
  const safeFoodQuantities = Array.isArray(plan?.foodQuantities) ? plan.foodQuantities : [];
  const safeSuppliesList = Array.isArray(plan?.suppliesList) ? plan.suppliesList : [];
  const safePrepTimeline = Array.isArray(plan?.prepTimeline) ? plan.prepTimeline : [];
  const safeVolunteerPlan = Array.isArray(plan?.volunteerPlan) ? plan.volunteerPlan : [];
  const safeStrategySummary = plan?.strategySummary;
  const safeProfitStrategy = plan?.profitStrategy;
  const safeSetupLayout = Array.isArray(plan?.setupLayout) ? plan.setupLayout : [];
  const safeShoppingListGrouped = Array.isArray(plan?.shoppingListGrouped) ? plan.shoppingListGrouped : [];
  const safeRiskPlan = Array.isArray(plan?.riskPlan) ? plan.riskPlan : [];
  const safeLeftoverPlan = plan?.leftoverPlan ?? null;
  const safeCommsPack = plan?.commsPack;
  const safeVolunteerBriefing = plan?.volunteerBriefing ?? "";
  const safeEmailBlurb = plan?.emailBlurb ?? "";
  const safeDisclaimer = plan?.disclaimer ?? "These are planning estimates. Adjust for your group, appetite, store prices, and local context.";
  const [sensitivityPrice, setSensitivityPrice] = useState<number>(safeMealPrice);
  const [accessCode, setAccessCode] = useState("");
  const [codeStatus, setCodeStatus] = useState<"idle" | "success" | "error">("idle");
  const [unlocked, setUnlockedState] = useState<boolean>(getUnlocked);
  const [activeTab, setActiveTab] = useState<"shopping" | "supplies" | "timeline" | "volunteers" | "email">("shopping");
  const [showCanvaBrief, setShowCanvaBrief] = useState(false);
  const [copiedCanva, setCopiedCanva] = useState(false);

  const profit = safeEstimatedProfit;
  const profitStatus = profit[1] < 0 ? "loss" : profit[0] < 0 ? "risky" : "good";

  const safeRevenueConservative = plan?.revenueConservative;
  const safeRevenueGenerous = plan?.revenueGenerous;
  const safeScenarioBundle = plan?.scenarioBundle;
  const showAdvancedRevenue = false;

  const MEAL_LABELS: Record<string, string> = {
    hotdogs: "Hot Dogs", burgers: "Burgers", bakedPotatoes: "Baked Potatoes",
    breakfastBurritos: "Breakfast Burritos", tacos: "Tacos", walkingTacos: "Walking Tacos",
    spaghetti: "Spaghetti", pancakes: "Pancakes", custom: "Custom Meal",
    combo_hotdogs_potatoes: "Hot Dogs + Baked Potatoes",
    combo_burgers_chips: "Burgers + Chips",
    combo_pancakes_sausage: "Pancakes + Sausage",
  };

  const generateCanvaBrief = () => {
    const mealLabel = MEAL_LABELS[safeFormData?.mealType ?? ""] ?? planSummary?.mealType ?? "Meal";
    const serveStart = safeFormData?.serveStartTime ?? "12:00";
    const serveEnd   = safeFormData?.serveEndTime   ?? "14:00";
    const orgName    = planSummary?.orgType ?? "Our Organization";
    const eventName  = planSummary?.eventName ?? "Our Fundraiser";
    const price      = fmt(safeMealPrice);

    return [
      "═══════════════════════════════════",
      "CANVA AD BRIEF — FUNDRAISER EVENT",
      "═══════════════════════════════════",
      "",
      `Event Name:      ${eventName}`,
      `Organization:    ${orgName}`,
      `Meal Served:     ${mealLabel}`,
      `Serving Time:    ${serveStart} – ${serveEnd}`,
      `Suggested Price: ${price} per person`,
      `Attendance Goal: ${safeAttendance} guests`,
      "",
      "HEADLINE OPTIONS (choose one):",
      `• "Join Us for ${mealLabel} to Support ${orgName}!"`,
      `• "${eventName} — All Are Welcome!"`,
      `• "Help ${orgName} — Enjoy Great ${mealLabel}!"`,
      "",
      "BODY COPY:",
      `Come enjoy delicious ${mealLabel} while supporting ${orgName}.`,
      `Suggested donation: ${price} per person.`,
      `Serving from ${serveStart} to ${serveEnd}.`,
      "",
      "DESIGN NOTES FOR CANVA:",
      "• Use a warm, inviting food photo as background",
      "• Keep headline large (48–64pt), bold, high contrast",
      "• Add your organization logo in the top-left corner",
      "• CTA button text: 'Come Join Us' or 'See You There'",
      "• Suggested colors: warm amber, deep red, or school/org brand colors",
      "• Format: Square (1080×1080) for social, or 4:5 for Instagram Feed",
      "",
      "═══════════════════════════════════",
      "Generated by Fundraiser Food Math · fundraiserfoodmath.com",
    ].join("\n");
  };

  const copyCanvaBrief = () => {
    const text = generateCanvaBrief();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedCanva(true);
      setTimeout(() => setCopiedCanva(false), 2500);
    });
  };

  const handleDemoUnlock = () => {
    setUnlocked();
    setUnlockedState(true);
    if (safePlan && safeFormData) savePlanBeforePayment(safePlan, safeFormData);
  };

  const handleApplyCode = () => {
    const result = applyAccessCode(accessCode);
    if (result === "ok") {
      if (safePlan && safeFormData) savePlanBeforePayment(safePlan, safeFormData);
      setCodeStatus("success");
      setUnlockedState(true);
    } else {
      setCodeStatus("error");
    }
  };

  const handlePaymentCTAClick = () => {
    if (safePlan && safeFormData) savePlanBeforePayment(safePlan, safeFormData);
    const link = PAYMENT_LINKS.fullEventPack;
    if (link) window.location.href = link;
  };

  const handlePrintClick = () => {
    if (safePlan && safeFormData) savePlanBeforePayment(safePlan, safeFormData);
  };

  const copyEmailBlurb = () => {
    navigator.clipboard.writeText(safeEmailBlurb).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const copyKeySummary = () => {
    const mealLabel = MEAL_LABELS[planSummary?.mealType ?? ""] ?? planSummary?.mealType ?? "Custom Meal";
    const top5 = [...safeShoppingList]
      .sort((a, b) => b.estimatedCost[1] - a.estimatedCost[1])
      .slice(0, 5);
    const sep = "─".repeat(38);
    const lines = [
      "FUNDRAISER KEY SUMMARY",
      sep,
      "",
      `Event:        ${planSummary?.eventName ?? "Unnamed Event"}`,
      `Organization: ${planSummary?.orgType ?? "—"}`,
      `Meal:         ${mealLabel}`,
      `Attendance:   ${safeAttendance} guests (${safeAdults} adults, ${safeKids} kids)`,
      `Suggested:    $${safeMealPrice} per person`,
      "",
      "FINANCIALS",
      sep,
      `Expected Revenue:  ${fmt(safeEstimatedRevenue)}`,
      `Est. Food Cost:    ${fmt(safeCostRange[0])} – ${fmt(safeCostRange[1])}`,
      `Est. Net Profit:   ${fmt(safeEstimatedProfit[0])} – ${fmt(safeEstimatedProfit[1])}`,
      "",
      "VOLUNTEERS",
      sep,
      `Adult Volunteers:  ${safeFormData?.adultVolunteers ?? 0}`,
      `Student Helpers:   ${safeFormData?.studentVolunteers ?? 0}`,
      "",
      "TOP SHOPPING ITEMS (by cost)",
      sep,
      ...top5.map((item, i) =>
        `${i + 1}. ${item.item} — ${fmt(item.estimatedCost[0])} – ${fmt(item.estimatedCost[1])}`
      ),
      "",
      "MAIN EXECUTION RISK",
      sep,
      safeStrategySummary?.mainExecutionRisk ?? "No strategy summary available.",
      "",
      "RECOMMENDED LEADER FOCUS",
      sep,
      safeStrategySummary?.recommendedFocus ?? "No recommended focus available.",
      "",
      sep,
      safeDisclaimer,
      "",
      "FOUNDING EVENT PACK",
      sep,
      "Includes: food quantities, shopping list, prep timeline, volunteer plan, basic budget range, announcement copy, and Canva flyer brief.",
      "Generated by Fundraiser Food Math · fundraiserfoodmath.com",
    ];

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopiedSummary(true);
      setSummaryFailed(false);
      setTimeout(() => setCopiedSummary(false), 2500);
    }).catch(() => {
      setSummaryFailed(true);
      setTimeout(() => setSummaryFailed(false), 5000);
    });
  };

  // Free preview: top N shopping items
  const previewItems = safeShoppingList.slice(0, FREE_SHOPPING_ITEMS);
  const hiddenItemCount = safeShoppingList.length - FREE_SHOPPING_ITEMS;

  // Free preview: up to N warnings
  const visibleWarnings = safeRiskWarnings.slice(0, FREE_WARNINGS_SHOWN);

  return (
    <div className="results-page" data-testid="results-page">
      {/* Header */}
      <div className="results-header">
        <div className="results-header-inner">
          <Link href="/" className="back-link" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to home
          </Link>
          <h1 className="results-title" data-testid="results-title">{planSummary?.eventName ?? "Untitled Event"}</h1>
          <p className="results-subtitle" data-testid="results-subtitle">
            {planSummary?.mealType ?? "Meal"} · {safeAttendance} guests · {planSummary?.orgType ?? "Organization"}
          </p>
          <div className="results-actions">
            <button onClick={onReset} className="btn-secondary" data-testid="button-edit-plan">
              <RefreshCw className="w-4 h-4 mr-2" /> Edit Plan
            </button>
            {unlocked && (
              <>
                <a
                  href="/print"
                  onClick={handlePrintClick}
                  className="btn-primary"
                  target="_blank"
                  data-testid="button-print-plan"
                >
                  <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
                </a>
                <button
                  onClick={copyKeySummary}
                  className="btn-secondary"
                  data-testid="button-copy-summary"
                >
                  {copiedSummary
                    ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Copied!</>
                    : <><Copy className="w-4 h-4 mr-2" /> Copy Key Summary</>}
                </button>
              </>
            )}
          </div>
          {summaryFailed && (
            <p className="results-copy-failed">
              Copy failed. Select and copy the summary manually, or try again.
            </p>
          )}
        </div>
      </div>

      {/* ── Canva Ad Brief ──────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px 0" }} />

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
          {showAdvancedRevenue && safeRevenueConservative !== undefined && safeRevenueGenerous !== undefined ? (
            <>
              <div className="summary-label">Revenue Range (Split Pricing)</div>
              <div className="summary-value summary-value--revenue" style={{ fontSize: "1.1rem" }}>
                {fmt(safeRevenueConservative)} – {fmt(safeRevenueGenerous)}
              </div>
              <div className="summary-note">
                Expected: {fmt(safeEstimatedRevenue)} · 60–90% donation rate
              </div>
            </>
          ) : (
            <>
              <div className="summary-label">Expected Revenue</div>
              <div className="summary-value summary-value--revenue">{fmt(safeEstimatedRevenue)}</div>
              <div className="summary-note">{safeAttendance} guests × ${safeMealPrice}</div>
            </>
          )}
        </div>
        <div className="summary-card" data-testid="card-cost">
          <div className="summary-label">Est. Total Cost</div>
          <div className="summary-value">{fmt(safeCostRange[0])} – {fmt(safeCostRange[1])}</div>
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
          <div className="summary-value">{safeAdults} adults</div>
          <div className="summary-note">{safeKids} kids / students</div>
        </div>
      </div>

      {/* ── Revenue Scenarios (hidden) ──────────────── */}
      {showAdvancedRevenue && plan?.revenueScenarios && (
        <section className="results-section" data-testid="section-revenue-scenarios" style={{ margin: "0 0 8px" }}>
          <h2 className="section-heading">Revenue Projection Scenarios</h2>
          <p className="section-note">
            Three scenarios based on how many guests actually donate, using your{" "}
            {safeFormData?.pricingModel === "split" ? "tiered pricing model" : "flat pricing model"}.
            The ±10% range around your baseline donation rate reflects real-world variance.
          </p>
          <div className="table-wrap">
            <table className="data-table" data-testid="table-revenue-scenarios">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Conv. Rate</th>
                  <th>Gross Revenue</th>
                  <th>Est. Cost</th>
                  <th>Net Profit Range</th>
                  <th>$/Guest</th>
                  <th>Break-Even</th>
                </tr>
              </thead>
              <tbody>
                {(["conservative", "baseline", "optimistic"] as const).map((key) => {
                  const s = plan.revenueScenarios![key];
                  const status = s.netProfitRange[1] < 0 ? "loss" : s.netProfitRange[0] < 0 ? "risky" : "good";
                  return (
                    <tr key={key} data-testid={`scenario-revenue-row-${key}`}>
                      <td style={{ fontWeight: 600 }}>{s.label}</td>
                      <td style={{ color: "var(--color-text-muted)" }}>{s.conversionRate}%</td>
                      <td style={{ color: "var(--color-revenue, #15803d)", fontWeight: 600 }}>{fmt(s.grossRevenue)}</td>
                      <td style={{ color: "var(--color-text-muted)" }}>{fmt(s.costRange[0])} – {fmt(s.costRange[1])}</td>
                      <td style={{ fontWeight: 600, color: status === "good" ? "var(--color-profit)" : status === "risky" ? "var(--color-warning)" : "var(--color-error)" }}>
                        {fmt(s.netProfitRange[0])} – {fmt(s.netProfitRange[1])}
                      </td>
                      <td>${s.revenuePerAttendee.toFixed(2)}</td>
                      <td style={{ color: "var(--color-text-muted)" }}>{s.breakEvenAttendance >= 9999 ? "—" : `${s.breakEvenAttendance} guests`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="field-hint" style={{ marginTop: 8 }}>
            Break-even is the minimum attendance needed to cover your high-end cost estimate at each scenario's donation rate. Plan to exceed your break-even by at least 20%.
          </p>
        </section>
      )}

      {/* ScenarioCompare — hidden */}
      {showAdvancedRevenue && safeScenarioBundle && (
        <section className="results-section" data-testid="section-scenarios" style={{ margin: "0 0 8px" }}>
          <h2 className="section-heading">Attendance Scenario Comparison</h2>
          <p className="section-note">
            Your plan uses the midpoint ({safeAttendance} guests) for shopping quantities. Here's how key numbers shift across your range.
          </p>
          <div className="table-wrap">
            <table className="data-table" data-testid="table-scenarios">
              <thead>
                <tr>
                  <th>Scenario</th>
                  <th>Guests</th>
                  <th>Revenue</th>
                  <th>Est. Cost</th>
                  <th>Est. Profit</th>
                </tr>
              </thead>
              <tbody>
                {(["conservative", "expected", "generous"] as const).map((key) => {
                  const s = safeScenarioBundle![key];
                  const pLow = s.estimatedProfit[0];
                  const pHigh = s.estimatedProfit[1];
                  const status = pHigh < 0 ? "loss" : pLow < 0 ? "risky" : "good";
                  return (
                    <tr key={key} data-testid={`scenario-row-${key}`}>
                      <td style={{ fontWeight: 600, textTransform: "capitalize" }}>{key}</td>
                      <td>{s.attendance}</td>
                      <td style={{ color: "var(--color-revenue, #15803d)" }}>{fmt(s.estimatedRevenue)}</td>
                      <td>{fmt(s.costRange[0])} – {fmt(s.costRange[1])}</td>
                      <td style={{ color: status === "good" ? "var(--color-profit)" : status === "risky" ? "var(--color-warning)" : "var(--color-error)" }}>
                        {fmt(pLow)} – {fmt(pHigh)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="field-hint" style={{ marginTop: 8 }}>
            Shop for the midpoint. If turnout is higher, key bulk items like hot dogs and buns are easy to grab extras of on the day before.
          </p>
        </section>
      )}

      {/* Disclaimer — always visible */}
      <p className="results-disclaimer" data-testid="results-disclaimer">{safeDisclaimer}</p>

      {/* Shopping List Preview — always visible, limited */}
      <section className="results-section" data-testid="section-preview">
        <h2 className="section-heading">Shopping List Preview</h2>
        <p className="section-note">
          Showing {previewItems.length} of {safeShoppingList.length} items.
          {!unlocked && " The complete grouped list is included in the Full Event Pack."}
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

        {/* Pricing methodology note (Part 5) */}
        {plan?.pricingMethodologyNote && (
          <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 10, padding: "8px 12px", background: "var(--color-bg-card)", borderRadius: 6, border: "1px solid var(--color-border)", lineHeight: 1.5 }}>
            <strong>About these prices:</strong> {plan.pricingMethodologyNote}
          </p>
        )}
      </section>

      {/* ── LOCKED SECTION ─────────────────────────────────────── */}
      {!unlocked && (
        <section className="locked-section" data-testid="locked-section">
          <div className="locked-inner">
            <div className="locked-header">
              <Lock className="locked-icon" />
                    <h2 className="locked-title">Unlock the Founding Event Pack</h2>
              <p className="locked-subtitle">
                Everything you need to run a smooth, well-organized fundraiser — ready to print and share.
              </p>
            </div>

            <div className="locked-features-grid">
              {[
                {
                  icon: <ShoppingCart className="w-5 h-5" />,
                  title: "Complete Shopping List",
                  desc: "Every ingredient and supply with quantities, cost estimates, and grouped by category.",
                },
                {
                  icon: <FileText className="w-5 h-5" />,
                  title: "Supplies List",
                  desc: "Plates, utensils, foil, serving trays — nothing gets forgotten.",
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  title: "Step-by-Step Prep Timeline",
                  desc: "Exactly what to do, when to start, who handles it — plus leader notes and watch-out tips for each step.",
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
                {
                  icon: <Lightbulb className="w-5 h-5" />,
                  title: "Fundraiser Strategy Summary",
                  desc: "Best fit assessment, main profit driver, main execution risk, and recommended focus for your specific event.",
                },
                {
                  icon: <TrendingUp className="w-5 h-5" />,
                  title: "Profit Strategy & Upsell Ideas",
                  desc: "Price check, upsell suggestions, pricing model recommendation, and copy-ready signage language.",
                },
                {
                  icon: <Users className="w-5 h-5" />,
                  title: "Volunteer Briefing Script",
                  desc: "A ready-to-read pre-event briefing for your whole team — food safety, serving flow, and roles.",
                },
                {
                  icon: <MapPin className="w-5 h-5" />,
                  title: "Event Setup Layout",
                  desc: "Step-by-step station layout specific to your meal type so your team knows exactly where everything goes.",
                },
                {
                  icon: <Package className="w-5 h-5" />,
                  title: "Leftover Food Plan",
                  desc: "What to save, what to discard, how to package it, and who makes the call — specific to your meal.",
                },
                {
                  icon: <MessageSquare className="w-5 h-5" />,
                  title: "Parent & Student Communication Pack",
                  desc: "Four ready-to-copy messages: announcement, volunteer request, day-before reminder, and thank-you.",
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: "Risk Plan with Practical Fixes",
                  desc: "Every risk flag paired with a specific, actionable fix so you know exactly how to respond.",
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
              <button
                onClick={handlePaymentCTAClick}
                className="btn-locked-cta"
                data-testid="button-unlock-paid"
              >
                      Get the Founding Event Pack — $19
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
              <p className="locked-cta-note">
                One-time purchase. Instant access. No account required.
              </p>

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

            {/* Access Code Entry — understated, below the $19 CTA */}
            <div className="locked-access-code" data-testid="access-code-area">
              {expiredCodeUnlock && (
                <p className="locked-access-msg locked-access-msg--error" data-testid="access-code-expired">
                  Your access code has expired. Re-enter a valid code to renew access.
                </p>
              )}
              <p className="locked-access-label">Have an access code?</p>
              <div className="locked-access-row">
                <input
                  type="text"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => { setAccessCode(e.target.value); setCodeStatus("idle"); }}
                  className="locked-access-input"
                  data-testid="access-code-input"
                  onKeyDown={(e) => { if (e.key === "Enter") handleApplyCode(); }}
                />
                <button
                  onClick={handleApplyCode}
                  className="locked-access-btn"
                  data-testid="access-code-submit"
                >
                  Apply Code
                </button>
              </div>
              {codeStatus === "success" && (
                <p className="locked-access-msg locked-access-msg--success" data-testid="access-code-success">
                  Access code applied. Full Event Pack unlocked.
                </p>
              )}
              {codeStatus === "error" && (
                <p className="locked-access-msg locked-access-msg--error" data-testid="access-code-error">
                  That code did not work. Check the code and try again.
                </p>
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
                  {safeFoodQuantities.map((q, i) => (
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
                  Store preference: <strong>{plan?.summary?.storePreference ?? "—"}</strong>. Prices are estimates and vary by store and region.
                </p>
                {safeShoppingListGrouped.length > 0 ? (
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
                        {safeShoppingListGrouped.map((group) => (
                          <>
                            <tr key={`group-${group.label}`} className="shopping-group-row">
                              <td colSpan={4} className="shopping-group-header-cell">{group.label}</td>
                            </tr>
                            {group.items.map((item, i) => (
                              <tr key={`${group.label}-${i}`} data-testid={`row-shopping-${group.label}-${i}`}>
                                <td>{item.item}</td>
                                <td><strong>{item.quantity}</strong></td>
                                <td>{fmt(item.estimatedCost[0])} – {fmt(item.estimatedCost[1])}</td>
                                <td className="table-note">{item.notes || "—"}</td>
                              </tr>
                            ))}
                          </>
                        ))}
                        <tr className="table-total">
                          <td colSpan={2}><strong>Total Food Cost Estimate</strong></td>
                          <td colSpan={2}><strong>{fmt(safeCostRange[0])} – {fmt(safeCostRange[1])}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
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
                        {safeShoppingList.map((item, i) => (
                          <tr key={i} data-testid={`row-shopping-${i}`}>
                            <td>{item.item}</td>
                            <td><strong>{item.quantity}</strong></td>
                            <td>{fmt(item.estimatedCost[0])} – {fmt(item.estimatedCost[1])}</td>
                            <td className="table-note">{item.notes || "—"}</td>
                          </tr>
                        ))}
                        <tr className="table-total">
                          <td colSpan={2}><strong>Total Food Cost Estimate</strong></td>
                          <td colSpan={2}><strong>{fmt(safeCostRange[0])} – {fmt(safeCostRange[1])}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
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
                      {safeSuppliesList.map((item, i) => (
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
                  {safePrepTimeline.map((step, i) => (
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
                        {step.leaderNote && (
                          <p className="timeline-leader-note">
                            <strong>Leader note:</strong> {step.leaderNote}
                          </p>
                        )}
                        {step.watchOut && (
                          <p className="timeline-watch-out">
                            <strong>Watch out:</strong> {step.watchOut}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "volunteers" && (
              <div className="tab-content" data-testid="tab-content-volunteers">
                <div className="volunteer-grid">
                  {safeVolunteerPlan.map((role, i) => (
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
                        {safeVolunteerPlan.flatMap((role) =>
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
                  <pre className="email-blurb" data-testid="text-email-blurb">{safeEmailBlurb}</pre>
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

          {/* ── NEW FULL EVENT PACK SECTIONS ───────────────────────── */}

          {/* Strategy Summary */}
          <section className="results-section" data-testid="section-strategy">
            <h2 className="section-heading">Fundraiser Strategy Summary</h2>
            <p className="section-note">
              Tailored to your meal type and event format — what to focus on for a successful event.
            </p>
            <div className="strategy-grid">
              {[
                { label: "Best Fit for This Event", value: safeStrategySummary?.bestFit ?? "—" },
                { label: "Main Profit Driver", value: safeStrategySummary?.mainProfitDriver ?? "—" },
                { label: "Main Execution Risk", value: safeStrategySummary?.mainExecutionRisk ?? "—" },
                { label: "Recommended Focus", value: safeStrategySummary?.recommendedFocus ?? "—" },
              ].map((card, i) => (
                <div key={i} className="strategy-card">
                  <div className="strategy-card-label">{card.label}</div>
                  <p className="strategy-card-value">{card.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Profit Strategy */}
          <section className="results-section" data-testid="section-profit">
            <h2 className="section-heading">Profit Strategy</h2>
            <p className="section-note">
              Pricing recommendations, upsell ideas, and signage language for your event.
            </p>
            <div className="profit-strategy-block">
              <div className="profit-row">
                <div className="profit-row-label">Price Check</div>
                <p className="profit-row-value">{safeProfitStrategy?.priceCheck ?? "—"}</p>
              </div>
              <div className="profit-row">
                <div className="profit-row-label">Recommended Pricing Model</div>
                <p className="profit-row-value">{safeProfitStrategy?.pricingModel ?? "—"}</p>
              </div>
              <div className="profit-row">
                <div className="profit-row-label">Upsell Ideas</div>
                <ul className="profit-upsell-list">
                  {safeProfitStrategy?.upsellIdeas?.map((idea, i) => (
                    <li key={i}>{idea}</li>
                  )) ?? null}
                </ul>
              </div>
              <div className="profit-row">
                <div className="profit-row-label">Donation Table Note</div>
                <p className="profit-row-value">{safeProfitStrategy?.donationTableNote ?? "—"}</p>
              </div>
              <div className="profit-row">
                <div className="profit-row-label">Suggested Signage</div>
                <div className="profit-signage-list">
                  {safeProfitStrategy?.signageLines?.map((line, i) => (
                    <div key={i} className="profit-signage-item">{line}</div>
                  )) ?? null}
                </div>
              </div>
            </div>
          </section>

          {/* Volunteer Briefing */}
          <section className="results-section" data-testid="section-briefing">
            <h2 className="section-heading">Volunteer Briefing Script</h2>
            <p className="section-note">
              Read this aloud to your whole team before doors open. Copy it to share in advance.
            </p>
            <div className="briefing-wrap">
              <pre className="briefing-pre" data-testid="text-briefing">{safeVolunteerBriefing}</pre>
              <button
                onClick={() => copyText("briefing", safeVolunteerBriefing)}
                className={`copy-btn ${copiedKey === "briefing" ? "copy-btn--copied" : ""}`}
                data-testid="button-copy-briefing"
              >
                {copiedKey === "briefing"
                  ? <><CheckCircle2 className="w-4 h-4 mr-1" /> Copied!</>
                  : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
              </button>
            </div>
          </section>

          {/* Setup Layout */}
          <section className="results-section" data-testid="section-setup">
            <h2 className="section-heading">Event Setup Layout</h2>
            <p className="section-note">
              Station-by-station layout for your meal type. Walk this with your Setup Crew before guests arrive.
            </p>
            <div className="setup-stations">
              {safeSetupLayout.map((station, i) => (
                <div key={i} className="setup-station" data-testid={`setup-station-${i}`}>
                  <div className="setup-station-pos">{station.position}</div>
                  <div>
                    <div className="setup-station-label">{station.label}</div>
                    <div className="setup-station-detail">{station.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Communication Pack */}
          <section className="results-section" data-testid="section-comms">
            <h2 className="section-heading">Parent & Student Communication Pack</h2>
            <p className="section-note">
              Four ready-to-copy messages for your event. Click Copy on any message to use it.
            </p>
            <div className="comms-grid">
              {([
                { key: "announcement", label: "Event Announcement", text: safeCommsPack?.announcement ?? "" },
                { key: "volunteerRequest", label: "Volunteer Request", text: safeCommsPack?.volunteerRequest ?? "" },
                { key: "dayBefore", label: "Day-Before Reminder", text: safeCommsPack?.dayBeforeReminder ?? "" },
                { key: "thankYou", label: "Thank-You Message", text: safeCommsPack?.thankYou ?? "" },
              ]).map(({ key, label, text }) => (
                <div key={key} className="comms-block" data-testid={`comms-block-${key}`}>
                  <div className="comms-block-title">{label}</div>
                  <pre className="comms-pre">{text}</pre>
                  <button
                    onClick={() => copyText(key, text)}
                    className={`copy-btn ${copiedKey === key ? "copy-btn--copied" : ""}`}
                    data-testid={`button-copy-${key}`}
                  >
                    {copiedKey === key
                      ? <><CheckCircle2 className="w-4 h-4 mr-1" /> Copied!</>
                      : <><Copy className="w-4 h-4 mr-1" /> Copy</>}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Leftover Plan */}
          <section className="results-section" data-testid="section-leftovers">
            <h2 className="section-heading">Leftover Food Plan</h2>
            <p className="section-note">
              Food safety guidance specific to your meal type. Review this with your Adult Volunteers before the event.
            </p>
            <div className="leftover-grid">
              <div className="leftover-block">
                <div className="leftover-block-title">Can Be Saved</div>
                <ul className="leftover-list leftover-list--save">
                  {(safeLeftoverPlan?.canSave ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="leftover-block leftover-block--discard">
                <div className="leftover-block-title">Must Be Discarded</div>
                <ul className="leftover-list leftover-list--discard">
                  {(safeLeftoverPlan?.discard ?? []).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="leftover-block">
                <div className="leftover-block-title">How to Package</div>
                <p className="leftover-text">{safeLeftoverPlan?.packaging ?? "—"}</p>
              </div>
              <div className="leftover-block">
                <div className="leftover-block-title">Who Makes the Call</div>
                <p className="leftover-text">{safeLeftoverPlan?.whoDecides ?? "—"}</p>
              </div>
            </div>
          </section>

          {/* Risk Plan with Fixes */}
          {safeRiskPlan.length > 0 && (
            <section className="results-section" data-testid="section-risk-plan">
              <h2 className="section-heading">Risk Plan</h2>
              <p className="section-note">
                Every risk flag for your event, paired with a specific, actionable fix.
              </p>
              <div className="risk-plan-list">
                {safeRiskPlan.map((item, i) => (
                  <div key={i} className={`risk-plan-item risk-plan-item--${item.level}`} data-testid={`risk-plan-${i}`}>
                    <div className="risk-plan-warning">
                      <span className="warning-icon">
                        {item.level === "error" ? <AlertCircle className="w-5 h-5 text-destructive" /> :
                         item.level === "warning" ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
                         <Info className="w-5 h-5 text-blue-500" />}
                      </span>
                      <span className="text-sm font-medium">{item.warning}</span>
                    </div>
                    <div className="risk-plan-fix">
                      <span className="risk-fix-label">Fix</span>
                      <p className="risk-fix-text">{item.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pricing Sensitivity Calculator */}
          <section className="results-section sensitivity-section" data-testid="section-sensitivity">
            <h2 className="section-heading">Pricing Sensitivity</h2>
            <p className="section-note">
              Try a different suggested donation or meal price to see how your fundraiser estimate changes.
              This is what-if math — it does not change your saved plan.
            </p>

            <div className="sensitivity-quick-btns">
              {[5, 7, 10, 12, 15].map((p) => (
                <button
                  key={p}
                  className={`sensitivity-quick-btn${sensitivityPrice === p ? " sensitivity-quick-btn--active" : ""}`}
                  onClick={() => setSensitivityPrice(p)}
                  data-testid={`sensitivity-quick-${p}`}
                >
                  ${p}
                </button>
              ))}
            </div>

            <div className="sensitivity-input-row">
              <label className="sensitivity-label" htmlFor="sensitivity-price">
                Suggested donation / meal price
              </label>
              <div className="sensitivity-input-wrap">
                <span className="sensitivity-currency">$</span>
                <input
                  id="sensitivity-price"
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={sensitivityPrice}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v >= 0) setSensitivityPrice(v);
                  }}
                  className="sensitivity-input"
                  data-testid="sensitivity-price-input"
                />
                <span className="sensitivity-per">per person</span>
              </div>
            </div>

            {(() => {
              const att = safeAttendance || 1;
              const sensRevenue = sensitivityPrice * att;
              const sensProfitLow = sensRevenue - safeCostRange[1];
              const sensProfitHigh = sensRevenue - safeCostRange[0];
              const sensProfitPerGuestMid = ((sensProfitLow + sensProfitHigh) / 2) / att;
              const breakEvenLow = sensitivityPrice > 0 ? Math.ceil(safeCostRange[0] / sensitivityPrice) : null;
              const breakEvenHigh = sensitivityPrice > 0 ? Math.ceil(safeCostRange[1] / sensitivityPrice) : null;
              const profitColor =
                sensProfitHigh < 0 ? "loss" : sensProfitLow < 0 ? "risky" : "good";
              const guidanceLevel =
                sensProfitPerGuestMid < 3 ? "low" : sensProfitPerGuestMid > 7 ? "high" : "mid";
              const guidanceText = {
                low: "This may be too low unless your goal is accessibility over profit.",
                mid: "This is a moderate margin for a simple fundraiser.",
                high: "This may be strong, but make sure the price feels reasonable for your audience.",
              }[guidanceLevel];

              return (
                <>
                  <div className="sensitivity-cards">
                    <div className="sensitivity-card">
                      <div className="sensitivity-card-label">Expected Revenue</div>
                      <div className="sensitivity-card-value">{fmt(sensRevenue)}</div>
                      <div className="sensitivity-card-note">{att} guests × ${sensitivityPrice}</div>
                    </div>
                    <div className="sensitivity-card">
                      <div className="sensitivity-card-label">Est. Food Cost</div>
                      <div className="sensitivity-card-value">{fmt(safeCostRange[0])} – {fmt(safeCostRange[1])}</div>
                      <div className="sensitivity-card-note">Unchanged from your plan</div>
                    </div>
                    <div className="sensitivity-card">
                      <div className="sensitivity-card-label">Est. Net Profit</div>
                      <div className={`sensitivity-card-value sensitivity-card-value--${profitColor}`}>
                        {fmt(sensProfitLow)} – {fmt(sensProfitHigh)}
                      </div>
                      <div className="sensitivity-card-note">
                        ~{fmt(sensProfitPerGuestMid)} per guest
                      </div>
                    </div>
                  </div>
                  <p className={`sensitivity-guidance sensitivity-guidance--${guidanceLevel}`} data-testid="sensitivity-guidance">
                    {guidanceText}
                  </p>
                  <div className="sensitivity-breakeven" data-testid="sensitivity-breakeven">
                    <div className="sensitivity-breakeven-value">
                      {breakEvenLow !== null && breakEvenHigh !== null
                        ? `Break-even: ${breakEvenLow}–${breakEvenHigh} paying guests`
                        : "Enter a price to calculate break-even."}
                    </div>
                    <div className="sensitivity-breakeven-note">
                      This is the estimated number of paying guests needed to cover food and supplies before the fundraiser begins making money.
                    </div>
                  </div>
                </>
              );
            })()}
          </section>

          {/* Bottom CTA */}
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
