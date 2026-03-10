export type CustomerTier = 'A' | 'B' | 'C';

export interface Customer {
  id: string;
  name: string;
  country: string;
  segment: string; // e.g. 'Packaging', 'Automotive', 'Construction', 'Agriculture'
  tier: CustomerTier;
  assignedAM: string; // Account Manager name
  address: string;
  email: string;
  phone: string;
  createdAt: string; // ISO date
}

export interface Contact {
  id: string;
  customerId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isPrimary: boolean;
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  createdBy: string;
  createdAt: string;
}
