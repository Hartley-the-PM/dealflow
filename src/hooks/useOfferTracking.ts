'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useOfferAnalyticsStore } from '@/stores/offerAnalyticsStore';
import type { OfferAnalyticsEvent, OfferAnalyticsSession } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

interface UseOfferTrackingOptions {
  offerId: string;
  token: string;
}

export function useOfferTracking({ offerId, token }: UseOfferTrackingOptions) {
  const sessionIdRef = useRef(uuidv4());
  const startTimeRef = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const addSession = useOfferAnalyticsStore((s) => s.addSession);
  const updateSession = useOfferAnalyticsStore((s) => s.updateSession);
  const addEvent = useOfferAnalyticsStore((s) => s.addEvent);

  // Create session on mount
  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const device = navigator.userAgent;
    const viewport = `${window.innerWidth}x${window.innerHeight}`;

    const session: OfferAnalyticsSession = {
      id: sessionId,
      offerId,
      token,
      startedAt: new Date().toISOString(),
      endedAt: null,
      device,
      viewport,
      events: [],
      maxScrollDepth: 0,
      timeOnPageSeconds: 0,
    };
    addSession(session);

    // Page view event
    const pageViewEvent: OfferAnalyticsEvent = {
      id: uuidv4(),
      sessionId,
      offerId,
      token,
      type: 'page_view',
      target: 'offer_page',
      value: 1,
      timestamp: new Date().toISOString(),
    };
    addEvent(sessionId, pageViewEvent);

    // Scroll depth tracking
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const depth = Math.round((window.scrollY / scrollHeight) * 100);
        if (depth > maxScrollRef.current) {
          maxScrollRef.current = depth;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);

    // End session on unmount or beforeunload
    const endSession = () => {
      const timeOnPage = Math.round((Date.now() - startTimeRef.current) / 1000);

      // Time on page event
      addEvent(sessionId, {
        id: uuidv4(),
        sessionId,
        offerId,
        token,
        type: 'time_on_page',
        target: 'total',
        value: timeOnPage,
        timestamp: new Date().toISOString(),
      });

      // Scroll depth event
      addEvent(sessionId, {
        id: uuidv4(),
        sessionId,
        offerId,
        token,
        type: 'scroll_depth',
        target: 'max',
        value: maxScrollRef.current,
        timestamp: new Date().toISOString(),
      });

      updateSession(sessionId, {
        endedAt: new Date().toISOString(),
        maxScrollDepth: maxScrollRef.current,
        timeOnPageSeconds: timeOnPage,
      });
    };

    window.addEventListener('beforeunload', endSession);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', endSession);
      endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offerId, token]);

  // Track section visibility
  const trackSectionView = useCallback(
    (sectionName: string) => {
      addEvent(sessionIdRef.current, {
        id: uuidv4(),
        sessionId: sessionIdRef.current,
        offerId,
        token,
        type: 'section_view',
        target: sectionName,
        value: 1,
        timestamp: new Date().toISOString(),
      });
    },
    [offerId, token, addEvent]
  );

  // Track clicks
  const trackClick = useCallback(
    (target: string) => {
      addEvent(sessionIdRef.current, {
        id: uuidv4(),
        sessionId: sessionIdRef.current,
        offerId,
        token,
        type: 'click',
        target,
        value: 1,
        timestamp: new Date().toISOString(),
      });
    },
    [offerId, token, addEvent]
  );

  // Setup IntersectionObserver for sections
  const observeSections = useCallback(
    (containerRef: HTMLElement | null) => {
      if (!containerRef) return;
      const sections = containerRef.querySelectorAll('[data-section]');
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const sectionName = (entry.target as HTMLElement).dataset.section;
              if (sectionName) {
                trackSectionView(sectionName);
              }
            }
          });
        },
        { threshold: 0.5 }
      );
      sections.forEach((section) => observer.observe(section));
      return () => observer.disconnect();
    },
    [trackSectionView]
  );

  return { trackClick, trackSectionView, observeSections, sessionId: sessionIdRef.current };
}
