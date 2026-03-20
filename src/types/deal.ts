export type DealStatus = 'Draft' | 'Active' | 'Won' | 'Lost' | 'Expired';

export interface Deal {
  id: string;
  customerId: string;
  name: string;
  status: DealStatus; // derived from pipelineStage for backwards compatibility
  pipelineStage: string; // source of truth — matches a stage name from pipeline settings
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  exitReason?: string; // reason when moved to an exit stage (Lost/Expired/Cancelled)
}
