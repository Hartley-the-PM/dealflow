export type DocumentType = 'TDS' | 'SDS' | 'CoA' | 'Certification' | 'Company Document' | 'Custom';

export interface DocumentVersion {
  id: string;
  versionNumber: number;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
  changeNote: string;
}

export interface CompanyDocument {
  id: string;
  name: string;
  documentType: DocumentType;
  issueDate: string;
  expiryDate: string;
  currentVersion: number;
  versions: DocumentVersion[];
  fileName: string;
  fileUrl: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentPackage {
  id: string;
  name: string;
  token: string; // unique shareable token
  dealId: string | null; // reference to deal if created from deal artifact
  expiryDate: string;
  recipientEmail: string;
  status: 'Active' | 'Expired' | 'Revoked';
  documents: PackageDocument[];
  viewCount: number;
  views: PackageView[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageDocument {
  id: string;
  name: string;
  type: DocumentType;
  productName: string; // product association label, or 'Company' for company docs
  fileName: string;
  fileUrl: string;
  date: string; // version/issue date
  version: number;
  expiryDate: string;
}

export interface PackageView {
  id: string;
  viewedAt: string;
  ipAddress: string;
  userAgent: string;
  email: string;
}

export interface PackageTemplate {
  id: string;
  name: string;
  description: string;
  includeProductTDS: boolean;
  includeProductSDS: boolean;
  includeProductCertifications: boolean;
  includeProductCoA: boolean;
  companyDocumentIds: string[]; // specific company docs to include
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DealDocument {
  id: string;
  dealId: string;
  name: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  expiryDate: string;
  currentVersion: number;
  versions: DocumentVersion[];
  source: 'product' | 'company' | 'ad-hoc';
  sourceLabel: string; // e.g. product name, "Company Library", "Ad Hoc Upload"
  uploadedAt: string;
  uploadedBy: string;
}
