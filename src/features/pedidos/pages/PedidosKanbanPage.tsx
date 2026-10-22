import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../shared/api/axiosClient";
import { usePedidos, ESTADO_LABEL } from "../hooks/usePedidos";
import { PedidoCard } from "../components/pedidoCard";

interface IngredienteSimple { id: number; nombre: string };

const COLUMNAS: { codigo: string; titulo: string }[] = [
    { codigo: "PENDIENTE", titulo: "Pendientes" },
    { codigo: "CONFIRMADO", titulo: "Confirmados" },
    { codigo: "EN_PREPARACION", titulo: "En preparación" },
    { codigo: "PREPARADO", titulo: "Preparados" },
    { codigo: "EN_CAMINO", titulo: "En camino" },
    { codigo: "ENTREGADO", titulo: "Entregados" },
];

function hoyISO(): string {
    // Fecha local del navegador (Argentina), NO UTC
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/* ── Iconos inline ─────────────────────────────────────────────────────── */

const CalendarIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
    </svg>
);

const SearchIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
    </svg>
);

/* ═════════════════════════════════════════════════════════════════════════ */

export function PedidosKanbanPage() {
    const [fechaFiltro, setFechaFiltro] = useState<"TODOS" | "HOY" | "PERSONALIZADO">("TODOS");
    const [fechaCustom, setFechaCustom] = useState(hoyISO());
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState<string>("TODOS");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Cierra el dropdown al clickear afuera
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Mapa de colores para los dots del dropdown
    const ESTADO_DOT: Record<string, string> = {
        PENDIENTE: "#ca8a04",
        CONFIRMADO: "#2563eb",
        EN_PREPARACION: "#ea580c",
        PREPARADO: "#d97706",
        EN_CAMINO: "#4f46e5",
        ENTREGADO: "#16a34a",
        CANCELADO: "#dc2626",
    };

    const { desde, hasta } = useMemo(() => {
        if (fechaFiltro === "HOY") {
            const hoy = hoyISO();
            return { desde: hoy, hasta: hoy };
        }
        if (fechaFiltro === "PERSONALIZADO") {
            return { desde: fechaCustom, hasta: fechaCustom };
        }
        return { desde: undefined, hasta: undefined };
    }, [fechaFiltro, fechaCustom]);

    const searchTerm = search.trim() || undefined;
    const estadoParam = estadoFiltro !== "TODOS" ? estadoFiltro : undefined;

    const { data, isLoading } = usePedidos({ desde, hasta, search: searchTerm, estado: estadoParam });
    const { avanzarEstado: avanzar, avanzarEstadoPending: avanzarPending } = usePedidos({ enabled: false });

    const { data: ingredientesData } = useQuery({
        queryKey: ["ingredientes"],
        queryFn: () => api.get<{ data: IngredienteSimple[] }>("/api/v1/ingredientes/?limit=100").then(r => r.data),
        staleTime: 5 * 60 * 1000,
    });
    const ingredientesMap = useMemo(() => new Map(
        (ingredientesData?.data ?? []).map((i) => [i.id, i.nombre])
    ), [ingredientesData]);

    const pedidos = data?.data ?? [];

    const pedidosPorEstado = (codigo: string) =>
        pedidos.filter((p) => p.estado_codigo === codigo);

    const handleAvanzar = (id: number, estado: string, motivo?: string) => {
        avanzar({ id, estado, motivo });
    };

    const fechaLabel =
        fechaFiltro === "HOY" ? "hoy" :
        fechaFiltro === "PERSONALIZADO" ? fechaCustom :
        "todos";

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "#2d1e0f" }}>Gestión de Pedidos</h1>
                    <p className="text-sm mt-1" style={{ color: "#9a8070" }}>
                        {data?.total ?? 0} pedidos · {fechaLabel}{searchTerm ? ` · "${searchTerm}"` : ""} · en vivo
                    </p>
                </div>
            </div>

            {/* Barra de filtros: fecha + estado + búsqueda */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
                {(["TODOS", "HOY", "PERSONALIZADO"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFechaFiltro(f)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all whitespace-nowrap"
                        style={fechaFiltro === f
                            ? { backgroundColor: "#2d1e0f", color: "#fff" }
                            : { backgroundColor: "#fff", border: "1px solid #E5E2DA", color: "#6b5a4e" }}
                    >
                        <CalendarIcon size={14} />
                        {f === "TODOS" ? "Todos" : f === "HOY" ? "Hoy" : "Día"}
                    </button>
                ))}
                {fechaFiltro === "PERSONALIZADO" && (
                    <input
                        type="date"
                        value={fechaCustom}
                        onChange={(e) => setFechaCustom(e.target.value)}
                        className="text-xs px-3 py-2 rounded-full border"
                        style={{ borderColor: "#E5E2DA", color: "#6b5a4e" }}
                    />
                )}

                {/* Separador visual */}
                <span className="w-px h-5 mx-1" style={{ backgroundColor: "#E5E2DA" }} />

                {/* Dropdown de estado */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setDropdownOpen((p) => !p)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all whitespace-nowrap"
                        style={{ backgroundColor: "#fff", border: "1px solid #E5E2DA", color: "#6b5a4e" }}
                    >
                        {estadoFiltro !== "TODOS" && (
                            <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: ESTADO_DOT[estadoFiltro] ?? "#6b5a4e" }}
                            />
                        )}
                        {estadoFiltro === "TODOS" ? "Todos los estados" : ESTADO_LABEL[estadoFiltro]}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.5 }}>
                            <path d="M7 10l5 5 5-5z" />
                        </svg>
                    </button>

                    {dropdownOpen && (
                        <div
                            className="absolute top-full left-0 mt-1 rounded-xl p-2 z-50 min-w-[180px]"
                            style={{
                                backgroundColor: "#222",
                                border: "1px solid #333",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                            }}
                        >
                            {(["TODOS", "PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "PREPARADO", "EN_CAMINO", "ENTREGADO", "CANCELADO"] as const).map((codigo) => (
                                <button
                                    key={codigo}
                                    onClick={() => { setEstadoFiltro(codigo); setDropdownOpen(false); }}
                                    className="w-full flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors text-left"
                                    style={{
                                        color: estadoFiltro === codigo ? "#fff" : "#aaa",
                                        backgroundColor: estadoFiltro === codigo ? "rgba(255,255,255,0.08)" : "transparent",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (estadoFiltro !== codigo) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)";
                                    }}
                                    onMouseLeave={(e) => {
                                        if (estadoFiltro !== codigo) e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                >
                                    {codigo !== "TODOS" && (
                                        <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: ESTADO_DOT[codigo] }}
                                        />
                                    )}
                                    <span>{codigo === "TODOS" ? "Todos los estados" : ESTADO_LABEL[codigo]}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Buscador — ocupa el espacio restante */}
                <div className="flex-1 relative ml-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8b6b4a" }}>
                        <SearchIcon size={16} />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por cliente..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full text-sm pl-9 pr-4 py-2 rounded-full border outline-none transition-colors"
                        style={{
                            borderColor: "#8b6b4a",
                            color: "#2d1e0f",
                            backgroundColor: "#fdfaf7",
                        }}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-[#C87A2E] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : estadoFiltro !== "TODOS" ? (
                /* ── Vista filtrada por un solo estado ── */
                <div>
                    <h2 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: "#9a8070" }}>
                        {ESTADO_LABEL[estadoFiltro] ?? estadoFiltro}: {pedidos.length}
                    </h2>
                    {pedidos.length === 0 ? (
                        <div
                            className="rounded-xl border border-dashed flex items-center justify-center"
                            style={{ borderColor: "#E5E2DA", minHeight: 120 }}
                        >
                            <p className="text-xs" style={{ color: "#9a8070" }}>Sin pedidos en este estado</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {pedidos.map((p) => (
                                <PedidoCard key={p.id} pedido={p} onAvanzar={handleAvanzar} loading={avanzarPending} ingredientesMap={ingredientesMap} />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                /* ── Kanban 4 columnas ── */
                <div className="pb-2">
                    <div className="grid grid-cols-4 gap-4">
                    {COLUMNAS.map((col) => {
                        const peds = pedidosPorEstado(col.codigo);
                        return (
                            <div key={col.codigo} className="flex flex-col">
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#9a8070" }}>
                                        {col.titulo}: {peds.length}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {peds.length === 0 ? (
                                        <div
                                            className="rounded-xl border border-dashed flex items-center justify-center"
                                            style={{ borderColor: "#E5E2DA", minHeight: 100 }}
                                        >
                                            <p className="text-xs" style={{ color: "#9a8070" }}>Sin pedidos</p>
                                        </div>
                                    ) : (
                                        peds.map((p) => (
                                            <PedidoCard key={p.id} pedido={p} onAvanzar={handleAvanzar} loading={avanzarPending} ingredientesMap={ingredientesMap} />
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                </div>
            )}
        </div>
    );
}
