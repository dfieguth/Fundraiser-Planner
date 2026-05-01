import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/LandingPage";
import PlannerPage from "@/pages/PlannerPage";
import ResultsPage from "@/pages/ResultsPage";
import PrintPage from "@/pages/PrintPage";
import NotFound from "@/pages/not-found";
import type { FundraiserPlan, PlannerFormData } from "@/lib/types";
import type { calculatePlan } from "@/lib/calculator";

const queryClient = new QueryClient();

function AppRoutes() {
  const [plan, setPlan] = useState<FundraiserPlan | null>(null);
  const [formData, setFormData] = useState<PlannerFormData | null>(null);
  const [, setLocation] = useState("/");

  const handlePlanReady = (newPlan: ReturnType<typeof calculatePlan>, form: PlannerFormData) => {
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
