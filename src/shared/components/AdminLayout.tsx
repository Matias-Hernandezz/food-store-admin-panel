import { type ReactNode, useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUsuarios } from "../../features/usuarios/hooks/useUsuarios";
import { useAuthStore } from "../../store/authStore";
import { useUIStore } from "../../store/uiStore";
import { useAdminOrdersFeed } from "../hooks/useAdminOrdersFeed";
import { Icons } from "./ui/Icons";
import { ConnectionBadge } from "./ConnectionBadge";
import { ROLE, STAFF_ORDER_ROLES } from "../roles";

const PANEL_ITEMS = [
  { to: "/admin/panel",   label: "Panel",    icon: <Icons.Dashboard width={18} height={18} />, required: [...STAFF_ORDER_ROLES] },
  { to: "/admin/usuarios", label: "Usuarios", icon: <Icons.Usuarios width={18} height={18} />, required: [ROLE.OWNER] },
  { to: "/admin/integraciones", label: "Integraciones", icon: <Icons.Payments width={18} height={18} />, required: [ROLE.OWNER] },
  { to: "/admin/horarios", label: "Horarios", icon: <Icons.RestaurantMenu width={18} height={18} />, required: [ROLE.OWNER] },
  { to: "/admin/zonas-envio", label: "Zonas envío", icon: <Icons.RestaurantMenu width={18} height={18} />, required: [ROLE.OWNER] },
  { to: "/admin/caja", label: "Caja", icon: <Icons.Payments width={18} height={18} />, required: [ROLE.OWNER, ROLE.CASHIER] },
  { to: "/admin/facturacion", label: "Facturación", icon: <Icons.Payments width={18} height={18} />, required: [ROLE.OWNER] },
];

const NAV_ITEMS: { to: string; label: string; icon: ReactNode; required: string[] }[] = [
  { to: "/admin/pedidos",     label: "Pedidos",      icon: <Icons.Pedidos width={18} height={18} />, required: [...STAFF_ORDER_ROLES] },
];

const CATALOGO_ITEMS: { to: string; label: string; icon: ReactNode; required: string[] }[] = [
  { to: "/admin/categorias",  label: "Categorías",    icon: <Icons.Categoria width={18} height={18} />, required: [ROLE.OWNER, ROLE.STOCK] },
  { to: "/admin/productos",   label: "Productos",     icon: <Icons.Producto width={18} height={18} />, required: [ROLE.OWNER, ROLE.STOCK] },
  { to: "/admin/ingredientes", label: "Ingredientes", icon: <Icons.Ingrediente width={18} height={18} />, required: [ROLE.OWNER, ROLE.STOCK] },
];

const navLinkStyle = (isActive: boolean) =>
  isActive
    ? { backgroundColor: "rgba(249,115,22,0.15)", color: "#C87A2E", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 12, transition: "all .15s" }
    : { color: "#888", border: "1px solid transparent", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 12, transition: "all .15s" };

export function AdminLayout({ children }: { children: ReactNode }) {
  const { hasRole, isOwner } = useUsuarios({ enabled: false });
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // WebSocket — conecta en todas las páginas del admin
  useAdminOrdersFeed();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const topItems = PANEL_ITEMS.filter((item) =>
    isOwner || item.required.some((role) => hasRole(role))
  );
  const visibleItems = NAV_ITEMS.filter((item) =>
    isOwner || item.required.some((role) => hasRole(role))
  );
  const catalogoItems = CATALOGO_ITEMS.filter((item) =>
    isOwner || item.required.some((role) => hasRole(role))
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#E8D5C0" }}>
      <aside
        className={`shrink-0 flex flex-col transition-all duration-300 ease-in-out ${sidebarOpen ? "w-56" : "w-16"}`}
        style={{ backgroundColor: "#2d1e0f", borderRight: "1px solid #4A3D2F", overflow: "visible" }}
      >
        {/* ── Header con toggle ──────────────────────────────────── */}
        <div
          className={`flex items-center px-3 py-4 gap-2 ${sidebarOpen ? "justify-between" : "justify-center"}`}
          style={{ borderBottom: "1px solid #4A3D2F" }}
        >
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#C87A2E" }}>Panel Admin</p>
              <h2 className="text-lg font-bold mt-0.5" style={{ color: "#f1f1f1" }}>Gestión</h2>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 transition-colors shrink-0"
            style={{ color: "#888" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#f1f1f1"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.backgroundColor = "transparent"; }}
            title={sidebarOpen ? "Colapsar menú" : "Expandir menú"}
          >
            <Icons.Menu size={20} />
          </button>
        </div>

        {/* ── Perfil de usuario ──────────────────────────────────── */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => sidebarOpen && setProfileOpen((p) => !p)}
            className={`flex items-center gap-3 transition-colors w-full ${sidebarOpen ? "px-4 py-2.5" : "justify-center py-3"}`}
            style={{
              backgroundColor: profileOpen ? "rgba(255,255,255,0.06)" : "transparent",
              borderBottom: "1px solid #4A3D2F",
              cursor: sidebarOpen ? "pointer" : "default",
            }}
            onMouseEnter={(e) => { if (!profileOpen && sidebarOpen) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
            onMouseLeave={(e) => { if (!profileOpen) e.currentTarget.style.backgroundColor = "transparent"; }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#C87A2E" }}
            >
              {user?.nombre?.charAt(0)?.toUpperCase() ?? "A"}
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate" style={{ color: "#e0e0e0" }}>
                    {user?.nombre ?? "Admin"}
                  </p>
                  <ConnectionBadge />
                </div>
                <Icons.ExpandLess
                  width={16}
                  height={16}
                  style={{ color: "#555", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}
                />
              </>
            )}
          </button>

          {/* Popover — solo cuando expandido */}
          {sidebarOpen && profileOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 mx-2 rounded-xl p-4 z-50 min-w-[220px]"
              style={{
                backgroundColor: "#222",
                border: "1px solid #333",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                  style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#C87A2E" }}
                >
                  {user?.nombre?.charAt(0)?.toUpperCase() ?? "A"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#f1f1f1" }}>
                    {user?.nombre ?? "Admin"} {user?.apellido ?? ""}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#666" }}>
                    {user?.email ?? ""}
                  </p>
                </div>
              </div>

              {/* Roles */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(user?.roles ?? []).map((rol) => (
                  <span
                    key={rol}
                    className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: rol === ROLE.OWNER ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.06)",
                      color: rol === ROLE.OWNER ? "#C87A2E" : "#888",
                    }}
                  >
                    {rol}
                  </span>
                ))}
              </div>

              <button
                onClick={async () => { await logout(); navigate("/login"); }}
                className="w-full text-left text-xs flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ color: "#888", backgroundColor: "rgba(255,255,255,0.04)" }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "#888"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
              >
                <Icons.Logout width={16} height={16} />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>

        <nav className={`flex flex-col gap-1 p-3 flex-1 ${sidebarOpen ? "" : "items-center"}`}>
          {/* ── Panel + Usuarios ──────────────────────────────────── */}
          {topItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={!sidebarOpen ? item.label : undefined}
              style={({ isActive }) => sidebarOpen ? navLinkStyle(isActive) : {
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "8px", borderRadius: 8,
                backgroundColor: isActive ? "rgba(249,115,22,0.15)" : "transparent",
                color: isActive ? "#C87A2E" : "#888",
                border: isActive ? "1px solid rgba(249,115,22,0.25)" : "1px solid transparent",
                transition: "all .15s",
              }}
            >
              <span>{item.icon}</span>
              {sidebarOpen && item.label}
            </NavLink>
          ))}
          <div className="my-2" style={{ borderTop: `1px solid #4A3D2F`, width: sidebarOpen ? "100%" : "70%" }} />

          {/* ── Pedidos ───────────────────────────────────────────── */}
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={!sidebarOpen ? item.label : undefined}
              style={({ isActive }) => sidebarOpen ? navLinkStyle(isActive) : {
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "8px", borderRadius: 8,
                backgroundColor: isActive ? "rgba(249,115,22,0.15)" : "transparent",
                color: isActive ? "#C87A2E" : "#888",
                border: isActive ? "1px solid rgba(249,115,22,0.25)" : "1px solid transparent",
                transition: "all .15s",
              }}
            >
              <span>{item.icon}</span>
              {sidebarOpen && item.label}
            </NavLink>
          ))}
          <div className="my-2" style={{ borderTop: `1px solid #4A3D2F`, width: sidebarOpen ? "100%" : "70%" }} />

          {/* ── Catálogo ──────────────────────────────────────────── */}
          {catalogoItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={!sidebarOpen ? item.label : undefined}
              style={({ isActive }) => sidebarOpen ? navLinkStyle(isActive) : {
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "8px", borderRadius: 8,
                backgroundColor: isActive ? "rgba(249,115,22,0.15)" : "transparent",
                color: isActive ? "#C87A2E" : "#888",
                border: isActive ? "1px solid rgba(249,115,22,0.25)" : "1px solid transparent",
                transition: "all .15s",
              }}
            >
              <span>{item.icon}</span>
              {sidebarOpen && item.label}
            </NavLink>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="px-5 py-3" style={{ borderTop: "1px solid #4A3D2F" }}>
            <p className="text-xs" style={{ color: "#444" }}>v1.0.0</p>
          </div>
        )}
      </aside>
      <main className="flex-1 p-8 overflow-auto" style={{ backgroundColor: "#E8D5C0" }}>
        {children}
      </main>
    </div>
  );
}