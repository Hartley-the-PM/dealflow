import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  type: 'progression' | 'exit'; // progression = main flow, exit = Lost/Expired/Cancelled
  defaultProbability: number; // 0-100, for opportunities
  color: string;
}

const DEFAULT_STAGES: PipelineStage[] = [
  { id: 'stage-opportunity', name: 'Opportunity', order: 1, type: 'progression', defaultProbability: 20, color: '#1976d2' },
  { id: 'stage-offer', name: 'Offer', order: 2, type: 'progression', defaultProbability: 50, color: '#7b1fa2' },
  { id: 'stage-order', name: 'Order', order: 3, type: 'progression', defaultProbability: 90, color: '#2e7d32' },
  { id: 'stage-lost', name: 'Lost', order: 100, type: 'exit', defaultProbability: 0, color: '#d32f2f' },
  { id: 'stage-expired', name: 'Expired', order: 101, type: 'exit', defaultProbability: 0, color: '#9e9e9e' },
  { id: 'stage-cancelled', name: 'Cancelled', order: 102, type: 'exit', defaultProbability: 0, color: '#ed6c02' },
];

interface PipelineStagesStore {
  stages: PipelineStage[];
  setStages: (stages: PipelineStage[]) => void;
  addStage: (stage: Omit<PipelineStage, 'id'>) => PipelineStage;
  updateStage: (id: string, updates: Partial<PipelineStage>) => void;
  deleteStage: (id: string) => void;
  reorderStages: (orderedIds: string[]) => void;
  getProgressionStages: () => PipelineStage[];
  getExitStages: () => PipelineStage[];
}

export const usePipelineStagesStore = create<PipelineStagesStore>()(
  persist(
    (set, get) => ({
      stages: DEFAULT_STAGES,
      setStages: (stages) => set({ stages }),
      addStage: (stageData) => {
        const newStage: PipelineStage = { ...stageData, id: uuid() };
        set((s) => ({ stages: [...s.stages, newStage] }));
        return newStage;
      },
      updateStage: (id, updates) =>
        set((s) => ({
          stages: s.stages.map((st) => (st.id === id ? { ...st, ...updates } : st)),
        })),
      deleteStage: (id) =>
        set((s) => ({
          stages: s.stages.filter((st) => st.id !== id),
        })),
      reorderStages: (orderedIds) =>
        set((s) => {
          const stageMap = new Map(s.stages.map((st) => [st.id, st]));
          const reordered = orderedIds
            .map((id, idx) => {
              const stage = stageMap.get(id);
              return stage ? { ...stage, order: idx + 1 } : null;
            })
            .filter(Boolean) as PipelineStage[];
          // Include any stages not in orderedIds (shouldn't happen, but safe)
          const included = new Set(orderedIds);
          const remaining = s.stages.filter((st) => !included.has(st.id));
          return { stages: [...reordered, ...remaining] };
        }),
      getProgressionStages: () =>
        get()
          .stages.filter((s) => s.type === 'progression')
          .sort((a, b) => a.order - b.order),
      getExitStages: () =>
        get()
          .stages.filter((s) => s.type === 'exit')
          .sort((a, b) => a.order - b.order),
    }),
    { name: 'dealflow-pipeline-stages' }
  )
);
