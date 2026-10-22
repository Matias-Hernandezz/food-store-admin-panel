import api from "../../../shared/api/axiosClient";

export type MpConnectionStatus = {
  connected: boolean;
  mp_user_id: string | null;
  mp_public_key: string | null;
  expires_at: string | null;
};

const BASE = "/api/v1/integrations/mp";

export const mpIntegrationsApi = {
  status: (slug?: string) =>
    api
      .get<MpConnectionStatus>(`${BASE}/status`, { params: slug ? { slug } : undefined })
      .then((r) => r.data),

  authorizeUrl: (slug?: string) =>
    api
      .get<{ authorize_url: string }>(`${BASE}/authorize-url`, {
        params: slug ? { slug } : undefined,
      })
      .then((r) => r.data.authorize_url),
};
