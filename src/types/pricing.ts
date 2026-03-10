export interface MSPEntry {
  id: string;
  productId: string;
  month: string; // YYYY-MM format
  price: number;
  currency: 'USD' | 'EUR';
  updatedAt: string;
}
