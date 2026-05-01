import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Company, Branch } from '@/types';
import { companiesApi } from '@/api';

interface CompanyContextValue {
  currentCompany: Company | null;
  currentBranch: Branch | null;
  setCurrentCompany: (company: Company | null) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  branches: Branch[];
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  loadBranches: (companyId: string) => Promise<Branch[]>;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  const loadBranches = useCallback(async (companyId: string): Promise<Branch[]> => {
    const data = await companiesApi.getBranches(companyId);
    setBranches(data);
    return data;
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