import { useState } from "react";
import { useLocation, Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, Lightbulb } from "lucide-react";
import {
  getRecommendations,
  type QuizAnswers, type AttendanceRange, type AudienceType,
  type EventTime, type VolunteerAdults, type VolunteerStudents,
  type EquipmentItem, type PriorityItem, type ConstraintItem,
  type MealRecommendation,
} from "@/lib/ideaFinder";
import type { OrgType } from "@/lib/types";

// ── Quiz state ────────────────────────────────────────────────
interface QuizState {
  orgType: OrgType | null;
  attendance: AttendanceRange | null;
  audience: AudienceType | null;
  timeOfEvent: EventTime | null;
  adultVolunteers: VolunteerAdults | null;
  studentHelpers: VolunteerStudents | null;
  equipment: EquipmentItem[];
  priorities: PriorityItem[];
  constraints: ConstraintItem[];
  constraintsDone: boolean;
}

const TOTAL_STEPS = 8;

// ── Helpers ───────────────────────────────────────────────────
function MetaBadge({ label, value, variant }: { label: string; value: string; variant: "green" | "amber" | "red" | "blue" }) {
  const colors = {
    green: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800",
    amber: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    red:   "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
    blue:  "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  };
  return (
    <div className={`quiz-meta-badge border rounded-lg px-3 py-2 text-center ${colors[variant]}`}>
      <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function difficultyVariant(d: string): "green" | "amber" | "red" {
  return d === "Easy" ? "green" : d === "Moderate" ? "amber" : "red";
}
function profitVariant(p: string): "green" | "amber" | "red" {
  return p === "High" ? "green" : p === "Medium" ? "amber" : "red";
}
function volVariant(v: string): "green" | "amber" | "red" {
  return v === "Low" ? "green" : v === "Medium" ? "amber" : "red";
}

// ── Main Page ─────────────────────────────────────────────────
export default function IdeaFinderPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [showResults, setShowResults] = useState(false);
  const [quiz, setQuiz] = useState<QuizState>({
    orgType: null,
    attendance: null,
    audience: null,
    timeOfEvent: null,
    adultVolunteers: null,
    studentHelpers: null,
    equipment: [],
    priorities: [],
    constraints: [],
    constraintsDone: false,
  });

  // ── Navigation helpers ──────────────────────────────────────
  const canContinue = (): boolean => {
    switch (step) {
      case 1: return quiz.orgType !== null;
      case 2: return quiz.attendance !== null;
      case 3: return quiz.audience !== null;
      case 4: return quiz.timeOfEvent !== null;
      case 5: return quiz.adultVolunteers !== null && quiz.studentHelpers !== null;
      case 6: return quiz.equipment.length > 0;
      case 7: return quiz.priorities.length > 0;
      case 8: return quiz.constraints.length > 0 || quiz.constraintsDone;
      default: return false;
    }
  };

  const goNext = () => {
    if (!canContinue()) return;
    if (step === TOTAL_STEPS) {
      setShowResults(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (showResults) {
      setShowResults(false);
    } else {
      setStep((s) => Math.max(1, s - 1));
    }
  };

  // ── Multi-select toggles ────────────────────────────────────
  const toggleEquipment = (item: EquipmentItem) => {
    setQuiz((q) => {
      if (item === "no-kitchen") {
        return { ...q, equipment: q.equipment.includes("no-kitchen") ? [] : ["no-kitchen"] };
      }
      const without = q.equipment.filter((e) => e !== "no-kitchen");
      return {
        ...q,
        equipment: without.includes(item) ? without.filter((e) => e !== item) : [...without, item],
      };
    });
  };

  const togglePriority = (item: PriorityItem) => {
    setQuiz((q) => ({
      ...q,
      priorities: q.priorities.includes(item)
        ? q.priorities.filter((p) => p !== item)
        : [...q.priorities, item],
    }));
  };

  const toggleConstraint = (item: ConstraintItem) => {
    setQuiz((q) => ({
      ...q,
      constraints: q.constraints.includes(item)
        ? q.constraints.filter((c) => c !== item)
        : [...q.constraints, item],
      constraintsDone: false,
    }));
  };

  const selectNoneConstraint = () => {
    setQuiz((q) => ({ ...q, constraints: [], constraintsDone: true }));
  };

  // ── Build this plan ─────────────────────────────────────────
  const handleBuildPlan = (rec: MealRecommendation) => {
    const payload = { formData: rec.defaultFormData, mealName: rec.mealName };
    sessionStorage.setItem("ffm_idea_prefill", JSON.stringify(payload));
    setLocation("/planner");
  };

  // ── Compute recommendations (only when showing results) ─────
  const recommendations = showResults && quiz.orgType && quiz.attendance && quiz.audience &&
    quiz.timeOfEvent && quiz.adultVolunteers && quiz.studentHelpers
    ? getRecommendations({
        orgType: quiz.orgType,
        attendance: quiz.attendance,
        audience: quiz.audience,
        timeOfEvent: quiz.timeOfEvent,
        adultVolunteers: quiz.adultVolunteers,
        studentHelpers: quiz.studentHelpers,
        equipment: quiz.equipment,
        priorities: quiz.priorities,
        constraints: quiz.constraints,
      } as QuizAnswers)
    : [];

  // ── Option button helper ────────────────────────────────────
  function OptionBtn({ label, sub, active, onClick }: {
    label: string; sub?: string; active: boolean; onClick: () => void;
  }) {
    return (
      <button
        type="button"
        className={`quiz-option ${active ? "quiz-option--active" : ""}`}
        onClick={onClick}
      >
        <span className="quiz-option-label">{label}</span>
        {sub && <span className="quiz-option-sub">{sub}</span>}
        {active && <Check className="quiz-option-check w-4 h-4" />}
      </button>
    );
  }

  // ── Render step content ─────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <h2 className="quiz-question">What type of organization are you fundraising for?</h2>
            <div className="quiz-option-grid quiz-option-grid--2col">
              {(["Church", "School", "Sports Team", "Nonprofit", "Other"] as OrgType[]).map((opt) => (
                <OptionBtn key={opt} label={opt} active={quiz.orgType === opt}
                  onClick={() => setQuiz((q) => ({ ...q, orgType: opt }))} />
              ))}
            </div>
          </>
        );

      case 2:
        return (
          <>
            <h2 className="quiz-question">How many guests do you expect?</h2>
            <div className="quiz-option-grid quiz-option-grid--2col">
              {([
                { val: "under75" as AttendanceRange, label: "Under 75" },
                { val: "75-150" as AttendanceRange, label: "75 – 150" },
                { val: "150-250" as AttendanceRange, label: "150 – 250" },
                { val: "250plus" as AttendanceRange, label: "250+ guests" },
              ]).map(({ val, label }) => (
                <OptionBtn key={val} label={label} active={quiz.attendance === val}
                  onClick={() => setQuiz((q) => ({ ...q, attendance: val }))} />
              ))}
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 className="quiz-question">Who is your audience?</h2>
            <div className="quiz-option-grid quiz-option-grid--1col">
              {([
                { val: "mostly-kids" as AudienceType, label: "Mostly kids or students", sub: "More than half your crowd is under 18" },
                { val: "mostly-adults" as AudienceType, label: "Mostly adults", sub: "Most guests are adults or parents" },
                { val: "mixed" as AudienceType, label: "Mixed crowd", sub: "A real mix of kids and adults" },
              ]).map(({ val, label, sub }) => (
                <OptionBtn key={val} label={label} sub={sub} active={quiz.audience === val}
                  onClick={() => setQuiz((q) => ({ ...q, audience: val }))} />
              ))}
            </div>
          </>
        );

      case 4:
        return (
          <>
            <h2 className="quiz-question">When is your event?</h2>
            <div className="quiz-option-grid quiz-option-grid--1col">
              {([
                { val: "breakfast" as EventTime, label: "Breakfast", sub: "Morning event, before noon" },
                { val: "lunch" as EventTime, label: "Lunch", sub: "Midday, roughly noon – 2pm" },
                { val: "dinner" as EventTime, label: "Dinner", sub: "Evening, roughly 5pm – 8pm" },
                { val: "after-church-school" as EventTime, label: "After church or school", sub: "Late morning or early afternoon" },
                { val: "during-event" as EventTime, label: "During a larger event", sub: "A game, fair, festival, or gathering" },
              ]).map(({ val, label, sub }) => (
                <OptionBtn key={val} label={label} sub={sub} active={quiz.timeOfEvent === val}
                  onClick={() => setQuiz((q) => ({ ...q, timeOfEvent: val }))} />
              ))}
            </div>
          </>
        );

      case 5:
        return (
          <>
            <h2 className="quiz-question">How many volunteers do you expect?</h2>
            <div className="quiz-sub-question">
              <p className="quiz-sub-label">Adult volunteers</p>
              <div className="quiz-option-grid quiz-option-grid--4col">
                {([
                  { val: "0-2" as VolunteerAdults, label: "0 – 2" },
                  { val: "3-5" as VolunteerAdults, label: "3 – 5" },
                  { val: "6-10" as VolunteerAdults, label: "6 – 10" },
                  { val: "10plus" as VolunteerAdults, label: "10+" },
                ]).map(({ val, label }) => (
                  <OptionBtn key={val} label={label} active={quiz.adultVolunteers === val}
                    onClick={() => setQuiz((q) => ({ ...q, adultVolunteers: val }))} />
                ))}
              </div>
            </div>
            <div className="quiz-sub-question">
              <p className="quiz-sub-label">Students or other helpers</p>
              <div className="quiz-option-grid quiz-option-grid--4col">
                {([
                  { val: "0-3" as VolunteerStudents, label: "0 – 3" },
                  { val: "4-8" as VolunteerStudents, label: "4 – 8" },
                  { val: "9-15" as VolunteerStudents, label: "9 – 15" },
                  { val: "16plus" as VolunteerStudents, label: "16+" },
                ]).map(({ val, label }) => (
                  <OptionBtn key={val} label={label} active={quiz.studentHelpers === val}
                    onClick={() => setQuiz((q) => ({ ...q, studentHelpers: val }))} />
                ))}
              </div>
            </div>
          </>
        );

      case 6:
        return (
          <>
            <h2 className="quiz-question">What equipment will you have available?</h2>
            <p className="quiz-step-hint">Select all that apply. Selecting "No kitchen equipment" means you have none of the above.</p>
            <div className="quiz-option-grid quiz-option-grid--2col">
              {([
                { val: "kitchen" as EquipmentItem, label: "Kitchen space", sub: "Stovetop, sink, counter space" },
                { val: "oven" as EquipmentItem, label: "Oven", sub: "Standard or commercial oven" },
                { val: "grill" as EquipmentItem, label: "Grill", sub: "Charcoal, gas, or electric" },
                { val: "large-pots" as EquipmentItem, label: "Large pots", sub: "Stockpots for boiling pasta, etc." },
                { val: "warmers" as EquipmentItem, label: "Warmers or roasters", sub: "Electric roasters, chafing dishes" },
                { val: "fridge" as EquipmentItem, label: "Refrigerator / cooler", sub: "Cold storage for prepped ingredients" },
                { val: "no-kitchen" as EquipmentItem, label: "No kitchen equipment", sub: "We're working from scratch outdoors" },
              ]).map(({ val, label, sub }) => (
                <OptionBtn key={val} label={label} sub={sub}
                  active={quiz.equipment.includes(val)}
                  onClick={() => toggleEquipment(val)} />
              ))}
            </div>
          </>
        );

      case 7:
        return (
          <>
            <h2 className="quiz-question">What matters most to your team?</h2>
            <p className="quiz-step-hint">Select all that apply.</p>
            <div className="quiz-option-grid quiz-option-grid--2col">
              {([
                { val: "lowest-cost" as PriorityItem, label: "Lowest food cost", sub: "Maximize budget efficiency" },
                { val: "easiest" as PriorityItem, label: "Easiest to run", sub: "Minimize stress and coordination" },
                { val: "highest-profit" as PriorityItem, label: "Highest profit potential", sub: "Maximize fundraising goal" },
                { val: "fastest-serving" as PriorityItem, label: "Fastest serving line", sub: "Keep wait times short" },
                { val: "kid-friendly" as PriorityItem, label: "Kid-friendly", sub: "Works well for young guests" },
                { val: "adult-friendly" as PriorityItem, label: "Adult-friendly", sub: "Appeals to adult donors" },
              ]).map(({ val, label, sub }) => (
                <OptionBtn key={val} label={label} sub={sub}
                  active={quiz.priorities.includes(val)}
                  onClick={() => togglePriority(val)} />
              ))}
            </div>
          </>
        );

      case 8:
        return (
          <>
            <h2 className="quiz-question">Any constraints we should know about?</h2>
            <p className="quiz-step-hint">Select all that apply, or choose "None of these."</p>
            <div className="quiz-option-grid quiz-option-grid--1col">
              {([
                { val: "no-cooking" as ConstraintItem, label: "No cooking onsite", sub: "Food must be pre-cooked or served cold" },
                { val: "limited-prep" as ConstraintItem, label: "Limited prep time", sub: "Less than 60 minutes before serving" },
                { val: "limited-adults" as ConstraintItem, label: "Limited adult supervision", sub: "Fewer than 3 adults available" },
                { val: "grab-and-go" as ConstraintItem, label: "Need grab-and-go format", sub: "Guests won't be seated; portable food needed" },
                { val: "vegetarian" as ConstraintItem, label: "Need a vegetarian option", sub: "Some guests don't eat meat" },
              ]).map(({ val, label, sub }) => (
                <OptionBtn key={val} label={label} sub={sub}
                  active={quiz.constraints.includes(val)}
                  onClick={() => { toggleConstraint(val); }} />
              ))}
              <OptionBtn
                label="None of these"
                sub="We don't have any of the above constraints"
                active={quiz.constraintsDone && quiz.constraints.length === 0}
                onClick={selectNoneConstraint}
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  // ── Results view ────────────────────────────────────────────
  if (showResults) {
    return (
      <div className="idea-finder-page" data-testid="idea-finder-results">
        <div className="idea-finder-header">
          <Link href="/" className="back-link"><ArrowLeft className="w-4 h-4 mr-1" /> Back to home</Link>
          <h1 className="idea-finder-title">Your Fundraiser Recommendations</h1>
          <p className="idea-finder-sub">
            Based on your answers, here are the meals that may work well for your event.
            Adjust for your group, volunteers, equipment, store prices, and local context.
          </p>
        </div>

        <div className="idea-results-wrap" data-testid="idea-results">
          {recommendations.map((rec, i) => (
            <div key={rec.mealKey} className="rec-card" data-testid={`rec-card-${rec.mealKey}`}>
              <div className="rec-header">
                <span className={`rec-rank-badge rec-rank-badge--${i}`}>{rec.rankLabel}</span>
                <div className="rec-title">
                  <span className="rec-emoji" aria-hidden="true">{rec.emoji}</span>
                  <span className="rec-name">{rec.mealName}</span>
                </div>
              </div>

              <p className="rec-why">{rec.whyThisFits}</p>

              <div className="rec-meta-grid">
                <MetaBadge label="Difficulty" value={rec.difficulty} variant={difficultyVariant(rec.difficulty)} />
                <MetaBadge label="Profit Potential" value={rec.profitPotential} variant={profitVariant(rec.profitPotential)} />
                <MetaBadge label="Volunteer Need" value={rec.volunteerNeed} variant={volVariant(rec.volunteerNeed)} />
              </div>

              <div className="rec-lists">
                <div className="rec-list-block">
                  <p className="rec-list-title">Equipment needed</p>
                  <ul className="rec-list">
                    {rec.equipment.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                </div>
                <div className="rec-list-block">
                  <p className="rec-list-title">Watch out for</p>
                  <ul className="rec-list rec-list--warning">
                    {rec.watchOuts.map((w) => <li key={w}>{w}</li>)}
                  </ul>
                </div>
              </div>

              <div className="rec-cta">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleBuildPlan(rec)}
                  data-testid={`button-build-plan-${rec.mealKey}`}
                >
                  Build This Plan <ArrowRight className="ml-2 w-4 h-4" />
                </button>
                <p className="rec-cta-note">
                  Pre-fills the planner with realistic defaults. You can edit every field.
                </p>
              </div>
            </div>
          ))}

          <div className="idea-disclaimer" data-testid="idea-disclaimer">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
            <p>
              These recommendations are planning guidance, not guarantees.
              Adjust for your group, volunteers, equipment, store prices, and local context.
            </p>
          </div>

          <div className="idea-results-nav">
            <button type="button" className="btn-secondary" onClick={goBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Retake Quiz
            </button>
            <Link href="/planner" className="btn-secondary" data-testid="link-planner-manual">
              Build a plan manually
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz view ───────────────────────────────────────────────
  return (
    <div className="idea-finder-page" data-testid="idea-finder-quiz">
      <div className="idea-finder-header">
        <Link href="/" className="back-link"><ArrowLeft className="w-4 h-4 mr-1" /> Back to home</Link>
        <h1 className="idea-finder-title">Find Your Fundraiser</h1>
        <p className="idea-finder-sub">
          Answer {TOTAL_STEPS} quick questions and we'll recommend the best meal for your event.
        </p>
      </div>

      <div className="quiz-container" data-testid="quiz-container">
        {/* Progress */}
        <div className="quiz-progress-wrap">
          <div className="quiz-progress-bar-bg">
            <div
              className="quiz-progress-bar-fill"
              style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
          <span className="quiz-progress-label">Step {step} of {TOTAL_STEPS}</span>
        </div>

        {/* Step content */}
        <div className="quiz-step" data-testid={`quiz-step-${step}`}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="quiz-nav">
          {step > 1 ? (
            <button type="button" className="btn-secondary" onClick={goBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="button"
            className="btn-primary"
            onClick={goNext}
            disabled={!canContinue()}
            data-testid="quiz-next-btn"
          >
            {step === TOTAL_STEPS ? "See Recommendations" : "Continue"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
