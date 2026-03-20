import type { Currency } from './offer';

export interface CostEntry {
  id: string;
  productId: string;
  cost: number;
  currency: Currency;
  effectiveDate: string;
  source: string;
}

export interface BasePrice {
  id: string;
  productId: string;
  price: number;
  currency: Currency;
  effectiveFrom: string;
  effectiveTo?: string;
}

export type AdjustmentType = 'percentage' | 'fixed';
export type AdjustmentTrigger = 'volume' | 'customer_tier' | 'incoterms' | 'payment_terms' | 'product_type';

export interface PricingRuleCondition {
  minQuantity?: number;
  maxQuantity?: number;
  tiers?: string[];
  incoterms?: string[];
  paymentTermsMinDays?: number;
  categories?: string[];
}

export interface PricingRule {
  id: string;
  name: string;
  productId?: string;
  trigger: AdjustmentTrigger;
  condition: PricingRuleCondition;
  adjustmentType: AdjustmentType;
  adjustmentValue: number;
  priority: number;
  active: boolean;
}

export interface CustomerOverride {
  id: string;
  customerId: string;
  productId: string;
  overridePrice: number;
  currency: Currency;
  validFrom: string;
  validTo?: string;
  note: string;
}

export type GuardrailType = 'min_margin_pct' | 'max_discount_pct' | 'below_cost' | 'below_msp';
export type GuardrailAction = 'warn' | 'block' | 'require_approval';

export interface GuardrailApprover {
  userId: string;
  userName: string;
  order: number;
}

export interface Guardrail {
  id: string;
  name: string;
  type: GuardrailType;
  threshold: number;
  action: GuardrailAction;
  scope?: string;
  active: boolean;
  description?: string;
  approvers?: GuardrailApprover[];
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PricingApproval {
  id: string;
  offerId: string;
  dealId: string;
  lineProductId: string;
  requestedPrice: number;
  computedFloor: number;
  guardrailId: string;
  reason: string;
  requestedBy: string;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  note?: string;
  createdAt: string;
}

export interface AppliedAdjustment {
  ruleId: string;
  ruleName: string;
  trigger: AdjustmentTrigger;
  adjustmentType: AdjustmentType;
  adjustmentValue: number;
  impact: number;
}

export interface GuardrailViolation {
  guardrailId: string;
  guardrailName: string;
  type: GuardrailType;
  action: GuardrailAction;
  threshold: number;
  actualValue: number;
}

export interface PricingResult {
  basePrice: number;
  adjustments: AppliedAdjustment[];
  finalPrice: number;
  cost: number | null;
  msp: number | null;
  marginVsCost: number | null;
  marginVsMSP: number | null;
  guardrailViolations: GuardrailViolation[];
  hasOverride: boolean;
  overridePrice?: number;
}
