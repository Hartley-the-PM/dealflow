import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApprovalRequest, ApprovalStep } from '@/types/approval';

interface ApprovalState {
  requests: ApprovalRequest[];
  addRequest: (request: ApprovalRequest) => void;
  approveStep: (requestId: string, userId: string, comment?: string) => void;
  rejectStep: (requestId: string, userId: string, comment?: string) => void;
  getRequestsByOffer: (offerId: string) => ApprovalRequest[];
  getPendingForUser: (userId: string) => ApprovalRequest[];
  getRequestById: (id: string) => ApprovalRequest | undefined;
}

export const useApprovalStore = create<ApprovalState>()(
  persist(
    (set, get) => ({
      requests: [],

      addRequest: (request) =>
        set((s) => ({ requests: [...s.requests, request] })),

      approveStep: (requestId, userId, comment = '') =>
        set((s) => ({
          requests: s.requests.map((req) => {
            if (req.id !== requestId) return req;
            const now = new Date().toISOString();
            const updatedSteps = req.steps.map((step) => {
              if (step.userId === userId && step.status === 'pending' && step.order === req.currentStepOrder) {
                return { ...step, status: 'approved' as const, decidedAt: now, comment };
              }
              return step;
            });

            // Check if all steps are approved
            const allApproved = updatedSteps.every((s) => s.status === 'approved');
            const nextPendingStep = updatedSteps.find((s) => s.status === 'pending');

            return {
              ...req,
              steps: updatedSteps,
              currentStepOrder: nextPendingStep ? nextPendingStep.order : req.currentStepOrder,
              status: allApproved ? 'approved' as const : req.status,
              completedAt: allApproved ? now : null,
            };
          }),
        })),

      rejectStep: (requestId, userId, comment = '') =>
        set((s) => ({
          requests: s.requests.map((req) => {
            if (req.id !== requestId) return req;
            const now = new Date().toISOString();
            const updatedSteps = req.steps.map((step) => {
              if (step.userId === userId && step.status === 'pending' && step.order === req.currentStepOrder) {
                return { ...step, status: 'rejected' as const, decidedAt: now, comment };
              }
              return step;
            });

            return {
              ...req,
              steps: updatedSteps,
              status: 'rejected' as const,
              completedAt: now,
            };
          }),
        })),

      getRequestsByOffer: (offerId) =>
        get().requests.filter((r) => r.offerId === offerId),

      getPendingForUser: (userId) =>
        get().requests.filter(
          (r) =>
            r.status === 'pending' &&
            r.steps.some(
              (s) => s.userId === userId && s.status === 'pending' && s.order === r.currentStepOrder
            )
        ),

      getRequestById: (id) =>
        get().requests.find((r) => r.id === id),
    }),
    { name: 'dealflow-approvals' }
  )
);
