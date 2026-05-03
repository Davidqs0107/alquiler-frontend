import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Company, Branch } from '@/types';
import { companiesApi } from '@/api';

interface CompanyContextValue {
  currentCompany: Company | null;
  currentBranch: Branch | null;
  setCurrentCompany: (company: Company | null, keepBranch?: boolean) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  loadBranches: (companyId: string) => Promise<Branch[]>;
  autoSetCompany: (companyId: string, branchId?: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

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

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompanyState] = useState<Company | null>(loadStoredCompany);
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(loadStoredBranch);
  const [branches, setBranches] = useState<Branch[]>([]);

  const setCurrentCompany = useCallback((company: Company | null, keepBranch = false) => {
    console.log('[CompanyContext] setCurrentCompany called:', { companyId: company?.id, keepBranch });
    persistCompany(company);
    setCurrentCompanyState(company);
    if (!keepBranch) {
      setCurrentBranchState(null);
    }
    if (!company) {
      setBranches([]);
    }
  }, []);

  const setCurrentBranch = useCallback((branch: Branch | null) => {
    console.log('[CompanyContext] setCurrentBranch called:', branch);
    persistBranch(branch);
    setCurrentBranchState(branch);
  }, []);

  const loadBranches = useCallback(async (companyId: string): Promise<Branch[]> => {
    const data = await companiesApi.getBranches(companyId);
    setBranches(data);
    return data;
  }, []);

  const autoSetCompany = useCallback(async (companyId: string, branchId?: string) => {
    console.log('[CompanyContext] autoSetCompany called:', { companyId, branchId });
    const company = await companiesApi.get(companyId);
    console.log('[CompanyContext] company fetched:', company);
    setCurrentCompany(company, true);
    const branchesData = await loadBranches(companyId);
    console.log('[CompanyContext] branches loaded:', branchesData);
    if (branchId) {
      const branch = branchesData.find((b) => b.id === branchId);
      console.log('[CompanyContext] branch found:', branch);
      if (branch) {
        setCurrentBranch(branch);
      }
    } else if (branchesData.length === 1) {
      setCurrentBranch(branchesData[0]);
    }
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        currentBranch,
        setCurrentCompany,
        setCurrentBranch,
        branches,
        setBranches,
        loadBranches,
        autoSetCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany(): CompanyContextValue {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}