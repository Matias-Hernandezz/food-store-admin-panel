import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { horariosApi, type HorarioDiaInput } from "../api/horariosApi";
import { useUIStore } from "../../../store/uiStore";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

function toInputValue(t: string | null): string {
  if (!t) return "";
  return t.length >= 5 ? t.slice(0, 5) : t;
}

export function HorariosPage() {
  const addToast = useUIStore((s) => s.addToast);
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["config-horarios"],
    queryFn: horariosApi.get,
  });

  const [draft, setDraft] = useState<HorarioDiaInput[]>([]);

  useEffect(() => {
    if (data?.dias) {
      setDraft(
        data.dias.map((d) => ({
          weekday: d.weekday,
          cerrado: d.cerrado,
          opens_at: d.opens_at,
          closes_at: d.closes_at,
        })),
      );
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => horariosApi.save(draft),
    onSuccess: () => {
      addToast({ type: "success", message: "Horarios guardados" });
      queryClient.invalidateQueries({ queryKey: ["config-horarios"] });
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

  if (isLoading || !data) {
    return <p className="text-sm" style={{ color: "#6b5a4a" }}>Cargando horarios…</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "#2d1e0f" }}>Horarios</h1>
      <p className="text-sm mb-4" style={{ color: "#6b5a4a" }}>
        Hora Argentina. Si no configurás franja, el día queda abierto (salvo “cerrado”).
      </p>

      <div
        className="mb-6 p-4 rounded-xl border text-sm"
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

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#e8d5c0", backgroundColor: "#fff" }}>
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: "#f5ebe0" }}>
            <tr>
              <th className="text-left p-3 font-semibold">Día</th>
              <th className="text-left p-3 font-semibold">Cerrado</th>
              <th className="text-left p-3 font-semibold">Desde</th>
              <th className="text-left p-3 font-semibold">Hasta</th>
            </tr>
          </thead>
          <tbody>
            {data.dias.map((dia) => {
              const row = draft.find((d) => d.weekday === dia.weekday)!;
              return (
                <tr key={dia.weekday} className="border-t" style={{ borderColor: "#f0e6d8" }}>
                  <td className="p-3 font-medium">{dia.dia_nombre}</td>
                  <td className="p-3">
                    <input
                      type="checkbox"
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
                      className="border rounded px-2 py-1"
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
                      className="border rounded px-2 py-1"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="mt-6 px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-60"
        style={{ backgroundColor: "#C87A2E" }}
      >
        {save.isPending ? "Guardando…" : "Guardar horarios"}
      </button>
    </div>
  );
}
