import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification, NotificationSettings, NotificationStatus } from '@/types/notification';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/types/notification';

interface NotificationStore {
  notifications: Notification[];
  settings: NotificationSettings;
  setSettings: (settings: Partial<NotificationSettings>) => void;
  addNotification: (notification: Notification) => void;
  addNotifications: (notifications: Notification[]) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  snooze: (id: string, until: string) => void;
  dismiss: (id: string) => void;
  getUnread: () => Notification[];
  getByDeal: (dealId: string) => Notification[];
  getActiveCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      settings: DEFAULT_NOTIFICATION_SETTINGS,

      setSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),

      addNotification: (notification) =>
        set((s) => {
          const exists = s.notifications.some(
            (n) => n.fingerprint === notification.fingerprint && n.status !== 'dismissed'
          );
          if (exists) return s;
          return { notifications: [notification, ...s.notifications] };
        }),

      addNotifications: (newNotifications) =>
        set((s) => {
          const existingFingerprints = new Set(
            s.notifications
              .filter((n) => n.status !== 'dismissed')
              .map((n) => n.fingerprint)
          );
          const unique = newNotifications.filter(
            (n) => !existingFingerprints.has(n.fingerprint)
          );
          if (unique.length === 0) return s;
          return { notifications: [...unique, ...s.notifications] };
        }),

      markRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, status: 'read' as NotificationStatus, readAt: new Date().toISOString() } : n
          ),
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.status === 'unread'
              ? { ...n, status: 'read' as NotificationStatus, readAt: new Date().toISOString() }
              : n
          ),
        })),

      snooze: (id, until) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, status: 'snoozed' as NotificationStatus, snoozedUntil: until } : n
          ),
        })),

      dismiss: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, status: 'dismissed' as NotificationStatus } : n
          ),
        })),

      getUnread: () =>
        get().notifications.filter((n) => n.status === 'unread'),

      getByDeal: (dealId) =>
        get().notifications.filter(
          (n) => n.dealId === dealId && n.status !== 'dismissed'
        ),

      getActiveCount: () =>
        get().notifications.filter(
          (n) => n.status === 'unread' || n.status === 'snoozed'
        ).length,
    }),
    { name: 'dealflow-notifications' }
  )
);
