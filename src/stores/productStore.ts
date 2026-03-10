import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types';

interface ProductStore {
  products: Product[];
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  getProductById: (id: string) => Product | undefined;
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      products: [],
      setProducts: (products) => set({ products }),
      addProduct: (product) => set((s) => ({ products: [...s.products, product] })),
      updateProduct: (id, updates) => set((s) => ({
        products: s.products.map((p) => p.id === id ? { ...p, ...updates } : p),
      })),
      getProductById: (id) => get().products.find((p) => p.id === id),
    }),
    { name: 'dealflow-products' }
  )
);
