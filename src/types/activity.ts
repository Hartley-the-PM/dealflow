export type ActivityAction =
  | 'deal_created'
  | 'deal_updated'
  | 'deal_deleted'
  | 'offer_created'
  | 'offer_sent'
  | 'offer_approved'
  | 'offer_rejected'
  | 'offer_expired'
  | 'order_created'
  | 'pdf_generated'
  | 'status_changed'
  | 'note_added'
  | 'offer_shared'
  | 'buyer_accepted'
  | 'buyer_rejected'
  | 'buyer_counter_proposed';

export interface ActivityEntry {
  id: string;
  entityType: 'deal' | 'offer' | 'customer' | 'order';
  entityId: string;
  dealId: string | null;
  action: ActivityAction;
  details: string;
  userId: string;
  timestamp: string;
}
