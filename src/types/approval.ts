export interface ApprovalStep {
  userId: string;
  userName: string;
  userRole: string;
  order: number; // 1-based order in the chain
  status: 'pending' | 'approved' | 'rejected';
  decidedAt: string | null;
  comment: string;
}

export interface ApprovalRequest {
  id: string;
  offerId: string;
  dealId: string;
  offerName: string;
  guardrailId: string;
  guardrailName: string;
  violationDetails: string; // e.g. "Price $1,280/MT is 8.5% below minimum margin"
  requestedBy: string; // userId
  requestedByName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  steps: ApprovalStep[];
  currentStepOrder: number; // which step is currently awaiting approval
  completedAt: string | null;
}

export interface ApproverConfig {
  userId: string;
  userName: string;
  order: number;
}
