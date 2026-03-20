import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NotificationPref {
  eventType: string;
  label: string;
  description: string;
  inApp: boolean;
  email: boolean;
}

interface NotificationPrefsState {
  preferences: NotificationPref[];
  updatePref: (eventType: string, field: 'inApp' | 'email', value: boolean) => void;
  toggleAll: (field: 'inApp' | 'email', value: boolean) => void;
}

const DEFAULT_PREFS: NotificationPref[] = [
  { eventType: 'buyer_response', label: 'Buyer Response', description: 'When a buyer accepts, declines, or requests changes on an offer', inApp: true, email: true },
  { eventType: 'deal_status_change', label: 'Deal Status Changed', description: 'When a deal moves to a new pipeline stage', inApp: true, email: false },
  { eventType: 'offer_expiring', label: 'Offer Expiring', description: 'When an offer is approaching its validity date', inApp: true, email: true },
  { eventType: 'reminder_due', label: 'Reminder Due', description: 'When a scheduled reminder is triggered', inApp: true, email: true },
  { eventType: 'copilot_draft', label: 'Copilot Draft Ready', description: 'When the AI copilot creates a new draft for review', inApp: true, email: false },
  { eventType: 'new_opportunity', label: 'New Opportunity', description: 'When a new opportunity is added to a deal', inApp: true, email: false },
  { eventType: 'order_created', label: 'Order Created', description: 'When a new order is placed', inApp: true, email: true },
  { eventType: 'deal_inactive', label: 'Deal Inactive', description: 'When a deal has had no activity for a set period', inApp: true, email: false },
];

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFS,

      updatePref: (eventType, field, value) =>
        set((s) => ({
          preferences: s.preferences.map((p) =>
            p.eventType === eventType ? { ...p, [field]: value } : p
          ),
        })),

      toggleAll: (field, value) =>
        set((s) => ({
          preferences: s.preferences.map((p) => ({ ...p, [field]: value })),
        })),
    }),
    { name: 'dealflow-notification-prefs' }
  )
);
