export type UserRole = 'Admin' | 'Sales Manager' | 'Account Manager' | 'Viewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string; // initials or image URL
  status: 'active' | 'invited' | 'deactivated';
  joinedAt: string;
}

export interface RolePermission {
  role: UserRole;
  permissions: {
    managePipeline: boolean;
    createDeals: boolean;
    createOffers: boolean;
    approveOffers: boolean;
    managePricing: boolean;
    manageCustomers: boolean;
    viewAnalytics: boolean;
    manageSettings: boolean;
    manageTeam: boolean;
    manageIntegrations: boolean;
    viewFormulations: boolean;
  };
}

export const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'Admin',
    permissions: {
      managePipeline: true, createDeals: true, createOffers: true, approveOffers: true,
      managePricing: true, manageCustomers: true, viewAnalytics: true,
      manageSettings: true, manageTeam: true, manageIntegrations: true,
      viewFormulations: true,
    },
  },
  {
    role: 'Sales Manager',
    permissions: {
      managePipeline: true, createDeals: true, createOffers: true, approveOffers: true,
      managePricing: true, manageCustomers: true, viewAnalytics: true,
      manageSettings: false, manageTeam: false, manageIntegrations: false,
      viewFormulations: false,
    },
  },
  {
    role: 'Account Manager',
    permissions: {
      managePipeline: true, createDeals: true, createOffers: true, approveOffers: false,
      managePricing: false, manageCustomers: true, viewAnalytics: true,
      manageSettings: false, manageTeam: false, manageIntegrations: false,
      viewFormulations: false,
    },
  },
  {
    role: 'Viewer',
    permissions: {
      managePipeline: false, createDeals: false, createOffers: false, approveOffers: false,
      managePricing: false, manageCustomers: false, viewAnalytics: true,
      manageSettings: false, manageTeam: false, manageIntegrations: false,
      viewFormulations: false,
    },
  },
];

export const PERMISSION_LABELS: Record<string, string> = {
  managePipeline: 'Manage Pipeline',
  createDeals: 'Create Deals',
  createOffers: 'Create Offers',
  approveOffers: 'Approve Offers',
  managePricing: 'Manage Pricing',
  manageCustomers: 'Manage Customers',
  viewAnalytics: 'View Analytics',
  manageSettings: 'Manage Settings',
  manageTeam: 'Manage Team',
  manageIntegrations: 'Manage Integrations',
  viewFormulations: 'View Formulations',
};
