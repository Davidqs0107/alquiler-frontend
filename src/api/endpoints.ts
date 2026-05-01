import { api } from './client';
import type {
  LoginRequest,
  LoginResponse,
  User,
  Company,
  Branch,
  ResourceCategory,
  Resource,
  RatePlan,
  Ticket,
  TicketItem,
  SaleCatalogItem,
  CreateCompanyRequest,
  StartRentalRequest,
  StartRentalResponse,
  AddRentalToTicketRequest,
  AddCatalogItemRequest,
  AddManualItemRequest,
  AddExtraRequest,
  RegisterPaymentRequest,
  RegisterPaymentResponse,
} from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

export const companiesApi = {
  list: async (): Promise<Company[]> => {
    const response = await api.get<Company[]>('/companies');
    return response.data;
  },

  get: async (companyId: string): Promise<Company> => {
    const response = await api.get<Company>(`/companies/${companyId}`);
    return response.data;
  },

  create: async (data: CreateCompanyRequest) => {
    const response = await api.post('/companies', data);
    return response.data;
  },

  getBranches: async (companyId: string): Promise<Branch[]> => {
    const response = await api.get<Branch[]>(`/companies/${companyId}/branches`);
    return response.data;
  },

  createBranch: async (companyId: string, data: { name: string }) => {
    const response = await api.post(`/companies/${companyId}/branches`, data);
    return response.data;
  },
};

export const categoriesApi = {
  list: async (companyId: string): Promise<ResourceCategory[]> => {
    const response = await api.get<ResourceCategory[]>(`/companies/${companyId}/categories`);
    return response.data;
  },

  create: async (companyId: string, data: { name: string; description?: string }) => {
    const response = await api.post(`/companies/${companyId}/categories`, data);
    return response.data;
  },

  updateVisibility: async (
    companyId: string,
    categoryId: string,
    branchId: string,
    visible: boolean
  ) => {
    const response = await api.patch(
      `/companies/${companyId}/categories/${categoryId}/branches/${branchId}/visibility`,
      { visible }
    );
    return response.data;
  },
};

export const resourcesApi = {
  list: async (companyId: string, branchId: string): Promise<Resource[]> => {
    const response = await api.get<Resource[]>(
      `/companies/${companyId}/branches/${branchId}/resources`
    );
    return response.data;
  },

  create: async (
    companyId: string,
    branchId: string,
    data: { categoryId: string; name: string; description?: string }
  ) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/resources`,
      data
    );
    return response.data;
  },
};

export const ratePlansApi = {
  list: async (companyId: string, branchId: string): Promise<RatePlan[]> => {
    const response = await api.get<RatePlan[]>(
      `/companies/${companyId}/branches/${branchId}/rate-plans`
    );
    return response.data;
  },

  create: async (
    companyId: string,
    branchId: string,
    data: {
      name: string;
      resourceId?: string;
      categoryId?: string;
      pricingType: 'BLOCK' | 'TIME_UNIT';
      basePrice: string;
      timeUnitMinutes?: number;
      blockHours?: number;
      blockPrice?: string;
    }
  ) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/rate-plans`,
      data
    );
    return response.data;
  },
};

export const catalogApi = {
  list: async (companyId: string, params?: { branchId?: string; status?: string }) => {
    const response = await api.get<SaleCatalogItem[]>(
      `/companies/${companyId}/catalog-items`,
      { params }
    );
    return response.data;
  },

  create: async (
    companyId: string,
    data: {
      name: string;
      description?: string;
      type: 'PRODUCT' | 'SERVICE';
      price: string;
      branchId?: string;
    }
  ) => {
    const response = await api.post(`/companies/${companyId}/catalog-items`, data);
    return response.data;
  },

  update: async (companyId: string, catalogItemId: string, data: Partial<SaleCatalogItem>) => {
    const response = await api.patch(
      `/companies/${companyId}/catalog-items/${catalogItemId}`,
      data
    );
    return response.data;
  },

  activate: async (companyId: string, catalogItemId: string) => {
    const response = await api.post(
      `/companies/${companyId}/catalog-items/${catalogItemId}/activate`
    );
    return response.data;
  },

  deactivate: async (companyId: string, catalogItemId: string) => {
    const response = await api.post(
      `/companies/${companyId}/catalog-items/${catalogItemId}/deactivate`
    );
    return response.data;
  },
};

export const ticketsApi = {
  list: async (companyId: string, branchId: string, params?: { status?: string }) => {
    const response = await api.get<Ticket[]>(
      `/companies/${companyId}/branches/${branchId}/tickets`,
      { params }
    );
    return response.data;
  },

  get: async (companyId: string, branchId: string, ticketId: string): Promise<Ticket> => {
    const response = await api.get<Ticket>(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}`
    );
    return response.data;
  },

  create: async (companyId: string, branchId: string) => {
    const response = await api.post<Ticket>(
      `/companies/${companyId}/branches/${branchId}/tickets`,
      {}
    );
    return response.data;
  },

  addRental: async (
    companyId: string,
    branchId: string,
    ticketId: string,
    data: AddRentalToTicketRequest
  ) => {
    const response = await api.post<TicketItem>(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/rentals`,
      data
    );
    return response.data;
  },

  addCatalogItem: async (
    companyId: string,
    branchId: string,
    ticketId: string,
    data: AddCatalogItemRequest
  ) => {
    const response = await api.post<TicketItem>(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/items/catalog`,
      data
    );
    return response.data;
  },

  addManualItem: async (
    companyId: string,
    branchId: string,
    ticketId: string,
    data: AddManualItemRequest
  ) => {
    const response = await api.post<TicketItem>(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/items/manual`,
      data
    );
    return response.data;
  },

  addExtra: async (
    companyId: string,
    branchId: string,
    ticketId: string,
    data: AddExtraRequest
  ) => {
    const response = await api.post<TicketItem>(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/items/extra`,
      data
    );
    return response.data;
  },

  applyDiscount: async (
    companyId: string,
    branchId: string,
    ticketId: string,
    itemId: string,
    discount: string
  ) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/items/${itemId}/discount`,
      { discount }
    );
    return response.data;
  },

  applyGlobalDiscount: async (companyId: string, branchId: string, ticketId: string, discount: string) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/discount`,
      { discount }
    );
    return response.data;
  },

  cancelItem: async (companyId: string, branchId: string, ticketId: string, itemId: string) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/items/${itemId}/cancel`
    );
    return response.data;
  },

  cancel: async (companyId: string, branchId: string, ticketId: string) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/cancel`
    );
    return response.data;
  },

  cancelWithReversal: async (companyId: string, branchId: string, ticketId: string) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/cancel-with-reversal`
    );
    return response.data;
  },

  close: async (companyId: string, branchId: string, ticketId: string) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/close`
    );
    return response.data;
  },

  registerPayment: async (
    companyId: string,
    branchId: string,
    ticketId: string,
    data: RegisterPaymentRequest
  ): Promise<RegisterPaymentResponse> => {
    const response = await api.post<RegisterPaymentResponse>(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/payments`,
      data
    );
    return response.data;
  },

  reversePayment: async (
    companyId: string,
    branchId: string,
    ticketId: string,
    paymentId: string,
    data?: { amount?: string; reason?: string }
  ) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/tickets/${ticketId}/payments/${paymentId}/reversals`,
      data || {}
    );
    return response.data;
  },
};

export const rentalsApi = {
  start: async (
    companyId: string,
    branchId: string,
    data: StartRentalRequest
  ): Promise<StartRentalResponse> => {
    const response = await api.post<StartRentalResponse>(
      `/companies/${companyId}/branches/${branchId}/rentals/start`,
      data
    );
    return response.data;
  },

  finish: async (companyId: string, branchId: string, rentalSessionId: string) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/rentals/${rentalSessionId}/finish`
    );
    return response.data;
  },

  cancel: async (companyId: string, branchId: string, rentalSessionId: string) => {
    const response = await api.post(
      `/companies/${companyId}/branches/${branchId}/rentals/${rentalSessionId}/cancel`
    );
    return response.data;
  },
};