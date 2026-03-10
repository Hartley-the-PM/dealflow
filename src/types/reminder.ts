export type ReminderType = 'customer' | 'product';
export type ReminderFrequency = 'monthly' | 'weekly' | 'quarterly';
export type ReminderStatus = 'active' | 'done' | 'snoozed';

export interface Reminder {
  id: string;
  type: ReminderType;
  targetId: string; // customerId or productId
  targetName: string; // display name
  title: string;
  frequency: ReminderFrequency;
  dueDate: string;
  status: ReminderStatus;
  createdAt: string;
}
