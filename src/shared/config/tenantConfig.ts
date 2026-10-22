/** Slug del local en modo multi-tenant (`TENANT_MODE=multi` en el backend). */
export const TENANT_SLUG = (import.meta.env.VITE_TENANT_SLUG || "").trim();
