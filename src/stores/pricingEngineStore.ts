import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BasePrice,
  CostEntry,
  PricingRule,
  CustomerOverride,
  Guardrail,
  PricingApproval,
} from '@/types';

interface PricingEngineStore {
  basePrices: BasePrice[];
  costs: CostEntry[];
  rules: PricingRule[];
  overrides: CustomerOverride[];
  guardrails: Guardrail[];
  approvals: PricingApproval[];

  setBasePrices: (basePrices: BasePrice[]) => void;
  addBasePrice: (bp: BasePrice) => void;
  updateBasePrice: (id: string, updates: Partial<BasePrice>) => void;
  deleteBasePrice: (id: string) => void;

  setCosts: (costs: CostEntry[]) => void;
  addCost: (cost: CostEntry) => void;
  updateCost: (id: string, updates: Partial<CostEntry>) => void;

  setRules: (rules: PricingRule[]) => void;
  addRule: (rule: PricingRule) => void;
  updateRule: (id: string, updates: Partial<PricingRule>) => void;
  deleteRule: (id: string) => void;

  setOverrides: (overrides: CustomerOverride[]) => void;
  addOverride: (override: CustomerOverride) => void;
  updateOverride: (id: string, updates: Partial<CustomerOverride>) => void;
  deleteOverride: (id: string) => void;

  setGuardrails: (guardrails: Guardrail[]) => void;
  addGuardrail: (guardrail: Guardrail) => void;
  updateGuardrail: (id: string, updates: Partial<Guardrail>) => void;
  deleteGuardrail: (id: string) => void;

  setApprovals: (approvals: PricingApproval[]) => void;
  addApproval: (approval: PricingApproval) => void;
  updateApproval: (id: string, updates: Partial<PricingApproval>) => void;
}

export const usePricingEngineStore = create<PricingEngineStore>()(
  persist(
    (set) => ({
      basePrices: [],
      costs: [],
      rules: [],
      overrides: [],
      guardrails: [],
      approvals: [],

      setBasePrices: (basePrices) => set({ basePrices }),
      addBasePrice: (bp) => set((s) => ({ basePrices: [...s.basePrices, bp] })),
      updateBasePrice: (id, updates) =>
        set((s) => ({
          basePrices: s.basePrices.map((bp) => (bp.id === id ? { ...bp, ...updates } : bp)),
        })),
      deleteBasePrice: (id) =>
        set((s) => ({ basePrices: s.basePrices.filter((bp) => bp.id !== id) })),

      setCosts: (costs) => set({ costs }),
      addCost: (cost) => set((s) => ({ costs: [...s.costs, cost] })),
      updateCost: (id, updates) =>
        set((s) => ({
          costs: s.costs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      setRules: (rules) => set({ rules }),
      addRule: (rule) => set((s) => ({ rules: [...s.rules, rule] })),
      updateRule: (id, updates) =>
        set((s) => ({
          rules: s.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      deleteRule: (id) => set((s) => ({ rules: s.rules.filter((r) => r.id !== id) })),

      setOverrides: (overrides) => set({ overrides }),
      addOverride: (override) => set((s) => ({ overrides: [...s.overrides, override] })),
      updateOverride: (id, updates) =>
        set((s) => ({
          overrides: s.overrides.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        })),
      deleteOverride: (id) =>
        set((s) => ({ overrides: s.overrides.filter((o) => o.id !== id) })),

      setGuardrails: (guardrails) => set({ guardrails }),
      addGuardrail: (guardrail) => set((s) => ({ guardrails: [...s.guardrails, guardrail] })),
      updateGuardrail: (id, updates) =>
        set((s) => ({
          guardrails: s.guardrails.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        })),
      deleteGuardrail: (id) =>
        set((s) => ({ guardrails: s.guardrails.filter((g) => g.id !== id) })),

      setApprovals: (approvals) => set({ approvals }),
      addApproval: (approval) => set((s) => ({ approvals: [...s.approvals, approval] })),
      updateApproval: (id, updates) =>
        set((s) => ({
          approvals: s.approvals.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        })),
    }),
    { name: 'dealflow-pricing-engine' }
  )
);
