import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, ArrowLeft, FileText } from "lucide-react";
import { setUnlocked, getStoredPlan, FULL_PACK_UNLOCK_VALUE } from "@/lib/unlock";
import { buildSupportMailto } from "@/config/paymentLinks";

// ── /success route ────────────────────────────────────────────
// Stripe or Gumroad redirects here after payment.
// Configure your payment link's success/redirect URL to:
//   [your-app-url]/success?unlock=full-event-pack
//
// This page reads the ?unlock= param, grants access, and sends
// the user back to their results. No login, no backend call.

type PageState = "unlocked" | "no-plan-after-unlock" | "unconfirmed" | "loading";

export default function SuccessPage() {
  const [state, setState] = useState<PageState>("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const unlockParam = params.get("unlock");

    if (unlockParam === FULL_PACK_UNLOCK_VALUE) {
      // Valid unlock param — grant access and restore saved plan.
      setUnlocked();
      const saved = getStoredPlan();
      if (saved) {
        setState("unlocked");
      } else {
        // Payment succeeded but no plan was saved before the redirect.
        // The unlock is still set — they'll get full access when they rebuild.
        setState("no-plan-after-unlock");
      }
    } else {
      // No valid unlock param — do not grant access.
      setState("unconfirmed");
    }
  }, []);

  if (state === "loading") {
    return <div className="success-page" data-testid="success-page-loading" />;
  }

  if (state === "unlocked") {
    return (
      <div className="success-page" data-testid="success-page-unlocked">
        <div className="success-inner">
          <div className="success-icon success-icon--ok">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="success-title">Your Full Event Pack is unlocked.</h1>
          <p className="success-desc">
            You can now view, print, and use your complete fundraiser plan.
            Your plan has been restored on this device.
          </p>
          <div className="success-actions">
            <a href="/results" className="btn-primary" data-testid="button-return-to-plan">
              Return to My Plan
            </a>
          </div>
          <p className="success-note">
            Your access is saved to this browser. Clear your browser data to reset.
          </p>
        </div>
      </div>
    );
  }

  if (state === "no-plan-after-unlock") {
    return (
      <div className="success-page" data-testid="success-page-no-plan">
        <div className="success-inner">
          <div className="success-icon success-icon--ok">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="success-title">Your purchase was successful.</h1>
          <p className="success-desc">
            Your Full Event Pack is unlocked, but we could not find a saved plan on this
            device. This can happen if you completed payment on a different device or browser.
          </p>
          <p className="success-desc">
            Please rebuild your plan below — it will unlock automatically once you reach
            the results page.
          </p>
          <div className="success-actions">
            <a href="/planner" className="btn-primary" data-testid="button-rebuild-plan">
              <FileText className="w-4 h-4 mr-2" /> Rebuild My Plan
            </a>
          </div>
          <p className="success-note">
            Your access is saved to this browser. Clear your browser data to reset.
          </p>
          <p className="success-note">
            If you have trouble,{" "}
            <a
              href={buildSupportMailto(
                "Full Event Pack \u2014 Plan Not Found",
                "Hi, I purchased the Full Event Pack, but my saved plan was not found after payment.\n\nEvent name:\nEmail used for payment:\nApproximate payment time:\n\nPlease help me unlock or rebuild my plan."
              )}
              className="success-support-link"
              data-testid="link-support-no-plan"
            >
              contact us
            </a>{" "}
            and we'll help.
          </p>
        </div>
      </div>
    );
  }

  // state === "unconfirmed" — no valid unlock param, don't grant anything
  const hasSavedPlan = getStoredPlan() !== null;

  return (
    <div className="success-page" data-testid="success-page-unconfirmed">
      <div className="success-inner">
        <div className="success-icon success-icon--warn">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h1 className="success-title success-title--warn">
          Payment status could not be confirmed from this link.
        </h1>
        <p className="success-desc">
          This page is only accessible after completing a purchase. If you believe you
          already paid,{" "}
          <a
            href={buildSupportMailto(
              "Full Event Pack \u2014 Order Help",
              "Hi, I may have purchased the Full Event Pack, but the app could not confirm my payment link.\n\nEvent name:\nEmail used for payment:\nApproximate payment time:\n\nPlease help me access my full plan."
            )}
            className="success-support-link"
            data-testid="link-support-unconfirmed"
          >
            contact us
          </a>{" "}
          and we'll help unlock your plan.
        </p>
        <div className="success-actions">
          {hasSavedPlan && (
            <a href="/results" className="btn-secondary" data-testid="button-back-results">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
            </a>
          )}
          <a href="/planner" className="btn-primary" data-testid="button-go-to-planner">
            Go to Planner
          </a>
        </div>
      </div>
    </div>
  );
}
