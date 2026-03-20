import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CompanyDocument, DocumentPackage, PackageTemplate, PackageView, DealDocument } from '@/types/document';

interface DocumentStore {
  companyDocuments: CompanyDocument[];
  packages: DocumentPackage[];
  templates: PackageTemplate[];
  dealDocuments: DealDocument[];

  // Company Documents
  addCompanyDocument: (doc: CompanyDocument) => void;
  updateCompanyDocument: (id: string, updates: Partial<CompanyDocument>) => void;
  deleteCompanyDocument: (id: string) => void;
  getCompanyDocumentById: (id: string) => CompanyDocument | undefined;

  // Packages
  addPackage: (pkg: DocumentPackage) => void;
  updatePackage: (id: string, updates: Partial<DocumentPackage>) => void;
  deletePackage: (id: string) => void;
  getPackageById: (id: string) => DocumentPackage | undefined;
  getPackageByToken: (token: string) => DocumentPackage | undefined;
  getPackagesByDeal: (dealId: string) => DocumentPackage[];
  addPackageView: (packageId: string, view: PackageView) => void;

  // Templates
  addTemplate: (template: PackageTemplate) => void;
  updateTemplate: (id: string, updates: Partial<PackageTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Deal Documents (ad-hoc uploads scoped to a deal)
  addDealDocument: (doc: DealDocument) => void;
  deleteDealDocument: (id: string) => void;
  getDealDocuments: (dealId: string) => DealDocument[];
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      companyDocuments: [],
      packages: [],
      templates: [],
      dealDocuments: [],

      // Company Documents
      addCompanyDocument: (doc) =>
        set((s) => ({ companyDocuments: [...s.companyDocuments, doc] })),
      updateCompanyDocument: (id, updates) =>
        set((s) => ({
          companyDocuments: s.companyDocuments.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        })),
      deleteCompanyDocument: (id) =>
        set((s) => ({
          companyDocuments: s.companyDocuments.filter((d) => d.id !== id),
        })),
      getCompanyDocumentById: (id) =>
        get().companyDocuments.find((d) => d.id === id),

      // Packages
      addPackage: (pkg) =>
        set((s) => ({ packages: [...s.packages, pkg] })),
      updatePackage: (id, updates) =>
        set((s) => ({
          packages: s.packages.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),
      deletePackage: (id) =>
        set((s) => ({
          packages: s.packages.filter((p) => p.id !== id),
        })),
      getPackageById: (id) =>
        get().packages.find((p) => p.id === id),
      getPackageByToken: (token) =>
        get().packages.find((p) => p.token === token),
      getPackagesByDeal: (dealId) =>
        get().packages.filter((p) => p.dealId === dealId),
      addPackageView: (packageId, view) =>
        set((s) => ({
          packages: s.packages.map((p) =>
            p.id === packageId
              ? { ...p, views: [...p.views, view], viewCount: p.viewCount + 1 }
              : p
          ),
        })),

      // Templates
      addTemplate: (template) =>
        set((s) => ({ templates: [...s.templates, template] })),
      updateTemplate: (id, updates) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),
      deleteTemplate: (id) =>
        set((s) => ({
          templates: s.templates.filter((t) => t.id !== id),
        })),

      // Deal Documents
      addDealDocument: (doc) =>
        set((s) => ({ dealDocuments: [...s.dealDocuments, doc] })),
      deleteDealDocument: (id) =>
        set((s) => ({
          dealDocuments: s.dealDocuments.filter((d) => d.id !== id),
        })),
      getDealDocuments: (dealId) =>
        get().dealDocuments.filter((d) => d.dealId === dealId),
    }),
    { name: 'dealflow-documents' }
  )
);
