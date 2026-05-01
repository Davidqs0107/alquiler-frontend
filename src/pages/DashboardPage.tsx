import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '@/contexts';
import { companiesApi } from '@/api';
import { Button, Card, Select, Badge } from '@/components/ui';
import type { Company } from '@/types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { currentCompany, currentBranch, setCurrentCompany, setCurrentBranch, loadBranches, branches } = useCompany();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await companiesApi.list();
        setCompanies(data);

        if (currentCompany && data.some(c => c.id === currentCompany.id)) {
          await loadBranches(currentCompany.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load companies');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleCompanyChange = async (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    setCurrentCompany(company || null);
    setCurrentBranch(null);
    if (company) {
      await loadBranches(company.id);
    }
  };

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    setCurrentBranch(branch || null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)] mb-4 sm:mb-6">Dashboard</h1>

      {error && (
        <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card padding>
          <div className="mb-2">
            <span className="text-sm font-medium text-[var(--ink-secondary)]">Empresa</span>
          </div>
          <Select
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            value={currentCompany?.id || ''}
            onChange={(e) => handleCompanyChange(e.target.value)}
            placeholder="Seleccionar empresa"
          />
        </Card>

        <Card padding>
          <div className="mb-2">
            <span className="text-sm font-medium text-[var(--ink-secondary)]">Sede</span>
          </div>
          <Select
            options={branches.map((b) => ({ value: b.id, label: b.name }))}
            value={currentBranch?.id || ''}
            onChange={(e) => handleBranchChange(e.target.value)}
            placeholder="Seleccionar sede"
            disabled={!currentCompany}
          />
        </Card>
      </div>

      {currentCompany && currentBranch && (
        <div className="mt-4 sm:mt-6">
          <Card padding>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[var(--accent)] font-semibold">
                    {currentCompany.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink-primary)] truncate">
                    {currentCompany.name}
                  </p>
                  <p className="text-xs text-[var(--ink-tertiary)] truncate">
                    {currentBranch.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="success">Listo</Badge>
                <Button onClick={() => navigate('/tickets')} className="whitespace-nowrap">
                  Ir a Tickets
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}