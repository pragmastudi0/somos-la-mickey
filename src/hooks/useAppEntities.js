import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useApp } from '@/context/AppContext';

function useEntityListQuery(entityName, key, options = {}) {
  const { applicationId } = useApp();
  const sort = options.sort ?? null;
  const limit = options.limit ?? null;

  return useQuery({
    queryKey: [key, applicationId, sort, limit],
    enabled: !!applicationId,
    queryFn: () => api.entities[entityName].list(sort, limit, applicationId),
  });
}

export function useClientesQuery(options) {
  return useEntityListQuery('Cliente', 'clientes', options);
}

export function useComprasQuery(options) {
  return useEntityListQuery('Compra', 'compras', options);
}

export function useCiclosQuery(options) {
  return useEntityListQuery('Ciclo', 'ciclos', options);
}

export function useConfiguracionQuery(options) {
  return useEntityListQuery('Configuracion', 'configuracion', options);
}

export function usePromocionesQuery(options) {
  return useEntityListQuery('Promocion', 'promociones', options);
}

function useScopedMutation(key, mutationFn) {
  const { applicationId } = useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (...args) => {
      if (!applicationId) throw new Error('Missing applicationId');
      return mutationFn(applicationId, ...args);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [key, applicationId] });
    },
  });
}

export function useCreateClienteMutation() {
  return useScopedMutation('clientes', (applicationId, payload) =>
    api.entities.Cliente.create(payload, applicationId));
}

export function useUpdateClienteMutation() {
  return useScopedMutation('clientes', (applicationId, { id, payload }) =>
    api.entities.Cliente.update(id, payload, applicationId));
}

export function useCreateCompraMutation() {
  return useScopedMutation('compras', (applicationId, payload) =>
    api.entities.Compra.create(payload, applicationId));
}

export function useCreateCicloMutation() {
  return useScopedMutation('ciclos', (applicationId, payload) =>
    api.entities.Ciclo.create(payload, applicationId));
}

export function useUpdateCicloMutation() {
  return useScopedMutation('ciclos', (applicationId, { id, payload }) =>
    api.entities.Ciclo.update(id, payload, applicationId));
}

export function useCreateConfiguracionMutation() {
  return useScopedMutation('configuracion', (applicationId, payload) =>
    api.entities.Configuracion.create(payload, applicationId));
}

export function useUpdateConfiguracionMutation() {
  return useScopedMutation('configuracion', (applicationId, { id, payload }) =>
    api.entities.Configuracion.update(id, payload, applicationId));
}

export function useCreatePromocionMutation() {
  return useScopedMutation('promociones', (applicationId, payload) =>
    api.entities.Promocion.create(payload, applicationId));
}

export function useUpdatePromocionMutation() {
  return useScopedMutation('promociones', (applicationId, { id, payload }) =>
    api.entities.Promocion.update(id, payload, applicationId));
}

export function useDeletePromocionMutation() {
  return useScopedMutation('promociones', (applicationId, id) =>
    api.entities.Promocion.delete(id, applicationId));
}
