import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OrderSchedule } from '@/types/orderSchedule';

interface OrderScheduleStore {
  schedules: OrderSchedule[];
  addSchedule: (schedule: OrderSchedule) => void;
  updateSchedule: (id: string, updates: Partial<OrderSchedule>) => void;
  deleteSchedule: (id: string) => void;
  getSchedulesByDeal: (dealId: string) => OrderSchedule[];
  getScheduleById: (id: string) => OrderSchedule | undefined;
}

export const useOrderScheduleStore = create<OrderScheduleStore>()(
  persist(
    (set, get) => ({
      schedules: [],
      addSchedule: (schedule) =>
        set((s) => ({ schedules: [...s.schedules, schedule] })),
      updateSchedule: (id, updates) =>
        set((s) => ({
          schedules: s.schedules.map((sch) =>
            sch.id === id ? { ...sch, ...updates, updatedAt: new Date().toISOString() } : sch
          ),
        })),
      deleteSchedule: (id) =>
        set((s) => ({
          schedules: s.schedules.filter((sch) => sch.id !== id),
        })),
      getSchedulesByDeal: (dealId) =>
        get().schedules.filter((s) => s.dealId === dealId),
      getScheduleById: (id) =>
        get().schedules.find((s) => s.id === id),
    }),
    { name: 'dealflow-order-schedules' }
  )
);
