export type DealStatus = 'Draft' | 'Active' | 'Won' | 'Lost' | 'Expired';

export interface Deal {
  id: string;
  customerId: string;
  name: string;
  status: DealStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
