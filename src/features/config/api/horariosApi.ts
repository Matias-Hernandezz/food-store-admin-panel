import api from "../../../shared/api/axiosClient";

export type HorarioDia = {
  weekday: number;
  dia_nombre: string;
  cerrado: boolean;
  opens_at: string | null;
  closes_at: string | null;
  etiqueta: string | null;
};

export type HorariosEstado = {
  abierto: boolean;
  mensaje: string | null;
  horario_hoy: string | null;
  proxima_apertura: string | null;
  dias: HorarioDia[];
};

export type HorarioDiaInput = {
  weekday: number;
  cerrado: boolean;
  opens_at: string | null;
  closes_at: string | null;
};

const BASE = "/api/v1/config/horarios";

export const horariosApi = {
  get: () => api.get<HorariosEstado>(BASE).then((r) => r.data),
  save: (dias: HorarioDiaInput[]) =>
    api.put<HorariosEstado>(BASE, { dias }).then((r) => r.data),
};
