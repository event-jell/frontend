import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commsApi } from '../lib/api';
import type { Comm } from '../types';

export const commKeys = {
  all: ['comms'] as const,
  list: (eventId?: string) => [...commKeys.all, 'list', eventId] as const,
  detail: (id: string) => [...commKeys.all, 'detail', id] as const,
};

export function useComms(eventId?: string) {
  return useQuery({
    queryKey: commKeys.list(eventId),
    queryFn: () => commsApi.list(eventId),
    staleTime: 15_000,
  });
}

export function useCreateComm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Comm>) => commsApi.create(data),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: commKeys.list(c.eventId) });
      qc.invalidateQueries({ queryKey: commKeys.list() });
    },
  });
}

export function useUpdateComm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Comm> }) => commsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: commKeys.all });
      const snapshots = new Map<string, any>();
      qc.getQueriesData<any>({ queryKey: commKeys.all }).forEach(([key, value]) => {
        if (!value) return;
        snapshots.set(JSON.stringify(key), value);
        if (Array.isArray(value)) {
          qc.setQueryData(key, value.map((c: Comm) => (c._id === id ? { ...c, ...data } : c)));
        } else if (typeof value === 'object' && value && (value as Comm)._id === id) {
          qc.setQueryData(key, { ...value, ...data });
        }
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach((v, k) => qc.setQueryData(JSON.parse(k), v));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: commKeys.all }),
  });
}

export function useDeleteComm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commsApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: commKeys.all });
      const snapshots = new Map<string, any>();
      qc.getQueriesData<any>({ queryKey: commKeys.all }).forEach(([key, value]) => {
        if (!value) return;
        snapshots.set(JSON.stringify(key), value);
        if (Array.isArray(value)) {
          qc.setQueryData(key, value.filter((c: Comm) => c._id !== id));
        } else if (typeof value === 'object' && value && (value as Comm)._id === id) {
          qc.setQueryData(key, undefined);
        }
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach((v, k) => qc.setQueryData(JSON.parse(k), v));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: commKeys.all }),
  });
}
