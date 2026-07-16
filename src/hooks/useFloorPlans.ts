import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { floorPlansApi } from '../lib/api';
import type { FloorPlan } from '../types';

export const floorPlanKeys = {
  all: ['floor-plans'] as const,
  list: () => [...floorPlanKeys.all, 'list'] as const,
  detail: (id: string) => [...floorPlanKeys.all, id] as const,
};

export function useTemplates() {
  return useQuery({
    queryKey: [...floorPlanKeys.all, 'templates'],
    queryFn: floorPlansApi.listTemplates,
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
    onSuccess: () => qc.invalidateQueries({ queryKey: floorPlanKeys.all }),
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
    // Deliberately no detail-query invalidation: the optimistic write above is
    // already the freshest state, and re-fetching here caused an infinite
    // save -> invalidate -> refetch -> new `plan` ref -> save loop while
    // editing. Other collaborators get updates over the socket instead.
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: floorPlanKeys.list() });
    },
  });
}


