import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OfferAnalyticsSession, OfferAnalyticsEvent } from '@/types/offerBuilder';

interface AnalyticsSummary {
  viewCount: number;
  avgTimeOnPage: number;
  lastViewed: string | null;
  sectionEngagement: Record<string, number>; // section name -> view count
  clickBreakdown: Record<string, number>; // target -> click count
}

interface OfferAnalyticsStore {
  sessions: OfferAnalyticsSession[];
  addSession: (session: OfferAnalyticsSession) => void;
  updateSession: (sessionId: string, updates: Partial<OfferAnalyticsSession>) => void;
  addEvent: (sessionId: string, event: OfferAnalyticsEvent) => void;
  getByOffer: (offerId: string) => OfferAnalyticsSession[];
  getSummary: (offerId: string) => AnalyticsSummary;
}

export const useOfferAnalyticsStore = create<OfferAnalyticsStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (session) =>
        set((s) => ({ sessions: [...s.sessions, session] })),

      updateSession: (sessionId, updates) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, ...updates } : sess
          ),
        })),

      addEvent: (sessionId, event) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, events: [...sess.events, event] }
              : sess
          ),
        })),

      getByOffer: (offerId) =>
        get().sessions.filter((s) => s.offerId === offerId),

      getSummary: (offerId) => {
        const offerSessions = get().sessions.filter((s) => s.offerId === offerId);
        const viewCount = offerSessions.length;
        const avgTimeOnPage =
          viewCount > 0
            ? offerSessions.reduce((sum, s) => sum + s.timeOnPageSeconds, 0) / viewCount
            : 0;
        const lastViewed =
          offerSessions.length > 0
            ? offerSessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0].startedAt
            : null;

        const sectionEngagement: Record<string, number> = {};
        const clickBreakdown: Record<string, number> = {};

        offerSessions.forEach((sess) => {
          sess.events.forEach((evt) => {
            if (evt.type === 'section_view') {
              sectionEngagement[evt.target] = (sectionEngagement[evt.target] || 0) + 1;
            }
            if (evt.type === 'click') {
              clickBreakdown[evt.target] = (clickBreakdown[evt.target] || 0) + 1;
            }
          });
        });

        return { viewCount, avgTimeOnPage, lastViewed, sectionEngagement, clickBreakdown };
      },
    }),
    { name: 'dealflow-offer-analytics' }
  )
);
