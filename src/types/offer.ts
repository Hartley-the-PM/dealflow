export type OfferStatus = 'Draft' | 'Sent' | 'Pending' | 'Approved' | 'Rejected' | 'Expired';

export type Currency = 'USD' | 'EUR';
export type UnitOfMeasure = 'MT' | 'KG';
export type Incoterms = 'FCA' | 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DAP' | 'DDP';

export type BelowMSPReason = 'Volume commitment' | 'Strategic account' | 'Market conditions' | 'Competitive pressure' | 'Other';

export type OfferLineType = 'product' | 'white_label' | 'formulation';

export interface FormulationLinePart {
  ingredientId: string;
  ingredientName: string;
  percentage: number;
  role: string;
  selling: boolean; // true = selling this part, false = consulting only
}

export interface OfferLine {
  id: string;
  lineType: OfferLineType;
  productId: string; // catalog product ID (used when lineType === 'product')
  whiteLabelId: string; // WL product ID (used when lineType === 'white_label')
  formulationId: string; // formulation ID (used when lineType === 'formulation')
  formulationParts: FormulationLinePart[]; // ingredient-level selling/consulting breakdown
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
  modules?: import('./offerBuilder').OfferModule[];
  shareToken?: string;
  templateId?: string;
}
