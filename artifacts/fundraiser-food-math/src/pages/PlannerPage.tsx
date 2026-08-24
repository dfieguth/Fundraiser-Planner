import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PlannerFormData, MealType, OrgType, StorePreference } from "@/lib/types";
import { MEAL_ASSUMPTIONS } from "@/lib/mealAssumptions";
import { toggleMealSelection as resolveMealSelection, selectSingleMeal } from "@/lib/mealSelection";
import { getPreparedServings } from "@/lib/servingRules";
import { SAMPLE_TEMPLATES } from "@/lib/sampleTemplates";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trackFunnelEvent } from "@/lib/analytics";

const ENABLE_TIERED_PRICING = false;
const SHOW_STORE_SELECTOR = false;

// ── Schema ───────────────────────────────────────────────────
const requiredNumber = (
  label: string,
  min: number,
  max?: number,
  wholeNumber = false,
) => z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    }
    return value;
  },
  z.number({
    required_error: `${label} is required.`,
    invalid_type_error: `${label} must be a valid number.`,
  })
    .min(min, `${label} must be at least ${min.toLocaleString()}.`)
    .refine((value) => !wholeNumber || Number.isInteger(value), {
      message: `${label} must be a whole number.`,
    })
    .refine((value) => max === undefined || value <= max, {
      message: max === undefined ? `${label} is invalid.` : `${label} must be ${max.toLocaleString()} or less.`,
    }),
);

const schema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  orgType: z.preprocess(
    (value) => value === "" || value === null || value === undefined ? undefined : value,
    z.enum(["Church", "School", "Sports Team", "Nonprofit", "Other"], {
      required_error: "Please select an organization type.",
      invalid_type_error: "Please select an organization type.",
    }),
  ),
  mealType: z.enum([
    "hotdogs", "burgers", "bakedPotatoes", "breakfastBurritos",
    "tacos", "walkingTacos", "spaghetti", "pancakes", "custom",
    "combo_hotdogs_potatoes", "combo_burgers_chips", "combo_pancakes_sausage",
  ]),
  attendance: requiredNumber("Guest count", 10, 5000, true),
  mealPrice: requiredNumber("Suggested donation", 0.5),
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
  // Attendee mix (tiered pricing)
  soloAdultPct: z.coerce.number().min(0).max(100).optional(),
  couplesPct: z.coerce.number().min(0).max(100).optional(),
  familiesPct: z.coerce.number().min(0).max(100).optional(),
  teensPct: z.coerce.number().min(0).max(100).optional(),
  avgFamilySize: z.coerce.number().min(2).max(10).optional(),
  familyPriceAdoptionRate: z.coerce.number().min(0).max(100).optional(),
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
  { value: "bakedPotatoes",    label: "Baked Potato Bar",  emoji: "🥔", desc: "Topping-bar format" },
  { value: "tacos",            label: "Taco Bar",           emoji: "🌮", desc: "Build-your-own taco bar" },
  { value: "walkingTacos",     label: "Walking Tacos",      emoji: "🌮", desc: "Individual chip-bag service" },
  { value: "spaghetti",        label: "Spaghetti Dinner",  emoji: "🍝", desc: "Classic sit-down dinner" },
];

const SNACK_OPTIONS: { value: MealType; label: string; emoji: string; desc: string; badge?: string }[] = [];

const ALL_MEAL_LABELS: Record<string, string> = {
  hotdogs: "Hot Dogs", burgers: "Burgers", bakedPotatoes: "Baked Potato Bar",
  breakfastBurritos: "Breakfast Burritos", tacos: "Tacos", walkingTacos: "Walking Tacos",
  spaghetti: "Spaghetti Dinner", pancakes: "Pancakes", custom: "Custom Meal",
  combo_hotdogs_potatoes: "Hot Dogs + Baked Potatoes",
  combo_burgers_chips: "Burgers + Chips",
  combo_pancakes_sausage: "Pancakes + Sausage",
};

const PUBLIC_MEAL_TYPES = new Set<MealType>([
  "hotdogs", "burgers", "bakedPotatoes", "tacos", "walkingTacos", "spaghetti",
]);

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
  orgType: "" as PlannerFormData["orgType"],
  mealType: "" as PlannerFormData["mealType"],
  attendance: "" as unknown as number,
  mealPrice: "" as unknown as number,
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
  soloAdultPct: 22,
  couplesPct: 25,
  familiesPct: 45,
  teensPct: 8,
  avgFamilySize: 3.75,
  familyPriceAdoptionRate: 80,
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
  useEffect(() => { trackFunnelEvent("planner_started"); }, []);

  const form = useForm<PlannerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...DEFAULT_VALUES,
      pricingModel: "flat",
    },
    mode: "onChange",
  });

  const [ideaPreFillLabel, setIdeaPreFillLabel] = useState<string | null>(null);

  // ── Multi-meal selection state ────────────────────────────────
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>([]);
  const [totalExpectedGuests, setTotalExpectedGuests] = useState<number | "">("");

  // Sync first selected meal → form.mealType (for schema validation + downstream logic)
  useEffect(() => {
    if (selectedMeals[0]) form.setValue("mealType", selectedMeals[0]);
  }, [selectedMeals]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMealSelection = (mealType: MealType) => {
    const nextSelectedMeals = resolveMealSelection(selectedMeals, mealType);
    setSelectedMeals(nextSelectedMeals);
  };

  const selectSingleMealType = (mealType: MealType) => {
    setSelectedMeals(selectSingleMeal(mealType));
  };

  // On mount: check sessionStorage for Idea Finder pre-fill
  useEffect(() => {
    const raw = sessionStorage.getItem("ffm_idea_prefill");
    if (raw) {
      try {
        const { formData, mealName } = JSON.parse(raw) as { formData: PlannerFormData; mealName: string };
        form.reset({ ...DEFAULT_VALUES, ...formData });
        setSelectedMeals([formData.mealType]);
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
    form.reset({
      ...DEFAULT_VALUES,
      eventName: template.formData.eventName,
      mealType: template.formData.mealType,
      prepStartTime: template.formData.prepStartTime,
      serveStartTime: template.formData.serveStartTime,
      serveEndTime: template.formData.serveEndTime,
      adultVolunteers: template.formData.adultVolunteers,
      studentVolunteers: template.formData.studentVolunteers,
    });
    setActiveTemplateId(templateId);
    const mealT = template.formData.mealType;
    setSelectedMeals([mealT]);
    setTotalExpectedGuests("");
    const formEl = document.querySelector("[data-testid='planner-form']");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearTemplate = () => {
    form.reset(DEFAULT_VALUES);
    setActiveTemplateId(null);
    setSelectedMeals([]);
    setTotalExpectedGuests("");
  };

  const pricingModel = form.watch("pricingModel");
  const attendanceMode = form.watch("attendanceMode");
  const orgType = form.watch("orgType");

  const priceLabel = orgType === "Church" || orgType === "Nonprofit"
    ? "Suggested Donation per Plate ($) *"
    : orgType === "School" || orgType === "Sports Team"
      ? "Suggested Donation / Ticket Price ($) *"
      : "Suggested Donation or Ticket Price ($) *";

  const onSubmit = (data: PlannerFormData) => {
    const primaryMeal = selectedMeals[0];
    if (!primaryMeal) return;
    const attendance = typeof totalExpectedGuests === "number"
      ? totalExpectedGuests
      : data.attendance;
    const enriched: PlannerFormData = {
      ...data,
      mealType: primaryMeal,
      attendance,
      selectedMeals: undefined,
      totalExpectedGuests: undefined,
    };
    trackFunnelEvent("planner_completed");
    onPlanReady(enriched);
  };

  const handleNext = async () => {
    if (step === 1) {
      // Sync attendance from state so schema validation passes
      const primaryMeal = selectedMeals[0];
      if (!primaryMeal) {
        form.setError("mealType", { message: "Please select one meal." });
        return;
      }
      form.setValue("attendance", totalExpectedGuests as number);
      form.setValue("mealType", primaryMeal);
      const isValid = await form.trigger([
        "eventName", "orgType", "mealType", "attendance", "mealPrice", "notes",
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
            Samples preload only the event name and meal type. Any timing and volunteer numbers are suggested starting values — confirm and edit them for your actual event.
          </p>
        </div>

        <div className="template-grid" data-testid="template-grid">
          {SAMPLE_TEMPLATES.filter((template) => PUBLIC_MEAL_TYPES.has(template.formData.mealType)).map((template) => (
            <button
              key={template.id}
              type="button"
              className={`template-card ${activeTemplateId === template.id ? "template-card--active" : ""}`}
              onClick={() => handleSelectTemplate(template.id)}
              data-testid={`template-card-${template.id}`}
            >
              <span className="template-card-emoji" aria-hidden="true">{template.mealEmoji}</span>
              <span className="template-card-name">{template.displayName}</span>
              <span className="template-card-meta" hidden>
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
                          <SelectValue placeholder="Select organization type" />
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

                    {/* Popular Combos — hidden, code preserved for future use */}
                    <div style={{ display: "none" }}>
                    <div className="meal-selector-section">
                      <p className="meal-selector-section-label">Popular Combos</p>
                      <div className="meal-selector-grid meal-selector-grid--combos">
                        {COMBO_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`meal-card meal-card--combo ${field.value === opt.value ? "meal-card--active" : ""}`}
                             onClick={() => {
                               field.onChange(opt.value);
                               selectSingleMealType(opt.value);
                             }}
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
                    </div>

                    {/* Individual Meals */}
                    <div className="meal-selector-section">
                      <p className="meal-selector-section-label">Individual Meals — select one</p>
                      <div className="meal-selector-grid meal-selector-grid--individual">
                        {INDIVIDUAL_OPTIONS.map((opt) => {
                          const slotIndex = selectedMeals.indexOf(opt.value as MealType);
                          const isSelected = slotIndex !== -1;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              className={`meal-card ${isSelected ? "meal-card--active" : ""}`}
                              onClick={() => toggleMealSelection(opt.value as MealType)}
                              data-testid={`meal-card-${opt.value}`}
                            >
                              <span className="meal-card-emoji" aria-hidden="true">{opt.emoji}</span>
                              <span className="meal-card-label">{opt.label}</span>
                              <span className="meal-card-desc">{opt.desc}</span>
                              {isSelected && (
                                <span className="meal-card-check">
                                  <Check className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Legacy snack choices remain in the data model but are not public options. */}

                    {/* Custom Meal remains supported for legacy saved plans but is not a public selection. */}
                  </FormItem>
                )}
              />

              {/* ── Servings & Guest Count ─────────────────────── */}
              <div className="field-group">
                <FormField
                  control={form.control}
                  name="attendance"
                  render={({ field }) => (
                    <FormItem>
                      <p className="field-label">How many guests are you expecting? *</p>
                      <p className="field-hint" style={{ marginTop: 0, marginBottom: 12 }}>
                        Enter your expected guest count. Servings to prepare are calculated automatically below.
                      </p>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <span style={{ flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text)", display: "block" }}>
                            Total guests expected
                          </span>
                          <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                            Used for revenue estimate, supplies, and volunteer ratios
                          </span>
                        </span>
                        <input
                          type="number"
                          min={10}
                          max={5000}
                          value={totalExpectedGuests}
                          onInput={(e) => {
                            const t = e.currentTarget;
                            const n = parseInt(t.value, 10);
                            if (!isNaN(n) && t.value !== String(n)) t.value = String(n);
                          }}
                          onChange={(e) => {
                            const guests = e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0);
                            setTotalExpectedGuests(guests);
                            field.onChange(guests);
                          }}
                          className="field-input"
                          style={{ width: 90 }}
                          data-testid="input-total-guests"
                        />
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>guests</span>
                      </div>
                      <FormMessage className="field-error" />
                    </FormItem>
                  )}
                />

                 {/* Secondary: per-meal servings (calculated from the universal rule) */}
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
                    Servings to prepare
                  </p>
                  <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 10 }}>
                     Calculated as the ceiling of guests × this meal's per-guest serving factor.
                  </p>

                  {selectedMeals.map((meal, idx) => {
                    const opt = [...INDIVIDUAL_OPTIONS, ...SNACK_OPTIONS].find((o) => o.value === meal);
                    const label = opt ? `${opt.emoji} ${opt.label}` : meal;
                    return (
                      <div key={meal} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "var(--color-text)" }}>
                          {label}
                          {selectedMeals.length > 1 && (
                            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 400, color: "var(--color-text-muted)" }}>
                              Station {idx + 1}
                            </span>
                          )}
                        </span>
                        <strong
                          style={{ minWidth: 90, textAlign: "right", fontSize: 16, color: "var(--color-text)" }}
                          data-testid={`input-servings-${meal}`}
                        >
                          {totalExpectedGuests === ""
                            ? "—"
                            : getPreparedServings(totalExpectedGuests, meal).toLocaleString()}
                        </strong>
                        <span style={{ fontSize: 13, color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>servings</span>
                      </div>
                    );
                  })}
                </div>

              </div>

              <FormField
                control={form.control}
                name="mealPrice"
                render={({ field }) => (
                  <FormItem className="field-group">
                    <FormLabel className="field-label">{priceLabel}</FormLabel>
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

              {/* ── Pricing & Attendance Model ───────────────────── */}
              <div style={{ display: "none" }}>
                {ENABLE_TIERED_PRICING && (
                  <>
                    <FormField control={form.control} name="donationRate" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="individualPrice" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="familyPrice" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="avgFamilySize" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="soloAdultPct" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="couplesPct" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="familiesPct" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="teensPct" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="familyPriceAdoptionRate" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                  </>
                )}
              </div>

              {SHOW_STORE_SELECTOR && (
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
              )}

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
                  Suggested starting values from <strong>{activeTemplate.displayName}</strong> — confirm and edit these times and volunteer counts for your event.
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
                Volunteers are listed as "Adult Volunteer" or "Student Volunteer" in the plan.
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
                Everything looks good? Click below to generate your free preview. The $19 Founding Event Pack unlocks
                the complete shopping list and supporting plan.
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
                  <span>{selectedMeals.length > 1 ? "Meals" : "Meal"}</span>
                  <strong>
                    {selectedMeals.map((m) => ALL_MEAL_LABELS[m] ?? m).join(" + ")}
                  </strong>
                </div>
                {selectedMeals.map((meal) => (
                  <div key={meal} className="review-row">
                    <span>{selectedMeals.length > 1 ? `${ALL_MEAL_LABELS[meal] ?? meal} servings` : "Servings planned"}</span>
                    <strong>
                      {typeof totalExpectedGuests === "number"
                        ? `${getPreparedServings(totalExpectedGuests, meal).toLocaleString()} servings`
                        : "—"}
                    </strong>
                  </div>
                ))}
                <div className="review-row">
                  <span>Total Guests Expected</span>
                  <strong>
                    {typeof totalExpectedGuests === "number"
                      ? `${totalExpectedGuests.toLocaleString()} guests`
                      : "—"}
                  </strong>
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
