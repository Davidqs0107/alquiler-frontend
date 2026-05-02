# Alquiler Frontend

Aplicación web frontend para el sistema de gestión de alquileres y ventas, construida con React, TypeScript y Vite.

## Stack Tecnológico

| Categoría     | Tecnología                 |
| ------------- | -------------------------- |
| Framework UI  | React 18.3 + TypeScript    |
| Build tool    | Vite 6.0                   |
| Enrutamiento  | React Router DOM 6.28      |
| Estado global | Zustand 5.0                |
| HTTP Client   | Axios                      |
| Estilos       | Tailwind CSS 3.4 + PostCSS |
| Iconos        | Lucide React               |
| Alertas       | SweetAlert2                |
| Validación    | Zod                        |

## Requisitos

- Node.js 20+
- npm

## Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar entorno

Copia `.env.example` a `.env` y ajusta las variables si es necesario.

### 3. Iniciar en desarrollo

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

### 4. Construir para producción

```bash
npm run build
```

### 5. Vista previa de producción

```bash
npm run preview
```

## Scripts Disponibles

| Comando           | Descripción                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Iniciar servidor de desarrollo         |
| `npm run build`   | Compilar para producción               |
| `npm run preview` | Vista previa de la build de producción |
| `npm run lint`    | Ejecutar linter                        |

## Estructura del Proyecto

```
src/
├── api/
│   ├── client.ts       # Instancia Axios con interceptors
│   ├── endpoints.ts    # Definición de todos los endpoints API
│   └── index.ts        # Exports de los módulos de API
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx   # Layout principal con sidebar
│   │   └── index.ts
│   └── ui/                 # Componentes reutilizables
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Modal.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── EmptyState.tsx
│       └── index.ts
├── contexts/
│   ├── AuthContext.tsx      # Contexto de autenticación
│   ├── CompanyContext.tsx   # Contexto de empresa/sede actual
│   ├── TicketContext.ts    # Store de Zustand para ticket activo
│   └── index.ts
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ResourcesPage.tsx
│   ├── RatesPage.tsx
│   ├── CatalogPage.tsx
│   ├── TicketsPage.tsx
│   ├── ReportsPage.tsx
│   ├── CompaniesPage.tsx
│   ├── CreateCompanyPage.tsx
│   ├── CompanyDetailPage.tsx
│   └── index.ts
├── types/
│   └── index.ts        # Definiciones TypeScript
├── App.tsx             # Router principal
├── main.tsx
└── index.css           # Tailwind + variables CSS
```

## Páginas Principales

### LoginPage

Autenticación con email y password. Al iniciar sesión successfully, redirige al Dashboard.

### DashboardPage

Selector de empresa y sede. Solo muestra empresas/sedes accesibles según el rol del usuario.

### ResourcesPage

Gestión de categorías y recursos. Permite crear, editar y controlar visibilidad por sede.

### RatesPage

CRUD de tarifas con tipos TIME_UNIT (por tiempo) o BLOCK (fijo). Incluye ámbito: sede, categoría o recurso.

### CatalogPage

Gestión del catálogo de productos y servicios. Permite activar/desactivar items.

### TicketsPage

Punto de venta completo:

- Abrir nuevos tickets
- Agregar alquileres, productos, items manuales y extras
- Aplicar descuentos por línea o globales
- Registrar pagos (efectivo, tarjeta, transferencia, billetera digital)
- Cerrar y cancelar tickets
- Reversos de pagos

### ReportsPage

Reportes de tickets con filtros por fecha, estado y sede. Muestra resumen financiero.

### CompaniesPage

Listado de empresas. Solo visible para SUPERADMIN.

### CreateCompanyPage / CompanyDetailPage

Creación y gestión de empresas con sus sucursales y miembros.

## Contextos de Estado

### AuthContext

Maneja autenticación: login, logout, almacenamiento de JWT.

### CompanyContext

Gestiona empresa y sede seleccionadas globalmente en la aplicación.

### TicketContext (Zustand Store)

Estado del ticket activo con operaciones:

- Apertura de ticket
- Agregar alquileres, productos, items manuales
- Descuentos
- Pagos y reversos
- Cierre y cancelación

## Variables de Entorno

```env
VITE_API_URL=http://localhost:3000
```

## Notas de Desarrollo

- El frontend espera que el backend esté corriendo en el puerto 3000
- La autenticación usa JWT almacenado en localStorage
- Todos los endpoints API requieren el header `Authorization: Bearer <token>`
- El sistema es multi-tenant: siempre se envía companyId y branchId en las requests
