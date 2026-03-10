import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DealNote } from '@/types';

interface DealNoteStore {
  notes: DealNote[];
  setNotes: (notes: DealNote[]) => void;
  addNote: (note: DealNote) => void;
  updateNote: (id: string, updates: Partial<DealNote>) => void;
  deleteNote: (id: string) => void;
  getNotesByDeal: (dealId: string) => DealNote[];
}

export const useDealNoteStore = create<DealNoteStore>()(
  persist(
    (set, get) => ({
      notes: [],
      setNotes: (notes) => set({ notes }),
      addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
      updateNote: (id, updates) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        })),
      deleteNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
      getNotesByDeal: (dealId) =>
        get()
          .notes.filter((n) => n.dealId === dealId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),
    { name: 'dealflow-deal-notes' }
  )
);
