export type OfferStatus = 'Draft' | 'Sent' | 'Pending' | 'Approved' | 'Rejected' | 'Expired';

export type Currency = 'USD' | 'EUR';
export type UnitOfMeasure = 'MT' | 'KG';
export type Incoterms = 'FCA' | 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DAP' | 'DDP';

export type BelowMSPReason = 'Volume commitment' | 'Strategic account' | 'Market conditions' | 'Competitive pressure' | 'Other';

export interface OfferLine {
  id: string;
  productId: string;
  quantity: number | null;
  unit: UnitOfMeasure;
  pricePerUnit: number;
  currency: Currency;
  incoterms: Incoterms;
  paymentTerms: string;
  belowMSPReason: BelowMSPReason | null;
  belowMSPNote: string;
}

export interface Offer {
  id: string;
  dealId: string;
  version: number;
  name: string;
  status: OfferStatus;
  currency: Currency;
  incoterms: Incoterms;
  incotermsLocation: string;
  paymentTerms: string;
  validityDate: string;
  notes: string;
  lines: OfferLine[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
}
