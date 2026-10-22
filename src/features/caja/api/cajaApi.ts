import api from "../../../shared/api/axiosClient";
import type { Pedido } from "../../pedidos/types";

export type TurnoCaja = {
    id: number;
    estado: string;
    abierto_en: string;
    cerrado_en: string | null;
    fondo_inicial: number;
    efectivo_esperado: number | null;
    efectivo_contado: number | null;
    pedidos_turno: number;
    total_efectivo_pedidos: number;
};

const BASE = "/api/v1/caja";

export const cajaApi = {
    turnoActual: () => api.get<TurnoCaja | null>(`${BASE}/turno/actual`).then((r) => r.data),
    abrirTurno: (fondo_inicial: number) =>
        api.post<TurnoCaja>(`${BASE}/turno/abrir`, { fondo_inicial }).then((r) => r.data),
    cerrarTurno: (efectivo_contado: number, notas_cierre?: string) =>
        api
            .post<TurnoCaja>(`${BASE}/turno/cerrar`, { efectivo_contado, notas_cierre })
            .then((r) => r.data),
    pedidoMostrador: (body: {
        items: { producto_id: number; cantidad: number }[];
        forma_pago_codigo: string;
        notas?: string;
    }) =>
        api
            .post<{ pedido: Pedido; turno_caja_id: number }>(`${BASE}/pedidos-mostrador`, {
                ...body,
                confirmar_pago: true,
            })
            .then((r) => r.data),
};
