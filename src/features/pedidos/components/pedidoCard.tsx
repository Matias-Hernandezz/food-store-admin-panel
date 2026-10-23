import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { facturacionApi } from "../../facturacion/api/facturacionApi";
import { cajaApi } from "../../caja/api/cajaApi";
import { useUIStore } from "../../../store/uiStore";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import type { Pedido } from "../types/index";
import { ESTADO_LABEL, ESTADO_COLOR, transicionesSiguientes } from "../hooks/usePedidos";
import { imprimirComanda } from "../utils/printComanda";

interface Props {
    pedido: Pedido;
    onAvanzar: (id: number, estado: string, motivo?: string) => void;
    loading: boolean;
    ingredientesMap?: Map<number, string>;
    /** Muestra minutos desde creación (cocina / KDS). */
    mostrarTiempoEspera?: boolean;
}

const CLIENT_APP_URL = (import.meta.env.VITE_CLIENT_APP_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:5174";

const TIPO_LABEL: Record<string, string> = {
    DELIVERY: "Delivery",
    PICKUP: "Retiro",
    DINE_IN: "Salón",
};

function minutosEspera(createdAt: string): number {
    return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
}

export function PedidoCard({ pedido, onAvanzar, loading, ingredientesMap, mostrarTiempoEspera }: Props) {
    const addToast = useUIStore((s) => s.addToast);
    const queryClient = useQueryClient();
    const emitirFactura = useMutation({
        mutationFn: () => facturacionApi.emitir(pedido.id),
        onSuccess: (c) => addToast({ type: "success", message: `CAE ${c.cae}` }),
        onError: (err) =>
            addToast({ type: "error", message: getApiErrorMessage(err, "No se pudo emitir comprobante") }),
    });
    const siguientes = transicionesSiguientes(pedido.tipo_pedido ?? "DELIVERY", pedido.estado_codigo);
    const riderUrl =
        pedido.tipo_pedido === "DELIVERY" && pedido.rider_token
            ? `${CLIENT_APP_URL}/repartidor/${pedido.rider_token}`
            : null;
    const [mostrarMotivo, setMostrarMotivo] = useState(false);
    const [motivoCancel, setMotivoCancel] = useState("");

    const confirmarCobro = useMutation({
        mutationFn: () => cajaApi.confirmarCobro(pedido.id),
        onSuccess: () => {
            addToast({ type: "success", message: `Cobro confirmado · pedido #${pedido.id}` });
            queryClient.invalidateQueries({ queryKey: ["pedidos"] });
            queryClient.invalidateQueries({ queryKey: ["caja-turno"] });
            queryClient.invalidateQueries({ queryKey: ["pedidos", "cocina"] });
        },
        onError: (err) =>
            addToast({ type: "error", message: getApiErrorMessage(err, "No se pudo confirmar el cobro") }),
    });

    const puedeCobrar = pedido.estado_codigo === "PENDIENTE";
    const espera = mostrarTiempoEspera ? minutosEspera(pedido.created_at) : null;

    return (
        <div className="rounded-2xl p-5 shadow-sm flex flex-col h-full" style={{ backgroundColor: "#fff", border: "1px solid #E5E2DA" }}>
            <div className="flex flex-wrap items-start justify-between gap-y-2 mb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold font-mono" style={{ color: "#9a8070" }}>#{pedido.id}</span>
                        {pedido.tipo_pedido && (
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#f3ebe3] text-[#6b5a4e]">
                                {TIPO_LABEL[pedido.tipo_pedido] ?? pedido.tipo_pedido}
                            </span>
                        )}
                        {espera != null && (
                            <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${espera >= 20 ? "bg-red-100 text-red-800" : espera >= 10 ? "bg-amber-100 text-amber-900" : "bg-emerald-50 text-emerald-800"}`}
                            >
                                {espera} min
                            </span>
                        )}
                        {pedido.usuario_nombre && (
                            <span className="text-sm font-semibold" style={{ color: "#2d1e0f" }}>
                                {pedido.usuario_nombre}
                            </span>
                        )}
                    </div>
                    <p className="text-xs mt-0.5 break-words" style={{ color: "#9a8070" }}>
                        {new Date(pedido.created_at).toLocaleDateString("es-AR")}{" "}
                        {new Date(pedido.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        {pedido.forma_pago_codigo === "EFECTIVO" && " · Efectivo"}
                        {pedido.forma_pago_codigo === "MERCADOPAGO" && " · MP"}
                        {pedido.forma_pago_codigo === "TRANSFERENCIA" && " · Transf."}
                    </p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${ESTADO_COLOR[pedido.estado_codigo]}`}>
                    {ESTADO_LABEL[pedido.estado_codigo]}
                </span>
            </div>

            {riderUrl && (
                <div className="mb-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2">
                        🛵 App repartidor
                    </p>
                    <a
                        href={riderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-700 underline break-all"
                    >
                        Abrir en el celular del repartidor
                    </a>
                    <button
                        type="button"
                        className="mt-2 block text-[11px] font-medium text-blue-600 hover:underline"
                        onClick={() => navigator.clipboard.writeText(riderUrl)}
                    >
                        Copiar link
                    </button>
                </div>
            )}

            {pedido.direccion && (
                <div className="mb-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
                    <p className="text-[10px] font-bold text-[#C87A2E] uppercase tracking-widest mb-1">
                        📍 Dirección de entrega
                    </p>
                    <p className="text-sm font-medium text-[#2d1e0f]">
                        {pedido.direccion.linea1} {pedido.direccion.linea2 ?? ""}
                    </p>
                </div>
            )}

            {pedido.notas && (
                <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">
                        📝 Notas
                    </p>
                    <p className="text-[11px] italic text-[#2d1e0f]">
                        "{pedido.notas}"
                    </p>
                </div>
            )}

            <div className="pt-3 mb-3 space-y-1 mt-auto" style={{ borderTop: "1px solid #E5E2DA" }}>
                {pedido.detalles.map((d) => (
                    <div key={d.id ?? d.producto_id}>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: "#6b5a4e" }}>{d.cantidad}x {d.nombre_snapshot}</span>
                            <span className="font-medium" style={{ color: "#2d1e0f" }}>${Number(d.subtotal).toFixed(2)}</span>
                        </div>
                        {Array.isArray(d.personalizacion) && d.personalizacion.length > 0 && ingredientesMap && (
                            <p className="text-[11px] text-red-500 italic ml-1 -mt-0.5 mb-1">
                                Sin: {ingredientesMap.size > 0
                                    ? d.personalizacion.map((id) => ingredientesMap.get(Number(id)) ?? `#${id}`).join(", ")
                                    : `${d.personalizacion.length} ingrediente(s)`}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-3">
                <button
                    type="button"
                    className="text-xs font-semibold text-[#2d1e0f] underline"
                    onClick={() => imprimirComanda(pedido, ingredientesMap)}
                >
                    Imprimir comanda
                </button>
                {pedido.estado_codigo !== "CANCELADO" && (
                    <button
                        type="button"
                        disabled={emitirFactura.isPending}
                        onClick={() => emitirFactura.mutate()}
                        className="text-xs font-semibold text-[#2d1e0f] underline disabled:opacity-50"
                    >
                        {emitirFactura.isPending ? "Emitiendo factura…" : "Emitir factura (mock/ARCA)"}
                    </button>
                )}
            </div>

            {puedeCobrar && (
                <button
                    type="button"
                    disabled={confirmarCobro.isPending || loading}
                    onClick={() => confirmarCobro.mutate()}
                    className="mb-3 w-full text-xs font-bold py-2.5 px-3 rounded-xl disabled:opacity-50"
                    style={{ backgroundColor: "#166534", color: "#fff" }}
                >
                    {confirmarCobro.isPending ? "Registrando cobro…" : "Confirmar cobro (caja)"}
                </button>
            )}

            <div className="flex justify-between text-sm font-bold pt-2 mb-4" style={{ borderTop: "1px solid #E5E2DA" }}>
                <span style={{ color: "#2d1e0f" }}>Total</span>
                <span style={{ color: "#C87A2E" }}>${Number(pedido.total).toFixed(2)}</span>
            </div>

            {siguientes.length > 0 && (
                <div className="flex flex-col gap-2">
                    {/* Prompt de motivo al cancelar */}
                    {mostrarMotivo && (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Motivo de cancelación..."
                                value={motivoCancel}
                                onChange={(e) => setMotivoCancel(e.target.value)}
                                className="flex-1 text-xs px-3 py-2 rounded-lg border outline-none"
                                style={{ borderColor: "#fecaca", color: "#2d1e0f", backgroundColor: "#fff" }}
                            />
                            <button
                                disabled={!motivoCancel.trim() || loading}
                                onClick={() => {
                                    onAvanzar(pedido.id, "CANCELADO", motivoCancel.trim());
                                    setMotivoCancel("");
                                    setMostrarMotivo(false);
                                }}
                                className="text-xs font-bold px-4 py-2 rounded-lg bg-red-600 text-white disabled:opacity-50"
                            >
                                Confirmar
                            </button>
                            <button
                                onClick={() => { setMostrarMotivo(false); setMotivoCancel(""); }}
                                className="text-xs px-3 py-2 rounded-lg"
                                style={{ color: "#9a8070", border: "1px solid #E5E2DA" }}
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    <div className="flex gap-2 flex-wrap">
                        {siguientes.map((estado) => (
                            <button key={estado} disabled={loading} onClick={() => {
                                if (estado === "CANCELADO") {
                                    setMostrarMotivo(true);
                                } else {
                                    onAvanzar(pedido.id, estado);
                                }
                            }}
                                className="flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all disabled:opacity-50"
                                style={estado === "CANCELADO"
                                    ? { backgroundColor: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }
                                    : { backgroundColor: "#C87A2E", color: "#fff" }}>
                                → {ESTADO_LABEL[estado]}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {siguientes.length === 0 && (
                <p className="text-xs text-center italic" style={{ color: "#9a8070" }}>Estado terminal</p>
            )}
        </div>
    );
}
