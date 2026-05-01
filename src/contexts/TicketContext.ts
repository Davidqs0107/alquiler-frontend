import { create } from 'zustand';
import type { Ticket, Resource, SaleCatalogItem } from '@/types';
import { ticketsApi, resourcesApi, catalogApi } from '@/api';
import { getErrorMessage } from '@/api/client';

interface TicketState {
  activeTicket: Ticket | null;
  resources: Resource[];
  catalogItems: SaleCatalogItem[];
  isLoading: boolean;
  error: string | null;
}

interface TicketActions {
  fetchActiveTicket: (companyId: string, branchId: string) => Promise<void>;
  fetchResources: (companyId: string, branchId: string) => Promise<void>;
  fetchCatalogItems: (companyId: string, branchId?: string) => Promise<void>;
  createTicket: (companyId: string, branchId: string) => Promise<Ticket | null>;
  addRental: (companyId: string, branchId: string, ticketId: string, resourceId: string, minutes: number) => Promise<void>;
  addCatalogItem: (companyId: string, branchId: string, ticketId: string, catalogItemId: string) => Promise<void>;
  addManualItem: (companyId: string, branchId: string, ticketId: string, description: string, price: string) => Promise<void>;
  addExtra: (companyId: string, branchId: string, ticketId: string, description: string, amount: string) => Promise<void>;
  registerPayment: (companyId: string, branchId: string, ticketId: string, method: string, amount: number) => Promise<void>;
  closeTicket: (companyId: string, branchId: string, ticketId: string) => Promise<void>;
  cancelItem: (companyId: string, branchId: string, ticketId: string, itemId: string) => Promise<void>;
  cancelTicket: (companyId: string, branchId: string, ticketId: string) => Promise<void>;
  cancelTicketWithReversal: (companyId: string, branchId: string, ticketId: string) => Promise<void>;
  reversePayment: (companyId: string, branchId: string, ticketId: string, paymentId: string, amount?: string) => Promise<void>;
  refreshTicket: (companyId: string, branchId: string, ticketId: string) => Promise<void>;
  clearActiveTicket: () => void;
  clearError: () => void;
}

export const useTicketStore = create<TicketState & TicketActions>((set, get) => ({
  activeTicket: null,
  resources: [],
  catalogItems: [],
  isLoading: false,
  error: null,

  fetchActiveTicket: async (companyId, branchId) => {
    set({ isLoading: true, error: null });
    try {
      const openTickets = await ticketsApi.list(companyId, branchId, { status: 'OPEN' });
      if (openTickets.length > 0) {
        const ticket = await ticketsApi.get(companyId, branchId, openTickets[0].id);
        set({ activeTicket: ticket, isLoading: false });
      } else {
        set({ activeTicket: null, isLoading: false });
      }
    } catch (err) {
      set({ error: getErrorMessage(err), isLoading: false });
    }
  },

  fetchResources: async (companyId, branchId) => {
    try {
      const data = await resourcesApi.list(companyId, branchId);
      set({ resources: data });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  fetchCatalogItems: async (companyId, branchId) => {
    try {
      const data = await catalogApi.list(companyId, branchId ? { branchId } : {});
      set({ catalogItems: data });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  createTicket: async (companyId, branchId) => {
    set({ error: null });
    try {
      const ticket = await ticketsApi.create(companyId, branchId);
      set({ activeTicket: ticket });
      return ticket;
    } catch (err) {
      set({ error: getErrorMessage(err) });
      return null;
    }
  },

  addRental: async (companyId, branchId, ticketId, resourceId, minutes) => {
    set({ error: null });
    try {
      await ticketsApi.addRental(companyId, branchId, ticketId, {
        resourceId,
        reservedMinutes: minutes,
      });
      await get().refreshTicket(companyId, branchId, ticketId);
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  addCatalogItem: async (companyId, branchId, ticketId, catalogItemId) => {
    set({ error: null });
    try {
      await ticketsApi.addCatalogItem(companyId, branchId, ticketId, { catalogItemId });
      await get().refreshTicket(companyId, branchId, ticketId);
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  addManualItem: async (companyId, branchId, ticketId, description, price) => {
    set({ error: null });
    try {
      await ticketsApi.addManualItem(companyId, branchId, ticketId, {
        description,
        unitPrice: price,
      });
      await get().refreshTicket(companyId, branchId, ticketId);
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  addExtra: async (companyId, branchId, ticketId, description, amount) => {
    set({ error: null });
    try {
      await ticketsApi.addExtra(companyId, branchId, ticketId, { description, amount });
      await get().refreshTicket(companyId, branchId, ticketId);
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  registerPayment: async (companyId, branchId, ticketId, method, amount) => {
    set({ error: null });
    try {
      await ticketsApi.registerPayment(companyId, branchId, ticketId, {
        method: method as 'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET' | 'OTHER',
        amount,
      });
      await get().refreshTicket(companyId, branchId, ticketId);
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  closeTicket: async (companyId, branchId, ticketId) => {
    set({ error: null });
    try {
      await ticketsApi.close(companyId, branchId, ticketId);
      set({ activeTicket: null });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  cancelItem: async (companyId, branchId, ticketId, itemId) => {
    set({ error: null });
    try {
      await ticketsApi.cancelItem(companyId, branchId, ticketId, itemId);
      await get().refreshTicket(companyId, branchId, ticketId);
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  cancelTicket: async (companyId, branchId, ticketId) => {
    set({ error: null });
    try {
      await ticketsApi.cancel(companyId, branchId, ticketId);
      set({ activeTicket: null });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  cancelTicketWithReversal: async (companyId, branchId, ticketId) => {
    set({ error: null });
    try {
      await ticketsApi.cancelWithReversal(companyId, branchId, ticketId);
      set({ activeTicket: null });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  reversePayment: async (companyId, branchId, ticketId, paymentId, amount) => {
    set({ error: null });
    try {
      await ticketsApi.reversePayment(companyId, branchId, ticketId, paymentId, amount ? { amount } : undefined);
      await get().refreshTicket(companyId, branchId, ticketId);
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  refreshTicket: async (companyId, branchId, ticketId) => {
    try {
      const ticket = await ticketsApi.get(companyId, branchId, ticketId);
      set({ activeTicket: ticket });
    } catch (err) {
      set({ error: getErrorMessage(err) });
    }
  },

  clearActiveTicket: () => set({ activeTicket: null }),
  clearError: () => set({ error: null }),
}));

export const useTickets = () => {
  const activeTicket = useTicketStore((s) => s.activeTicket);
  const resources = useTicketStore((s) => s.resources);
  const catalogItems = useTicketStore((s) => s.catalogItems);
  const isLoading = useTicketStore((s) => s.isLoading);
  const error = useTicketStore((s) => s.error);
  return { activeTicket, resources, catalogItems, isLoading, error };
};