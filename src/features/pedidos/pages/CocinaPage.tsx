import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePedidos } from "../hooks/usePedidos";
import { pedidosApi } from "../../pedidos/api/pedidosApi";
import { PedidoCard } from "../../pedidos/components/pedidoCard";
import api from "../../../shared/api/axiosClient";
import { AdminPageHeader } from "../../../shared/components/AdminPageHeader";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

interface IngredienteSimple { id: number; nombre: string }

export function CocinaPage() {
    const [fullscreen, setFullscreen] = useState(false);
    const { data, isLoading, error } = useQuery({
        queryKey: ["pedidos", "cocina"],
        queryFn: () => pedidosApi.getCocinaPedidos(),
        refetchInterval: 30_000,
    });

    const { data: ingredientesData } = useQuery({
        queryKey: ["ingredientes"],
        queryFn: () => api.get<{ data: IngredienteSimple[] }>("/api/v1/ingredientes/?limit=100").then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });
    const ingredientesMap = useMemo(() => new Map(
        (ingredientesData?.data ?? []).map((i) => [i.id, i.nombre])
    ), [ingredientesData]);

    const { avanzarEstado: avanzar, avanzarEstadoPending: isPending } = usePedidos({ enabled: false });

    const pedidos = useMemo(() => {
        const list = [...(data?.data ?? [])];
        list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return list;
    }, [data?.data]);

    const shellClass = fullscreen
        ? "fixed inset-0 z-[100] overflow-y-auto p-4 md:p-6"
        : "flex flex-col gap-6";

    if (isLoading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#C87A2E", borderTopColor: "transparent" }} />
        </div>
    );

    if (error) return (
        <div className="rounded-xl p-4" style={{ backgroundColor: "#fee2e2", border: "1px solid #fecaca", color: "#991b1b" }}>
            {getApiErrorMessage(error, "Error al cargar pedidos de cocina")}
        </div>
    );

    return (
        <div className={shellClass} style={fullscreen ? { backgroundColor: "#E8D5C0" } : undefined}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <AdminPageHeader
                    title="Cocina (KDS)"
                    description={`${pedidos.length} pedido(s) · más antiguos primero · actualización cada 30 s`}
                />
                <button
                    type="button"
                    onClick={() => setFullscreen((f) => !f)}
                    className="shrink-0 text-sm font-bold px-4 py-2 rounded-xl border"
                    style={{ borderColor: "#C87A2E", color: "#C87A2E", backgroundColor: "#fff" }}
                >
                    {fullscreen ? "Salir pantalla completa" : "Pantalla completa"}
                </button>
            </div>

            {pedidos.length === 0 ? (
                <div className="text-center py-16" style={{ color: "#9a8070" }}>
                    <p>No hay pedidos en preparación</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {pedidos.map((pedido) => (
                        <PedidoCard
                            key={pedido.id}
                            pedido={pedido}
                            loading={isPending}
                            mostrarTiempoEspera
                            onAvanzar={(id, estado, motivo) => avanzar({ id, estado, motivo })}
                            ingredientesMap={ingredientesMap}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
