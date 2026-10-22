import api from "../../../shared/api/axiosClient";

export type ConfigFiscal = {
    cuit: string;
    razon_social: string;
    punto_venta: number;
    condicion_iva: "MONOTRIBUTO" | "RI";
    adapter: "mock" | "wsfe";
    habilitado: boolean;
};

export type ComprobanteFiscal = {
    id: number;
    pedido_id: number;
    tipo_comprobante: number;
    numero: number;
    cae: string | null;
    cae_vencimiento: string | null;
    estado: string;
    importe_total: number;
    qr_payload: string | null;
    error_detalle: string | null;
};

const BASE = "/api/v1/facturacion";

export const facturacionApi = {
    getConfig: () => api.get<ConfigFiscal>(`${BASE}/config`).then((r) => r.data),
    saveConfig: (body: ConfigFiscal) => api.put<ConfigFiscal>(`${BASE}/config`, body).then((r) => r.data),
    getComprobante: (pedidoId: number) =>
        api.get<ComprobanteFiscal | null>(`${BASE}/pedidos/${pedidoId}`).then((r) => r.data),
    emitir: (pedidoId: number) =>
        api.post<ComprobanteFiscal>(`${BASE}/pedidos/${pedidoId}/emitir`).then((r) => r.data),
};
