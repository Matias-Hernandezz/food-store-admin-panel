# 🛠️ Food Store — Panel de Administración

Panel de administración React + TypeScript para la gestión integral de Food Store. Dashboard con gráficos, CRUD de entidades y gestión de pedidos en tiempo real vía WebSocket.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| UI | React 19 · TypeScript 6.x |
| Build | Vite 6.x |
| Estilos | Tailwind CSS 4.x |
| Estado servidor | TanStack Query 5.x |
| Estado cliente | Zustand 5.x |
| HTTP | Axios (interceptors JWT) |
| Gráficos | Recharts 2.x |

## Prerequisitos

- **Node.js** 20+
- **pnpm** 9+
- Backend corriendo en `http://localhost:8000`

## Setup — Paso a Paso

### 1. Clonar y configurar

```powershell
cd food-store-admin-panel
copy .env.example .env
```

### 2. Instalar dependencias

```powershell
pnpm install
```

### 3. Levantar en desarrollo

```powershell
pnpm dev
```

Admin disponible en **http://localhost:5174**

### 4. Compilar para producción

```powershell
pnpm build
```

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL del backend | `http://localhost:8000` |

## Credenciales de Acceso

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@foodstore.com | Admin1234! |
| Stock | stock@ejemplo.com | 123456 |
| Pedidos | pedidos@ejemplo.com | 123456 |

## Features

| Feature | Ruta | Roles |
|---------|------|-------|
| Dashboard + KPIs | `/admin/estadisticas` | ADMIN |
| Gestión de Pedidos (Kanban) | `/admin/pedidos` | ADMIN, PEDIDOS |
| Cocina | `/admin/pedidos/cocina` | ADMIN, PEDIDOS |
| Cajero | `/admin/pedidos/cajero` | ADMIN, PEDIDOS |
| CRUD Usuarios | `/admin/usuarios` | ADMIN |
| CRUD Categorías | `/admin/categorias` | ADMIN, STOCK |
| CRUD Productos | `/admin/productos` | ADMIN, STOCK |
| CRUD Ingredientes | `/admin/ingredientes` | ADMIN, STOCK |

## Arquitectura

```
src/
├── features/           # Feature-Sliced Design
│   ├── auth/           # Login, ProtectedRoute
│   ├── estadisticas/   # Dashboard + gráficos Recharts
│   ├── pedidos/        # Kanban, cocina, cajero
│   ├── producto/       # CRUD + Cloudinary upload
│   ├── categoria/      # CRUD
│   ├── ingrediente/    # CRUD
│   └── usuarios/       # CRUD + roles
├── shared/             # API client, hooks, componentes compartidos
│   ├── api/            # Axios client + interceptors
│   ├── components/     # AdminLayout, CloudinaryUpload, ConnectionBadge
│   ├── hooks/          # useAdminOrdersFeed (WebSocket)
│   └── types/          # Tipos compartidos
└── store/              # Zustand stores
    ├── authStore.ts    # Autenticación (JWT + refresh)
    ├── uiStore.ts      # Sidebar, toasts
    └── wsStore.ts      # Estado WebSocket
```

Proyecto académico — Food Store v6.0
