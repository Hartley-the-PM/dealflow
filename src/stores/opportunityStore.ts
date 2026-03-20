import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Opportunity } from '@/types';

interface OpportunityStore {
  opportunities: Opportunity[];
  setOpportunities: (opportunities: Opportunity[]) => void;
  addOpportunity: (opportunity: Opportunity) => void;
  updateOpportunity: (id: string, updates: Partial<Opportunity>) => void;
  deleteOpportunity: (id: string) => void;
  getOpportunitiesByDeal: (dealId: string) => Opportunity[];
  getOpenOpportunitiesByDeal: (dealId: string) => Opportunity[];
  getOpportunityById: (id: string) => Opportunity | undefined;
}

export const useOpportunityStore = create<OpportunityStore>()(
  persist(
    (set, get) => ({
      opportunities: [],
      setOpportunities: (opportunities) => set({ opportunities }),
      addOpportunity: (opportunity) =>
        set((s) => ({ opportunities: [...s.opportunities, opportunity] })),
      updateOpportunity: (id, updates) =>
        set((s) => ({
          opportunities: s.opportunities.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),
      deleteOpportunity: (id) =>
        set((s) => ({
          opportunities: s.opportunities.filter((o) => o.id !== id),
        })),
      getOpportunitiesByDeal: (dealId) =>
        get().opportunities.filter((o) => o.dealId === dealId),
      getOpenOpportunitiesByDeal: (dealId) =>
        get().opportunities.filter(
          (o) => o.dealId === dealId && (o.status === 'Open' || o.status === 'Qualified')
        ),
      getOpportunityById: (id) => get().opportunities.find((o) => o.id === id),
    }),
    { name: 'dealflow-opportunities' }
  )
);
