import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TeamMember, UserRole, RolePermission } from '@/types/team';
import { DEFAULT_ROLE_PERMISSIONS } from '@/types/team';

interface TeamState {
  members: TeamMember[];
  rolePermissions: RolePermission[];
  currentUserId: string;
  addMember: (member: TeamMember) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
  setCurrentUser: (id: string) => void;
  getCurrentUser: () => TeamMember | undefined;
  updateRolePermission: (role: UserRole, field: string, value: boolean) => void;
}

const SEED_MEMBERS: TeamMember[] = [
  { id: 'user-001', name: 'John Mitchell', email: 'john.mitchell@vailent.com', role: 'Admin', status: 'active', joinedAt: '2025-06-15T00:00:00Z' },
  { id: 'user-002', name: 'Anna Kowalski', email: 'anna.k@vailent.com', role: 'Sales Manager', status: 'active', joinedAt: '2025-08-01T00:00:00Z' },
  { id: 'user-003', name: 'Erik Petersen', email: 'erik.p@vailent.com', role: 'Account Manager', status: 'active', joinedAt: '2025-09-10T00:00:00Z' },
  { id: 'user-004', name: 'Sarah Liu', email: 'sarah.l@vailent.com', role: 'Account Manager', status: 'active', joinedAt: '2025-10-22T00:00:00Z' },
  { id: 'user-005', name: 'Marcus Chen', email: 'marcus.c@vailent.com', role: 'Viewer', status: 'invited', joinedAt: '2026-03-01T00:00:00Z' },
];

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      members: SEED_MEMBERS,
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,
      currentUserId: 'user-001',

      addMember: (member) => set((s) => ({ members: [...s.members, member] })),

      updateMember: (id, updates) =>
        set((s) => ({ members: s.members.map((m) => (m.id === id ? { ...m, ...updates } : m)) })),

      removeMember: (id) =>
        set((s) => ({ members: s.members.filter((m) => m.id !== id) })),

      setCurrentUser: (id) => set({ currentUserId: id }),

      getCurrentUser: () => {
        const state = get();
        return state.members.find((m) => m.id === state.currentUserId);
      },

      updateRolePermission: (role, field, value) =>
        set((s) => ({
          rolePermissions: s.rolePermissions.map((rp) =>
            rp.role === role ? { ...rp, permissions: { ...rp.permissions, [field]: value } } : rp
          ),
        })),
    }),
    { name: 'dealflow-team' }
  )
);
