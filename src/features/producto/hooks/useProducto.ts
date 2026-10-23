import { useQuery, QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { productoApi } from "../api/producto.actions";
import { useUIStore } from "../../../store/uiStore";
import type { Producto, ProductoCreate, ProductoUpdate, PaginatedResponse } from "../../../shared/types";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

const PRODUCTO_KEY = ["productos"] as const;

interface Props {
  id?: number;
  page?: number;
  pageSize?: number;
  categoria?: number;
  incluirEliminados?: boolean;
  enabled?: boolean;
}

export function useProductos({
  id,
  page = 1,
  pageSize = 100,
  categoria,
  incluirEliminados = false,
  enabled = true,
}: Props = {}) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  // --- QUERIES (GET) ---
  const productosList = useQuery({
    queryKey: [...PRODUCTO_KEY, page, pageSize, categoria, incluirEliminados],
    queryFn: () => productoApi.getAll(page, pageSize, categoria, incluirEliminados),
    enabled: enabled && !id,
  });

  const productoById = useQuery({
    queryKey: [...PRODUCTO_KEY, id],
    queryFn: () => id ? productoApi.getById(id) : Promise.reject("No ID provided"),
    enabled: enabled && !!id,
  });

  const unidadesMedidaQuery = useQuery({
    queryKey: ["unidades-medida"],
    queryFn: () => productoApi.getUnidadesMedida(),
    staleTime: 10 * 60 * 1000,
    enabled,
  });

  // --- MUTATIONS (POST/PUT/DELETE) ---
  const createProduct = useMutation({
    mutationFn: (data: ProductoCreate) => productoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTO_KEY });
      addToast({ type: "success", message: "Producto creado" });
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiErrorMessage(err, "Error al crear el producto") });
    },
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoUpdate }) =>
      productoApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTO_KEY });
      addToast({ type: "success", message: "Producto actualizado" });
    },
    onError: (err) => {
      addToast({ type: "error", message: getApiErrorMessage(err, "Error al actualizar el producto") });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: number) => productoApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PRODUCTO_KEY });
      const previous = queryClient.getQueriesData({ queryKey: PRODUCTO_KEY })
        .filter(([, d]) => d != null) as [QueryKey, PaginatedResponse<Producto>][];
      previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, {
          ...data,
          data: data.data.map((p: Producto) =>
            p.id === id ? { ...p, deleted_at: new Date().toISOString() } : p
          ),
        });
      });
      return { previous };
    },
    onSuccess: () => {
      addToast({ type: "success", message: "Producto eliminado" });
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      addToast({ type: "error", message: getApiErrorMessage(err, "Error al eliminar el producto") });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: PRODUCTO_KEY }),
  });

  const restoreProduct = useMutation({
    mutationFn: (id: number) => productoApi.restore(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: PRODUCTO_KEY });
      const previous = queryClient.getQueriesData({ queryKey: PRODUCTO_KEY })
        .filter(([, d]) => d != null) as [QueryKey, PaginatedResponse<Producto>][];
      previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, {
          ...data,
          data: data.data.map((p: Producto) =>
            p.id === id ? { ...p, deleted_at: null } : p
          ),
        });
      });
      return { previous };
    },
    onSuccess: () => {
      addToast({ type: "success", message: "Producto restaurado" });
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        context.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      }
      addToast({ type: "error", message: getApiErrorMessage(err, "Error al restaurar el producto") });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: PRODUCTO_KEY }),
  });

  return {
    data: productosList.data,
    singleData: productoById.data,
    isLoading: productosList.isLoading || productoById.isLoading,
    isFetching: productosList.isFetching || productoById.isFetching,
    isError: productosList.isError || productoById.isError,
    refetch: productosList.refetch,
    refetchById: productoById.refetch,
    unidadesMedida: unidadesMedidaQuery.data,
    unidadesMedidaLoading: unidadesMedidaQuery.isLoading,
    createProduct: createProduct.mutateAsync,
    createProductPending: createProduct.isPending,
    updateProduct: updateProduct.mutateAsync,
    updateProductPending: updateProduct.isPending,
    deleteProduct: deleteProduct.mutateAsync,
    deleteProductPending: deleteProduct.isPending,
    restoreProduct: restoreProduct.mutateAsync,
    restoreProductPending: restoreProduct.isPending,
  };
}
