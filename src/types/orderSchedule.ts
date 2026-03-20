export type ScheduleFrequency = 'Weekly' | 'Biweekly' | 'Monthly' | 'Custom' | 'Specific Dates';

export type OrderScheduleStatus = 'Active' | 'Paused' | 'Completed' | 'Cancelled';

export interface ScheduledOrderEntry {
  id: string;
  sequenceNumber: number;
  deliveryDate: string;
  status: 'Pending' | 'Created' | 'Skipped';
  orderId: string | null; // links to created order
}

export interface OrderSchedule {
  id: string;
  dealId: string;
  name: string;
  productId: string;
  quantity: number;
  unit: 'MT' | 'KG';
  pricePerUnit: number;
  currency: string;
  frequency: ScheduleFrequency;
  customIntervalDays: number | null; // only when frequency === 'Custom'
  startDate: string;
  totalOrders: number;
  entries: ScheduledOrderEntry[];
  status: OrderScheduleStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
