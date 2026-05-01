import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useCompany } from '@/contexts';
import { Button } from '@/components/ui';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/resources', label: 'Recursos', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { path: '/rates', label: 'Tarifas', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/catalog', label: 'Catálogo', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { path: '/tickets', label: 'Tickets', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/reports', label: 'Reportes', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];

const superadminNavItems = [
  { path: '/companies', label: 'Empresas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/companies/new', label: 'Nueva Empresa', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
];

function NavIcon({ path }: { path: string }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}

export function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentCompany, currentBranch } = useCompany();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[var(--surface-base)]">
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 lg:flex lg:flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full bg-white border-r border-[var(--border-subtle)]">
          <div className="p-4 border-b border-[var(--border-subtle)]">
            <h1 className="text-lg font-semibold text-[var(--ink-primary)]">Alquileres</h1>
            {currentCompany && (
              <p className="text-sm text-[var(--ink-secondary)] mt-1 truncate">{currentCompany.name}</p>
            )}
            {currentBranch && (
              <p className="text-xs text-[var(--ink-tertiary)] truncate">{currentBranch.name}</p>
            )}
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                    ${isActive
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                      : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--ink-primary)]'
                    }
                  `}
                >
                  <NavIcon path={item.icon} />
                  {item.label}
                </Link>
              );
            })}
            {user?.globalRole === 'SUPERADMIN' && (
              <div className="pt-3 mt-3 border-t border-[var(--border-subtle)]">
                <p className="px-3 text-xs font-medium text-[var(--ink-tertiary)] uppercase mb-1">Administración</p>
                {superadminNavItems.map((item) => {
                  const isActive = location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors
                        ${isActive
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
                          : 'text-[var(--ink-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--ink-primary)]'
                        }
                      `}
                    >
                      <NavIcon path={item.icon} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-[var(--border-subtle)]">
            <div className="mb-3">
              <p className="text-sm font-medium text-[var(--ink-primary)] truncate">{user?.email}</p>
              <p className="text-xs text-[var(--ink-tertiary)]">{user?.globalRole}</p>
            </div>
            <Button variant="secondary" className="w-full" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 overflow-auto bg-[var(--surface-base)]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-white px-4 shadow-sm lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-[var(--ink-primary)] truncate">
            {navItems.find(item => location.pathname.startsWith(item.path))?.label ||
             superadminNavItems.find(item => location.pathname.startsWith(item.path))?.label ||
             'Alquileres'}
          </h1>
          <div className="w-10" />
        </header>
        <Outlet />
      </main>
    </div>
  );
}