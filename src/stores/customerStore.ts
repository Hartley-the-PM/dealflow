import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Customer, Contact, CustomerNote } from '@/types';

interface CustomerStore {
  customers: Customer[];
  contacts: Contact[];
  notes: CustomerNote[];
  setCustomers: (customers: Customer[]) => void;
  setContacts: (contacts: Contact[]) => void;
  setNotes: (notes: CustomerNote[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addNote: (note: CustomerNote) => void;
  getCustomerById: (id: string) => Customer | undefined;
  getContactsByCustomer: (customerId: string) => Contact[];
  getNotesByCustomer: (customerId: string) => CustomerNote[];
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],
      contacts: [],
      notes: [],
      setCustomers: (customers) => set({ customers }),
      setContacts: (contacts) => set({ contacts }),
      setNotes: (notes) => set({ notes }),
      addCustomer: (customer) => set((s) => ({ customers: [...s.customers, customer] })),
      updateCustomer: (id, updates) => set((s) => ({
        customers: s.customers.map((c) => c.id === id ? { ...c, ...updates } : c),
      })),
      addContact: (contact) => set((s) => ({ contacts: [...s.contacts, contact] })),
      updateContact: (id, updates) => set((s) => ({
        contacts: s.contacts.map((c) => c.id === id ? { ...c, ...updates } : c),
      })),
      deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),
      addNote: (note) => set((s) => ({ notes: [...s.notes, note] })),
      getCustomerById: (id) => get().customers.find((c) => c.id === id),
      getContactsByCustomer: (customerId) => get().contacts.filter((c) => c.customerId === customerId),
      getNotesByCustomer: (customerId) => get().notes.filter((n) => n.customerId === customerId),
    }),
    { name: 'dealflow-customers' }
  )
);
