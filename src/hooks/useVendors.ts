import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsApi } from '../lib/api';
import type { Vendor } from '../types';

export const vendorKeys = {
  all: ['vendors'] as const,
  list: (eventId?: string) => [...vendorKeys.all, 'list', eventId] as const,
  detail: (id: string) => [...vendorKeys.all, 'detail', id] as const,
};

export function useVendors(eventId?: string) {
  return useQuery({
    queryKey: vendorKeys.list(eventId),
    queryFn: () => vendorsApi.list(eventId),
    staleTime: 15_000,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Vendor>) => vendorsApi.create(data),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: vendorKeys.list(v.eventId) });
      qc.invalidateQueries({ queryKey: vendorKeys.list() });
    },
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vendor> }) => vendorsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: vendorKeys.all });
      const snapshots = new Map<string, Vendor[]>();
      qc.getQueriesData<Vendor[]>({ queryKey: vendorKeys.all }).forEach(([key, vendors]) => {
        if (!vendors) return;
        snapshots.set(JSON.stringify(key), vendors);
        qc.setQueryData(key, vendors.map(v => (v._id === id ? { ...v, ...data } : v)));
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach((v, k) => qc.setQueryData(JSON.parse(k), v));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorsApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: vendorKeys.all });
      const snapshots = new Map<string, Vendor[]>();
      qc.getQueriesData<Vendor[]>({ queryKey: vendorKeys.all }).forEach(([key, vendors]) => {
        if (!vendors) return;
        snapshots.set(JSON.stringify(key), vendors);
        qc.setQueryData(key, vendors.filter(v => v._id !== id));
      });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach((v, k) => qc.setQueryData(JSON.parse(k), v));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: vendorKeys.all }),
  });
}
