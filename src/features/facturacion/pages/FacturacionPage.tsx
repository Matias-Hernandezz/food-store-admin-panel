import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { facturacionApi, type ConfigFiscal } from "../api/facturacionApi";
import { useUIStore } from "../../../store/uiStore";

export function FacturacionPage() {
    const addToast = useUIStore((s) => s.addToast);
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({
        queryKey: ["facturacion-config"],
        queryFn: facturacionApi.getConfig,
    });

    const [draft, setDraft] = useState<ConfigFiscal | null>(null);

    useEffect(() => {
        if (data) setDraft(data);
    }, [data]);

    const save = useMutation({
        mutationFn: () => facturacionApi.saveConfig(draft!),
        onSuccess: () => {
            addToast({ type: "success", message: "Configuración fiscal guardada" });
            queryClient.invalidateQueries({ queryKey: ["facturacion-config"] });
        },
        onError: () => addToast({ type: "error", message: "No se pudo guardar" }),
    });

    if (isLoading || !draft) {
        return <p className="text-sm" style={{ color: "#6b5a4a" }}>Cargando facturación…</p>;
    }

    return (
        <div className="max-w-xl">
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#2d1e0f" }}>Facturación (ARCA)</h1>
            <p className="text-sm mb-6" style={{ color: "#6b5a4a" }}>
                Emisor = este local (CUIT y certificado propios). En dev usá <strong>mock</strong>; en homologación AFIP
                configurá <strong>wsfe</strong> y las rutas de certificado en el servidor.
            </p>

            <div className="space-y-4 rounded-xl border p-6" style={{ backgroundColor: "#fff", borderColor: "#e8d5c0" }}>
                <label className="block text-sm">
                    CUIT
                    <input
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                        value={draft.cuit}
                        onChange={(e) => setDraft({ ...draft, cuit: e.target.value })}
                    />
                </label>
                <label className="block text-sm">
                    Razón social
                    <input
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                        value={draft.razon_social}
                        onChange={(e) => setDraft({ ...draft, razon_social: e.target.value })}
                    />
                </label>
                <label className="block text-sm">
                    Punto de venta
                    <input
                        type="number"
                        min={1}
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                        value={draft.punto_venta}
                        onChange={(e) => setDraft({ ...draft, punto_venta: Number(e.target.value) })}
                    />
                </label>
                <label className="block text-sm">
                    Condición IVA
                    <select
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                        value={draft.condicion_iva}
                        onChange={(e) =>
                            setDraft({ ...draft, condicion_iva: e.target.value as ConfigFiscal["condicion_iva"] })
                        }
                    >
                        <option value="MONOTRIBUTO">Monotributo (Factura C)</option>
                        <option value="RI">Responsable inscripto</option>
                    </select>
                </label>
                <label className="block text-sm">
                    Adaptador
                    <select
                        className="mt-1 w-full border rounded-lg px-3 py-2"
                        value={draft.adapter}
                        onChange={(e) => setDraft({ ...draft, adapter: e.target.value as ConfigFiscal["adapter"] })}
                    >
                        <option value="mock">Mock (desarrollo / pruebas de flujo)</option>
                        <option value="wsfe">WSFE (certificados ARCA)</option>
                    </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={draft.habilitado}
                        onChange={(e) => setDraft({ ...draft, habilitado: e.target.checked })}
                    />
                    Facturación habilitada
                </label>
                <button
                    type="button"
                    disabled={save.isPending}
                    onClick={() => save.mutate()}
                    className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                    style={{ backgroundColor: "#C87A2E" }}
                >
                    Guardar
                </button>
            </div>
        </div>
    );
}
