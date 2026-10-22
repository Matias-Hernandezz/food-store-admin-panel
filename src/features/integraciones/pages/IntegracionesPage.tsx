import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { mpIntegrationsApi } from "../api/mpIntegrationsApi";
import { TENANT_SLUG } from "../../../shared/config/tenantConfig";
import { useUIStore } from "../../../store/uiStore";
import { Icons } from "../../../shared/components/ui/Icons";

export function IntegracionesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const slug = TENANT_SLUG || undefined;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mp-integration-status", slug ?? "default"],
    queryFn: () => mpIntegrationsApi.status(slug),
  });

  useEffect(() => {
    const mp = searchParams.get("mp");
    if (!mp) return;
    if (mp === "connected") {
      addToast({ type: "success", message: "Mercado Pago conectado correctamente" });
      queryClient.invalidateQueries({ queryKey: ["mp-integration-status"] });
    } else if (mp === "error") {
      const reason = searchParams.get("reason") ?? "desconocido";
      addToast({ type: "error", message: `No se pudo conectar Mercado Pago: ${reason}` });
    }
    searchParams.delete("mp");
    searchParams.delete("reason");
    searchParams.delete("slug");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, addToast, queryClient]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const url = await mpIntegrationsApi.authorizeUrl(slug);
      window.location.href = url;
    } catch {
      addToast({ type: "error", message: "No se pudo iniciar la conexión con Mercado Pago" });
      setConnecting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#2d1e0f" }}>
        Integraciones
      </h1>
      <p className="text-sm mb-8" style={{ color: "#6b5a4a" }}>
        Conectá la cuenta de Mercado Pago del local. Los cobros online van a esa cuenta (OAuth).
      </p>

      <div
        className="max-w-xl rounded-xl p-6 border"
        style={{ backgroundColor: "#fff", borderColor: "#e8d5c0" }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(0,158,227,0.12)", color: "#009ee3" }}
          >
            <Icons.Payments width={28} height={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold" style={{ color: "#2d1e0f" }}>Mercado Pago</h2>
            {TENANT_SLUG ? (
              <p className="text-xs mt-1" style={{ color: "#888" }}>
                Local: <span className="font-mono">{TENANT_SLUG}</span>
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "#b45309" }}>
                Modo legacy: definí <code className="font-mono">VITE_TENANT_SLUG</code> si usás multi-tenant.
              </p>
            )}

            {isLoading && <p className="text-sm mt-4" style={{ color: "#888" }}>Cargando estado…</p>}
            {error && (
              <p className="text-sm mt-4" style={{ color: "#dc2626" }}>
                No se pudo leer el estado. Revisá que el backend esté en marcha y el slug sea correcto.
              </p>
            )}

            {data && !isLoading && (
              <div className="mt-4 space-y-2 text-sm" style={{ color: "#4a3d2f" }}>
                <p>
                  Estado:{" "}
                  <span
                    className="font-bold"
                    style={{ color: data.connected ? "#16a34a" : "#ca8a04" }}
                  >
                    {data.connected ? "Conectado" : "Sin conectar"}
                  </span>
                </p>
                {data.mp_user_id && (
                  <p className="text-xs" style={{ color: "#888" }}>
                    MP user id: {data.mp_user_id}
                  </p>
                )}
                {data.expires_at && (
                  <p className="text-xs" style={{ color: "#888" }}>
                    Token expira: {new Date(data.expires_at).toLocaleString("es-AR")}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
                style={{ backgroundColor: "#009ee3" }}
              >
                {connecting ? "Redirigiendo…" : data?.connected ? "Reconectar" : "Conectar Mercado Pago"}
              </button>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-2 rounded-lg text-sm font-semibold border"
                style={{ borderColor: "#d4c4b0", color: "#6b5a4a" }}
              >
                Actualizar estado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
