export interface WhiteLabelBrand {
  id: string;
  name: string; // e.g. 'Vinpol'
  logoUrl: string;
  prefix: string; // e.g. 'VNP' for auto-naming
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhiteLabelProduct {
  id: string;
  brandId: string; // references WhiteLabelBrand
  name: string; // e.g. 'Vinpol HDPE 5429'
  code: string; // e.g. 'VNP-HD-5429'
  linkedProductIds: string[]; // source products (same family required)
  family: string; // must match all linked products
  productType: string; // e.g. 'HDPE'
  // Auto-generated TDS with ranges
  tdsRanges?: {
    densityMin?: number; densityMax?: number;
    mfiMin?: string; mfiMax?: string;
    tensileMin?: number; tensileMax?: number;
    elongationMin?: number; elongationMax?: number;
    flexuralMin?: number; flexuralMax?: number;
    meltingPointMin?: string; meltingPointMax?: string;
  };
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
