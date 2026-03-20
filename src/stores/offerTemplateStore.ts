import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OfferTemplate, OfferModule } from '@/types/offerBuilder';
import { v4 as uuidv4 } from 'uuid';

function makeDefaultModules(variant: 'standard' | 'premium' | 'quick'): OfferModule[] {
  const hero: OfferModule = {
    type: 'hero', id: uuidv4(), visible: true,
    title: '', customerName: '', date: '', intro: '', logoUrl: '',
  };
  const products: OfferModule = {
    type: 'products', id: uuidv4(), visible: true,
    showQuantity: true, showUnit: true, showUnitPrice: true, showTotal: true, entries: [],
  };
  const terms: OfferModule = {
    type: 'terms', id: uuidv4(), visible: true,
    paymentTerms: '', incoterms: '', validity: '', delivery: '', legalNotes: '',
  };
  const customText: OfferModule = {
    type: 'custom_text', id: uuidv4(), visible: true,
    heading: '', body: '',
  };
  const about: OfferModule = {
    type: 'company_about', id: uuidv4(), visible: true,
    mission: '', certifications: [], differentiators: [],
  };
  const testimonials: OfferModule = {
    type: 'testimonials', id: uuidv4(), visible: true,
    testimonials: [],
  };
  const coverImage: OfferModule = {
    type: 'cover_image', id: uuidv4(), visible: true,
    backgroundImageUrl: '', title: '', subtitle: '', overlayOpacity: 0.5, overlayColor: '#000000',
  };
  const divider: OfferModule = {
    type: 'divider', id: uuidv4(), visible: true,
    style: 'line', height: 32,
  };

  if (variant === 'standard') {
    return [hero, products, terms, customText];
  }
  if (variant === 'premium') {
    return [coverImage, products, { ...divider, id: uuidv4() }, terms, { ...divider, id: uuidv4() }, about, testimonials, customText];
  }
  // quick
  return [products, terms];
}

const PRESET_TEMPLATES: OfferTemplate[] = [
  {
    id: 'preset-standard',
    name: 'Standard Offer',
    description: 'Cover page, product lines, terms, and notes',
    modules: makeDefaultModules('standard'),
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-premium',
    name: 'Premium Proposal',
    description: 'Full proposal with showcase, about us, and testimonials',
    modules: makeDefaultModules('premium'),
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'preset-quick',
    name: 'Quick Quote',
    description: 'Minimal — just pricing and terms',
    modules: makeDefaultModules('quick'),
    isPreset: true,
    createdAt: new Date().toISOString(),
  },
];

interface OfferTemplateStore {
  templates: OfferTemplate[];
  addTemplate: (template: OfferTemplate) => void;
  updateTemplate: (id: string, updates: Partial<OfferTemplate>) => void;
  deleteTemplate: (id: string) => void;
  getTemplateById: (id: string) => OfferTemplate | undefined;
}

export const useOfferTemplateStore = create<OfferTemplateStore>()(
  persist(
    (set, get) => ({
      templates: PRESET_TEMPLATES,

      addTemplate: (template) =>
        set((s) => ({ templates: [...s.templates, template] })),

      updateTemplate: (id, updates) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTemplate: (id) =>
        set((s) => ({
          templates: s.templates.filter((t) => t.id !== id || t.isPreset),
        })),

      getTemplateById: (id) => get().templates.find((t) => t.id === id),
    }),
    { name: 'dealflow-offer-templates' }
  )
);
