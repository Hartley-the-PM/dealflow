import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Formulation } from '@/types';

interface FormulationStore {
  formulations: Formulation[];
  setFormulations: (formulations: Formulation[]) => void;
  addFormulation: (formulation: Formulation) => void;
  updateFormulation: (id: string, updates: Partial<Formulation>) => void;
  deleteFormulation: (id: string) => void;
  getFormulationById: (id: string) => Formulation | undefined;
}

export const useFormulationStore = create<FormulationStore>()(
  persist(
    (set, get) => ({
      formulations: [],
      setFormulations: (formulations) => set({ formulations }),
      addFormulation: (formulation) =>
        set((s) => ({ formulations: [...s.formulations, formulation] })),
      updateFormulation: (id, updates) =>
        set((s) => ({
          formulations: s.formulations.map((f) =>
            f.id === id ? { ...f, ...updates } : f
          ),
        })),
      deleteFormulation: (id) =>
        set((s) => ({
          formulations: s.formulations.filter((f) => f.id !== id),
        })),
      getFormulationById: (id) => get().formulations.find((f) => f.id === id),
    }),
    { name: 'dealflow-formulations' }
  )
);
