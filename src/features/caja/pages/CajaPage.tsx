import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useProductos } from "../../producto/hooks/useProducto";
import { usePedidos } from "../../pedidos/hooks/usePedidos";
import { pedidosApi } from "../../pedidos/api/pedidosApi";
import { cajaApi } from "../api/cajaApi";
import { useUIStore } from "../../../store/uiStore";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

export function CajaPage() {
    const addToast = useUIStore((s) => s.addToast);
    const queryClient = useQueryClient();
    const { data: turno, isLoading } = useQuery({
        queryKey: ["caja-turno"],
        queryFn: cajaApi.turnoActual,
    });
    const { data: productosData } = useProductos({ page: 1, pageSize: 100 });
    const { formasPago } = usePedidos({ enabled: false });

    const { data: pendientesData, refetch: refetchPendientes } = useQuery({
        queryKey: ["pedidos", "pendientes-caja"],
        queryFn: () => pedidosApi.getAll(0, 30, undefined, undefined, undefined, "PENDIENTE"),
        enabled: !!turno,
    });
    const pendientes = pendientesData?.data ?? [];

    const cobrarPendiente = useMutation({
        mutationFn: (pedidoId: number) => cajaApi.confirmarCobro(pedidoId),
        onSuccess: () => {
            addToast({ type: "success", message: "Cobro registrado" });
            queryClient.invalidateQueries({ queryKey: ["pedidos"] });
            queryClient.invalidateQueries({ queryKey: ["caja-turno"] });
            queryClient.invalidateQueries({ queryKey: ["pedidos", "cocina"] });
            refetchPendientes();
        },
        onError: (err) =>
            addToast({ type: "error", message: getApiErrorMessage(err, "No se pudo cobrar") }),
    });

    const [fondoInicial, setFondoInicial] = useState("0");
    const [efectivoCierre, setEfectivoCierre] = useState("");
    const [carrito, setCarrito] = useState<Record<number, number>>({});
    const [formaPago, setFormaPago] = useState("EFECTIVO");

    const productos = productosData?.data ?? [];
    const total = useMemo(
        () =>
            Object.entries(carrito).reduce((acc, [id, qty]) => {
                const p = productos.find((x) => x.id === Number(id));
                return acc + (p ? Number(p.precio_base) * qty : 0);
            }, 0),
        [carrito, productos],
    );

    const abrir = useMutation({
        mutationFn: () => cajaApi.abrirTurno(Number(fondoInicial) || 0),
        onSuccess: () => {
            addToast({ type: "success", message: "Turno abierto" });
            queryClient.invalidateQueries({ queryKey: ["caja-turno"] });
        },
        onError: (err) =>
            addToast({ type: "error", message: getApiErrorMessage(err, "No se pudo abrir el turno") }),
    });

    const cerrar = useMutation({
        mutationFn: () => cajaApi.cerrarTurno(Number(efectivoCierre) || 0),
        onSuccess: (t) => {
            const diff =
                t.efectivo_contado != null && t.efectivo_esperado != null
                    ? t.efectivo_contado - t.efectivo_esperado
                    : 0;
            addToast({
                type: "success",
                message: `Turno cerrado · diferencia $${diff.toFixed(2)}`,
            });
            queryClient.invalidateQueries({ queryKey: ["caja-turno"] });
            setEfectivoCierre("");
        },
        onError: (err) =>
            addToast({ type: "error", message: getApiErrorMessage(err, "No se pudo cerrar el turno") }),
    });

    const cargarPedido = useMutation({
        mutationFn: () =>
            cajaApi.pedidoMostrador({
                forma_pago_codigo: formaPago,
                items: Object.entries(carrito).map(([id, cantidad]) => ({
                    producto_id: Number(id),
                    cantidad,
                })),
            }),
        onSuccess: () => {
            addToast({ type: "success", message: "Pedido mostrador creado" });
            setCarrito({});
            queryClient.invalidateQueries({ queryKey: ["caja-turno"] });
        },
        onError: (err) =>
            addToast({ type: "error", message: getApiErrorMessage(err, "Error al crear pedido") }),
    });

    if (isLoading) {
        return <p className="text-sm" style={{ color: "#6b5a4a" }}>Cargando caja…</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold" style={{ color: "#2d1e0f" }}>Caja / mostrador</h1>
                <p className="text-sm mt-1" style={{ color: "#6b5a4a" }}>
                    Turnos, arqueo y pedidos presenciales (DINE_IN).
                </p>
            </div>

            <div
                className="rounded-xl border p-6 max-w-lg"
                style={{ backgroundColor: "#fff", borderColor: "#e8d5c0" }}
            >
                <h2 className="font-bold mb-3" style={{ color: "#2d1e0f" }}>Turno de caja</h2>
                {turno ? (
                    <div className="text-sm space-y-2" style={{ color: "#4a3d2f" }}>
                        <p>Turno #{turno.id} · abierto {new Date(turno.abierto_en).toLocaleString("es-AR")}</p>
                        <p>Fondo inicial: ${Number(turno.fondo_inicial).toFixed(2)}</p>
                        <p>Pedidos en turno: {turno.pedidos_turno}</p>
                        <p>Efectivo en pedidos: ${Number(turno.total_efectivo_pedidos).toFixed(2)}</p>
                        <p className="font-semibold">
                            Esperado en caja: $
                            {(Number(turno.fondo_inicial) + Number(turno.total_efectivo_pedidos)).toFixed(2)}
                        </p>
                        <label className="block mt-4">
                            Efectivo contado al cierre
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={efectivoCierre}
                                onChange={(e) => setEfectivoCierre(e.target.value)}
                                className="mt-1 w-full border rounded-lg px-3 py-2"
                            />
                        </label>
                        <button
                            type="button"
                            disabled={cerrar.isPending}
                            onClick={() => cerrar.mutate()}
                            className="mt-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#2d1e0f] disabled:opacity-50"
                        >
                            Cerrar turno (arqueo)
                        </button>
                    </div>
                ) : (
                    <div className="text-sm space-y-3">
                        <label>
                            Fondo inicial ($)
                            <input
                                type="number"
                                min={0}
                                value={fondoInicial}
                                onChange={(e) => setFondoInicial(e.target.value)}
                                className="mt-1 w-full border rounded-lg px-3 py-2"
                            />
                        </label>
                        <button
                            type="button"
                            disabled={abrir.isPending}
                            onClick={() => abrir.mutate()}
                            className="px-4 py-2 rounded-lg text-sm font-bold text-white"
                            style={{ backgroundColor: "#C87A2E" }}
                        >
                            Abrir turno
                        </button>
                    </div>
                )}
            </div>

            {turno && pendientes.length > 0 && (
                <div
                    className="rounded-xl border p-6 max-w-2xl"
                    style={{ backgroundColor: "#fff", borderColor: "#e8d5c0" }}
                >
                    <h2 className="font-bold mb-3" style={{ color: "#2d1e0f" }}>
                        Cobros pendientes ({pendientes.length})
                    </h2>
                    <p className="text-xs mb-4" style={{ color: "#6b5a4a" }}>
                        Pedidos web o delivery en PENDIENTE. Al confirmar pasan a CONFIRMADO y entran a cocina.
                    </p>
                    <ul className="space-y-2">
                        {pendientes.map((p) => (
                            <li
                                key={p.id}
                                className="flex flex-wrap items-center justify-between gap-2 text-sm border rounded-lg p-3"
                                style={{ borderColor: "#e8d5c0" }}
                            >
                                <span>
                                    <strong>#{p.id}</strong>
                                    {p.usuario_nombre ? ` · ${p.usuario_nombre}` : ""}
                                    {" · "}
                                    {p.forma_pago_codigo}
                                    {" · "}
                                    <strong>${Number(p.total).toFixed(2)}</strong>
                                </span>
                                <button
                                    type="button"
                                    disabled={cobrarPendiente.isPending}
                                    onClick={() => cobrarPendiente.mutate(p.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                                    style={{ backgroundColor: "#166534" }}
                                >
                                    Confirmar cobro
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {turno && (
                <div
                    className="rounded-xl border p-6 max-w-2xl"
                    style={{ backgroundColor: "#fff", borderColor: "#e8d5c0" }}
                >
                    <h2 className="font-bold mb-3" style={{ color: "#2d1e0f" }}>Pedido mostrador</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto mb-4">
                        {productos.filter((p) => p.disponible).map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() =>
                                    setCarrito((c) => ({
                                        ...c,
                                        [p.id]: (c[p.id] ?? 0) + 1,
                                    }))
                                }
                                className="text-left text-sm border rounded-lg p-2 hover:border-[#C87A2E]"
                            >
                                {p.nombre} · ${Number(p.precio_base).toFixed(2)}
                            </button>
                        ))}
                    </div>
                    {Object.keys(carrito).length > 0 && (
                        <ul className="text-sm mb-3 space-y-1">
                            {Object.entries(carrito).map(([id, qty]) => {
                                const p = productos.find((x) => x.id === Number(id));
                                return (
                                    <li key={id} className="flex justify-between">
                                        <span>{qty}x {p?.nombre}</span>
                                        <button
                                            type="button"
                                            className="text-xs text-red-600"
                                            onClick={() =>
                                                setCarrito((c) => {
                                                    const n = { ...c };
                                                    delete n[Number(id)];
                                                    return n;
                                                })
                                            }
                                        >
                                            quitar
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                    <div className="flex flex-wrap gap-3 items-end">
                        <label className="text-sm">
                            Pago
                            <select
                                value={formaPago}
                                onChange={(e) => setFormaPago(e.target.value)}
                                className="mt-1 block border rounded-lg px-3 py-2"
                            >
                                {(formasPago ?? []).filter((f) => f.habilitado).map((f) => (
                                    <option key={f.codigo} value={f.codigo}>{f.descripcion}</option>
                                ))}
                            </select>
                        </label>
                        <p className="font-bold text-lg">Total ${total.toFixed(2)}</p>
                        <button
                            type="button"
                            disabled={cargarPedido.isPending || total <= 0}
                            onClick={() => cargarPedido.mutate()}
                            className="px-4 py-2 rounded-lg font-bold text-white disabled:opacity-50"
                            style={{ backgroundColor: "#C87A2E" }}
                        >
                            Cobrar y enviar a cocina
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
