import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Sample } from '@/types';

interface SampleStore {
  samples: Sample[];
  setSamples: (samples: Sample[]) => void;
  addSample: (sample: Sample) => void;
  updateSample: (id: string, updates: Partial<Sample>) => void;
  deleteSample: (id: string) => void;
  getSamplesByDeal: (dealId: string) => Sample[];
  getSampleById: (id: string) => Sample | undefined;
}

export const useSampleStore = create<SampleStore>()(
  persist(
    (set, get) => ({
      samples: [],
      setSamples: (samples) => set({ samples }),
      addSample: (sample) =>
        set((s) => ({ samples: [...s.samples, sample] })),
      updateSample: (id, updates) =>
        set((s) => ({
          samples: s.samples.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
        })),
      deleteSample: (id) =>
        set((s) => ({
          samples: s.samples.filter((o) => o.id !== id),
        })),
      getSamplesByDeal: (dealId) =>
        get().samples.filter((o) => o.dealId === dealId),
      getSampleById: (id) => get().samples.find((o) => o.id === id),
    }),
    { name: 'dealflow-samples' }
  )
);
