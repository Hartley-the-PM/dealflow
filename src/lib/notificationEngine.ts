import { v4 as uuidv4 } from 'uuid';
import type { Deal } from '@/types/deal';
import type { Offer } from '@/types/offer';
import type { MSPEntry } from '@/types/pricing';
import type { ActivityEntry } from '@/types/activity';
import type { Order } from '@/types/order';
import type {
  Notification,
  NotificationSettings,
  NotificationTrigger,
  NotificationCategory,
  NotificationPriority,
} from '@/types/notification';
import type { BuyerResponse } from '@/types/offerBuilder';

function makeNotification(
  trigger: NotificationTrigger,
  category: NotificationCategory,
  priority: NotificationPriority,
  title: string,
  message: string,
  dealId: string | null,
  offerId: string | null,
  fingerprintSuffix: string
): Notification {
  return {
    id: uuidv4(),
    trigger,
    category,
    priority,
    status: 'unread',
    title,
    message,
    dealId,
    offerId,
    fingerprint: `${trigger}:${fingerprintSuffix}`,
    createdAt: new Date().toISOString(),
    readAt: null,
    snoozedUntil: null,
  };
}

function daysBetween(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
}

function daysUntil(dateStr: string, now: Date): number {
  const d = new Date(dateStr);
  return (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
}

interface EngineInput {
  deals: Deal[];
  offers: Offer[];
  mspEntries: MSPEntry[];
  activities: ActivityEntry[];
  orders: Order[];
  settings: NotificationSettings;
  buyerResponses?: BuyerResponse[];
}

export function generateNotifications(input: EngineInput): Notification[] {
  const { deals, offers, mspEntries, activities, orders, settings, buyerResponses } = input;
  const now = new Date();
  const notifications: Notification[] = [];

  if (!settings.enabled) return notifications;

  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Helper: get offers for a deal
  const offersByDeal = new Map<string, Offer[]>();
  offers.forEach((o) => {
    const list = offersByDeal.get(o.dealId) || [];
    list.push(o);
    offersByDeal.set(o.dealId, list);
  });

  // Helper: get MSP for product
  const mspMap = new Map<string, number>();
  mspEntries.forEach((e) => {
    if (e.month === currentMonth) {
      mspMap.set(e.productId, e.price);
    }
  });

  // Helper: latest activity timestamp per deal
  const lastActivityByDeal = new Map<string, string>();
  activities.forEach((a) => {
    if (a.dealId) {
      const existing = lastActivityByDeal.get(a.dealId);
      if (!existing || a.timestamp > existing) {
        lastActivityByDeal.set(a.dealId, a.timestamp);
      }
    }
  });

  // Helper: orders by deal
  const ordersByDeal = new Map<string, Order[]>();
  orders.forEach((o) => {
    const list = ordersByDeal.get(o.dealId) || [];
    list.push(o);
    ordersByDeal.set(o.dealId, list);
  });

  for (const deal of deals) {
    const dealOffers = offersByDeal.get(deal.id) || [];

    // 1. offer_validity_expiring
    dealOffers.forEach((offer) => {
      if (offer.validityDate && (offer.status === 'Sent' || offer.status === 'Pending')) {
        const days = daysUntil(offer.validityDate, now);
        if (days >= 0 && days <= settings.offerValidityDays) {
          notifications.push(
            makeNotification(
              'offer_validity_expiring',
              'time_based',
              'high',
              'Offer Expiring Soon',
              `"${offer.name}" (V${offer.version}) expires in ${Math.ceil(days)} day${Math.ceil(days) !== 1 ? 's' : ''}`,
              deal.id,
              offer.id,
              offer.id
            )
          );
        }
      }
    });

    // 2. deal_inactive
    const lastActivity = lastActivityByDeal.get(deal.id) || deal.updatedAt;
    if (deal.status === 'Active' || deal.status === 'Draft') {
      const inactiveDays = daysBetween(lastActivity, now);
      if (inactiveDays >= settings.dealInactiveDays) {
        notifications.push(
          makeNotification(
            'deal_inactive',
            'time_based',
            'medium',
            'Deal Inactive',
            `"${deal.name}" has had no activity for ${Math.floor(inactiveDays)} days`,
            deal.id,
            null,
            deal.id
          )
        );
      }
    }

    // 3. follow_up_due
    dealOffers.forEach((offer) => {
      if (offer.status === 'Sent' && offer.sentAt) {
        const daysSinceSent = daysBetween(offer.sentAt, now);
        if (daysSinceSent >= settings.followUpDays) {
          notifications.push(
            makeNotification(
              'follow_up_due',
              'time_based',
              'medium',
              'Follow Up Due',
              `"${offer.name}" was sent ${Math.floor(daysSinceSent)} days ago — time to follow up`,
              deal.id,
              offer.id,
              offer.id
            )
          );
        }
      }
    });

    // 4. offer_no_response
    dealOffers.forEach((offer) => {
      if (offer.status === 'Sent' && offer.sentAt) {
        const daysSinceSent = daysBetween(offer.sentAt, now);
        if (daysSinceSent >= settings.offerNoResponseDays) {
          notifications.push(
            makeNotification(
              'offer_no_response',
              'status_based',
              'high',
              'No Response on Offer',
              `"${offer.name}" has been sent for ${Math.floor(daysSinceSent)} days with no response`,
              deal.id,
              offer.id,
              offer.id
            )
          );
        }
      }
    });

    // 5. deal_stuck_draft
    if (deal.status === 'Draft') {
      const daysInDraft = daysBetween(deal.createdAt, now);
      if (daysInDraft >= settings.dealStuckDraftDays) {
        notifications.push(
          makeNotification(
            'deal_stuck_draft',
            'status_based',
            'medium',
            'Deal Stuck in Draft',
            `"${deal.name}" has been in Draft for ${Math.floor(daysInDraft)} days`,
            deal.id,
            null,
            deal.id
          )
        );
      }
    }

    // 6. rejected_needs_revision
    dealOffers.forEach((offer) => {
      if (offer.status === 'Rejected') {
        const hasNewerVersion = dealOffers.some(
          (o) => o.version > offer.version
        );
        if (!hasNewerVersion) {
          notifications.push(
            makeNotification(
              'rejected_needs_revision',
              'status_based',
              'high',
              'Rejected Offer Needs Revision',
              `"${offer.name}" was rejected — create a new version`,
              deal.id,
              offer.id,
              offer.id
            )
          );
        }
      }
    });

    // 7. msp_changed_since_offer
    dealOffers.forEach((offer) => {
      if (offer.status === 'Sent' || offer.status === 'Pending') {
        offer.lines.forEach((line) => {
          const currentMSP = mspMap.get(line.productId);
          if (currentMSP !== undefined) {
            // Check if the MSP entry was updated after the offer was created
            const mspEntry = mspEntries.find(
              (e) => e.productId === line.productId && e.month === currentMonth
            );
            if (mspEntry && mspEntry.updatedAt > offer.createdAt) {
              notifications.push(
                makeNotification(
                  'msp_changed_since_offer',
                  'pricing',
                  'high',
                  'MSP Changed Since Offer',
                  `MSP for a product in "${offer.name}" has been updated since the offer was created`,
                  deal.id,
                  offer.id,
                  `${offer.id}:${line.productId}`
                )
              );
            }
          }
        });
      }
    });

    // 8. margin_below_threshold
    dealOffers.forEach((offer) => {
      if (offer.status === 'Draft' || offer.status === 'Sent' || offer.status === 'Pending') {
        offer.lines.forEach((line) => {
          const msp = mspMap.get(line.productId);
          if (msp !== undefined && line.pricePerUnit > 0) {
            const marginPct = ((line.pricePerUnit - msp) / line.pricePerUnit) * 100;
            if (marginPct < settings.marginThresholdPct) {
              notifications.push(
                makeNotification(
                  'margin_below_threshold',
                  'pricing',
                  'critical',
                  'Low Margin Alert',
                  `Line in "${offer.name}" has ${marginPct.toFixed(1)}% margin (threshold: ${settings.marginThresholdPct}%)`,
                  deal.id,
                  offer.id,
                  `${offer.id}:${line.id}`
                )
              );
            }
          }
        });
      }
    });

    // 9. deal_value_threshold
    const totalValue = dealOffers.reduce((sum, offer) => {
      if (offer.status === 'Draft' || offer.status === 'Sent' || offer.status === 'Pending' || offer.status === 'Approved') {
        const offerValue = offer.lines.reduce((lineSum, line) => {
          return lineSum + (line.quantity ?? 0) * line.pricePerUnit;
        }, 0);
        return Math.max(sum, offerValue);
      }
      return sum;
    }, 0);
    if (totalValue >= settings.dealValueThreshold) {
      notifications.push(
        makeNotification(
          'deal_value_threshold',
          'milestone',
          'low',
          'High-Value Deal',
          `"${deal.name}" has crossed $${(settings.dealValueThreshold / 1000).toFixed(0)}K in value`,
          deal.id,
          null,
          deal.id
        )
      );
    }

    // 10. all_offers_rejected
    if (dealOffers.length > 0 && dealOffers.every((o) => o.status === 'Rejected')) {
      notifications.push(
        makeNotification(
          'all_offers_rejected',
          'milestone',
          'critical',
          'All Offers Rejected',
          `Every offer on "${deal.name}" has been rejected`,
          deal.id,
          null,
          deal.id
        )
      );
    }

    // 11. first_order_created
    const dealOrders = ordersByDeal.get(deal.id) || [];
    if (dealOrders.length === 1) {
      notifications.push(
        makeNotification(
          'first_order_created',
          'milestone',
          'low',
          'First Order Created',
          `Order created for "${deal.name}"`,
          deal.id,
          null,
          `order:${deal.id}`
        )
      );
    }
  }

  // Buyer response notifications
  if (buyerResponses) {
    buyerResponses.forEach((response) => {
      if (response.type === 'counter_proposal') {
        notifications.push(
          makeNotification(
            'buyer_counter_proposed',
            'buyer',
            'high',
            'Buyer Counter-Proposal',
            `${response.buyerName} submitted a counter-proposal on an offer`,
            null,
            response.offerId,
            `buyer_counter:${response.id}`
          )
        );
      } else if (response.type === 'accept') {
        notifications.push(
          makeNotification(
            'buyer_accepted',
            'buyer',
            'critical',
            'Buyer Accepted Offer',
            `${response.buyerName} accepted the offer`,
            null,
            response.offerId,
            `buyer_accept:${response.id}`
          )
        );
      } else if (response.type === 'reject') {
        notifications.push(
          makeNotification(
            'buyer_rejected',
            'buyer',
            'high',
            'Buyer Rejected Offer',
            `${response.buyerName} rejected the offer`,
            null,
            response.offerId,
            `buyer_reject:${response.id}`
          )
        );
      }
    });
  }

  return notifications;
}
