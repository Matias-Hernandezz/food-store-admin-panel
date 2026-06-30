
// ─── PAGINACIÓN GENÉRICA ─────────────────────────────────────────────────────
// Reemplaza las interfaces XxxList duplicadas. La rúbrica §16 exige "no any".

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

// ─── CATEGORIA ───────────────────────────────────────────────────────────────

export interface Categoria {
  id: number;
  parent_id: number | null;
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CategoriaCreate {
  parent_id?: number | null;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
}

export interface CategoriaUpdate {
  parent_id?: number | null;
  nombre?: string;
  descripcion?: string | null;
  imagen_url?: string | null;
}

export type CategoriaList = PaginatedResponse<Categoria>;

// ─── INGREDIENTE ─────────────────────────────────────────────────────────────

export interface Ingrediente {
  id: number;
  nombre: string;
  descripcion: string | null;
  es_alergeno: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IngredienteCreate {
  nombre: string;
  descripcion?: string | null;
  es_alergeno?: boolean;
}

export interface IngredienteUpdate {
  nombre?: string;
  descripcion?: string | null;
  es_alergeno?: boolean;
}

export type IngredienteList = PaginatedResponse<Ingrediente>;

// ─── UNIDAD DE MEDIDA ───────────────────────────────────────────────────────

export interface UnidadMedida {
  id: number;
  nombre: string;
  simbolo: string;
  tipo: string;
}

// ─── PRODUCTO ────────────────────────────────────────────────────────────────

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio_base: number;
  imagenes_url: string[] | null;
  stock_cantidad: number;
  disponible: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  categoria_ids: number[];
  ingrediente_ids: number[];
  unidad_venta?: UnidadMedida | null;
  cantidad_venta?: number | null;
}

export interface ProductoCreate {
  nombre: string;
  descripcion?: string | null;
  precio_base: number;
  imagenes_url?: string[] | null;
  stock_cantidad?: number;
  disponible?: boolean;
  categoria_ids: number[];
  ingrediente_ids?: number[];
  unidad_venta_id?: number | null;
  cantidad_venta?: number | null;
}

export interface ProductoUpdate {
  nombre?: string;
  descripcion?: string | null;
  precio_base?: number;
  imagenes_url?: string[] | null;
  stock_cantidad?: number;
  disponible?: boolean;
  categoria_ids?: number[];
  ingrediente_ids?: number[];
  unidad_venta_id?: number | null;
  cantidad_venta?: number | null;
}

export type ProductoList = PaginatedResponse<Producto>;

// ─── PAGINACION ───────────────────────────────────────────────────────────────
// También se usa en hooks para tipar query params de listados.

export interface PaginationParams {
  offset?: number;
  limit?: number;
}

// ─── USUARIO (compartido — lo usan auth, pedidos, usuarios) ──────────────────
// Antes duplicado en auth/types/ y pedidos/types/. Unificado para cumplir FSD.

export interface UsuarioCreate {
  nombre: string;
  apellido: string;
  email: string;
  celular?: string;
  password: string;
}

export interface UsuarioRead {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  celular: string | null;
  roles: string[];
  deleted_at: string | null;
}
