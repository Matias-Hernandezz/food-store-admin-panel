import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zonasEnvioApi, type ZonaEnvioRow } from "../api/zonasEnvioApi";
import { useUIStore } from "../../../store/uiStore";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

const emptyRow = (): ZonaEnvioRow => ({
    nombre: "",
    ciudad_match: "",
    costo_envio: 50,
    pedido_minimo: 0,
    activa: true,
    orden: 0,
});

export function ZonasEnvioPage() {
    const addToast = useUIStore((s) => s.addToast);
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["config-zonas-envio"],
        queryFn: zonasEnvioApi.get,
    });

    const [draft, setDraft] = useState<ZonaEnvioRow[]>([]);

    useEffect(() => {
        if (data?.zonas) {
            setDraft(
                data.zonas.map((z) => ({
                    ...z,
                    ciudad_match: z.ciudad_match ?? "",
                })),
            );
        }
    }, [data]);

    const save = useMutation({
        mutationFn: () =>
            zonasEnvioApi.save(
                draft.map((z, i) => ({
                    ...z,
                    orden: i,
                    ciudad_match: z.ciudad_match?.trim() ? z.ciudad_match.trim() : null,
                })),
            ),
        onSuccess: () => {
            addToast({ type: "success", message: "Zonas guardadas" });
            queryClient.invalidateQueries({ queryKey: ["config-zonas-envio"] });
        },
        onError: (err) =>
            addToast({ type: "error", message: getApiErrorMessage(err, "No se pudieron guardar las zonas") }),
    });

    const updateRow = (index: number, patch: Partial<ZonaEnvioRow>) => {
        setDraft((prev) => prev.map((z, i) => (i === index ? { ...z, ...patch } : z)));
    };

    const addRow = () => setDraft((prev) => [...prev, { ...emptyRow(), orden: prev.length }]);

    const removeRow = (index: number) => {
        setDraft((prev) => prev.filter((_, i) => i !== index));
    };

    if (isLoading || !data) {
        return <p className="text-sm" style={{ color: "#6b5a4a" }}>Cargando zonas…</p>;
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#2d1e0f" }}>Zonas de envío</h1>
            <p className="text-sm mb-6" style={{ color: "#6b5a4a" }}>
                Una fila <strong>sin ciudad</strong> es la zona default. Las demás coinciden por ciudad (sin importar mayúsculas).
            </p>

            <div className="space-y-4 max-w-3xl">
                {draft.map((z, i) => (
                    <div
                        key={i}
                        className="rounded-xl border p-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
                        style={{ backgroundColor: "#fff", borderColor: "#e8d5c0" }}
                    >
                        <label className="text-sm">
                            Nombre
                            <input
                                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                                value={z.nombre}
                                onChange={(e) => updateRow(i, { nombre: e.target.value })}
                            />
                        </label>
                        <label className="text-sm">
                            Ciudad (vacío = default)
                            <input
                                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                                value={z.ciudad_match ?? ""}
                                onChange={(e) => updateRow(i, { ciudad_match: e.target.value })}
                            />
                        </label>
                        <label className="text-sm">
                            Costo envío ($)
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                                value={z.costo_envio}
                                onChange={(e) => updateRow(i, { costo_envio: Number(e.target.value) })}
                            />
                        </label>
                        <label className="text-sm">
                            Pedido mínimo ($)
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                                value={z.pedido_minimo}
                                onChange={(e) => updateRow(i, { pedido_minimo: Number(e.target.value) })}
                            />
                        </label>
                        <label className="text-sm flex items-center gap-2 sm:col-span-2">
                            <input
                                type="checkbox"
                                checked={z.activa}
                                onChange={(e) => updateRow(i, { activa: e.target.checked })}
                            />
                            Zona activa
                            <button
                                type="button"
                                className="ml-auto text-xs text-red-600"
                                onClick={() => removeRow(i)}
                            >
                                Eliminar
                            </button>
                        </label>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={addRow}
                    className="px-4 py-2 rounded-lg text-sm font-semibold border"
                    style={{ borderColor: "#d4c4b0", color: "#6b5a4a" }}
                >
                    + Agregar zona
                </button>
                <button
                    type="button"
                    disabled={save.isPending}
                    onClick={() => save.mutate()}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: "#C87A2E" }}
                >
                    {save.isPending ? "Guardando…" : "Guardar zonas"}
                </button>
            </div>
        </div>
    );
}
