import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, UserRole } from '@/types';

interface SettingsStore {
  settings: AppSettings;
  updateRole: (role: UserRole) => void;
  updateUser: (user: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        currentRole: 'account_manager',
        currentUser: 'John Mitchell',
      },
      updateRole: (role) => set((s) => ({
        settings: { ...s.settings, currentRole: role },
      })),
      updateUser: (user) => set((s) => ({
        settings: { ...s.settings, currentUser: user },
      })),
    }),
    { name: 'dealflow-settings' }
  )
);
