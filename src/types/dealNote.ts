export type DealNoteCategory = 'Call Summary' | 'Internal Note' | 'Price Discussion' | 'Customer Feedback';
export type DealNotePriority = 'Low' | 'Medium' | 'High';

export interface DealNote {
  id: string;
  dealId: string;
  body: string;
  category: DealNoteCategory;
  priority: DealNotePriority;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
