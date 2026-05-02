import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/LandingPage";
import PlannerPage from "@/pages/PlannerPage";
import ResultsPage from "@/pages/ResultsPage";
import PrintPage from "@/pages/PrintPage";
import SuccessPage from "@/pages/SuccessPage";
import NotFound from "@/pages/not-found";
import type { FundraiserPlan, PlannerFormData } from "@/lib/types";
import type { calculatePlan } from "@/lib/calculator";
import { getStoredPlan, savePlanBeforePayment } from "@/lib/unlock";
import { USE_STRIPE_TEST_MODE } from "@/config/paymentLinks";

const queryClient = new QueryClient();

function AppRoutes() {
  const [plan, setPlan] = useState<FundraiserPlan | null>(null);
  const [formData, setFormData] = useState<PlannerFormData | null>(null);

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
  }, []);

  const handlePlanReady = (newPlan: ReturnType<typeof calculatePlan>, form: PlannerFormData) => {
    // Persist to localStorage before the hard-navigate so the useEffect
    // restore on mount finds the plan even after a full page reload.
    savePlanBeforePayment(newPlan, form);
    setPlan(newPlan);
    setFormData(form);
    window.location.href = "/results";
  };

  const handleReset = () => {
    setPlan(null);
    setFormData(null);
    window.location.href = "/planner";
  };

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/planner">
        {() => <PlannerPage onPlanReady={handlePlanReady} />}
      </Route>
      <Route path="/results">
        {() =>
          plan && formData ? (
            <ResultsPage plan={plan} formData={formData} onReset={handleReset} />
          ) : (
            <div className="empty-state">
              <h2>No plan found.</h2>
              <p>Please <a href="/planner">build a plan first</a>.</p>
            </div>
          )
        }
      </Route>
      <Route path="/print" component={PrintPage} />
      <Route path="/success" component={SuccessPage} />
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
