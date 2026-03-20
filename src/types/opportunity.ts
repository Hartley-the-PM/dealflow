export type OpportunityStatus = 'Open' | 'Qualified' | 'Converted' | 'Lost';
export type OpportunitySource = 'Email' | 'Phone' | 'Website' | 'Referral' | 'Trade Show' | 'Other';
export type OpportunityPriority = 'Low' | 'Medium' | 'High';

export interface OpportunityLine {
  id: string;
  productId: string;
  productName: string;          // free-text product name (for products not in catalog)
  estimatedQty: number | null;  // MT
  targetPrice: number | null;   // $/MT
  notes: string;
}

export interface Opportunity {
  id: string;
  dealId: string;
  title: string;
  status: OpportunityStatus;
  source: OpportunitySource;
  priority: OpportunityPriority;
  lines: OpportunityLine[];
  contactName: string;
  contactEmail: string;
  estimatedValue: number | null;
  probability: number;           // 0-100 percentage
  competitorInfo: string;
  expectedCloseDate: string | null;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  convertedOfferId: string | null;   // links to the offer if converted
  convertedOrderId: string | null;   // links to the order if converted
}
