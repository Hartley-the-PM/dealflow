import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OfferShareLink, BuyerResponse } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

interface OfferShareStore {
  shareLinks: OfferShareLink[];
  buyerResponses: BuyerResponse[];
  createShareLink: (offerId: string, dealId: string, createdBy: string) => OfferShareLink;
  getShareLinkByToken: (token: string) => OfferShareLink | undefined;
  getShareLinksByOffer: (offerId: string) => OfferShareLink[];
  addBuyerResponse: (response: BuyerResponse) => void;
  getBuyerResponsesByOffer: (offerId: string) => BuyerResponse[];
  getUnreadBuyerResponses: () => BuyerResponse[];
}

export const useOfferShareStore = create<OfferShareStore>()(
  persist(
    (set, get) => ({
      shareLinks: [],
      buyerResponses: [],

      createShareLink: (offerId, dealId, createdBy) => {
        const link: OfferShareLink = {
          id: uuidv4(),
          offerId,
          dealId,
          token: uuidv4().replace(/-/g, ''),
          createdAt: new Date().toISOString(),
          createdBy,
        };
        set((s) => ({ shareLinks: [...s.shareLinks, link] }));
        return link;
      },

      getShareLinkByToken: (token) =>
        get().shareLinks.find((l) => l.token === token),

      getShareLinksByOffer: (offerId) =>
        get().shareLinks.filter((l) => l.offerId === offerId),

      addBuyerResponse: (response) =>
        set((s) => ({ buyerResponses: [...s.buyerResponses, response] })),

      getBuyerResponsesByOffer: (offerId) =>
        get().buyerResponses.filter((r) => r.offerId === offerId),

      getUnreadBuyerResponses: () => get().buyerResponses,
    }),
    { name: 'dealflow-offer-shares' }
  )
);
