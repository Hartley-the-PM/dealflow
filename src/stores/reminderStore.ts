import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Reminder } from '@/types';

interface ReminderStore {
  reminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  markDone: (id: string) => void;
  snooze: (id: string, newDueDate: string) => void;
  getUpcoming: (days: number) => Reminder[];
}

export const useReminderStore = create<ReminderStore>()(
  persist(
    (set, get) => ({
      reminders: [],
      setReminders: (reminders) => set({ reminders }),
      addReminder: (reminder) => set((s) => ({ reminders: [...s.reminders, reminder] })),
      updateReminder: (id, updates) => set((s) => ({
        reminders: s.reminders.map((r) => r.id === id ? { ...r, ...updates } : r),
      })),
      markDone: (id) => set((s) => ({
        reminders: s.reminders.map((r) => r.id === id ? { ...r, status: 'done' as const } : r),
      })),
      snooze: (id, newDueDate) => set((s) => ({
        reminders: s.reminders.map((r) =>
          r.id === id ? { ...r, status: 'snoozed' as const, dueDate: newDueDate } : r
        ),
      })),
      getUpcoming: (days) => {
        const now = new Date();
        const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return get().reminders.filter((r) => {
          if (r.status === 'done') return false;
          const due = new Date(r.dueDate);
          return due >= now && due <= cutoff;
        });
      },
    }),
    { name: 'dealflow-reminders' }
  )
);
