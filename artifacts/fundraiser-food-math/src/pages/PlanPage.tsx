import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Loader2 } from "lucide-react";
import type { FundraiserPlan, PlannerFormData } from "@/lib/types";
import ResultsPage from "@/pages/ResultsPage";
import { setUnlocked, savePlanBeforePayment, savePlanId } from "@/lib/unlock";
import { buildSupportMailto } from "@/config/paymentLinks";

// ── /plan/:planId route ───────────────────────────────────────
// Permanent, device-independent access to a purchased plan.
// The database record (fetched via the API) is the source of truth
// for unlock status — localStorage is only refreshed as a convenience
// so the rest of the app (print page, results) behaves as unlocked.

interface PlanPageProps {
  planId: string;
}

type PageState =
  | { status: "loading" }
  | { status: "ready"; plan: FundraiserPlan; formData: PlannerFormData }
  | { status: "paid-no-plan" }
  | { status: "not-found" }
  | { status: "error" };

export default function PlanPage({ planId }: PlanPageProps) {
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [, setLocation] = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/purchases/${encodeURIComponent(planId)}`);
        if (res.status === 404 || res.status === 400) {
          if (!cancelled) setState({ status: "not-found" });
          return;
        }
        if (!res.ok) {
          if (!cancelled) setState({ status: "error" });
          return;
        }
        const data = await res.json();
        // A database record for this id means the purchase is verified —
        // unlock this device and remember the plan id.
        setUnlocked();
        savePlanId(planId);

        if (data.planData && data.formData) {
          const plan = data.planData as FundraiserPlan;
          const formData = data.formData as PlannerFormData;
          // Refresh local copies so /print and /results work on this device.
          savePlanBeforePayment(plan, formData);
          if (!cancelled) setState({ status: "ready", plan, formData });
        } else {
          if (!cancelled) setState({ status: "paid-no-plan" });
        }
      } catch {
        if (!cancelled) setState({ status: "error" });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [planId]);

  if (state.status === "loading") {
    return (
      <div className="success-page" data-testid="plan-page-loading">
        <div className="success-inner">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="success-desc">Loading your plan…</p>
        </div>
      </div>
    );
  }

  if (state.status === "ready") {
    return (
      <ResultsPage
        plan={state.plan}
        formData={state.formData}
        onReset={() => setLocation("/planner")}
      />
    );
  }

  if (state.status === "paid-no-plan") {
    return (
      <div className="success-page" data-testid="plan-page-no-plan">
        <div className="success-inner">
          <div className="success-icon success-icon--ok">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h1 className="success-title">Your purchase is confirmed.</h1>
          <p className="success-desc">
            Your Full Event Pack is unlocked on this device, but no saved plan was
            attached to this purchase. Rebuild your plan below — it will unlock
            automatically once you reach the results page.
          </p>
          <div className="success-actions">
            <a href="/planner" className="btn-primary" data-testid="button-rebuild-plan">
              Rebuild My Plan
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isNotFound = state.status === "not-found";
  return (
    <div className="success-page" data-testid="plan-page-error">
      <div className="success-inner">
        <div className="success-icon success-icon--warn">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h1 className="success-title success-title--warn">
          {isNotFound ? "We couldn't find this plan." : "Something went wrong loading your plan."}
        </h1>
        <p className="success-desc">
          {isNotFound
            ? "This link doesn't match any purchase on record. Double-check the link from your confirmation, or contact us and we'll help."
            : "Please try again in a moment. If the problem continues, contact us and we'll help."}{" "}
          <a
            href={buildSupportMailto(
              "Full Event Pack \u2014 Plan Link Help",
              `Hi, my plan link isn't working.\n\nPlan link: ${typeof window !== "undefined" ? window.location.href : ""}\nEmail used for payment:\nApproximate payment time:\n\nPlease help me access my plan.`
            )}
            className="success-support-link"
            data-testid="link-support-plan"
          >
            Contact support
          </a>
        </p>
        <div className="success-actions">
          <a href="/planner" className="btn-primary" data-testid="button-go-planner">
            Go to Planner
          </a>
        </div>
      </div>
    </div>
  );
}
