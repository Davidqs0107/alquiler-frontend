export type GlobalRole = 'SUPERADMIN' | 'USER';

export type MembershipRole = 'ADMIN_EMPRESA' | 'ADMIN_SEDE' | 'CAJERO' | 'RECEPCION';

export type RecordStatus = 'ACTIVE' | 'INACTIVE';

export type PricingType = 'BLOCK' | 'TIME_UNIT';

export type TicketStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export type TicketItemType = 'RENTAL' | 'PRODUCT' | 'EXTRA' | 'MANUAL';

export type RentalSessionStatus = 'RESERVED' | 'IN_USE' | 'FINISHED' | 'CANCELLED';

export type CatalogItemType = 'PRODUCT' | 'SERVICE';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'DIGITAL_WALLET' | 'OTHER';

export interface User {
  id: string;
  email: string;
  globalRole: GlobalRole;
  status: RecordStatus;
  createdAt: string;
  memberships?: CompanyMembership[];
}

export interface CompanyMembership {
  companyId: string;
  companyName: string;
  companyRole: MembershipRole;
  branches: BranchMembership[];
}

export interface BranchMembership {
  companyId: string;
  branchId: string;
  branchName: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: RecordStatus;
  createdAt: string;
  branches?: Branch[];
  users?: CompanyUser[];
}

export interface CompanyUser {
  id: string;
  role: MembershipRole;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface BranchUser {
  id: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  status: RecordStatus;
  createdAt: string;
}

export interface ResourceCategoryVisibility {
  branchId: string;
  isVisible: boolean;
  updatedAt: string;
}

export interface ResourceCategory {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  status: RecordStatus;
  createdAt: string;
  visibilityOverrides?: ResourceCategoryVisibility[];
}

export interface Resource {
  id: string;
  branchId: string;
  resourceCategoryId: string;
  name: string;
  description?: string;
  image?: string;
  maxCapacity?: number;
  location?: string;
  status: RecordStatus;
  createdAt: string;
  category?: ResourceCategory;
}

export interface Customer {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RatePlan {
  id: string;
  branchId: string;
  resourceId?: string;
  categoryId?: string;
  name: string;
  pricingType: PricingType;
  basePrice: string;
  timeUnitMinutes?: number;
  blockHours?: number;
  blockPrice?: string;
  status: RecordStatus;
  createdAt: string;
}

export interface Ticket {
  id: string;
  companyId: string;
  branchId: string;
  openedById: string;
  ticketNumber: number;
  status: TicketStatus;
  subtotal: string;
  discountAmount: string;
  total: string;
  openedAt: string;
  closedAt?: string;
  cancelledAt?: string;
  items?: TicketItem[];
  payments?: Payment[];
}

export interface TicketItem {
  id: string;
  ticketId: string;
  type: TicketItemType;
  description: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  discountAmount: string;
  status: RecordStatus;
  resourceId?: string;
  catalogItemId?: string;
  rentalSessionId?: string;
  createdAt: string;
  rentalSession?: RentalSession;
}

export interface RentalSession {
  id: string;
  resourceId: string;
  ticketItemId?: string;
  customerId?: string;
  status: RentalSessionStatus;
  startAt?: string;
  scheduledEndAt?: string;
  actualEndAt?: string;
  reservedMinutes: number;
  baseAmount: string;
  overtimeAmount: string;
  totalAmount: string;
  notes?: string;
  createdAt: string;
  resource?: Resource;
  customer?: { id: string; name: string };
  extensions?: RentalExtension[];
}

export interface RentalExtension {
  minutes: number;
  isOvertime: boolean;
  extendedAt: string;
  amount: number;
}

export interface ExtendRentalRequest {
  additionalMinutes: number;
  isOvertime: boolean;
}

export interface Payment {
  id: string;
  ticketId: string;
  method: PaymentMethod;
  amount: string;
  notes?: string;
  createdAt: string;
  reversals?: PaymentReversal[];
}

export interface PaymentReversal {
  id: string;
  paymentId: string;
  amount: string;
  reason?: string;
  createdAt: string;
}

export interface SaleCatalogItem {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  description?: string;
  type: CatalogItemType;
  price: string;
  status: RecordStatus;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface CreateCompanyRequest {
  company: { name: string; slug: string };
  branch: { name: string };
  admin: { email: string; password: string };
}

export interface CreateTicketResponse {
  id: string;
  companyId: string;
  branchId: string;
  openedById: string;
  ticketNumber: number;
  status: TicketStatus;
  subtotal: string;
  discountAmount: string;
  total: string;
  openedAt: string;
  closedAt: string | null;
  cancelledAt: string | null;
}

export interface StartRentalRequest {
  resourceId: string;
  reservedMinutes: number;
  startAt?: string;
  notes?: string;
}

export interface StartRentalResponse {
  ticket: Partial<Ticket>;
  ticketItem: TicketItem;
  rentalSession: RentalSession;
  totals: {
    paidTotal: number;
    pendingAmount: number;
  };
}

export interface AddRentalToTicketRequest {
  resourceId: string;
  reservedMinutes: number;
  startAt?: string;
  notes?: string;
  customerId?: string;
}

export interface AddCatalogItemRequest {
  catalogItemId: string;
  quantity?: number;
}

export interface AddManualItemRequest {
  description: string;
  unitPrice: string;
  quantity?: number;
}

export interface AddExtraRequest {
  description: string;
  amount: string;
}

export interface RegisterPaymentRequest {
  method: PaymentMethod;
  amount: number;
  notes?: string;
}

export interface RegisterPaymentResponse {
  payment: Payment;
  paidGrossTotal: number;
  reversedTotal: number;
  paidNetTotal: number;
  paidTotal: number;
  pendingAmount: number;
}

export interface ApiError {
  message: string;
  details?: string;
}

export interface ResourceBlockout {
  id: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  reason: string;
  createdAt: string;
  resource?: { id: string; name: string };
}