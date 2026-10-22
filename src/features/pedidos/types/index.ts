
export interface DireccionCreate {
    usuario_id: number;
    alias?: string;       // Opcional
    linea1: string;       // Obligatorio
    linea2?: string;      // Opcional
    ciudad: string;       // Obligatorio
    provincia?: string;   // Opcional
    codigo_postal?: string; // Opcional
    es_principal: boolean;
}

export interface DireccionRead {
    id: number;
    usuario_id: number;
    alias?: string;
    linea1: string;
    linea2?: string;
    ciudad: string;
    provincia?: string;
    codigo_postal?: string;
    es_principal: boolean;
    deleted_at?: string; // Usamos string porque las fechas llegan como texto (ISO 8601) desde FastAPI
}

export interface DireccionEntrega {
    id: number;
    usuario_id: number;
    alias: string;
    linea1: string;      // Dirección (Calle)
    linea2?: string;     // Número/Detalle
    ciudad: string;
    provincia: string;
    codigo_postal: string;
    es_principal: boolean;
}
export interface DetallePedido {
    id?: number;
    producto_id: number;
    cantidad: number;
    nombre_snapshot: string;
    precio_snapshot: number;
    subtotal: number;
    personalizacion?: number[];  // IDs de ingredientes removidos
}

export interface Pedido {
    id: number;
    usuario_id: number;
    usuario_nombre?: string | null;
    tipo_pedido: string;
    estado_codigo: string;
    forma_pago_codigo: string;
    subtotal: number;
    descuento: number;
    costo_envio: number;
    total: number;
    notas: string | null;
    created_at: string;
    rider_token?: string | null;
    detalles: DetallePedido[];
    direccion?: DireccionEntrega | null;
}

export interface PedidoList {
    data: Pedido[];
    total: number;
}
export interface PedidoCreate {
    usuario_id?: number;       // admin crea pedido para otro usuario
    direccion_id: number | null;
    forma_pago_codigo: string;
    notas?: string | null;
    productos: {
        producto_id: number;
        cantidad: number;
    }[];
}

// UsuarioRead viene de shared/types/. Esta versión extiende con direcciones
// solo cuando el endpoint de pedidos incluye ese campo embebido.
import type { UsuarioRead } from "../../../shared/types";
export type { UsuarioRead } from "../../../shared/types";

export interface UsuarioReadConDireccion extends UsuarioRead {
    direcciones?: DireccionEntrega[];
}

export interface FormaPago {
    codigo: string;
    descripcion: string;
    habilitado: boolean;
}