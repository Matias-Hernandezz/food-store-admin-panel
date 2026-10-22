/** FSM staff (retiro / mostrador) — envío agrega EN_CAMINO después de PREPARADO */
export const ESTADOS_FSM_PICKUP: Record<string, string[]> = {
  PENDIENTE: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["EN_PREPARACION", "CANCELADO"],
  EN_PREPARACION: ["PREPARADO", "CANCELADO"],
  PREPARADO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export const ESTADOS_FSM_DELIVERY: Record<string, string[]> = {
  ...ESTADOS_FSM_PICKUP,
  PREPARADO: ["EN_CAMINO", "CANCELADO"],
  EN_CAMINO: ["ENTREGADO", "CANCELADO"],
};

export const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparación",
  PREPARADO: "Preparado",
  EN_CAMINO: "En camino",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

export const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  EN_PREPARACION: "bg-orange-100 text-orange-800",
  PREPARADO: "bg-amber-100 text-amber-900",
  EN_CAMINO: "bg-indigo-100 text-indigo-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

export function transicionesSiguientes(tipoPedido: string, estadoActual: string): string[] {
  const map = tipoPedido === "DELIVERY" ? ESTADOS_FSM_DELIVERY : ESTADOS_FSM_PICKUP;
  return map[estadoActual] ?? [];
}
