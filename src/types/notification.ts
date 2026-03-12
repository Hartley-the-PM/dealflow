export type NotificationCategory = 'time_based' | 'status_based' | 'pricing' | 'milestone' | 'buyer';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export type NotificationStatus = 'unread' | 'read' | 'snoozed' | 'dismissed';

export type NotificationTrigger =
  | 'offer_validity_expiring'
  | 'deal_inactive'
  | 'follow_up_due'
  | 'offer_no_response'
  | 'deal_stuck_draft'
  | 'rejected_needs_revision'
  | 'msp_changed_since_offer'
  | 'margin_below_threshold'
  | 'deal_value_threshold'
  | 'all_offers_rejected'
  | 'first_order_created'
  | 'buyer_counter_proposed'
  | 'buyer_accepted'
  | 'buyer_rejected';

export interface Notification {
  id: string;
  trigger: NotificationTrigger;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  dealId: string | null;
  offerId: string | null;
  fingerprint: string; // dedup key
  createdAt: string;
  readAt: string | null;
  snoozedUntil: string | null;
}

export interface NotificationSettings {
  enabled: boolean;
  offerValidityDays: number;
  dealInactiveDays: number;
  followUpDays: number;
  offerNoResponseDays: number;
  dealStuckDraftDays: number;
  marginThresholdPct: number;
  dealValueThreshold: number;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  offerValidityDays: 3,
  dealInactiveDays: 14,
  followUpDays: 5,
  offerNoResponseDays: 7,
  dealStuckDraftDays: 10,
  marginThresholdPct: 5,
  dealValueThreshold: 100000,
};
