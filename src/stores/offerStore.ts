import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Offer } from '@/types';

interface OfferStore {
  offers: Offer[];
  setOffers: (offers: Offer[]) => void;
  addOffer: (offer: Offer) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  getOfferById: (id: string) => Offer | undefined;
  getOffersByDeal: (dealId: string) => Offer[];
  getLatestOfferForDeal: (dealId: string) => Offer | undefined;
  duplicateAsNewVersion: (offerId: string, newId: string) => Offer | undefined;
}

export const useOfferStore = create<OfferStore>()(
  persist(
    (set, get) => ({
      offers: [],
      setOffers: (offers) => set({ offers }),
      addOffer: (offer) => set((s) => ({ offers: [...s.offers, offer] })),
      updateOffer: (id, updates) => set((s) => ({
        offers: s.offers.map((o) => o.id === id ? { ...o, ...updates } : o),
      })),
      getOfferById: (id) => get().offers.find((o) => o.id === id),
      getOffersByDeal: (dealId) => get().offers.filter((o) => o.dealId === dealId),
      getLatestOfferForDeal: (dealId) => {
        const dealOffers = get().offers.filter((o) => o.dealId === dealId);
        if (dealOffers.length === 0) return undefined;
        return dealOffers.reduce((latest, o) => o.version > latest.version ? o : latest);
      },
      duplicateAsNewVersion: (offerId, newId) => {
        const source = get().offers.find((o) => o.id === offerId);
        if (!source) return undefined;
        const now = new Date().toISOString();
        const newOffer: Offer = {
          ...source,
          id: newId,
          version: source.version + 1,
          status: 'Draft',
          sentAt: null,
          createdAt: now,
          updatedAt: now,
          lines: source.lines.map((line) => ({ ...line })),
        };
        set((s) => ({ offers: [...s.offers, newOffer] }));
        return newOffer;
      },
    }),
    { name: 'dealflow-offers' }
  )
);
