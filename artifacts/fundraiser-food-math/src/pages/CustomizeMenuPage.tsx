import { useState, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, Info, Lock } from "lucide-react";
import type { PlannerFormData } from "@/lib/types";
import { MEAL_ASSUMPTIONS, COMBO_DEFINITIONS, isComboMeal } from "@/lib/mealAssumptions";
import type { MealAssumption } from "@/lib/mealAssumptions";
import { calculatePlan } from "@/lib/calculator";

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

// Extract the package count from strings like:
//   "220 potatoes needed · buy 22 × 10-lb bag ..."
//   "22 × 10-pack" (old format fallback)
function parsePackageCount(value: string): number {
  const afterBuy = value.match(/buy\s+(\d+)/);
  if (afterBuy) return Number.parseInt(afterBuy[1], 10);
  const leading = value.match(/^(\d+)/);
  return leading ? Number.parseInt(leading[1], 10) : 1;
}

// Extract just the "X × packageUnit" part for a clean buy line display.
// Input:  "220 potatoes needed · buy 22 × 10-lb bag · $7–$12 · total $154–$264"
// Output: "22 × 10-lb bag"
function extractBuyLine(value: string): string {
  const match = value.match(/buy\s+(\d+\s*×\s*[^·]+)/);
  if (match) return match[1].trim();
  return value;
}

// Extract just the "X units needed" part for the needed-count display.
function extractNeededLine(value: string): string {
  const parts = value.split("·");
  return parts[0]?.trim() ?? value;
}

interface CustomizeMenuPageProps {
  form: PlannerFormData;
  onConfirm: (form: PlannerFormData) => void;
  onBack: () => void;
}

export default function CustomizeMenuPage({ form, onConfirm, onBack }: CustomizeMenuPageProps) {
  const items = useMemo(() => getPreviewItems(form), [form]);

  // Run the calculator once (no exclusions, no custom prices) to get the baseline numbers.
  const previewPlan = useMemo(
    () => calculatePlan({ ...form, excludedItems: undefined, customItemPrices: undefined }),
    [form],
  );

  // Build a lookup: item name → { quantity string, estimatedCost from calculator }
  // estimatedCost is already packages × costPerPackage — the correct total.
  const planByName = useMemo(() => {
    const map = new Map<string, { quantity: string; estimatedCost: [number, number] }>();
    for (const item of previewPlan.shoppingList)
      map.set(item.item, { quantity: item.quantity, estimatedCost: item.estimatedCost });
    for (const item of previewPlan.suppliesList)
      map.set(item.item, { quantity: item.quantity, estimatedCost: item.estimatedCost });
    return map;
  }, [previewPlan]);

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const item of items) init[item.name] = true;
    return init;
  });
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [qtyOverrides, setQtyOverrides] = useState<Record<string, string>>({});

  const toggleItem = (name: string, required: boolean) => {
    if (required) return;
    setChecked(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const setPrice = (name: string, val: string) => {
    setPrices(prev => ({ ...prev, [name]: val }));
  };
  const setQtyOverride = (name: string, val: string) => {
    setQtyOverrides(prev => ({ ...prev, [name]: val }));
  };

  // Returns the baseline package count and any user override.
  const getQuantity = (item: PreviewItem) => {
    const quantityStr = planByName.get(item.name)?.quantity ?? "";
    const basePkgs = parsePackageCount(quantityStr) || 1;
    const overrideRaw = qtyOverrides[item.name] ?? "";
    const overrideVal = Number.parseInt(overrideRaw, 10);
    const overridePkgs = Number.isFinite(overrideVal) && overrideVal > 0 ? overrideVal : null;
    return { quantityStr, basePkgs, finalPkgs: overridePkgs ?? basePkgs, hasOverride: overridePkgs !== null };
  };

  // Compute the estimated cost for a single item, respecting overrides.
  // KEY FIX: estimatedCost from the calculator already = packages × costPerPackage.
  // Only re-multiply when the user has changed the package count or entered a custom price.
  const itemCostEstimate = (item: PreviewItem): [number, number] => {
    const { basePkgs, finalPkgs, hasOverride } = getQuantity(item);
    const customPriceRaw = parseFloat(prices[item.name] ?? "");
    const hasCustomPrice = Number.isFinite(customPriceRaw) && customPriceRaw > 0;

    if (!hasOverride && !hasCustomPrice) {
      // Use the calculator's pre-computed total directly — no extra multiplication.
      return planByName.get(item.name)?.estimatedCost ?? item.defaultCostRange;
    }

    // User changed something: recompute from per-package price × package count.
    const pricePerPkg: [number, number] = hasCustomPrice
      ? [customPriceRaw, customPriceRaw]
      : item.defaultCostRange;
    const pkgs = finalPkgs;
    return [pkgs * pricePerPkg[0], pkgs * pricePerPkg[1]];
  };

  const totalCostEstimate: [number, number] = useMemo(() => {
    let low = 0, high = 0;
    for (const item of items) {
      if (!checked[item.name]) continue;
      const [lo, hi] = itemCostEstimate(item);
      low += lo;
      high += hi;
    }
    return [low, high];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, items, qtyOverrides, prices, planByName]);

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
            The "My price" field overrides the default — enter the price per package.
          </span>
        </div>

        {combo && (
          <div className="info-banner" style={{
            background: "#fefce8",
            border: "1px solid #fde047",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 24,
            fontSize: 14,
            color: "#713f12",
          }}>
            Offering two entrees at one event? Expect most guests to take both, especially with student servers. Plan quantities for both or stick to one entree.
          </div>
        )}

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
                const { quantityStr, basePkgs, finalPkgs, hasOverride } = getQuantity(item);
                const [totalLow, totalHigh] = itemCostEstimate(item);
                const myPrice = prices[item.name];

                // Display strings parsed from the calculator's quantity string
                const neededLine = extractNeededLine(quantityStr);   // "220 potatoes needed"
                const buyLine    = extractBuyLine(quantityStr);       // "22 × 10-lb bag"

                return (
                  <div
                    key={item.name}
                    onClick={() => toggleItem(item.name, isReq)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "20px 1fr",
                      gap: 10,
                      padding: "12px 14px",
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
                    <div style={{ minWidth: 0 }}>
                      {/* Item name + package unit + required badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</span>
                        <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>• {item.packageUnit}</span>
                        {isReq && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: "var(--color-text-muted)", color: "white", padding: "1px 5px", borderRadius: 3 }}>
                            REQUIRED
                          </span>
                        )}
                      </div>

                      {/* Usage rate note */}
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>
                        {item.usageRate && item.usageRate < 1 ? `~${Math.round(item.usageRate * 100)}% of guests use this` : " "}
                      </div>

                      {/* Needed + packages to buy */}
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        <strong style={{ color: "var(--color-text)" }}>{neededLine}</strong>
                        {" · buy "}
                        <strong style={{ color: "var(--color-primary)" }}>
                          {hasOverride ? `${finalPkgs} × ${item.packageUnit}` : buyLine}
                        </strong>
                        {hasOverride && (
                          <span style={{ fontSize: 11, color: "var(--color-text-muted)", marginLeft: 6 }}>
                            (calc: {basePkgs})
                          </span>
                        )}
                      </div>

                      {/* Adjust quantity */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        <label style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          Adjust packages:
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder={String(basePkgs)}
                          value={qtyOverrides[item.name] ?? ""}
                          onChange={(e) => setQtyOverride(item.name, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: 76, padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: 5, fontSize: 13 }}
                        />
                      </div>

                      {/* Price per package + my price input */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                          {fmt(item.defaultCostRange[0])}–{fmt(item.defaultCostRange[1])} per {item.packageUnit}
                        </div>
                        {isChecked && (
                          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>My price: $</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="per pkg"
                              value={myPrice ?? ""}
                              onChange={(e) => setPrice(item.name, e.target.value)}
                              style={{ width: 80, padding: "4px 6px", border: "1px solid var(--color-border)", borderRadius: 5, fontSize: 13, background: "white" }}
                              data-testid={`price-input-${item.name.replace(/\s+/g, "-")}`}
                            />
                          </div>
                        )}
                      </div>

                      {/* Total estimated cost for this item */}
                      <div style={{ fontSize: 12, marginTop: 5, fontWeight: 600, color: "var(--color-text)" }}>
                        Total: {fmt(totalLow)} – {fmt(totalHigh)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Grand total */}
        <div style={{ marginTop: 24, padding: "14px 16px", border: "1px solid var(--color-border)", borderRadius: 10, background: "white", fontWeight: 700 }}>
          Estimated Total Food Cost: {fmt(totalCostEstimate[0])} – {fmt(totalCostEstimate[1])}
        </div>

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
