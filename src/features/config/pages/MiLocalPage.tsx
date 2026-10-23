import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { miLocalApi, type LocalPerfil } from "../api/miLocalApi";
import { useUIStore } from "../../../store/uiStore";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { AdminCard, AdminPageHeader } from "../../../shared/components/AdminPageHeader";

export function MiLocalPage() {
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["config-mi-local"],
    queryFn: miLocalApi.get,
  });

  const [draft, setDraft] = useState<LocalPerfil | null>(null);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Sin datos");
      return miLocalApi.save(draft);
    },
    onSuccess: (updated) => {
      addToast({ type: "success", message: "Datos del local guardados" });
      queryClient.setQueryData(["config-mi-local"], updated);
      setDraft(updated);
    },
    onError: (err) =>
      addToast({ type: "error", message: getApiErrorMessage(err, "No se pudo guardar") }),
  });

  if (isLoading || !draft) {
    return (
      <div className="flex items-center justify-center h-48">
        <div
          className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "#C87A2E", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (isError) {
    return (
      <AdminCard>
        <p className="text-sm text-red-700">{getApiErrorMessage(error, "Error al cargar")}</p>
        <button type="button" className="mt-3 text-sm font-semibold text-[#C87A2E]" onClick={() => refetch()}>
          Reintentar
        </button>
      </AdminCard>
    );
  }

  const field = (label: string, key: keyof LocalPerfil) => (
    <label className="block text-sm">
      <span className="font-medium" style={{ color: "#2d1e0f" }}>{label}</span>
      <input
        type="text"
        value={draft[key] ?? ""}
        onChange={(e) => setDraft((d) => (d ? { ...d, [key]: e.target.value || null } : d))}
        className="mt-1 w-full border rounded-lg px-3 py-2"
        style={{ borderColor: "#e8d5c0" }}
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <AdminPageHeader
        title="Mi local"
        description="Nombre y contacto que verán tus clientes en la tienda online (junto con horarios y envíos)."
      />
      <AdminCard>
        <div className="space-y-4">
          {field("Nombre del negocio", "nombre_negocio")}
          {field("Teléfono", "telefono")}
          {field("WhatsApp", "whatsapp")}
          {field("Email de contacto", "email_contacto")}
          {field("Dirección", "direccion")}
          {field("Ciudad", "ciudad")}
        </div>
        <button
          type="button"
          disabled={save.isPending || !draft.nombre_negocio.trim()}
          onClick={() => save.mutate()}
          className="mt-6 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: "#C87A2E" }}
        >
          {save.isPending ? "Guardando…" : "Guardar"}
        </button>
      </AdminCard>
    </div>
  );
}
