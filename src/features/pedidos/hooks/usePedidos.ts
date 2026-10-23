// features/pedidos/hooks/usePedidos.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pedidosApi } from "../api/pedidosApi";
import { useUIStore } from "../../../store/uiStore";
import type { PedidoCreate, DireccionCreate } from "../types/index";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

import { ESTADO_COLOR, ESTADO_LABEL, ESTADOS_FSM_DELIVERY, transicionesSiguientes } from "../pedidoEstados";

export { ESTADO_COLOR, ESTADO_LABEL, transicionesSiguientes };

/** Compat kanban: unión de transiciones envío (más completa) */
export const ESTADOS_FSM = ESTADOS_FSM_DELIVERY;

interface Props {
    desde?: string;
    hasta?: string;
    search?: string;
    estado?: string;
    enabled?: boolean;
}

export function usePedidos({ desde, hasta, search, estado, enabled = true }: Props = {}) {
    const queryClient = useQueryClient();
    const addToast = useUIStore((s) => s.addToast);

    // --- QUERIES ---
    const pedidosList = useQuery({
        queryKey: ["pedidos", { desde, hasta, search, estado }],
        queryFn: () => pedidosApi.getAll(0, 50, desde, hasta, search, estado),
        refetchInterval: 30000,
        enabled,
    });

    const misPedidosQuery = useQuery({
        queryKey: ["mis-pedidos"],
        queryFn: () => pedidosApi.getMisPedidos(),
        enabled,
    });

    const formasPagoQuery = useQuery({
        queryKey: ["formas-pago"],
        queryFn: () => pedidosApi.getFormasPago(),
        enabled,
    });

    const direccionesQuery = useQuery({
        queryKey: ["direcciones"],
        queryFn: () => pedidosApi.getDirecciones(),
        enabled,
    });

    // --- MUTATIONS ---
    const avanzarEstadoMutation = useMutation({
        mutationFn: ({ id, estado, motivo }: { id: number; estado: string; motivo?: string }) =>
            pedidosApi.avanzarEstado(id, estado, motivo),
        onSuccess: (_, { estado }) => {
            queryClient.invalidateQueries({ queryKey: ["pedidos"] });
            addToast({ type: "success", message: `Pedido → ${ESTADO_LABEL[estado] ?? estado}` });
        },
        onError: (err) => {
            addToast({
                type: "error",
                message: getApiErrorMessage(err, "Error al cambiar el estado del pedido"),
            });
        },
    });

    const crearDireccionMutation = useMutation({
        mutationFn: (data: DireccionCreate) => pedidosApi.crearDireccion(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["direcciones"] });
            addToast({ type: "success", message: "Dirección creada" });
        },
        onError: (err) => {
            addToast({ type: "error", message: getApiErrorMessage(err, "Error al crear la dirección") });
        },
    });

    const crearPedidoMutation = useMutation({
        mutationFn: (data: PedidoCreate) => pedidosApi.crear(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["mis-pedidos"] });
            addToast({ type: "success", message: "Pedido creado" });
        },
        onError: (err) => {
            addToast({ type: "error", message: getApiErrorMessage(err, "Error al crear el pedido") });
        },
    });

    return {
        data: pedidosList.data,
        error: pedidosList.error,
        isLoading: pedidosList.isLoading,
        isFetching: pedidosList.isFetching,
        isError: pedidosList.isError,
        refetch: pedidosList.refetch,
        misPedidos: misPedidosQuery.data,
        misPedidosLoading: misPedidosQuery.isLoading,
        formasPago: formasPagoQuery.data,
        formasPagoLoading: formasPagoQuery.isLoading,
        direcciones: direccionesQuery.data,
        direccionesLoading: direccionesQuery.isLoading,
        avanzarEstado: avanzarEstadoMutation.mutateAsync,
        avanzarEstadoPending: avanzarEstadoMutation.isPending,
        crearDireccion: crearDireccionMutation.mutateAsync,
        crearDireccionPending: crearDireccionMutation.isPending,
        crearPedido: crearPedidoMutation.mutateAsync,
        crearPedidoPending: crearPedidoMutation.isPending,
    };
}
