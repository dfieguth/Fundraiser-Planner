import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { PlannerFormData, MealType, OrgType, StorePreference } from "@/lib/types";
import { calculatePlan } from "@/lib/calculator";
import { SAMPLE_TEMPLATES } from "@/lib/sampleTemplates";
import { Link } from "wouter";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  eventName: z.string().min(1, "Event name is required"),
  orgType: z.enum(["Church", "School", "Sports Team", "Nonprofit", "Other"]),
  mealType: z.enum(["hotdogs", "burgers", "bakedPotatoes", "breakfastBurritos", "tacos", "spaghetti", "pancakes", "custom"]),
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
});

const ORG_TYPES: OrgType[] = ["Church", "School", "Sports Team", "Nonprofit", "Other"];
const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "hotdogs", label: "Hot Dogs" },
  { value: "burgers", label: "Burgers" },
  { value: "bakedPotatoes", label: "Baked Potatoes" },
  { value: "breakfastBurritos", label: "Breakfast Burritos" },
  { value: "tacos", label: "Tacos" },
  { value: "spaghetti", label: "Spaghetti" },
  { value: "pancakes", label: "Pancakes" },
  { value: "custom", label: "Custom (describe below)" },
];
const STORE_PREFS: StorePreference[] = ["Costco", "Sam's Club", "Walmart", "Smart & Final", "Aldi", "Local Grocery", "Mixed"];

interface PlannerPageProps {
  onPlanReady: (plan: ReturnType<typeof calculatePlan>, form: PlannerFormData) => void;
}

export default function PlannerPage({ onPlanReady }: PlannerPageProps) {
  const [step, setStep] = useState(1);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const totalSteps = 3;

  const form = useForm<PlannerFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
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
    },
    mode: "onChange",
  });

  const mealType = form.watch("mealType");

  const handleSelectTemplate = (templateId: string) => {
    const template = SAMPLE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    // Reset the entire form with the template's values.
    // form.reset() updates all registered field values and triggers re-renders.
    form.reset(template.formData);
    setActiveTemplateId(templateId);
    // Scroll to the form so the user sees the pre-filled fields
    const formEl = document.querySelector("[data-testid='planner-form']");
    if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleClearTemplate = () => {
    form.reset({
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
    });
    setActiveTemplateId(null);
  };

  const onSubmit = (data: PlannerFormData) => {
    const plan = calculatePlan(data);
    onPlanReady(plan, data);
  };

  const handleNext = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await form.trigger(["eventName", "orgType", "mealType", "attendance", "mealPrice", "adultPercent", "kidPercent", "storePreference", "notes"]);
    } else if (step === 2) {
      isValid = await form.trigger(["prepStartTime", "serveStartTime", "serveEndTime", "adultVolunteers", "studentVolunteers"]);
    }
    if (isValid) setStep((s) => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

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
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`progress-step ${i + 1 <= step ? "progress-step--active" : ""}`}>
              <div className="progress-dot">{i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}</div>
              <span className="progress-label">
                {["Event Info", "Timing & Volunteers", "Review & Submit"][i]}
              </span>
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
      </div>

      {/* ── Multi-step Form ───────────────────────────────────── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="planner-form" data-testid="planner-form">

          {/* Step 1: Event Info */}
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

              <div className="field-row">
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

                <FormField
                  control={form.control}
                  name="mealType"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Meal Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="field-select" data-testid="select-meal-type">
                            <SelectValue placeholder="Select meal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEAL_TYPES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage className="field-error" />
                    </FormItem>
                  )}
                />
              </div>

              {mealType === "custom" && (
                <div className="custom-meal-section">
                  <FormField
                    control={form.control}
                    name="customMealName"
                    render={({ field }) => (
                      <FormItem className="field-group">
                        <FormLabel className="field-label">Custom Meal Name</FormLabel>
                        <FormControl>
                          <Input
                            className="field-input"
                            placeholder="e.g. BBQ Pulled Pork Sandwiches"
                            {...field}
                            data-testid="input-custom-meal-name"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customIngredients"
                    render={({ field }) => (
                      <FormItem className="field-group">
                        <FormLabel className="field-label">Main Ingredients (describe briefly)</FormLabel>
                        <FormControl>
                          <Textarea
                            className="field-textarea"
                            rows={3}
                            placeholder="e.g. pulled pork, slider buns, coleslaw, BBQ sauce"
                            {...field}
                            data-testid="textarea-custom-ingredients"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customServingSize"
                    render={({ field }) => (
                      <FormItem className="field-group">
                        <FormLabel className="field-label">Serving Size Notes</FormLabel>
                        <FormControl>
                          <Input
                            className="field-input"
                            placeholder="e.g. 1.5 sandwiches per adult, 1 per child"
                            {...field}
                            data-testid="input-custom-serving-size"
                          />
                        </FormControl>
                        <FormDescription className="field-hint">
                          Note: Custom meals use generic estimates. Adjust quantities based on your recipe.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="field-row">
                <FormField
                  control={form.control}
                  name="attendance"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Expected Attendance *</FormLabel>
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
                <FormField
                  control={form.control}
                  name="mealPrice"
                  render={({ field }) => (
                    <FormItem className="field-group">
                      <FormLabel className="field-label">Suggested Donation / Meal Price ($) *</FormLabel>
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
                  Continue to Timing &amp; Volunteers <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Timing & Volunteers */}
          {step === 2 && (
            <div className="form-step" data-testid="form-step-2">
              <h2 className="step-heading">Timing &amp; Volunteers</h2>

              {activeTemplate && (
                <p className="template-step-note" data-testid="template-step-note-2">
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

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="form-step" data-testid="form-step-3">
              <h2 className="step-heading">Review &amp; Generate</h2>
              <p className="review-desc">
                Everything looks good? Click below to generate your full fundraiser plan including shopping list,
                prep timeline, volunteer roles, and profit estimate.
              </p>

              {activeTemplate && (
                <p className="template-step-note" data-testid="template-step-note-3">
                  Started from <strong>{activeTemplate.displayName}</strong> template.
                </p>
              )}

              <div className="review-summary">
                <div className="review-row">
                  <span>Event Name</span>
                  <strong>{form.watch("eventName") || "—"}</strong>
                </div>
                <div className="review-row">
                  <span>Meal Type</span>
                  <strong>{MEAL_TYPES.find((m) => m.value === form.watch("mealType"))?.label}</strong>
                </div>
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
                    {form.watch("adultVolunteers")} adult + {form.watch("studentVolunteers")} student
                  </strong>
                </div>
                <div className="review-row">
                  <span>Serving Window</span>
                  <strong>{form.watch("serveStartTime")} – {form.watch("serveEndTime")}</strong>
                </div>
              </div>

              <div className="form-nav form-nav--split">
                <button type="button" onClick={prevStep} className="btn-secondary" data-testid="button-prev-step">
                  <ArrowLeft className="mr-2 w-4 h-4" /> Back
                </button>
                <button type="submit" className="btn-primary btn-generate" data-testid="button-generate-plan">
                  Generate My Fundraiser Plan <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
