import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, Info, Lock } from "lucide-react";
import type { PlannerFormData } from "@/lib/types";
import { MEAL_ASSUMPTIONS, COMBO_DEFINITIONS, isComboMeal } from "@/lib/mealAssumptions";
import type { MealAssumption } from "@/lib/mealAssumptions";

interface PreviewItem {
  name: string;
  packageUnit: string;
  defaultCostRange: [number, number];
  required: boolean;
  isSupply: boolean;
  category: string;
  usageRate?: number;
  cookingOnly?: boolean;
}

function getPreviewItems(form: PlannerFormData): PreviewItem[] {
  const mealMeta = MEAL_ASSUMPTIONS[form.mealType] ?? MEAL_ASSUMPTIONS["custom"]!;
  const combo = isComboMeal(form.mealType) ? (COMBO_DEFINITIONS[form.mealType] ?? null) : null;
  const items: PreviewItem[] = [];
  const seen = new Set<string>();

  const processIngredients = (meal: MealAssumption) => {
    for (const ing of meal.ingredients) {
      if (seen.has(ing.name)) continue;
      seen.add(ing.name);
      items.push({
        name: ing.name,
        packageUnit: ing.packageUnit,
        defaultCostRange: ing.costPerPackage,
        required: ing.required ?? (ing.category === "protein" || ing.category === "carb"),
        isSupply: false,
        category: ing.category,
        usageRate: ing.usageRate,
        cookingOnly: ing.cookingOnly,
      });
    }
  };

  const processSupplies = (meal: MealAssumption) => {
    for (const sup of meal.supplies) {
      if (seen.has(sup.name)) continue;
      seen.add(sup.name);
      items.push({
        name: sup.name,
        packageUnit: "pack",
        defaultCostRange: sup.costPerPackage,
        required: sup.required ?? false,
        isSupply: true,
        category: "supply",
      });
    }
  };

  if (combo) {
    for (const component of combo.components) processIngredients(component);
    if (combo.components[0]) processSupplies(combo.components[0]);
  } else {
    processIngredients(mealMeta);
    processSupplies(mealMeta);
  }
  return items;
}

const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteins",
  carb: "Starches & Bread",
  dairy: "Dairy",
  produce: "Produce",
  condiment: "Condiments & Seasonings",
  other: "Other Food Items",
  supply: "Serving Supplies",
};

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

interface CustomizeMenuPageProps {
  form: PlannerFormData;
  onConfirm: (form: PlannerFormData) => void;
  onBack: () => void;
}

export default function CustomizeMenuPage({ form, onConfirm, onBack }: CustomizeMenuPageProps) {
  const items = useMemo(() => getPreviewItems(form), [form]);

  // Initialize: all items checked, no custom prices
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of items) init[item.name] = true;
    return init;
  });
  const [prices, setPrices] = useState<Record<string, string>>({});

  const toggleItem = (name: string, required: boolean) => {
    if (required) return;
    setChecked(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const setPrice = (name: string, val: string) => {
    setPrices(prev => ({ ...prev, [name]: val }));
  };

  const handleConfirm = () => {
    const excludedItems = Object.entries(checked)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    const customItemPrices: Record<string, number> = {};
    for (const [name, val] of Object.entries(prices)) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) customItemPrices[name] = n;
    }

    onConfirm({
      ...form,
      excludedItems: excludedItems.length > 0 ? excludedItems : undefined,
      customItemPrices: Object.keys(customItemPrices).length > 0 ? customItemPrices : undefined,
    });
  };

  // Group items by category
  const grouped = useMemo(() => {
    const groups: Record<string, PreviewItem[]> = {};
    for (const item of items) {
      const cat = item.isSupply ? "supply" : item.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return groups;
  }, [items]);

  const mealLabel = MEAL_ASSUMPTIONS[form.mealType]?.displayName ?? form.mealType;
  const checkedCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="planner-page" data-testid="customize-menu-page">
      <div className="planner-header">
        <button type="button" onClick={onBack} className="back-link">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to form
        </button>
        <h1 className="planner-title">Customize Your Menu</h1>
        <p className="planner-sub">
          Every item below is pre-selected based on your meal choice: <strong>{mealLabel}</strong>.
          Uncheck anything you already have on hand, won't be serving, or want to skip.
          Enter your actual store price to get a precise cost estimate.
        </p>
      </div>

      <div className="planner-form" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="info-banner" style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 24,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          fontSize: 14,
          color: "var(--color-text-muted)",
        }}>
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>{checkedCount} of {items.length} items selected.</strong>{" "}
            Items marked <Lock className="w-3 h-3 inline" /> are required and cannot be unchecked.
            The "My price" field overrides the default estimate — enter the price per package.
          </span>
        </div>

        {Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} style={{ marginBottom: 28 }}>
            <p style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 8,
            }}>
              {CATEGORY_LABELS[cat] ?? cat}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {catItems.map((item) => {
                const isChecked = checked[item.name] ?? true;
                const isReq = item.required;
                return (
                  <div
                    key={item.name}
                    onClick={() => toggleItem(item.name, isReq)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 8,
                      border: `1.5px solid ${isChecked ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: isChecked ? "var(--color-primary-light, #fdf8ef)" : "var(--color-bg-card)",
                      cursor: isReq ? "default" : "pointer",
                      opacity: isChecked ? 1 : 0.55,
                      transition: "all 0.12s",
                    }}
                  >
                    {/* Checkbox */}
                    <div style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      border: `2px solid ${isChecked ? "var(--color-primary)" : "var(--color-border)"}`,
                      background: isChecked ? "var(--color-primary)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.1s",
                    }}>
                      {isChecked && <Check className="w-3 h-3 text-white" />}
                    </div>

                    {/* Label and meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 500, fontSize: 14 }}>{item.name}</span>
                        {isReq && (
                          <span style={{
                            fontSize: 10,
                            fontWeight: 700,
                            background: "var(--color-text-muted)",
                            color: "white",
                            padding: "1px 5px",
                            borderRadius: 3,
                            letterSpacing: "0.05em",
                          }}>REQUIRED</span>
                        )}
                        {item.cookingOnly && (
                          <span style={{
                            fontSize: 10,
                            color: "var(--color-text-muted)",
                            fontStyle: "italic",
                          }}>cooking only</span>
                        )}
                        {item.usageRate && item.usageRate < 1 && (
                          <span style={{
                            fontSize: 10,
                            color: "var(--color-text-muted)",
                          }}>~{Math.round(item.usageRate * 100)}% of guests</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 1 }}>
                        Default estimate: {fmt(item.defaultCostRange[0])} – {fmt(item.defaultCostRange[1])} per {item.packageUnit}
                      </div>
                    </div>

                    {/* My price input */}
                    {isChecked && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
                      >
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="My price"
                          value={prices[item.name] ?? ""}
                          onChange={(e) => setPrice(item.name, e.target.value)}
                          style={{
                            width: 80,
                            padding: "4px 6px",
                            border: "1px solid var(--color-border)",
                            borderRadius: 5,
                            fontSize: 13,
                            background: "white",
                          }}
                          data-testid={`price-input-${item.name.replace(/\s+/g, "-")}`}
                        />
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>/{item.packageUnit.split(" ")[0]}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="form-nav form-nav--split" style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--color-border)" }}>
          <button type="button" onClick={onBack} className="btn-secondary">
            <ArrowLeft className="mr-2 w-4 h-4" /> Back
          </button>
          <button type="button" onClick={handleConfirm} className="btn-primary">
            Generate My Plan <ArrowRight className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
