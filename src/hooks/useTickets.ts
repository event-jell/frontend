import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../lib/api';
import type { Ticket } from '../types';

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (eventId?: string) => [...ticketKeys.all, 'list', eventId] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
};

export function useTickets(eventId?: string) {
  return useQuery({
    queryKey: ticketKeys.list(eventId),
    queryFn: () => ticketsApi.list(eventId),
    staleTime: 15_000,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Ticket>) => ticketsApi.create(data),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ticketKeys.list(t.eventId) });
      qc.invalidateQueries({ queryKey: ticketKeys.list() });
    },
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Ticket> }) => ticketsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ticketKeys.all });
      const snapshots = new Map<string, Ticket[]>();
      qc.getQueriesData<Ticket[]>({ queryKey: ticketKeys.all }).forEach(([key, tickets]) => {
        if (!tickets) return;
        snapshots.set(JSON.stringify(key), tickets);
        qc.setQueryData(key, tickets.map(t => (t._id === id ? { ...t, ...data } : t)));
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach((v, k) => qc.setQueryData(JSON.parse(k), v));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ticketsApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ticketKeys.all });
      const snapshots = new Map<string, Ticket[]>();
      qc.getQueriesData<Ticket[]>({ queryKey: ticketKeys.all }).forEach(([key, tickets]) => {
        if (!tickets) return;
        snapshots.set(JSON.stringify(key), tickets);
        qc.setQueryData(key, tickets.filter(t => t._id !== id));
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach((v, k) => qc.setQueryData(JSON.parse(k), v));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ticketKeys.all }),
  });
}
