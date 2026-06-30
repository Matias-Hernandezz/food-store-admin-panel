import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ProductoTopItem } from "../hooks/useEstadisticas";

interface Props { data: ProductoTopItem[]; loading: boolean; error: boolean; onRetry?: () => void; }

const C = { primary: "#059669", text: "#1e293b", muted: "#94a3b8", grid: "#e2e8f0", card: "#fff" };

export function ProductosTopChart({ data, loading, error, onRetry }: Props) {
  if (error) return <div className="h-[250px] flex flex-col items-center justify-center gap-3" style={{ color: "#dc2626" }}><p>Error al cargar</p>{onRetry && <button onClick={onRetry} className="text-sm underline cursor-pointer">Reintentar</button>}</div>;
  if (loading) return <div className="h-[250px] flex items-center justify-center" style={{ color: C.muted }}>Cargando...</div>;
  if (data.length === 0) return <div className="h-[250px] flex items-center justify-center" style={{ color: C.muted }}>Sin datos aún</div>;

  const chartData = data.map((d) => ({ ...d, nombre: d.nombre.length > 18 ? d.nombre.slice(0, 18) + "…" : d.nombre, ingresos: Number(d.ingresos), cantidad_vendida: Number(d.cantidad_vendida) }));

  return (
    <div style={{ width: "100%", height: 250 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
          <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: C.text }} angle={-35} textAnchor="end" height={80} />
          <YAxis tick={{ fontSize: 11, fill: C.muted }} tickFormatter={(v) => `$${Number(v).toFixed(0)}`} />
          <Tooltip contentStyle={{ backgroundColor: C.card, border: `1px solid ${C.grid}`, borderRadius: 8, fontSize: 12, color: C.text }}
            formatter={(value: number, name: string) => [name === "ingresos" ? `$${value.toFixed(2)}` : `${value} vend.`, name === "ingresos" ? "Ingresos" : "Cantidad"]} />
          <Bar dataKey="ingresos" fill={C.primary} radius={[4, 4, 0, 0]} barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
