import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order } from '@/types';

interface OrderStore {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrderByOffer: (offerId: string) => Order | undefined;
  getOrdersByDeal: (dealId: string) => Order[];
  getOrderById: (id: string) => Order | undefined;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((s) => ({ orders: [...s.orders, order] })),
      updateOrder: (id, updates) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, ...updates } : o)),
        })),
      deleteOrder: (id) =>
        set((s) => ({
          orders: s.orders.filter((o) => o.id !== id),
        })),
      getOrderByOffer: (offerId) => get().orders.find((o) => o.offerId === offerId),
      getOrdersByDeal: (dealId) => get().orders.filter((o) => o.dealId === dealId),
      getOrderById: (id) => get().orders.find((o) => o.id === id),
    }),
    { name: 'dealflow-orders' }
  )
);
