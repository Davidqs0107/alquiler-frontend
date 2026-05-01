import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { Button, Card, Input } from '@/components/ui';
import { getErrorMessage } from '@/api/client';
import Swal from 'sweetalert2';

export function CreateCompanyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    branchName: 'Sede Central',
    adminEmail: '',
    adminPassword: '',
  });

  if (user?.globalRole !== 'SUPERADMIN') {
    return (
      <div className="p-4 sm:p-6">
        <Card padding>
          <p className="text-[var(--error)]">No tenés permisos para crear empresas.</p>
        </Card>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === 'companyName') {
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return { ...prev, [name]: value, companySlug: slug };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/companies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          company: { name: formData.companyName, slug: formData.companySlug },
          branch: { name: formData.branchName },
          admin: { email: formData.adminEmail, password: formData.adminPassword },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear empresa');
      }

      await Swal.fire({
        icon: 'success',
        title: 'Empresa creada',
        text: 'La empresa se creó exitosamente.',
      });
      setFormData({
        companyName: '',
        companySlug: '',
        branchName: 'Sede Central',
        adminEmail: '',
        adminPassword: '',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-semibold text-[var(--ink-primary)] mb-4 sm:mb-6">Crear Nueva Empresa</h1>

      {error && (
        <div className="mb-4 p-4 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md">
          {error}
        </div>
      )}

      <Card padding>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-b border-[var(--border-subtle)] pb-4 mb-4">
            <h2 className="text-sm font-medium text-[var(--ink-secondary)] mb-3">Datos de la Empresa</h2>
            <div className="space-y-4">
              <Input
                label="Nombre de la Empresa"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Ej: Deportes Plus"
                required
              />
              <Input
                label="Slug (URL)"
                name="companySlug"
                value={formData.companySlug}
                onChange={handleChange}
                placeholder="deportes-plus"
                required
              />
            </div>
          </div>

          <div className="border-b border-[var(--border-subtle)] pb-4 mb-4">
            <h2 className="text-sm font-medium text-[var(--ink-secondary)] mb-3">Sede Principal</h2>
            <Input
              label="Nombre de la Sede"
              name="branchName"
              value={formData.branchName}
              onChange={handleChange}
              placeholder="Ej: Sede Central"
              required
            />
          </div>

          <div>
            <h2 className="text-sm font-medium text-[var(--ink-secondary)] mb-3">Administrador de la Empresa</h2>
            <div className="space-y-4">
              <Input
                label="Email del Admin"
                name="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={handleChange}
                placeholder="admin@empresa.com"
                required
              />
              <Input
                label="Contraseña"
                name="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={handleChange}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => navigate('/dashboard')}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear Empresa
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}