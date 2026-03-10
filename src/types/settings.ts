export type UserRole = 'account_manager' | 'sales_manager';

export interface AppSettings {
  currentRole: UserRole;
  currentUser: string;
}
