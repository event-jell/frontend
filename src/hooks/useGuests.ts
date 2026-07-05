import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guestsApi } from '../lib/api';
import type { Guest } from '../types';

export const guestKeys = {
  all: ['guests'] as const,
  list: (eventId?: string) => [...guestKeys.all, 'list', eventId] as const,
  detail: (id: string) => [...guestKeys.all, 'detail', id] as const,
};

export function useGuests(eventId?: string) {
  return useQuery({
    queryKey: guestKeys.list(eventId),
    queryFn: () => guestsApi.list(eventId),
    staleTime: 15_000,
  });
}

export function useGuest(id: string) {
  return useQuery({
    queryKey: guestKeys.detail(id),
    queryFn: () => guestsApi.get(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Guest>) => guestsApi.create(data),
    onSuccess: (newGuest) => {
      qc.invalidateQueries({ queryKey: guestKeys.list(newGuest.eventId) });
      qc.invalidateQueries({ queryKey: guestKeys.list() });
    },
  });
}

export function useUpdateGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Guest> }) => guestsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: guestKeys.all });
      const snapshots = new Map<string, Guest[]>();

      qc.getQueriesData<Guest[]>({ queryKey: guestKeys.all }).forEach(([key, guests]) => {
        if (!guests) return;
        snapshots.set(JSON.stringify(key), guests);
        qc.setQueryData(key, guests.map(g => (g._id === id ? { ...g, ...data } : g)));
      });
      const prevDetail = qc.getQueryData<Guest>(guestKeys.detail(id));
      if (prevDetail) qc.setQueryData(guestKeys.detail(id), { ...prevDetail, ...data });

      return { snapshots, prevDetail };
    },
    onError: (_err, { id }, ctx) => {
      ctx?.snapshots.forEach((v, k) => qc.setQueryData(JSON.parse(k), v));
      if (ctx?.prevDetail) qc.setQueryData(guestKeys.detail(id), ctx.prevDetail);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: guestKeys.all }),
  });
}

export function useBulkCreateGuests() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, guests }: { eventId: string; guests: Partial<Guest>[] }) =>
      guestsApi.bulkCreate(eventId, guests),
    onSuccess: () => qc.invalidateQueries({ queryKey: guestKeys.all }),
  });
}

export function useDeleteGuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => guestsApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: guestKeys.all });
      const snapshots = new Map<string, Guest[]>();
      qc.getQueriesData<Guest[]>({ queryKey: guestKeys.all }).forEach(([key, guests]) => {
        if (!guests) return;
        snapshots.set(JSON.stringify(key), guests);
        qc.setQueryData(key, guests.filter(g => g._id !== id));
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach((v, k) => qc.setQueryData(JSON.parse(k), v));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: guestKeys.all }),
  });
}
