import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ActivityEntry } from '@/types';

interface ActivityStore {
  activities: ActivityEntry[];
  setActivities: (activities: ActivityEntry[]) => void;
  addActivity: (activity: ActivityEntry) => void;
  getActivitiesByDeal: (dealId: string) => ActivityEntry[];
  getActivitiesByEntity: (entityType: string, entityId: string) => ActivityEntry[];
  getRecentActivities: (limit: number) => ActivityEntry[];
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: [],
      setActivities: (activities) => set({ activities }),
      addActivity: (activity) => set((s) => ({ activities: [...s.activities, activity] })),
      getActivitiesByDeal: (dealId) =>
        get().activities.filter((a) => a.dealId === dealId),
      getActivitiesByEntity: (entityType, entityId) =>
        get().activities.filter((a) => a.entityType === entityType && a.entityId === entityId),
      getRecentActivities: (limit) =>
        [...get().activities]
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
          .slice(0, limit),
    }),
    { name: 'dealflow-activities' }
  )
);
