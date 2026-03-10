export type OrderStatus = 'Created' | 'Confirmed' | 'Shipped' | 'Delivered';

export interface Order {
  id: string;
  orderNumber: string;
  offerId: string;
  dealId: string;
  customerId: string;
  status: OrderStatus;
  createdAt: string;
}
