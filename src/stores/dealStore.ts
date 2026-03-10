import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Deal } from '@/types';

interface DealStore {
  deals: Deal[];
  setDeals: (deals: Deal[]) => void;
  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  getDealById: (id: string) => Deal | undefined;
  getDealsByCustomer: (customerId: string) => Deal[];
}

export const useDealStore = create<DealStore>()(
  persist(
    (set, get) => ({
      deals: [],
      setDeals: (deals) => set({ deals }),
      addDeal: (deal) => set((s) => ({ deals: [...s.deals, deal] })),
      updateDeal: (id, updates) => set((s) => ({
        deals: s.deals.map((d) => d.id === id ? { ...d, ...updates } : d),
      })),
      deleteDeal: (id) => set((s) => ({
        deals: s.deals.filter((d) => d.id !== id),
      })),
      getDealById: (id) => get().deals.find((d) => d.id === id),
      getDealsByCustomer: (customerId) => get().deals.filter((d) => d.customerId === customerId),
    }),
    { name: 'dealflow-deals' }
  )
);
