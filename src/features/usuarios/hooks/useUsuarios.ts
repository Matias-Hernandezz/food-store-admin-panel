// features/usuarios/hooks/useUsuarios.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usuariosApi } from "../api/usuariosApi";
import { authApi } from "../../auth/api/authApi";
import { useUIStore } from "../../../store/uiStore";
import { useAuthStore } from "../../../store/authStore";
import type { UsuarioCreate } from "../../../shared/types";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

interface Props {
  id?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  enabled?: boolean;
}

export function useUsuarios({
  id,
  page: _page = 0,
  pageSize: _pageSize = 100,
  search,
  enabled = true,
}: Props = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);
  const user = useAuthStore((s) => s.user);

  // --- QUERIES (GET) ---
  const usuariosList = useQuery({
    queryKey: ["usuarios", search],
    queryFn: () => usuariosApi.getAll(search),
    enabled: enabled && !id,
  });

  // --- MUTATIONS ---
  const softDeleteUsuario = useMutation({
    mutationFn: (id: number) => usuariosApi.softDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      addToast({ type: "success", message: "Usuario eliminado" });
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiErrorMessage(err, "Error al eliminar el usuario") });
    },
  });

  const quitarRol = useMutation({
    mutationFn: ({ id, rol }: { id: number; rol: string }) =>
      usuariosApi.quitarRol(id, rol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      addToast({ type: "success", message: "Rol removido" });
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiErrorMessage(err, "Error al quitar el rol") });
    },
  });

  const asignarRol = useMutation({
    mutationFn: ({ id, rol }: { id: number; rol: string }) =>
      usuariosApi.asignarRol(id, rol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      addToast({ type: "success", message: "Rol asignado" });
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiErrorMessage(err, "Error al asignar el rol") });
    },
  });

  const crearUsuario = useMutation({
    mutationFn: (data: UsuarioCreate) => authApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      addToast({ type: "success", message: "Usuario creado" });
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiErrorMessage(err, "Error al crear el usuario") });
    },
  });

  // --- ROLE HELPERS (absorbidos de useRole.ts) ---
  const hasRole = (...roles: string[]) =>
    roles.some((r) => user?.roles?.includes(r)) ?? false;

  const isOwner = user?.roles?.includes("OWNER") ?? false;

  return {
    data: usuariosList.data,
    isLoading: usuariosList.isLoading,
    isFetching: usuariosList.isFetching,
    isError: usuariosList.isError,
    refetch: usuariosList.refetch,
    softDeleteUser: softDeleteUsuario.mutateAsync,
    softDeleteUserPending: softDeleteUsuario.isPending,
    quitarRol: quitarRol.mutateAsync,
    quitarRolPending: quitarRol.isPending,
    asignarRol: asignarRol.mutateAsync,
    asignarRolPending: asignarRol.isPending,
    createUser: crearUsuario.mutateAsync,
    createUserPending: crearUsuario.isPending,
    hasRole,
    isOwner,
  };
}
