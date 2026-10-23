import axios, { type AxiosError } from "axios";

export type ApiProblemBody = {
    detail?: string | { msg?: string; loc?: (string | number)[] }[];
    title?: string;
    status?: number;
    errors?: { field?: string; message?: string; type?: string }[];
};

const NETWORK_PATTERNS = [
    "failed to fetch",
    "network error",
    "err_network",
    "load failed",
    "networkrequestfailed",
];

function isNetworkMessage(msg: string): boolean {
    const m = msg.toLowerCase();
    return NETWORK_PATTERNS.some((p) => m.includes(p));
}

function humanizeField(field?: string): string {
    if (!field) return "";
    const last = field.split("→").pop()?.trim() ?? field;
    const map: Record<string, string> = {
        body: "formulario",
        email: "email",
        password: "contraseña",
        nombre: "nombre",
        apellido: "apellido",
        linea1: "calle",
        ciudad: "ciudad",
        provincia: "provincia",
        codigo_postal: "código postal",
        forma_pago_codigo: "forma de pago",
        producto_id: "producto",
        cantidad: "cantidad",
    };
    return map[last] ?? last;
}

function humanizeValidationMessage(msg: string): string {
    const rules: [RegExp | string, string][] = [
        ["Field required", "es obligatorio"],
        ["value is not a valid email address", "email inválido"],
        ["String should have at least", "es demasiado corto"],
        ["String should have at most", "es demasiado largo"],
        ["Input should be greater than or equal to", "debe ser mayor o igual a"],
        ["Input should be less than or equal to", "debe ser menor o igual a"],
        ["value is not a valid integer", "debe ser un número entero"],
        ["value is not a valid float", "debe ser un número"],
    ];
    for (const [pattern, replacement] of rules) {
        if (typeof pattern === "string" ? msg.includes(pattern) : pattern.test(msg)) {
            return replacement;
        }
    }
    return msg;
}

export function extractApiDetail(data: unknown): string | null {
    if (!data || typeof data !== "object") return null;
    const body = data as ApiProblemBody;

    if (Array.isArray(body.errors) && body.errors.length > 0) {
        const parts = body.errors.map((e) => {
            const field = humanizeField(e.field);
            const msg = humanizeValidationMessage(e.message ?? "dato inválido");
            return field ? `${field}: ${msg}` : msg;
        });
        return parts.join(" · ");
    }

    const detail = body.detail;
    if (typeof detail === "string" && detail.trim()) {
        return detail.trim();
    }

    if (Array.isArray(detail) && detail.length > 0) {
        const parts = detail.map((d) => {
            const loc = Array.isArray(d.loc) ? d.loc.filter((x) => x !== "body").join(".") : "";
            const field = humanizeField(loc);
            const msg = humanizeValidationMessage(d.msg ?? "dato inválido");
            return field ? `${field}: ${msg}` : msg;
        });
        return parts.join(" · ");
    }

    if (typeof body.title === "string" && body.title.trim() && body.title !== "Error") {
        return body.title.trim();
    }

    return null;
}

function statusFallback(status: number): string | null {
    switch (status) {
        case 400:
            return "Revisá los datos enviados";
        case 401:
            return "Email o contraseña incorrectos";
        case 403:
            return "No tenés permisos para esta acción";
        case 404:
            return "No encontramos lo que buscás";
        case 409:
            return "No se pudo completar por un conflicto (quizá ya existe)";
        case 422:
            return "Revisá los datos del formulario";
        case 429:
            return "Demasiadas peticiones. Esperá unos segundos e intentá de nuevo";
        case 502:
        case 503:
            return "El servicio no está disponible en este momento";
        case 500:
            return "Error interno del servidor. Intentá de nuevo más tarde";
        default:
            return status >= 500 ? "Error del servidor. Intentá más tarde" : null;
    }
}

export function messageFromHttpResponse(status: number, body: unknown, fallback: string): string {
    const fromBody = extractApiDetail(body);
    if (fromBody && !isNetworkMessage(fromBody)) return fromBody;
    return statusFallback(status) ?? fallback;
}

/** Mensaje listo para mostrar al usuario (toasts, formularios, login). */
export function getApiErrorMessage(err: unknown, fallback = "Ocurrió un error. Intentá de nuevo."): string {
    if (!navigator.onLine) {
        return "Sin conexión a internet. Revisá tu red e intentá de nuevo.";
    }

    if (axios.isAxiosError(err)) {
        const ax = err as AxiosError<ApiProblemBody>;
        if (!ax.response) {
            const msg = ax.message ?? "";
            if (isNetworkMessage(msg)) {
                return "No pudimos conectar con el servidor. Verificá que la API esté en marcha y recargá la página.";
            }
            return fallback;
        }
        return messageFromHttpResponse(ax.response.status, ax.response.data, fallback);
    }

    if (err instanceof Error) {
        if (isNetworkMessage(err.message)) {
            return "No pudimos conectar con el servidor. Verificá que la API esté en marcha y recargá la página.";
        }
        if (err.message && err.message !== "Error" && !err.message.startsWith("HTTP ")) {
            return err.message;
        }
    }

    return fallback;
}
