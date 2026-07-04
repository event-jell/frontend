import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { floorPlansApi } from '../lib/api';
import type { FloorPlan, PlacedElement } from '../types';

export const floorPlanKeys = {
  all: ['floor-plans'] as const,
  list: () => [...floorPlanKeys.all, 'list'] as const,
  detail: (id: string) => [...floorPlanKeys.all, id] as const,
};

export function useFloorPlans() {
  return useQuery({
    queryKey: floorPlanKeys.list(),
    queryFn: floorPlansApi.list,
    staleTime: 30_000,
  });
}

export function useFloorPlan(id: string) {
  return useQuery({
    queryKey: floorPlanKeys.detail(id),
    queryFn: () => floorPlansApi.get(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateFloorPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FloorPlan>) => floorPlansApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: floorPlanKeys.list() }),
  });
}

export function useUpdateFloorPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FloorPlan> }) =>
      floorPlansApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: floorPlanKeys.detail(id) });
      const prev = qc.getQueryData<FloorPlan>(floorPlanKeys.detail(id));
      if (prev) qc.setQueryData(floorPlanKeys.detail(id), { ...prev, ...data });
      return { prev };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(floorPlanKeys.detail(id), ctx.prev);
    },
    onSettled: (_, _err, { id }) => {
      qc.invalidateQueries({ queryKey: floorPlanKeys.detail(id) });
      qc.invalidateQueries({ queryKey: floorPlanKeys.list() });
    },
  });
}

export function useDeleteFloorPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => floorPlansApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: floorPlanKeys.list() });
      const prev = qc.getQueryData<FloorPlan[]>(floorPlanKeys.list());
      if (prev) qc.setQueryData(floorPlanKeys.list(), prev.filter(p => p._id !== id));
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(floorPlanKeys.list(), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: floorPlanKeys.list() }),
  });
}

export function useDuplicateFloorPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => floorPlansApi.duplicate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: floorPlanKeys.list() }),
  });
}

export function useSaveElements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, elements }: { id: string; elements: PlacedElement[] }) =>
      floorPlansApi.saveElements(id, elements),
    onMutate: async ({ id, elements }) => {
      await qc.cancelQueries({ queryKey: floorPlanKeys.detail(id) });
      const prev = qc.getQueryData<FloorPlan>(floorPlanKeys.detail(id));
      if (prev) qc.setQueryData(floorPlanKeys.detail(id), { ...prev, elements });
      return { prev };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(floorPlanKeys.detail(id), ctx.prev);
    },
    onSettled: (_, _err, { id }) => {
      qc.invalidateQueries({ queryKey: floorPlanKeys.detail(id) });
    },
  });
}
