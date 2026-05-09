import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/LandingPage";
import PlannerPage from "@/pages/PlannerPage";
import CustomizeMenuPage from "@/pages/CustomizeMenuPage";
import ResultsPage from "@/pages/ResultsPage";
import PrintPage from "@/pages/PrintPage";
import SuccessPage from "@/pages/SuccessPage";
import IdeaFinderPage from "@/pages/IdeaFinderPage";
import NotFound from "@/pages/not-found";
import type { FundraiserPlan, PlannerFormData } from "@/lib/types";
import { calculatePlan } from "@/lib/calculator";
import { getStoredPlan, savePlanBeforePayment } from "@/lib/unlock";
import { USE_STRIPE_TEST_MODE } from "@/config/paymentLinks";

const queryClient = new QueryClient();

// ── Feature flag ──────────────────────────────────────────────
// Set to true to skip the Customize Your Menu screen entirely.
// The screen's code and route are preserved; this flag bypasses them.
const SKIP_CUSTOMIZE_MENU = true;

function AppRoutes() {
  const [plan, setPlan] = useState<FundraiserPlan | null>(null);
  const [formData, setFormData] = useState<PlannerFormData | null>(null);
  const [pendingForm, setPendingForm] = useState<PlannerFormData | null>(null);
  const [, setLocation] = useLocation();

  // On mount, restore plan from localStorage so returning users (e.g. after a
  // Stripe redirect → /success → /results) find their plan in the results page
  // without having to rebuild it.
  useEffect(() => {
    if (!plan) {
      const saved = getStoredPlan();
      if (saved) {
        setPlan(saved.plan);
        setFormData(saved.formData);
      }
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1: PlannerPage submits form → skip Customize Your Menu if flag is set
  const handlePlanReady = (form: PlannerFormData) => {
    if (SKIP_CUSTOMIZE_MENU) {
      const newPlan = calculatePlan(form);
      savePlanBeforePayment(newPlan, form);
      setPlan(newPlan);
      setFormData(form);
      setLocation("/results");
    } else {
      setPendingForm(form);
      setLocation("/customize");
    }
  };

  // Step 2: CustomizeMenuPage confirms → run calculation → navigate to results
  const handleCustomizeConfirm = (form: PlannerFormData) => {
    const newPlan = calculatePlan(form);
    savePlanBeforePayment(newPlan, form);
    setPlan(newPlan);
    setFormData(form);
    setLocation("/results");
  };

  // Back from customize → back to planner
  const handleCustomizeBack = () => {
    setLocation("/planner");
  };

  const handleReset = () => {
    setPlan(null);
    setFormData(null);
    setPendingForm(null);
    setLocation("/planner");
  };

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/planner">
        {() => <PlannerPage onPlanReady={handlePlanReady} />}
      </Route>
      <Route path="/customize">
        {() =>
          pendingForm ? (
            <CustomizeMenuPage
              form={pendingForm}
              onConfirm={handleCustomizeConfirm}
              onBack={handleCustomizeBack}
            />
          ) : (
            <div className="empty-state">
              <h2>No form data found.</h2>
              <p>
                Please <a href="/planner">start from the planner</a> to build your plan.
              </p>
            </div>
          )
        }
      </Route>
      <Route path="/results">
        {() =>
          plan && formData ? (
            <ResultsPage plan={plan} formData={formData} onReset={handleReset} />
          ) : (
            <div className="empty-state">
              <h2>No plan found.</h2>
              <p>
                Your plan may have expired or this page was opened directly.{" "}
                <a href="/planner">Build a plan</a> to get started.
              </p>
            </div>
          )
        }
      </Route>
      <Route path="/print" component={PrintPage} />
      <Route path="/success" component={SuccessPage} />
      <Route path="/idea-finder" component={IdeaFinderPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {USE_STRIPE_TEST_MODE && (
          <div className="test-mode-banner" data-testid="test-mode-banner">
            Test mode: checkout uses Stripe test payments.
          </div>
        )}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
