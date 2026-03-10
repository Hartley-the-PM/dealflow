import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order } from '@/types';

interface OrderStore {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  getOrderByOffer: (offerId: string) => Order | undefined;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((s) => ({ orders: [...s.orders, order] })),
      getOrderByOffer: (offerId) => get().orders.find((o) => o.offerId === offerId),
    }),
    { name: 'dealflow-orders' }
  )
);
