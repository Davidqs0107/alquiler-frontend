import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useCompany } from '@/contexts';
import { Button, Input, Card } from '@/components/ui';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, clearError, isLoading } = useAuth();
  const { autoSetCompany } = useCompany();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      const fullUser = await login({ email, password });

      const membership = fullUser.memberships?.[0];
      const role = membership?.companyRole;
      const companyId = membership?.companyId;
      const branches = membership?.branches || [];

      if (role === 'ADMIN_EMPRESA') {
        if (companyId) {
          await autoSetCompany(companyId);
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else if (branches.length === 1 && companyId) {
        await autoSetCompany(companyId, branches[0].branchId);
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('[Login] error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-base)] p-4">
      <Card className="w-full max-w-sm" padding>
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-[var(--ink-primary)]">Sistema de Alquileres</h1>
          <p className="text-sm text-[var(--ink-secondary)] mt-1">Ingresá tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />

          <Input
            type="password"
            label="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && (
            <div className="p-3 text-sm text-[var(--error)] bg-[var(--error)]/10 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Iniciar sesión
          </Button>
        </form>
      </Card>
    </div>
  );
}