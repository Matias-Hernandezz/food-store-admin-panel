import api from "../../../shared/api/axiosClient";

export type LocalPerfil = {
  nombre_negocio: string;
  telefono: string | null;
  email_contacto: string | null;
  direccion: string | null;
  ciudad: string | null;
  whatsapp: string | null;
};

export type LocalPerfilUpdate = Partial<LocalPerfil>;

const BASE = "/api/v1/config/mi-local";

export const miLocalApi = {
  get: () => api.get<LocalPerfil>(BASE).then((r) => r.data),
  save: (data: LocalPerfilUpdate) => api.put<LocalPerfil>(BASE, data).then((r) => r.data),
};
