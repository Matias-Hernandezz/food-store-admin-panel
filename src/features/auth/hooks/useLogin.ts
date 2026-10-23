
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/authStore";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

export function useLogin() {
    const login = useAuthStore((s) => s.login);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submit = async (email: string, password: string) => {
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate("/admin/panel", { replace: true });
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, "Email o contraseña incorrectos"));
        } finally {
            setLoading(false);
        }
    };

    return { submit, loading, error };
}