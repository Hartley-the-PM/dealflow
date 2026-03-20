import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WhiteLabelBrand, WhiteLabelProduct } from '@/types';

interface WhiteLabelStore {
  brands: WhiteLabelBrand[];
  setBrands: (brands: WhiteLabelBrand[]) => void;
  addBrand: (brand: WhiteLabelBrand) => void;
  updateBrand: (id: string, updates: Partial<WhiteLabelBrand>) => void;
  deleteBrand: (id: string) => void;
  getBrandById: (id: string) => WhiteLabelBrand | undefined;
  products: WhiteLabelProduct[];
  setProducts: (products: WhiteLabelProduct[]) => void;
  addProduct: (product: WhiteLabelProduct) => void;
  updateProduct: (id: string, updates: Partial<WhiteLabelProduct>) => void;
  deleteProduct: (id: string) => void;
  getProductsByBrand: (brandId: string) => WhiteLabelProduct[];
}

export const useWhiteLabelStore = create<WhiteLabelStore>()(
  persist(
    (set, get) => ({
      brands: [],
      setBrands: (brands) => set({ brands }),
      addBrand: (brand) =>
        set((s) => ({ brands: [...s.brands, brand] })),
      updateBrand: (id, updates) =>
        set((s) => ({
          brands: s.brands.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),
      deleteBrand: (id) =>
        set((s) => ({
          brands: s.brands.filter((b) => b.id !== id),
        })),
      getBrandById: (id) => get().brands.find((b) => b.id === id),
      products: [],
      setProducts: (products) => set({ products }),
      addProduct: (product) =>
        set((s) => ({ products: [...s.products, product] })),
      updateProduct: (id, updates) =>
        set((s) => ({
          products: s.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
        })),
      getProductsByBrand: (brandId) =>
        get().products.filter((p) => p.brandId === brandId),
    }),
    { name: 'dealflow-white-labels' }
  )
);
