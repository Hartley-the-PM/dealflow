import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BrandProfile, ContentPreset, ContentPresetType } from '@/types/offerBuilder';

interface OfferBuilderSettingsStore {
  brandProfiles: BrandProfile[];
  contentPresets: ContentPreset[];
  defaultPresets: Record<ContentPresetType, string>; // maps preset type → default preset ID

  // Brand profiles CRUD
  addBrandProfile: (profile: BrandProfile) => void;
  updateBrandProfile: (id: string, updates: Partial<BrandProfile>) => void;
  deleteBrandProfile: (id: string) => void;

  // Content presets CRUD
  addContentPreset: (preset: ContentPreset) => void;
  updateContentPreset: (id: string, updates: Partial<ContentPreset>) => void;
  deleteContentPreset: (id: string) => void;
  getPresetsByType: (type: ContentPresetType) => ContentPreset[];

  // Default presets
  setDefaultPreset: (type: ContentPresetType, presetId: string) => void;
  clearDefaultPreset: (type: ContentPresetType) => void;
}

export const useOfferBuilderSettingsStore = create<OfferBuilderSettingsStore>()(
  persist(
    (set, get) => ({
      brandProfiles: [],
      contentPresets: [],
      defaultPresets: {
        terms: '',
        testimonials: '',
        cover_image: '',
        company_about: '',
      },

      addBrandProfile: (profile) =>
        set((s) => ({ brandProfiles: [...s.brandProfiles, profile] })),

      updateBrandProfile: (id, updates) =>
        set((s) => ({
          brandProfiles: s.brandProfiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteBrandProfile: (id) =>
        set((s) => ({
          brandProfiles: s.brandProfiles.filter((p) => p.id !== id),
        })),

      addContentPreset: (preset) =>
        set((s) => ({ contentPresets: [...s.contentPresets, preset] })),

      updateContentPreset: (id, updates) =>
        set((s) => ({
          contentPresets: s.contentPresets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),

      deleteContentPreset: (id) =>
        set((s) => ({
          contentPresets: s.contentPresets.filter((p) => p.id !== id),
          // Clear default if this was the default
          defaultPresets: Object.fromEntries(
            Object.entries(s.defaultPresets).map(([type, presetId]) => [type, presetId === id ? '' : presetId])
          ) as Record<ContentPresetType, string>,
        })),

      getPresetsByType: (type) => get().contentPresets.filter((p) => p.type === type),

      setDefaultPreset: (type, presetId) =>
        set((s) => ({ defaultPresets: { ...s.defaultPresets, [type]: presetId } })),

      clearDefaultPreset: (type) =>
        set((s) => ({ defaultPresets: { ...s.defaultPresets, [type]: '' } })),
    }),
    { name: 'dealflow-offer-builder-settings' }
  )
);
