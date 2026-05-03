# Progreso frontend — alquileres

Fecha: 2026-05-02

## Estado actual
Frontend React + Vite + TypeScript con sistema de autenticación, contexto de empresa/sede, y páginas principales.

## Cambios realizados hoy (2026-05-02)

### Modelo de roles simplificado

**Antes:** `BranchMembership` tenía `branchRole` que podía ser diferente de `companyRole`
**Ahora:** Un usuario = un rol principal (ADMIN_EMPRESA | ADMIN_SEDE | CAJERO | RECEPCION)

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/types/index.ts` | Removido `branchRole` de `BranchMembership` |
| `src/pages/LoginPage.tsx` | ADMIN_EMPRESA ahora redirige a /dashboard (no a /companies/:id) |
| `src/pages/DashboardPage.tsx` | ADMIN_EMPRESA ve selector de empresa+sede, otros roles auto-seleccionan |
| `src/components/layout/AppLayout.tsx` | Badge de rol simple |

### Lógica de Dashboard según rol

| Rol | Selector empresa | Selector sede | Auto-selecciona |
|-----|-----------------|---------------|-----------------|
| ADMIN_EMPRESA | Sí (disabled) | Sí | Sí - su empresa |
| ADMIN_SEDE | No | No | Sí - su única branch |
| CAJERO | No | No | Sí - su única branch |
| RECEPCION | No | No | Sí - su única branch |
| SUPERADMIN | Sí | Sí | No |

### Flujo de login

```
1. Login → auth/me → fullUser con memberships
2. Si ADMIN_EMPRESA → autoSetCompany(companyId) → /dashboard
3. Si ADMIN_SEDE/CAJERO/RECEPCION → autoSetCompany(companyId, branchId) → /dashboard
4. Dashboard muestra "Listo" con empresa+sede
```

## Contexto de autenticación (AuthContext)

- `login()` ahora retorna `fullUser` para usar datos directamente sin esperar setState
- `getMyCompanyId()` → companyId de memberships[0]
- `getMyCompanyRole()` → companyRole de memberships[0]
- `getMyBranches()` → branches de memberships[0]

## Contexto de empresa (CompanyContext)

- `currentCompany` / `currentBranch` - seleccionados actualmente
- `autoSetCompany(companyId, branchId?)` - para auto-seleccionar al login
- Persistencia en localStorage

## Páginas implementadas

| Página | Descripción |
|--------|-------------|
| LoginPage | Login con redirect según rol |
| DashboardPage | Selector de empresa/sede según rol |
| ResourcesPage | Categorías y recursos con edit |
| RatesPage | Tarifas con edit |
| CatalogPage | Catálogo de venta |
| TicketsPage | Tickets con detalle, rentals, pagos |
| ReportsPage | Reportes (placeholder) |
| CompaniesPage | Listado de empresas (SUPERADMIN) |
| CompanyDetailPage | Detalle con branches y miembros |
| CreateCompanyPage | Crear empresa (SUPERADMIN) |

## Estructura de componentes

```
src/
├── api/endpoints.ts     # API calls
├── components/
│   └── ui/              # Componentes UI básicos
├── contexts/
│   ├── AuthContext.tsx  # Auth con helpers
│   └── CompanyContext.tsx # Empresa/sede con autoSet
├── pages/               # Páginas principales
├── types/index.ts       # Tipos TypeScript
└── App.tsx              # Router con ProtectedRoute
```

## Próximo paso

1. Testear flujo completo con los nuevos usuarios del seed
2. Verificar que el acceso a recursos/tarifas/tickets funciona para todos los roles
3. Continuar con cualquier fix de bugs

## Modelo de datos del frontend

```typescript
interface User {
  id: string;
  email: string;
  globalRole: 'SUPERADMIN' | 'USER';
  memberships?: CompanyMembership[];
}

interface CompanyMembership {
  companyId: string;
  companyName: string;
  companyRole: MembershipRole;
  branches: BranchMembership[];
}

interface BranchMembership {
  companyId: string;
  branchId: string;
  branchName: string;
}
```

## Keys de localStorage

- `accessToken` - JWT token
- `user` - User object
- `selectedCompany` - Company seleccionado
- `selectedBranch` - Branch seleccionada