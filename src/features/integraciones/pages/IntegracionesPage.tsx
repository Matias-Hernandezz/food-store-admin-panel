import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deliveryFeeApi } from "../../config/api/deliveryFeeApi";
import { useSearchParams } from "react-router-dom";
import { mpIntegrationsApi } from "../api/mpIntegrationsApi";
import { TENANT_SLUG } from "../../../shared/config/tenantConfig";
import { useUIStore } from "../../../store/uiStore";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { Icons } from "../../../shared/components/ui/Icons";
import { AdminCard, AdminPageHeader } from "../../../shared/components/AdminPageHeader";

export function IntegracionesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);
  const [feeDraft, setFeeDraft] = useState<string>("");

  const feeQuery = useQuery({
    queryKey: ["config-delivery-fee"],
    queryFn: () => deliveryFeeApi.get(),
  });

  const mpSlug = TENANT_SLUG || feeQuery.data?.tenant_slug || "demo";

  useEffect(() => {
    if (feeQuery.data) {
      setFeeDraft(String(feeQuery.data.delivery_app_fee_percent));
    }
  }, [feeQuery.data]);

  const saveFee = useMutation({
    mutationFn: () => deliveryFeeApi.save(Number(feeDraft)),
    onSuccess: () => {
      addToast({ type: "success", message: "Comisión delivery actualizada" });
      queryClient.invalidateQueries({ queryKey: ["config-delivery-fee"] });
    },
    onError: (err) =>
      addToast({ type: "error", message: getApiErrorMessage(err, "No se pudo guardar el porcentaje") }),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mp-integration-status", mpSlug],
    queryFn: () => mpIntegrationsApi.status(mpSlug),
    retry: 1,
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
      const url = await mpIntegrationsApi.authorizeUrl(mpSlug);
      window.location.href = url;
    } catch (err) {
      addToast({
        type: "error",
        message: getApiErrorMessage(err, "No se pudo iniciar la conexión con Mercado Pago"),
      });
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <AdminPageHeader
        title="Mercado Pago"
        description="Conectá la cuenta del local para cobrar con tarjeta en la tienda web. Los pagos van a esa cuenta (OAuth de Mercado Pago), no a una cuenta global del sistema."
      />

      <AdminCard>
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(0,158,227,0.12)", color: "#009ee3" }}
          >
            <Icons.Payments width={28} height={28} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold" style={{ color: "#2d1e0f" }}>Estado de la conexión</h2>
            <p className="text-xs mt-1" style={{ color: "#9a8070" }}>
              Local: <span className="font-mono font-semibold">{mpSlug}</span>
              {TENANT_SLUG ? null : (
                <span className="block mt-1">
                  En desarrollo usamos el tenant <code className="font-mono">demo</code> de la base de control.
                  En producción multi-local: <code className="font-mono">VITE_TENANT_SLUG</code> en el admin.
                </span>
              )}
            </p>

            {isLoading && <p className="text-sm mt-4" style={{ color: "#6b5a4a" }}>Cargando estado…</p>}
            {error && (
              <p className="text-sm mt-4" style={{ color: "#dc2626" }}>
                {getApiErrorMessage(error, "No se pudo leer el estado de Mercado Pago")}
              </p>
            )}

            {data && !isLoading && (
              <div className="mt-4 space-y-2 text-sm" style={{ color: "#2d1e0f" }}>
                <p>
                  Estado:{" "}
                  <span className="font-bold" style={{ color: data.connected ? "#16a34a" : "#ca8a04" }}>
                    {data.connected ? "Conectado" : "Sin conectar"}
                  </span>
                </p>
                {data.mp_user_id && (
                  <p className="text-xs" style={{ color: "#9a8070" }}>Usuario MP: {data.mp_user_id}</p>
                )}
                {data.expires_at && (
                  <p className="text-xs" style={{ color: "#9a8070" }}>
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
                style={{ borderColor: "#d4c4b0", color: "#2d1e0f" }}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-lg font-bold mb-1" style={{ color: "#2d1e0f" }}>
          Comisión apps de delivery (KPI)
        </h2>
        <p className="text-sm mb-4" style={{ color: "#9a8070" }}>
          Porcentaje que estimás que cobran Rappi, PedidosYa, etc. Solo alimenta el gráfico de &quot;ahorro&quot; del panel;
          no cambia precios ni envíos de tu tienda.
        </p>
        {feeQuery.isLoading && <p className="text-sm" style={{ color: "#9a8070" }}>Cargando…</p>}
        {feeQuery.data && (
          <>
            {feeQuery.data.usa_default_global && (
              <p className="text-xs mb-3 p-3 rounded-lg" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                En modo single-tenant el % viene del servidor (<code>DEFAULT_DELIVERY_APP_FEE_PERCENT</code>).
                Para editarlo por local, activá multi-tenant y definí <code>VITE_TENANT_SLUG</code>.
              </p>
            )}
            <div className="flex items-end gap-3 flex-wrap">
              <label className="text-sm font-medium" style={{ color: "#2d1e0f" }}>
                Comisión estimada (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={feeDraft}
                  onChange={(e) => setFeeDraft(e.target.value)}
                  className="mt-1 block w-32 px-3 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "#e8d5c0", color: "#2d1e0f" }}
                />
              </label>
              <button
                type="button"
                disabled={saveFee.isPending || feeQuery.data.usa_default_global}
                onClick={() => saveFee.mutate()}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                style={{ backgroundColor: "#C87A2E" }}
              >
                {saveFee.isPending ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </>
        )}
      </AdminCard>
    </div>
  );
}
