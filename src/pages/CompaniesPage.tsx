import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge, EmptyState } from '@/components/ui';
import { api } from '@/api/client';

type Company = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  membershipRole?: string;
};

export function CompaniesPage() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Company[]>('/companies');
      setCompanies(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar empresas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--surface-elevated)] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)]">Empresas</h1>
        <Button onClick={() => navigate('/companies/new')} size="sm">Nueva Empresa</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md">{error}</div>
      )}

      {companies.length === 0 ? (
        <Card padding>
          <EmptyState
            title="No hay empresas"
            description="Crea tu primera empresa para comenzar"
            action={<Button onClick={() => navigate('/companies/new')}>Crear Empresa</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card
              key={company.id}
              className="hover:border-[var(--accent)] cursor-pointer transition-colors"
              onClick={() => navigate(`/companies/${company.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--ink-primary)]">{company.name}</h3>
                    <Badge variant={company.status === 'ACTIVE' ? 'success' : 'default'}>
                      {company.status === 'ACTIVE' ? 'Activa' : company.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--ink-secondary)]">{company.slug}</p>
                </div>
                {company.membershipRole && (
                  <Badge variant="info">{company.membershipRole.replace('_', ' ')}</Badge>
                )}
              </div>
              <p className="text-xs text-[var(--ink-tertiary)] mt-2">
                Creada el {new Date(company.createdAt).toLocaleDateString('es-AR')}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}