import api from "../../../shared/api/axiosClient";

export type ZonaEnvioRow = {
    id?: number;
    nombre: string;
    ciudad_match: string | null;
    costo_envio: number;
    pedido_minimo: number;
    activa: boolean;
    orden: number;
};

const BASE = "/api/v1/config/zonas-envio";

export const zonasEnvioApi = {
    get: () => api.get<{ zonas: ZonaEnvioRow[] }>(BASE).then((r) => r.data),
    save: (zonas: ZonaEnvioRow[]) => api.put<{ zonas: ZonaEnvioRow[] }>(BASE, { zonas }).then((r) => r.data),
};
