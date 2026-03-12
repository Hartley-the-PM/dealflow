'use client';

import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useDealStore } from '@/stores/dealStore';
import { useOfferStore } from '@/stores/offerStore';
import { usePricingStore } from '@/stores/pricingStore';
import { useActivityStore } from '@/stores/activityStore';
import { useOrderStore } from '@/stores/orderStore';
import { generateNotifications } from '@/lib/notificationEngine';

const INTERVAL_MS = 60_000; // 60 seconds

export function useNotificationEngine() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const deals = useDealStore((s) => s.deals);
  const offers = useOfferStore((s) => s.offers);
  const mspEntries = usePricingStore((s) => s.entries);
  const activities = useActivityStore((s) => s.activities);
  const orders = useOrderStore((s) => s.orders);
  const notifSettings = useNotificationStore((s) => s.settings);
  const addNotifications = useNotificationStore((s) => s.addNotifications);

  const runEngine = () => {
    let buyerResponses;
    try {
      // Dynamically access offerShareStore if available
      const { useOfferShareStore } = require('@/stores/offerShareStore');
      const shareState = useOfferShareStore.getState();
      buyerResponses = shareState.buyerResponses;
    } catch {
      buyerResponses = undefined;
    }

    const newNotifications = generateNotifications({
      deals,
      offers,
      mspEntries,
      activities,
      orders,
      settings: notifSettings,
      buyerResponses,
    });

    if (newNotifications.length > 0) {
      addNotifications(newNotifications);
    }
  };

  useEffect(() => {
    // Run immediately on mount
    runEngine();

    // Set up interval
    intervalRef.current = setInterval(runEngine, INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deals, offers, mspEntries, activities, orders, notifSettings]);
}
