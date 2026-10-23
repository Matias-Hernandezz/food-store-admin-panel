import type { Pedido } from "../types";

export function imprimirComanda(pedido: Pedido, ingredientesMap?: Map<number, string>) {
  const lineas = pedido.detalles.map((d) => {
    const extras =
      Array.isArray(d.personalizacion) && d.personalizacion.length > 0 && ingredientesMap
        ? `<br/><small>Sin: ${d.personalizacion.map((id) => ingredientesMap.get(Number(id)) ?? `#${id}`).join(", ")}</small>`
        : "";
    return `<tr><td>${d.cantidad}</td><td>${d.nombre_snapshot}${extras}</td></tr>`;
  });

  const dir = pedido.direccion
    ? `<p><strong>Entrega:</strong> ${pedido.direccion.linea1} ${pedido.direccion.linea2 ?? ""}</p>`
    : "";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Comanda #${pedido.id}</title>
<style>
body{font-family:system-ui,sans-serif;padding:16px;max-width:320px;margin:0 auto}
h1{font-size:18px;margin:0 0 8px}
table{width:100%;border-collapse:collapse;font-size:14px}
td{padding:4px 0;vertical-align:top}
.notas{background:#fff7ed;padding:8px;border-radius:8px;margin:12px 0;font-size:13px}
@media print{body{padding:0}}
</style></head><body>
<h1>Pedido #${pedido.id}</h1>
<p>${new Date(pedido.created_at).toLocaleString("es-AR")} · ${pedido.tipo_pedido ?? "DELIVERY"} · ${pedido.forma_pago_codigo ?? ""}</p>
${pedido.usuario_nombre ? `<p><strong>Cliente:</strong> ${pedido.usuario_nombre}</p>` : ""}
${dir}
${pedido.notas ? `<div class="notas"><strong>Notas:</strong> ${pedido.notas}</div>` : ""}
<table>${lineas.join("")}</table>
<p style="margin-top:12px;font-weight:bold">Total: $${Number(pedido.total).toFixed(2)}</p>
<script>window.onload=function(){window.print();}</script>
</body></html>`;

  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}
