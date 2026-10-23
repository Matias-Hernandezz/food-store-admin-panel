import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { horariosApi, type HorarioDiaInput } from "../api/horariosApi";
import { useUIStore } from "../../../store/uiStore";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { AdminCard, AdminPageHeader } from "../../../shared/components/AdminPageHeader";

function toInputValue(t: string | null): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function HorariosPage() {
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["config-horarios"],
    queryFn: horariosApi.get,
  });

  const [draft, setDraft] = useState<HorarioDiaInput[]>([]);

  useEffect(() => {
    if (!data?.dias?.length) return;
    setDraft(
      data.dias.map((d) => ({
        weekday: d.weekday,
        cerrado: d.cerrado,
        opens_at: d.opens_at,
        closes_at: d.closes_at,
      })),
    );
  }, [data]);

  const draftReady = data?.dias?.length === 7 && draft.length === 7;

  const save = useMutation({
    mutationFn: () => horariosApi.save(draft),
    onSuccess: (updated) => {
      addToast({ type: "success", message: "Horarios guardados" });
      queryClient.setQueryData(["config-horarios"], updated);
      setDraft(
        updated.dias.map((d) => ({
          weekday: d.weekday,
          cerrado: d.cerrado,
          opens_at: d.opens_at,
          closes_at: d.closes_at,
        })),
      );
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiErrorMessage(err, "No se pudieron guardar los horarios") });
    },
  });

  const updateDay = (weekday: number, patch: Partial<HorarioDiaInput>) => {
    setDraft((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)),
    );
  };

  if (isError) {
    return (
      <div className="text-sm space-y-2" style={{ color: "#991b1b" }}>
        <p>{getApiErrorMessage(error, "No se pudieron cargar los horarios")}</p>
        <button type="button" onClick={() => refetch()} className="underline font-semibold" style={{ color: "#C87A2E" }}>
          Reintentar
        </button>
      </div>
    );
  }

  if (isLoading || !data || !draftReady) {
    return <p className="text-sm" style={{ color: "#6b5a4a" }}>Cargando horarios…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title="Horarios"
        description="Define cuándo la tienda online acepta pedidos. Hora Argentina. Sin franja = día abierto (salvo si marcás cerrado)."
      />

      <div
        className="p-4 rounded-xl border text-sm"
        style={{
          backgroundColor: data.abierto ? "#ecfdf5" : "#fef2f2",
          borderColor: data.abierto ? "#a7f3d0" : "#fecaca",
          color: data.abierto ? "#065f46" : "#991b1b",
        }}
      >
        <strong>{data.abierto ? "Abierto ahora" : "Cerrado ahora"}</strong>
        {data.horario_hoy && <span className="ml-2">· Hoy: {data.horario_hoy}</span>}
        {data.mensaje && <p className="mt-1">{data.mensaje}</p>}
      </div>

      <AdminCard className="p-0 overflow-hidden">
        <table className="w-full text-sm" style={{ color: "#2d1e0f" }}>
          <thead style={{ backgroundColor: "#f5ebe0" }}>
            <tr>
              <th className="text-left p-3 font-semibold" style={{ color: "#2d1e0f" }}>Día</th>
              <th className="text-left p-3 font-semibold" style={{ color: "#2d1e0f" }}>Cerrado</th>
              <th className="text-left p-3 font-semibold" style={{ color: "#2d1e0f" }}>Desde</th>
              <th className="text-left p-3 font-semibold" style={{ color: "#2d1e0f" }}>Hasta</th>
            </tr>
          </thead>
          <tbody>
            {data.dias.map((dia) => {
              const row = draft.find((d) => d.weekday === dia.weekday);
              if (!row) return null;
              return (
                <tr key={dia.weekday} className="border-t" style={{ borderColor: "#f0e6d8" }}>
                  <td className="p-3 font-semibold" style={{ color: "#2d1e0f" }}>{dia.dia_nombre}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#C87A2E]"
                      checked={row.cerrado}
                      onChange={(e) => updateDay(dia.weekday, { cerrado: e.target.checked })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="time"
                      disabled={row.cerrado}
                      value={toInputValue(row.opens_at)}
                      onChange={(e) =>
                        updateDay(dia.weekday, {
                          opens_at: e.target.value ? `${e.target.value}:00` : null,
                        })
                      }
                      className="border rounded-lg px-2 py-1.5 text-sm disabled:opacity-50"
                      style={{ borderColor: "#d4c4b0", color: "#2d1e0f", backgroundColor: "#fff" }}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="time"
                      disabled={row.cerrado}
                      value={toInputValue(row.closes_at)}
                      onChange={(e) =>
                        updateDay(dia.weekday, {
                          closes_at: e.target.value ? `${e.target.value}:00` : null,
                        })
                      }
                      className="border rounded-lg px-2 py-1.5 text-sm disabled:opacity-50"
                      style={{ borderColor: "#d4c4b0", color: "#2d1e0f", backgroundColor: "#fff" }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminCard>

      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending || !draftReady}
        className="self-start px-5 py-2.5 rounded-lg text-sm font-bold text-white disabled:opacity-60"
        style={{ backgroundColor: "#C87A2E" }}
      >
        {save.isPending ? "Guardando…" : "Guardar horarios"}
      </button>
    </div>
  );
}
