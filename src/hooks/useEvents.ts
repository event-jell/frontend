import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../lib/api';
import type { Event } from '../types';

export const eventKeys = {
  all: ['events'] as const,
  list: () => [...eventKeys.all, 'list'] as const,
  detail: (id: string) => [...eventKeys.all, id] as const,
  collaborators: (id: string) => [...eventKeys.all, id, 'collaborators'] as const,
};

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.list(),
    queryFn: eventsApi.list,
    staleTime: 20_000,
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventsApi.get(id),
    enabled: !!id,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Event>) => eventsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: eventKeys.list() }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Event> }) => eventsApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: eventKeys.detail(id) });
      const prev = qc.getQueryData<Event>(eventKeys.detail(id));
      if (prev) qc.setQueryData(eventKeys.detail(id), { ...prev, ...data });
      return { prev };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.prev) qc.setQueryData(eventKeys.detail(id), ctx.prev);
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: eventKeys.detail(id) });
      qc.invalidateQueries({ queryKey: eventKeys.list() });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: eventKeys.detail(id) });
      qc.invalidateQueries({ queryKey: eventKeys.list() });
    },
  });
}

export function useCollaborators(eventId: string) {
  return useQuery({
    queryKey: eventKeys.collaborators(eventId),
    queryFn: () => eventsApi.getCollaborators(eventId),
    enabled: !!eventId,
    staleTime: 60_000,
    retry: false,
  });
}

export function useAddCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, email, role }: { eventId: string; email: string; role?: 'editor' | 'viewer' }) =>
      eventsApi.addCollaborator(eventId, email, role),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: eventKeys.collaborators(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

export function useUpdateCollaboratorRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId, role }: { eventId: string; userId: string; role: 'editor' | 'viewer' }) =>
      eventsApi.updateCollaboratorRole(eventId, userId, role),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: eventKeys.collaborators(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}

export function useRemoveCollaborator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) =>
      eventsApi.removeCollaborator(eventId, userId),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: eventKeys.collaborators(eventId) });
      qc.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
    },
  });
}
