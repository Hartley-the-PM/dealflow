export type OrderStatus = 'Draft' | 'Confirmed' | 'In Production' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface OrderLine {
  id: string;
  productId: string;
  quantity: number | null;
  unit: 'MT' | 'KG';
  pricePerUnit: number;
  currency: string;
}

export interface OrderDocument {
  id: string;
  name: string;
  type: 'Purchase Order' | 'Invoice' | 'Bill of Lading' | 'Certificate' | 'TDS' | 'SDS' | 'Shipping Docs' | 'Other';
  url: string; // data URL for uploaded files
  uploadedAt: string;
  uploadedBy: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  offerId: string | null;
  opportunityId: string | null;
  dealId: string;
  customerId: string;
  name: string;
  status: OrderStatus;
  lines: OrderLine[];
  currency: string;
  incoterms: string;
  incotermsLocation: string;
  paymentTerms: string;
  poNumber: string;
  orderDate: string;
  deliveryDate: string | null;
  shippingAddress: ShippingAddress;
  carrier: string;
  trackingNumber: string;
  estimatedArrival: string | null;
  documents: OrderDocument[];
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
