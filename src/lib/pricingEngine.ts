import type {
  BasePrice,
  CostEntry,
  PricingRule,
  CustomerOverride,
  Guardrail,
  PricingResult,
  AppliedAdjustment,
  GuardrailViolation,
} from '@/types/pricingEngine';
import type { MSPEntry } from '@/types/pricing';
import type { Incoterms } from '@/types/offer';

interface ComputePriceInput {
  productId: string;
  quantity: number;
  customerId: string;
  customerTier: string;
  incoterms: Incoterms;
  paymentTerms: string;
  productCategory: string;
}

interface ComputePriceData {
  basePrices: BasePrice[];
  costs: CostEntry[];
  rules: PricingRule[];
  overrides: CustomerOverride[];
  guardrails: Guardrail[];
  mspEntries: MSPEntry[];
}

function parsePaymentDays(paymentTerms: string): number {
  const match = paymentTerms.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
}

function getLatestBasePrice(basePrices: BasePrice[], productId: string): BasePrice | undefined {
  const now = new Date().toISOString().slice(0, 10);
  return basePrices
    .filter(
      (bp) =>
        bp.productId === productId &&
        bp.effectiveFrom <= now &&
        (!bp.effectiveTo || bp.effectiveTo >= now)
    )
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

function getLatestCost(costs: CostEntry[], productId: string): CostEntry | undefined {
  return costs
    .filter((c) => c.productId === productId)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
}

function getCurrentMSP(mspEntries: MSPEntry[], productId: string): MSPEntry | undefined {
  return mspEntries
    .filter((e) => e.productId === productId)
    .sort((a, b) => b.month.localeCompare(a.month))[0];
}

function getActiveOverride(
  overrides: CustomerOverride[],
  customerId: string,
  productId: string
): CustomerOverride | undefined {
  const now = new Date().toISOString().slice(0, 10);
  return overrides.find(
    (o) =>
      o.customerId === customerId &&
      o.productId === productId &&
      o.validFrom <= now &&
      (!o.validTo || o.validTo >= now)
  );
}

function ruleMatches(rule: PricingRule, input: ComputePriceInput): boolean {
  const c = rule.condition;
  switch (rule.trigger) {
    case 'volume': {
      const qty = input.quantity;
      if (c.minQuantity != null && qty < c.minQuantity) return false;
      if (c.maxQuantity != null && qty > c.maxQuantity) return false;
      return true;
    }
    case 'customer_tier':
      return c.tiers?.includes(input.customerTier) ?? false;
    case 'incoterms':
      return c.incoterms?.includes(input.incoterms) ?? false;
    case 'payment_terms': {
      const days = parsePaymentDays(input.paymentTerms);
      return c.paymentTermsMinDays != null && days >= c.paymentTermsMinDays;
    }
    case 'category':
      return c.categories?.includes(input.productCategory) ?? false;
    default:
      return false;
  }
}

function applyAdjustment(
  price: number,
  rule: PricingRule
): { newPrice: number; impact: number } {
  if (rule.adjustmentType === 'percentage') {
    const impact = price * (rule.adjustmentValue / 100);
    return { newPrice: price + impact, impact };
  }
  return { newPrice: price + rule.adjustmentValue, impact: rule.adjustmentValue };
}

export function checkGuardrails(
  finalPrice: number,
  basePrice: number,
  cost: number | null,
  msp: number | null,
  guardrails: Guardrail[]
): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  for (const gr of guardrails) {
    if (!gr.active) continue;

    switch (gr.type) {
      case 'min_margin_pct': {
        if (cost == null) break;
        const margin = ((finalPrice - cost) / finalPrice) * 100;
        if (margin < gr.threshold) {
          violations.push({
            guardrailId: gr.id,
            guardrailName: gr.name,
            type: gr.type,
            action: gr.action,
            threshold: gr.threshold,
            actualValue: Math.round(margin * 100) / 100,
          });
        }
        break;
      }
      case 'below_msp': {
        if (msp == null) break;
        const mspMargin = ((finalPrice - msp) / msp) * 100;
        if (finalPrice < msp) {
          violations.push({
            guardrailId: gr.id,
            guardrailName: gr.name,
            type: gr.type,
            action: gr.action,
            threshold: gr.threshold,
            actualValue: Math.round(mspMargin * 100) / 100,
          });
        }
        break;
      }
      case 'max_discount_pct': {
        const discount = ((basePrice - finalPrice) / basePrice) * 100;
        if (discount > gr.threshold) {
          violations.push({
            guardrailId: gr.id,
            guardrailName: gr.name,
            type: gr.type,
            action: gr.action,
            threshold: gr.threshold,
            actualValue: Math.round(discount * 100) / 100,
          });
        }
        break;
      }
      case 'below_cost': {
        if (cost == null) break;
        if (finalPrice < cost) {
          violations.push({
            guardrailId: gr.id,
            guardrailName: gr.name,
            type: gr.type,
            action: gr.action,
            threshold: gr.threshold,
            actualValue: Math.round(((finalPrice - cost) / cost) * 100 * 100) / 100,
          });
        }
        break;
      }
    }
  }

  return violations;
}

export function computePrice(
  input: ComputePriceInput,
  data: ComputePriceData
): PricingResult {
  const basePriceEntry = getLatestBasePrice(data.basePrices, input.productId);
  const costEntry = getLatestCost(data.costs, input.productId);
  const mspEntry = getCurrentMSP(data.mspEntries, input.productId);
  const override = getActiveOverride(data.overrides, input.customerId, input.productId);

  const basePrice = basePriceEntry?.price ?? 0;
  const cost = costEntry?.cost ?? null;
  const msp = mspEntry?.price ?? null;

  if (override) {
    const finalPrice = override.overridePrice;
    const marginVsCost = cost != null ? ((finalPrice - cost) / finalPrice) * 100 : null;
    const marginVsMSP = msp != null ? ((finalPrice - msp) / msp) * 100 : null;

    return {
      basePrice,
      adjustments: [],
      finalPrice,
      cost,
      msp,
      marginVsCost: marginVsCost != null ? Math.round(marginVsCost * 100) / 100 : null,
      marginVsMSP: marginVsMSP != null ? Math.round(marginVsMSP * 100) / 100 : null,
      guardrailViolations: checkGuardrails(finalPrice, basePrice, cost, msp, data.guardrails),
      hasOverride: true,
      overridePrice: override.overridePrice,
    };
  }

  const matchingRules = data.rules
    .filter((r) => r.active && (!r.productId || r.productId === input.productId) && ruleMatches(r, input))
    .sort((a, b) => a.priority - b.priority);

  // For volume rules, only apply the highest-priority (most specific) one
  const volumeRules = matchingRules.filter((r) => r.trigger === 'volume');
  const nonVolumeRules = matchingRules.filter((r) => r.trigger !== 'volume');
  const bestVolumeRule = volumeRules.length > 0 ? volumeRules[volumeRules.length - 1] : null;
  const rulesToApply = bestVolumeRule ? [bestVolumeRule, ...nonVolumeRules] : nonVolumeRules;

  let currentPrice = basePrice;
  const adjustments: AppliedAdjustment[] = [];

  for (const rule of rulesToApply) {
    const { newPrice, impact } = applyAdjustment(currentPrice, rule);
    adjustments.push({
      ruleId: rule.id,
      ruleName: rule.name,
      trigger: rule.trigger,
      adjustmentType: rule.adjustmentType,
      adjustmentValue: rule.adjustmentValue,
      impact: Math.round(impact * 100) / 100,
    });
    currentPrice = Math.round(newPrice * 100) / 100;
  }

  const finalPrice = currentPrice;
  const marginVsCost = cost != null ? ((finalPrice - cost) / finalPrice) * 100 : null;
  const marginVsMSP = msp != null ? ((finalPrice - msp) / msp) * 100 : null;

  return {
    basePrice,
    adjustments,
    finalPrice,
    cost,
    msp,
    marginVsCost: marginVsCost != null ? Math.round(marginVsCost * 100) / 100 : null,
    marginVsMSP: marginVsMSP != null ? Math.round(marginVsMSP * 100) / 100 : null,
    guardrailViolations: checkGuardrails(finalPrice, basePrice, cost, msp, data.guardrails),
    hasOverride: false,
  };
}
