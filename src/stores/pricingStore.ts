import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MSPEntry } from '@/types';

interface PricingStore {
  entries: MSPEntry[];
  setEntries: (entries: MSPEntry[]) => void;
  addEntry: (entry: MSPEntry) => void;
  updateEntry: (id: string, updates: Partial<MSPEntry>) => void;
  getMSPForProduct: (productId: string, month: string) => MSPEntry | undefined;
  getHistoryForProduct: (productId: string) => MSPEntry[];
}

export const usePricingStore = create<PricingStore>()(
  persist(
    (set, get) => ({
      entries: [],
      setEntries: (entries) => set({ entries }),
      addEntry: (entry) => set((s) => ({ entries: [...s.entries, entry] })),
      updateEntry: (id, updates) => set((s) => ({
        entries: s.entries.map((e) => e.id === id ? { ...e, ...updates } : e),
      })),
      getMSPForProduct: (productId, month) =>
        get().entries.find((e) => e.productId === productId && e.month === month),
      getHistoryForProduct: (productId) =>
        get().entries
          .filter((e) => e.productId === productId)
          .sort((a, b) => a.month.localeCompare(b.month)),
    }),
    { name: 'dealflow-pricing' }
  )
);
