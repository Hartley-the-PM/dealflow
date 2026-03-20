// ===== Module Types =====

// --- Merged Products & Pricing Module ---

export interface ProductsModuleEntry {
  id: string;
  productId: string;       // from product catalog
  quantity: number | null;
  unit: 'MT' | 'KG';
  pricePerUnit: number;    // auto-filled from pricing engine, overridable
  description: string;     // concise text for showcase card
  imageUrl: string;        // optional, for showcase card
}

export interface ProductsModule {
  type: 'products';
  id: string;
  visible: boolean;
  showQuantity: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showTotal: boolean;
  entries: ProductsModuleEntry[];
}

// --- Brand & Content Preset Types ---

export interface BrandProfile {
  id: string;
  name: string;
  logoUrl: string;
  primaryColor: string;   // hex
  accentColor: string;    // hex
  companyName: string;
}

// ContentPresetType mirrors OfferModuleType — every builder module can have a content block template
// When adding a new module type to the builder, add it here too
export type ContentPresetType =
  | 'hero'
  | 'terms'
  | 'custom_text'
  | 'company_about'
  | 'certifications'
  | 'testimonials'
  | 'cover_image'
  | 'image'
  | 'products'
  | 'formulation';

export interface HeroPresetData {
  title: string;
  customerName: string;
  intro: string;
  logoUrl: string;
}

export interface TermsPresetData {
  paymentTerms: string;
  incoterms: string;
  validity: string;
  delivery: string;
  legalNotes: string;
}

export interface CustomTextPresetData {
  heading: string;
  body: string;
}

export interface CompanyAboutPresetData {
  mission: string;
  vision: string;
  values: string[];
  certifications: string[];
  differentiators: string[];
}

export interface CertificationsPresetData {
  title: string;
  certifications: Array<{ name: string; description: string; issuer: string }>;
}

export interface TestimonialsPresetData {
  testimonials: Array<{ quote: string; author: string; company: string }>;
}

export interface CoverImagePresetData {
  backgroundImageUrl: string;
  title: string;
  subtitle: string;
  overlayOpacity: number;
  overlayColor: string;
}

export interface ImagePresetData {
  imageUrl: string;
  caption: string;
  alt: string;
  width: 'full' | 'medium' | 'small';
  alignment: 'left' | 'center' | 'right';
}

export interface ProductsPresetData {
  showQuantity: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showTotal: boolean;
}

export type PresetData =
  | HeroPresetData
  | TermsPresetData
  | CustomTextPresetData
  | CompanyAboutPresetData
  | CertificationsPresetData
  | TestimonialsPresetData
  | CoverImagePresetData
  | ImagePresetData
  | ProductsPresetData;

export interface ContentPreset {
  id: string;
  name: string;
  type: ContentPresetType;
  data: Record<string, unknown>;  // shape depends on type
}

// --- Existing Module Types ---

export interface HeroModule {
  type: 'hero';
  id: string;
  visible: boolean;
  title: string;
  customerName: string;
  date: string;
  intro: string;
  logoUrl: string;
}

/** @deprecated Use ProductsModule instead. Kept for backwards compatibility with persisted data. */
export interface ProductLinesModule {
  type: 'product_lines';
  id: string;
  visible: boolean;
  showQuantity: boolean;
  showUnit: boolean;
  showUnitPrice: boolean;
  showTotal: boolean;
  showMSP: boolean;
}

export interface TermsModule {
  type: 'terms';
  id: string;
  visible: boolean;
  paymentTerms: string;
  incoterms: string;
  validity: string;
  delivery: string;
  legalNotes: string;
}

export interface CustomTextModule {
  type: 'custom_text';
  id: string;
  visible: boolean;
  heading: string;
  body: string;
}

/** @deprecated Use ProductsModule instead. Kept for backwards compatibility with persisted data. */
export interface ProductShowcaseModule {
  type: 'product_showcase';
  id: string;
  visible: boolean;
  products: Array<{
    name: string;
    description: string;
    specs: string;
    imageUrl: string;
  }>;
}

export interface CompanyAboutModule {
  type: 'company_about';
  id: string;
  visible: boolean;
  mission: string;
  vision: string;
  values: string[];
  certifications: string[];
  differentiators: string[];
}

export interface CertificationsModule {
  type: 'certifications';
  id: string;
  visible: boolean;
  title: string;
  certifications: Array<{
    name: string;
    description: string;
    issuer: string;
  }>;
}

export interface TestimonialsModule {
  type: 'testimonials';
  id: string;
  visible: boolean;
  testimonials: Array<{
    quote: string;
    author: string;
    company: string;
  }>;
}

export interface CoverImageModule {
  type: 'cover_image';
  id: string;
  visible: boolean;
  backgroundImageUrl: string;
  title: string;
  subtitle: string;
  overlayOpacity: number; // 0-1
  overlayColor: string; // hex
  fontColor?: string; // hex, defaults to white
}

export interface DividerModule {
  type: 'divider';
  id: string;
  visible: boolean;
  style: 'line' | 'dots' | 'space';
  height: number; // px
}

export interface ImageModule {
  type: 'image';
  id: string;
  visible: boolean;
  imageUrl: string;
  caption: string;
  alt: string;
  width: 'full' | 'medium' | 'small';
  alignment: 'left' | 'center' | 'right';
}

export interface FormulationModule {
  type: 'formulation';
  id: string;
  visible: boolean;
  formulationId: string;
  title: string;
  showPercentages: boolean;
  showRecycledContent: boolean;
  showTds: boolean;
}

export type OfferModule =
  | HeroModule
  | ProductLinesModule
  | TermsModule
  | CustomTextModule
  | ProductShowcaseModule
  | CompanyAboutModule
  | CertificationsModule
  | TestimonialsModule
  | CoverImageModule
  | DividerModule
  | ImageModule
  | ProductsModule
  | FormulationModule;

export type OfferModuleType = OfferModule['type'];

// ===== Templates =====

export interface TemplateSlot {
  moduleType: OfferModuleType;
  contentBlockId: string | null; // null = user fills from scratch
  contentBlockName: string; // display name, empty if no block
}

export interface OfferTemplate {
  id: string;
  name: string;
  description: string;
  modules: OfferModule[];
  isPreset: boolean;
  createdAt: string;
  // New: linked blocks + brand
  brandProfileId?: string;
  slots?: TemplateSlot[]; // if present, used to build modules from blocks
}

// ===== Buyer Interaction =====

export interface BuyerLineAction {
  lineId: string;
  productId: string;
  counterPrice: number | null;
  comment: string;
}

export interface BuyerResponse {
  id: string;
  offerId: string;
  shareToken: string;
  type: 'accept' | 'reject' | 'counter_proposal' | 'request_changes';
  buyerName: string;
  buyerEmail: string;
  lineActions: BuyerLineAction[];
  generalComment: string;
  createdAt: string;
}

export interface OfferShareLink {
  id: string;
  offerId: string;
  dealId: string;
  token: string;
  createdAt: string;
  createdBy: string;
}

// ===== Analytics =====

export type AnalyticsEventType =
  | 'page_view'
  | 'section_view'
  | 'click'
  | 'scroll_depth'
  | 'time_on_page'
  | 'counter_propose'
  | 'accept'
  | 'reject';

export interface OfferAnalyticsEvent {
  id: string;
  sessionId: string;
  offerId: string;
  token: string;
  type: AnalyticsEventType;
  target: string; // section name, button name, etc.
  value: string | number; // scroll %, time in seconds, etc.
  timestamp: string;
}

export interface OfferAnalyticsSession {
  id: string;
  offerId: string;
  token: string;
  startedAt: string;
  endedAt: string | null;
  device: string;
  viewport: string;
  events: OfferAnalyticsEvent[];
  maxScrollDepth: number;
  timeOnPageSeconds: number;
}
