// ===== Module Types =====

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
  certifications: string[];
  differentiators: string[];
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

export type OfferModule =
  | HeroModule
  | ProductLinesModule
  | TermsModule
  | CustomTextModule
  | ProductShowcaseModule
  | CompanyAboutModule
  | TestimonialsModule;

export type OfferModuleType = OfferModule['type'];

// ===== Templates =====

export interface OfferTemplate {
  id: string;
  name: string;
  description: string;
  modules: OfferModule[];
  isPreset: boolean;
  createdAt: string;
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
  type: 'accept' | 'reject' | 'counter_proposal';
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
