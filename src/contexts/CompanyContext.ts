import { create } from 'zustand';
import type { Company, Branch } from '@/types';
import { companiesApi } from '@/api';

interface CompanyState {
  currentCompany: Company | null;
  currentBranch: Branch | null;
  branches: Branch[];
  isLoading: boolean;
  error: string | null;
}

interface CompanyActions {
  setCurrentCompany: (company: Company | null) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  loadBranches: (companyId: string) => Promise<Branch[]>;
  clearError: () => void;
}

const COMPANY_KEY = 'selectedCompany';
const BRANCH_KEY = 'selectedBranch';

function loadStoredCompany(): Company | null {
  try {
    const stored = localStorage.getItem(COMPANY_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function loadStoredBranch(): Branch | null {
  try {
    const stored = localStorage.getItem(BRANCH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function persistCompany(company: Company | null) {
  if (company) {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(company));
  } else {
    localStorage.removeItem(COMPANY_KEY);
  }
}

function persistBranch(branch: Branch | null) {
  if (branch) {
    localStorage.setItem(BRANCH_KEY, JSON.stringify(branch));
  } else {
    localStorage.removeItem(BRANCH_KEY);
  }
}

export const useCompanyStore = create<CompanyState & CompanyActions>((set) => ({
  currentCompany: loadStoredCompany(),
  currentBranch: loadStoredBranch(),
  branches: [],
  isLoading: false,
  error: null,

  setCurrentCompany: (company) => {
    persistCompany(company);
    set({ currentCompany: company, currentBranch: null, branches: [] });
  },

  setCurrentBranch: (branch) => {
    persistBranch(branch);
    set({ currentBranch: branch });
  },

  loadBranches: async (companyId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await companiesApi.getBranches(companyId);
      set({ branches: data, isLoading: false });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load branches';
      set({ error: message, isLoading: false });
      return [];
    }
  },

  clearError: () => set({ error: null }),
}));

export const useCompany = () => {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const currentBranch = useCompanyStore((s) => s.currentBranch);
  const branches = useCompanyStore((s) => s.branches);
  const isLoading = useCompanyStore((s) => s.isLoading);
  const error = useCompanyStore((s) => s.error);
  const setCurrentCompany = useCompanyStore((s) => s.setCurrentCompany);
  const setCurrentBranch = useCompanyStore((s) => s.setCurrentBranch);
  const loadBranches = useCompanyStore((s) => s.loadBranches);
  const clearError = useCompanyStore((s) => s.clearError);
  return {
    currentCompany,
    currentBranch,
    branches,
    isLoading,
    error,
    setCurrentCompany,
    setCurrentBranch,
    loadBranches,
    clearError,
  };
};