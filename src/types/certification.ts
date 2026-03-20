export type CertificationType = 'ISO' | 'Regulatory / Compliance' | 'Industry' | 'Customer-Specific Approval';

export type CertificationStatus = 'Active' | 'Expiring Soon' | 'Expired';

export interface Certification {
  id: string;
  productId: string;
  certificationType: CertificationType;
  certificationName: string;
  issuingBody: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  documentName: string; // simulated file reference
  documentUrl: string;  // simulated URL
  notes: string;
  createdAt: string;
  updatedAt: string;
}
