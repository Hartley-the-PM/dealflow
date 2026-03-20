import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Certification } from '@/types/certification';

interface CertificationStore {
  certifications: Certification[];
  setCertifications: (certifications: Certification[]) => void;
  addCertification: (certification: Certification) => void;
  updateCertification: (id: string, updates: Partial<Certification>) => void;
  deleteCertification: (id: string) => void;
  getCertificationsByProduct: (productId: string) => Certification[];
  getCertificationById: (id: string) => Certification | undefined;
}

export const useCertificationStore = create<CertificationStore>()(
  persist(
    (set, get) => ({
      certifications: [],
      setCertifications: (certifications) => set({ certifications }),
      addCertification: (certification) =>
        set((s) => ({ certifications: [...s.certifications, certification] })),
      updateCertification: (id, updates) =>
        set((s) => ({
          certifications: s.certifications.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),
      deleteCertification: (id) =>
        set((s) => ({
          certifications: s.certifications.filter((c) => c.id !== id),
        })),
      getCertificationsByProduct: (productId) =>
        get().certifications.filter((c) => c.productId === productId),
      getCertificationById: (id) =>
        get().certifications.find((c) => c.id === id),
    }),
    { name: 'dealflow-certifications' }
  )
);
