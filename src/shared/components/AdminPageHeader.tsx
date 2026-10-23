import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  children?: ReactNode;
};

/** Encabezado unificado (mismo estilo que Productos). */
export function AdminPageHeader({ title, description, children }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: "#2d1e0f" }}>{title}</h1>
        <p className="text-sm mt-0.5 max-w-2xl" style={{ color: "#9a8070" }}>{description}</p>
      </div>
      {children ? <div className="flex shrink-0 gap-2 items-center">{children}</div> : null}
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{ backgroundColor: "#fff", borderColor: "#e8d5c0", color: "#2d1e0f" }}
    >
      {children}
    </div>
  );
}
