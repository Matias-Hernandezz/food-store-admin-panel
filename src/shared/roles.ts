export const ROLE = {
  OWNER: "OWNER",
  STOCK: "STOCK",
  KITCHEN: "KITCHEN",
  CASHIER: "CASHIER",
  CLIENT: "CLIENT",
} as const;

export const ASSIGNABLE_ROLES = [
  ROLE.OWNER,
  ROLE.STOCK,
  ROLE.KITCHEN,
  ROLE.CASHIER,
  ROLE.CLIENT,
] as const;

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Dueño",
  STOCK: "Stock",
  KITCHEN: "Cocina",
  CASHIER: "Cajero",
  CLIENT: "Cliente",
};

export const STAFF_PANEL_ROLES = [
  ROLE.OWNER,
  ROLE.STOCK,
  ROLE.KITCHEN,
  ROLE.CASHIER,
] as const;

export const STAFF_ORDER_ROLES = [ROLE.OWNER, ROLE.KITCHEN, ROLE.CASHIER] as const;
