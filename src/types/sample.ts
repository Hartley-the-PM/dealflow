export type SampleStatus = 'Requested' | 'Sent' | 'Received' | 'Approved' | 'Rejected';

export interface SampleLine {
  id: string;
  productId: string;
  productName: string; // for free-text fallback
  quantity: number | null;
  unit: 'MT' | 'KG' | 'g' | 'pcs';
  notes: string;
}

export interface Sample {
  id: string;
  dealId: string;
  name: string;
  status: SampleStatus;
  lines: SampleLine[];
  // Shipping
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  carrier: string;
  trackingNumber: string;
  // Dates
  requestedDate: string;
  sentDate: string | null;
  receivedDate: string | null;
  // Feedback
  feedback: string;
  feedbackRating: 'positive' | 'neutral' | 'negative' | null;
  // Meta
  requestedBy: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
