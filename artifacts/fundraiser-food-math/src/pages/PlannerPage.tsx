import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PlannerFormData, MealType, OrgType, StorePreference } from "@/lib/types";
import { SAMPLE_TEMPLATES } from "@/lib/sampleTemplates";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// ── Schema ───────────────────────────────────────────────────
const schema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  orgType: z.enum(["Church", "School", "Sports Team", "Nonprofit", "Other"]),
  mealType: z.enum([
    "hotdogs", "burgers", "bakedPotatoes", "breakfastBurritos",
    "tacos", "spaghetti", "pancakes", "custom",
    "combo_hotdogs_potatoes", "combo_burgers_chips", "combo_pancakes_sausage",
  ]),
  attendance: z.coerce.number().min(10, "Minimum 10 guests").max(5000, "Max 5000"),
  mealPrice: z.coerce.number().min(0.5, "Price must be at least $0.50"),
  adultPercent: z.coerce.number().min(0).max(100),
  kidPercent: z.coerce.number().min(0).max(100),
  storePreference: z.enum(["Costco", "Sam's Club", "Walmart", "Smart & Final", "Aldi", "Local Grocery", "Mixed"]),
  prepStartTime: z.string().min(1, "Prep start time is required"),
  serveStartTime: z.string().min(1, "Serve start time is required"),
  serveEndTime: z.string().min(1, "Serve end time is required"),
  adultVolunteers: z.coerce.number().min(0),
  studentVolunteers: z.coerce.number().min(0),
  notes: z.string().optional(),
  customMealName: z.string().optional(),
  customServingSize: z.string().optional(),
  customIngredients: z.string().optional(),
  customMenuMainDish: z.string().optional(),
  customMenuSides: z.array(z.string()).optional(),
  customMenuDrinks: z.array(z.string()).optional(),
  customMenuDesserts: z.array(z.string()).optional(),
  customMenuDietary: z.array(z.string()).optional(),
  // Pricing model
  pricingModel: z.enum(["flat", "split"]).optional(),
  individualPrice: z.coerce.number().min(0.5).optional(),
  familyPrice: z.coerce.number().min(1).optional(),
  individualPercent: z.coerce.number().min(0).max(100).optional(),
  donationRate: z.coerce.number().min(0).max(100).optional(),
  // Attendance range mode
  attendanceMode: z.enum(["exact", "estimate"]).optional(),
  attendanceLow: z.coerce.number().min(10).max(5000).optional(),
  attendanceHigh: z.coerce.number().min(10).max(5000).optional(),
});

// ── Meal option groups ────────────────────────────────────────
const COMBO_OPTIONS: { value: MealType; label: string; emoji: string; desc: string }[] = [
  { value: "combo_hotdogs_potatoes", label: "Hot Dogs + Baked Potatoes", emoji: "🌭🥔", desc: "A crowd-pleasing outdoor classic" },
  { value: "combo_burgers_chips",    label: "Burgers + Chips",           emoji: "🍔🥔", desc: "Cookout-style with a crispy side" },
  { value: "combo_pancakes_sausage", label: "Pancakes + Sausage",        emoji: "🥞🍳", desc: "Perfect for a morning fundraiser" },
];

const INDIVIDUAL_OPTIONS: { value: MealType; label: string; emoji: string; desc: string }[] = [
  { value: "hotdogs",          label: "Hot Dogs",          emoji: "🌭", desc: "Easy to grill at scale" },
  { value: "burgers",          label: "Burgers",           emoji: "🍔", desc: "Great for outdoor events" },
  { value: "bakedPotatoes",    label: "Baked Potatoes",    emoji: "🥔", desc: "Topping-bar format" },
  { value: "breakfastBurritos",label: "Breakfast Burritos",emoji: "🌯", desc: "Popular morning fundraiser" },
  { value: "tacos",            label: "Tacos",             emoji: "🌮", desc: "Build-your-own taco bar" },
  { value: "spaghetti",        label: "Spaghetti",         emoji: "🍝", desc: "Classic sit-down dinner" },
  { value: "pancakes",         label: "Pancakes",          emoji: "🥞", desc: "Griddle-based breakfast" },
];

const ALL_MEAL_LABELS: Record<string, string> = {
  hotdogs: "Hot Dogs", burgers: "Burgers", bakedPotatoes: "Baked Potatoes",
  breakfastBurritos: "Breakfast Burritos", tacos: "Tacos", spaghetti: "Spaghetti",
  pancakes: "Pancakes", custom: "Custom Meal",
  combo_hotdogs_potatoes: "Hot Dogs + Baked Potatoes",
  combo_burgers_chips: "Burgers + Chips",
  combo_pancakes_sausage: "Pancakes + Sausage",
};

const ORG_TYPES: OrgType[] = ["Church", "School", "Sports Team", "Nonprofit", "Other"];
const STORE_PREFS: StorePreference[] = ["Costco", "Sam's Club", "Walmart", "Smart & Final", "Aldi", "Local Grocery", "Mixed"];

// ── Custom menu checkbox options ──────────────────────────────
const SIDES_OPTIONS    = [
  { value: "rolls",    label: "Rolls / Bread" },
  { value: "chips",    label: "Chips" },
  { value: "salad",    label: "Salad" },
  { value: "mac",      label: "Mac & Cheese" },
  { value: "coleslaw", label: "Coleslaw" },
  { value: "other",    label: "Other" },
];
const DRINKS_OPTIONS   = [
  { value: "water",    label: "Water" },
  { value: "lemonade", label: "Lemonade" },
  { value: "coffee",   label: "Coffee" },
  { value: "soda",     label: "Soda" },
  { value: "none",     label: "No drinks" },
];
const DESSERTS_OPTIONS = [
  { value: "cookies",  label: "Cookies" },
  { value: "brownies", label: "Brownies" },
  { value: "cake",     label: "Cake" },
  { value: "none",     label: "No desserts" },
];
const DIETARY_OPTIONS  = [
  { value: "vegetarian",  label: "Vegetarian option" },
  { value: "glutenFree",  label: "Gluten-free option" },
  { value: "nutAllergy",  label: "Nut allergy awareness" },
];

// ── Default form values ───────────────────────────────────────
const DEFAULT_VALUES: PlannerFormData = {
  orgType: "Church",
  mealType: "hotdogs",
  attendance: 100,
  mealPrice: 10,
  adultPercent: 70,
  kidPercent: 30,
  storePreference: "Mixed",
  prepStartTime: "10:00",
  serveStartTime: "12:00",
  serveEndTime: "14:00",
  adultVolunteers: 8,
  studentVolunteers: 4,
  notes: "",
  eventName: "",
  customMealName: "",
  customServingSize: "",
  customIngredients: "",
  customMenuMainDish: "",
  customMenuSides: [],
  customMenuDrinks: [],
  customMenuDesserts: [],
  customMenuDietary: [],
  pricingModel: "flat",
  individualPrice: 5,
  familyPrice: 15,
  individualPercent: 40,
  donationRate: 75,
  attendanceMode: "exact",
  attendanceLow: 80,
  attendanceHigh: 120,
};

interface PlannerPageProps {
  onPlanReady: (form: PlannerFormData) => void;
}

// ── Checkbox toggle helper ────────────────────────────────────
function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

export default function PlannerPage({ onPlanReady }: PlannerPageProps) {
  // Internal step: 1=Event Info, 2=Tell Us About Your Menu (custom only), 3=Timing, 4=Review
  const [step, setStep] = useState(1);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const form = useForm<PlannerFormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
    mode: "onChange",
  });

  const [ideaPreFillLabel, setIdeaPreFillLabel] = useState<string | null>(null);

  // On mount: check sessionStorage for Idea Finder pre-fill
  useEffect(() => {
    const raw = sessionStorage.getItem("ffm_idea_prefill");
    if (raw) {
      try {
        const { formData, mealName } = JSON.parse(raw) as { formData: PlannerFormData; mealName: string };
        form.reset({ ...DEFAULT_VALUES, ...formData });
        setIdeaPreFillLabel(mealName);
        sessionStorage.removeItem("ffm_idea_prefill");
      } catch {
        // ignore malformed data
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mealType = form.watch("mealType");
  const isCustomMeal = mealType === "custom";

  // Step labels — dynamic based on whether custom meal is selected
  const stepLabels = isCustomMeal
    ? ["Event Info", "Your Menu", "Timing & Volunteers", "Review & Submit"]
    : ["Event Info", "Timing & Volunteers", "Review & Submit"];

  // Map internal step → display index (0-based) for progress bar
  const displayStepIndex = (() => {
    if (isCustomMeal) return step - 1;        // 1→0, 2→1, 3→2, 4→3
    if (step === 1) return 0;
    if (step === 3) return 1;
    return 2;                                  // step 4
  })();

  const handleSelectTemplate = (templateId: string) => {
    const template = SAMPLE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    form.reset({ ...DEFAULT_VALUES, ...template.formData });
    setActiveTemplateId(templateId);
    const formEl = document.querySelector("[data-testid='planner-form']");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearTemplate = () => {
    form.reset(DEFAULT_VALUES);
    setActiveTemplateId(null);
  };

  const pricingModel = form.watch("pricingModel");
  const attendanceMode = form.watch("attendanceMode");

  const onSubmit = (data: PlannerFormData) => {
    onPlanReady(data);
  };

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await form.trigger([
        "eventName", "orgType", "mealType", "attendance", "mealPrice",
        "adultPercent", "kidPercent", "storePreference", "notes",
      ]);
      if (!isValid) return;
      // Custom meal: go to menu details step; otherwise jump to timing
      setStep(isCustomMeal ? 2 : 3);
    } else if (step === 2) {
      // Tell Us About Your Menu — no required fields, just continue
      setStep(3);
    } else if (step === 3) {
      const isValid = await form.trigger([
        "prepStartTime", "serveStartTime", "serveEndTime",
        "adultVolunteers", "studentVolunteers",
      ]);
      if (!isValid) return;
      setStep(4);
    }
  };

  const prevStep = () => {
    if (step === 2) { setStep(1); return; }
    if (step === 3) { setStep(isCustomMeal ? 2 : 1); return; }
    if (step === 4) { setStep(3); return; }
  };

  const activeTemplate = SAMPLE_TEMPLATES.find((t) => t.id === activeTemplateId);

  return (
    <div className="planner-page" data-testid="planner-page">
      <div className="planner-header">
        <Link href="/" className="back-link" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to home
        </Link>
        <h1 className="planner-title">Build Your Fundraiser Plan</h1>
        <p className="planner-sub">Fill in the details below and we'll handle the math.</p>

        {/* Progress */}
        <div className="progress-bar-wrap">
          {stepLabels.map((label, i) => (
            <div key={label} className={`progress-step ${i <= displayStepIndex ? "progress-step--active" : ""}`}>
              <div className="progress-dot">
                {i < displayStepIndex ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="progress-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sample Templates Picker ───────────────────────────── */}
      <div className="template-picker" data-testid="template-picker">
        <div className="template-picker-intro">
          <h2 className="template-picker-heading">Start with a sample</h2>
          <p className="template-picker-note">
            Choose a common fundraiser scenario and edit it to match your event.
            Samples are starting points — adjust attendance, volunteers, pricing, and timing for your actual event.
          </p>
        </div>

        <div className="template-grid" data-testid="template-grid">
          {SAMPLE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`template-card ${activeTemplateId === template.id ? "template-card--active" : ""}`}
              onClick={() => handleSelectTemplate(template.id)}
              data-testid={`template-card-${template.id}`}
            >
              <span className="template-card-emoji" aria-hidden="true">{template.mealEmoji}</span>
              <span className="template-card-name">{template.displayName}</span>
              <span className="template-card-meta">
                {template.formData.attendance} guests · {template.formData.orgType}
              </span>
            </button>
          ))}
        </div>

        {activeTemplate && (
          <div className="template-active-banner" data-testid="template-active-banner">
            <span>
              Starting from: <strong>{activeTemplate.displayName}</strong> — all fields are editable.
            </span>
            <button
              type="button"
              className="template-clear-btn"
              onClick={handleClearTemplate}
              data-testid="button-clear-template"
              aria-label="Clear template"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </button>
          </div>
        )}

        {ideaPreFillLabel && !activeTemplate && (
          <div className="template-active-banner" data-testid="idea-prefill-banner">
            <span>
              Pre-filled from Idea Finder: <strong>{ideaPreFillLabel}</strong> — adjust every field to match your event.
            </span>
            <button
              type="button"
              className="template-clear-btn"
              onClick={() => { setIdeaPreFillLabel(null); handleClearTemplate(); }}
              data-testid="button-clear-idea-prefill"
              aria-label="Clear pre-fill"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Clear
            </button>
          </div>
        )}

        <p className="idea-finder-nudge" data-testid="planner-idea-finder-nudge">
          Not sure what to serve?{" "}
          <Link href="/idea-finder" className="idea-finder-nudge-link" data-testid="link-planner-idea-finder">
            Try the Idea Finder
          </Link>
        </p>
      </div>

      {/* ── Multi-step Form ───────────────────────────────────── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="planner-form" data-testid="planner-form">

          {/* ── Step 1: Event Info ─────────────────────────────── */}
          {step === 1 && (
            <div className="form-step" data-testid="form-step-1">
              <h2 className="step-heading">Event Information</h2>

              <FormField
                control={form.control}
                name="eventName"
                render={({ field }) => (
                  <FormItem className="field-group">
                    <FormLabel className="field-label">Event Name *</FormLabel>
                    <FormControl>
                      <Input
                        className="field-input"
                        placeholder="e.g. Spring Fundraiser Dinner"
                        {...field}
                        data-testid="input-event-name"
                      />
                    </FormControl>
                    <FormMessage className="field-error" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="orgType"
                render={({ field }) => (
                  <FormItem className="field-group">
                    <FormLabel className="field-label">Organization Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="field-select" data-testid="select-org-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORG_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage className="field-error" />
                  </FormItem>
                )}
              />

              {/* ── Meal Selector ──────────────────────────────── */}
              <FormField
                control={form.control}
                name="mealType"
                render={({ field }) => (
                  <FormItem className="field-group">
                    <FormLabel className="field-label">What are you serving? *</FormLabel>
                    <FormMessage className="field-error" />

                    {/* Popular Combos */}
                    <div className="meal-selector-section">
                      <p className="meal-selector-section-label">Popular Combos</p>
                      <div className="meal-selector-grid meal-selector-grid--combos">
                        {COMBO_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`meal-card meal-card--combo ${field.value === opt.value ? "meal-card--active" : ""}`}
                            onClick={() => field.onChange(opt.value)}
                            data-testid={`meal-card-${opt.value}`}
                          >
                            <span className="meal-card-emoji" aria-hidden="true">{opt.emoji}</span>
                            <span className="meal-card-label">{opt.label}</span>
                            <span className="meal-card-desc">{opt.desc}</span>
                            {field.value === opt.value && (
                              <span className="meal-card-check"><Check className="w-3.5 h-3.5" /></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Individual Meals */}
                    <div className="meal-selector-section">
                      <p className="meal-selector-section-label">Individual Meals</p>
                      <div className="meal-selector-grid meal-selector-grid--individual">
                        {INDIVIDUAL_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`meal-card ${field.value === opt.value ? "meal-card--active" : ""}`}
                            onClick={() => field.onChange(opt.value)}
                            data-testid={`meal-card-${opt.value}`}
                          >
                            <span className="meal-card-emoji" aria-hidden="true">{opt.emoji}</span>
                            <span className="meal-card-label">{opt.label}</span>
                            <span className="meal-card-desc">{opt.desc}</span>
                            {field.value === opt.value && (
                              <span className="meal-card-check"><Check className="w-3.5 h-3.5" /></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Meal */}
                    <div className="meal-selector-section">
                      <p className="meal-selector-section-label">Something Else</p>
                      <button
                        type="button"
                        className={`meal-card meal-card--custom ${field.value === "custom" ? "meal-card--active" : ""}`}
                        onClick={() => field.onChange("custom")}
                        data-testid="meal-card-custom"
                      >
                        <span className="meal-card-emoji" aria-hidden="true">🍽️</span>
                        <span className="meal-card-label">Custom Meal</span>
                        <span className="meal-card-desc">Tell us about your menu on the next step</span>
                        {field.value === "custom" && (
                          <span className="meal-card-check"><Check className="w-3.5 h-3.5" /></span>
                        )}
                      </button>
                    </div>
                  </FormItem>
                )}
              />

              {/* ── Attendance ─────────────────────────────────── */}
              <div className="field-group">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <p className="field-label" style={{ margin: 0 }}>
                    {attendanceMode === "estimate" ? "Attendance Range *" : "Expected Attendance *"}
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["exact", "estimate"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => form.setValue("attendanceMode", mode)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 16,
                          fontSize: 11,
                          fontWeight: 600,
                          border: `1.5px solid ${attendanceMode === mode ? "var(--color-primary)" : "var(--color-border)"}`,
                          background: attendanceMode === mode ? "var(--color-primary)" : "transparent",
                          color: attendanceMode === mode ? "white" : "var(--color-text-muted)",
                          cursor: "pointer",
                          transition: "all 0.1s",
                          letterSpacing: "0.03em",
                        }}
                        data-testid={`attendance-mode-${mode}`}
                      >
                        {mode === "exact" ? "Exact" : "Estimate Range"}
                      </button>
                    ))}
                  </div>
                </div>

                {attendanceMode === "estimate" ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <FormField control={form.control} name="attendanceLow" render={({ field }) => (
                        <FormItem style={{ margin: 0 }}>
                          <FormLabel className="field-label">Minimum guests</FormLabel>
                          <FormControl>
                            <Input className="field-input" type="number" min={10} max={5000} {...field} data-testid="input-attendance-low" />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="attendanceHigh" render={({ field }) => (
                        <FormItem style={{ margin: 0 }}>
                          <FormLabel className="field-label">Maximum guests</FormLabel>
                          <FormControl>
                            <Input className="field-input" type="number" min={10} max={5000} {...field} data-testid="input-attendance-high" />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <p className="field-hint">
                      Food quantities use the midpoint. Results show a conservative / expected / generous scenario breakdown.
                    </p>
                    {/* Keep attendance synced to midpoint for the underlying calculation */}
                    {(() => {
                      const low = Number(form.watch("attendanceLow") ?? 80);
                      const high = Number(form.watch("attendanceHigh") ?? 120);
                      const mid = Math.round((low + high) / 2);
                      if (form.getValues("attendance") !== mid) form.setValue("attendance", mid);
                      return null;
                    })()}
                  </>
                ) : (
                  <FormField
                    control={form.control}
                    name="attendance"
                    render={({ field }) => (
                      <FormItem style={{ margin: 0 }}>
                        <FormControl>
                          <Input
                            className="field-input"
                            type="number"
                            min={10}
                            max={5000}
                            {...field}
                            data-testid="input-attendance"
                          />
                        </FormControl>
                        <FormMessage className="field-error" />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="mealPrice"
                render={({ field }) => (
                  <FormItem className="field-group">
                    <FormLabel className="field-label">
                      {pricingModel === "split" ? "Base Price per Person ($) *" : "Suggested Donation / Meal Price ($) *"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="field-input"
                        type="number"
                        step="0.50"
                        min={0.5}
                        {...field}
                        data-testid="input-meal-price"
                      />
                    </FormControl>
                    <FormMessage className="field-error" />
                  </FormItem>
                )}
              />

              {/* ── Pricing Model ──────────────────────────────── */}
              <div className="field-group" data-testid="pricing-model-section">
                <p className="field-label">Pricing Model</p>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  {(["flat", "split"] as const).map((model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => form.setValue("pricingModel", model)}
                      className={pricingModel === model ? "meal-card meal-card--active" : "meal-card"}
                      style={{ flex: 1, padding: "10px 14px", minHeight: "unset" }}
                      data-testid={`pricing-model-${model}`}
                    >
                      <span className="meal-card-label">
                        {model === "flat" ? "Flat Price" : "Individual + Family"}
                      </span>
                      <span className="meal-card-desc" style={{ fontSize: 12 }}>
                        {model === "flat"
                          ? "Single price for everyone"
                          : "Different rates for individuals vs. families"}
                      </span>
                    </button>
                  ))}
                </div>

                {pricingModel === "split" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "14px", background: "var(--color-bg-card)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 2 }}>
                      Revenue is shown as a range based on 60% (conservative), your target %, and 90% (generous) actual donation rates — because not every guest pays full price.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <FormField control={form.control} name="individualPrice" render={({ field }) => (
                        <FormItem className="field-group" style={{ margin: 0 }}>
                          <FormLabel className="field-label">Individual Price ($)</FormLabel>
                          <FormControl>
                            <Input className="field-input" type="number" step="0.50" min={0.5} {...field} data-testid="input-individual-price" />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="familyPrice" render={({ field }) => (
                        <FormItem className="field-group" style={{ margin: 0 }}>
                          <FormLabel className="field-label">Family Price ($, ~4 people)</FormLabel>
                          <FormControl>
                            <Input className="field-input" type="number" step="0.50" min={1} {...field} data-testid="input-family-price" />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="individualPercent" render={({ field }) => (
                        <FormItem className="field-group" style={{ margin: 0 }}>
                          <FormLabel className="field-label">% attending as individuals</FormLabel>
                          <FormControl>
                            <Input className="field-input" type="number" min={0} max={100} {...field} data-testid="input-individual-percent" />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="donationRate" render={({ field }) => (
                        <FormItem className="field-group" style={{ margin: 0 }}>
                          <FormLabel className="field-label">Expected donation rate (%)</FormLabel>
                          <FormControl>
                            <Input className="field-input" type="number" min={0} max={100} {...field} data-testid="input-donation-rate" />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}
              </div>

              <div className="field-row mb-2">
                <FormField
                  control={form.control}
                  name="adultPercent"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">% Adults</FormLabel>
                      <FormControl>
                        <Input
                          className="field-input"
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          data-testid="input-adult-percent"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="kidPercent"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">% Kids / Students</FormLabel>
                      <FormControl>
                        <Input
                          className="field-input"
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          data-testid="input-kid-percent"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <p className="field-hint">Adults and kids eat different amounts. Totals don't need to equal 100% exactly.</p>

              <FormField
                control={form.control}
                name="storePreference"
                render={({ field }) => (
                  <FormItem className="field-group">
                    <FormLabel className="field-label">Preferred Store</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="field-select" data-testid="select-store-preference">
                          <SelectValue placeholder="Select store" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STORE_PREFS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="field-group">
                    <FormLabel className="field-label">Special Notes or Constraints</FormLabel>
                    <FormControl>
                      <Textarea
                        className="field-textarea"
                        rows={3}
                        placeholder="Allergies, dietary restrictions, equipment limitations, etc."
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="form-nav">
                <button type="button" onClick={handleNext} className="btn-primary" data-testid="button-next-step">
                  {isCustomMeal
                    ? <>Tell Us About Your Menu <ArrowRight className="ml-2 w-4 h-4" /></>
                    : <>Continue to Timing &amp; Volunteers <ArrowRight className="ml-2 w-4 h-4" /></>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Tell Us About Your Menu (custom only) ─── */}
          {step === 2 && (
            <div className="form-step" data-testid="form-step-2">
              <h2 className="step-heading">Tell Us About Your Menu</h2>
              <p className="step-sub">
                We'll use these details to build a smarter shopping list for your custom meal.
                All fields are optional — fill in as much as you know.
              </p>

              {/* Main dish name */}
              <FormField
                control={form.control}
                name="customMenuMainDish"
                render={({ field }) => (
                  <FormItem className="field-group">
                    <FormLabel className="field-label">What's your main dish?</FormLabel>
                    <FormControl>
                      <Input
                        className="field-input"
                        placeholder="e.g. BBQ Pulled Pork Sandwiches, Fried Chicken..."
                        {...field}
                        data-testid="input-custom-menu-main-dish"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Sides */}
              <div className="field-group">
                <p className="field-label">What sides will you serve?</p>
                <div className="checkbox-grid" data-testid="checkbox-group-sides">
                  {SIDES_OPTIONS.map((opt) => {
                    const sides = form.watch("customMenuSides") ?? [];
                    const checked = sides.includes(opt.value);
                    return (
                      <label key={opt.value} className={`checkbox-card ${checked ? "checkbox-card--active" : ""}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => form.setValue("customMenuSides", toggleValue(sides, opt.value))}
                          data-testid={`checkbox-side-${opt.value}`}
                        />
                        <span>{opt.label}</span>
                        {checked && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Drinks */}
              <div className="field-group">
                <p className="field-label">What drinks will you offer?</p>
                <div className="checkbox-grid" data-testid="checkbox-group-drinks">
                  {DRINKS_OPTIONS.map((opt) => {
                    const drinks = form.watch("customMenuDrinks") ?? [];
                    const checked = drinks.includes(opt.value);
                    return (
                      <label key={opt.value} className={`checkbox-card ${checked ? "checkbox-card--active" : ""}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => form.setValue("customMenuDrinks", toggleValue(drinks, opt.value))}
                          data-testid={`checkbox-drink-${opt.value}`}
                        />
                        <span>{opt.label}</span>
                        {checked && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Desserts */}
              <div className="field-group">
                <p className="field-label">Any desserts?</p>
                <div className="checkbox-grid" data-testid="checkbox-group-desserts">
                  {DESSERTS_OPTIONS.map((opt) => {
                    const desserts = form.watch("customMenuDesserts") ?? [];
                    const checked = desserts.includes(opt.value);
                    return (
                      <label key={opt.value} className={`checkbox-card ${checked ? "checkbox-card--active" : ""}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => form.setValue("customMenuDesserts", toggleValue(desserts, opt.value))}
                          data-testid={`checkbox-dessert-${opt.value}`}
                        />
                        <span>{opt.label}</span>
                        {checked && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dietary */}
              <div className="field-group">
                <p className="field-label">Any dietary considerations?</p>
                <div className="checkbox-grid" data-testid="checkbox-group-dietary">
                  {DIETARY_OPTIONS.map((opt) => {
                    const dietary = form.watch("customMenuDietary") ?? [];
                    const checked = dietary.includes(opt.value);
                    return (
                      <label key={opt.value} className={`checkbox-card ${checked ? "checkbox-card--active" : ""}`}>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => form.setValue("customMenuDietary", toggleValue(dietary, opt.value))}
                          data-testid={`checkbox-dietary-${opt.value}`}
                        />
                        <span>{opt.label}</span>
                        {checked && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-nav form-nav--split">
                <button type="button" onClick={prevStep} className="btn-secondary" data-testid="button-prev-step">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </button>
                <button type="button" onClick={handleNext} className="btn-primary" data-testid="button-next-timing">
                  Continue to Timing &amp; Volunteers <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Timing & Volunteers ───────────────────── */}
          {step === 3 && (
            <div className="form-step" data-testid="form-step-3">
              <h2 className="step-heading">Timing &amp; Volunteers</h2>

              {activeTemplate && (
                <p className="template-step-note" data-testid="template-step-note-3">
                  Pre-filled from <strong>{activeTemplate.displayName}</strong> — adjust as needed.
                </p>
              )}

              <div className="field-row">
                <FormField
                  control={form.control}
                  name="prepStartTime"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Prep Start Time *</FormLabel>
                      <FormControl>
                        <Input className="field-input" type="time" {...field} data-testid="input-prep-start" />
                      </FormControl>
                      <FormMessage className="field-error" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serveStartTime"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Serve Start Time *</FormLabel>
                      <FormControl>
                        <Input className="field-input" type="time" {...field} data-testid="input-serve-start" />
                      </FormControl>
                      <FormMessage className="field-error" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serveEndTime"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Serve End Time *</FormLabel>
                      <FormControl>
                        <Input className="field-input" type="time" {...field} data-testid="input-serve-end" />
                      </FormControl>
                      <FormMessage className="field-error" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="field-row mb-2">
                <FormField
                  control={form.control}
                  name="adultVolunteers"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Number of Adult Volunteers</FormLabel>
                      <FormControl>
                        <Input
                          className="field-input"
                          type="number"
                          min={0}
                          {...field}
                          data-testid="input-adult-volunteers"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="studentVolunteers"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Number of Student Volunteers</FormLabel>
                      <FormControl>
                        <Input
                          className="field-input"
                          type="number"
                          min={0}
                          {...field}
                          data-testid="input-student-volunteers"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <p className="field-hint">
                Volunteers are listed as "Adult Volunteer", "Parent Oversight", or "Student Volunteer" in the plan.
              </p>

              <div className="form-nav form-nav--split">
                <button type="button" onClick={prevStep} className="btn-secondary" data-testid="button-prev-step">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </button>
                <button type="button" onClick={handleNext} className="btn-primary" data-testid="button-review-plan">
                  Review Plan <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Review & Submit ────────────────────────── */}
          {step === 4 && (
            <div className="form-step" data-testid="form-step-4">
              <h2 className="step-heading">Review &amp; Generate</h2>
              <p className="review-desc">
                Everything looks good? Click below to generate your full fundraiser plan including shopping list,
                prep timeline, volunteer roles, and profit estimate.
              </p>

              {activeTemplate && (
                <p className="template-step-note" data-testid="template-step-note-4">
                  Started from <strong>{activeTemplate.displayName}</strong> template.
                </p>
              )}

              <div className="review-summary">
                <div className="review-row">
                  <span>Event Name</span>
                  <strong>{form.watch("eventName") || "—"}</strong>
                </div>
                <div className="review-row">
                  <span>Meal</span>
                  <strong>{ALL_MEAL_LABELS[form.watch("mealType")] ?? form.watch("mealType")}</strong>
                </div>
                {form.watch("mealType") === "custom" && form.watch("customMenuMainDish") && (
                  <div className="review-row">
                    <span>Main Dish</span>
                    <strong>{form.watch("customMenuMainDish")}</strong>
                  </div>
                )}
                <div className="review-row">
                  <span>Attendance</span>
                  <strong>{form.watch("attendance")} guests</strong>
                </div>
                <div className="review-row">
                  <span>Meal Price</span>
                  <strong>${form.watch("mealPrice")} / person</strong>
                </div>
                <div className="review-row">
                  <span>Volunteers</span>
                  <strong>
                    {form.watch("adultVolunteers")} adults, {form.watch("studentVolunteers")} students
                  </strong>
                </div>
                <div className="review-row">
                  <span>Serving</span>
                  <strong>{form.watch("serveStartTime")} – {form.watch("serveEndTime")}</strong>
                </div>
              </div>

              <div className="form-nav form-nav--split">
                <button type="button" onClick={prevStep} className="btn-secondary" data-testid="button-prev-step">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </button>
                <button type="submit" className="btn-primary" data-testid="button-generate-plan">
                  Generate My Plan <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </form>
      </Form>
    </div>
  );
}
