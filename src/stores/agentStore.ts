import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIAgent, AgentActivity, AgentDraft, AgentDraftStatus } from '@/types';

interface AgentStore {
  agents: AIAgent[];
  activities: AgentActivity[];
  drafts: AgentDraft[];
  setAgents: (agents: AIAgent[]) => void;
  setActivities: (activities: AgentActivity[]) => void;
  setDrafts: (drafts: AgentDraft[]) => void;
  addDraft: (draft: AgentDraft) => void;
  updateDraftStatus: (id: string, status: AgentDraftStatus, reviewedBy: string) => void;
  getActivitiesByDeal: (dealId: string) => AgentActivity[];
  getDraftsByDeal: (dealId: string) => AgentDraft[];
  getPendingDraftsByDeal: (dealId: string) => AgentDraft[];
  getPendingDraftsCount: () => number;
}

export const useAgentStore = create<AgentStore>()(
  persist(
    (set, get) => ({
      agents: [],
      activities: [],
      drafts: [],
      setAgents: (agents) => set({ agents }),
      setActivities: (activities) => set({ activities }),
      setDrafts: (drafts) => set({ drafts }),
      addDraft: (draft) => set((s) => ({ drafts: [...s.drafts, draft] })),
      updateDraftStatus: (id, status, reviewedBy) =>
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id ? { ...d, status, reviewedAt: new Date().toISOString(), reviewedBy } : d
          ),
        })),
      getActivitiesByDeal: (dealId) => get().activities.filter((a) => a.dealId === dealId),
      getDraftsByDeal: (dealId) => get().drafts.filter((d) => d.dealId === dealId),
      getPendingDraftsByDeal: (dealId) => get().drafts.filter((d) => d.dealId === dealId && d.status === 'pending'),
      getPendingDraftsCount: () => get().drafts.filter((d) => d.status === 'pending').length,
    }),
    { name: 'dealflow-agents' }
  )
);
