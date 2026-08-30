import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkInApi } from '../lib/api';
import type { CheckInStats, CheckInAuditLog } from '../types';

export const checkInKeys = {
  all: ['check-in'] as const,
  stats: (eventId: string) => [...checkInKeys.all, 'stats', eventId] as const,
  logs: (eventId: string, params?: Record<string, any>) =>
    [...checkInKeys.all, 'logs', eventId, params] as const,
  pass: (eventId: string, guestId: string) =>
    [...checkInKeys.all, 'pass', eventId, guestId] as const,
};

export function useCheckInStats(eventId?: string) {
  return useQuery({
    queryKey: checkInKeys.stats(eventId || ''),
    queryFn: () => checkInApi.getStats(eventId!),
    enabled: Boolean(eventId),
    refetchInterval: 10_000, // Background polling every 10s for live scanner dashboard
  });
}

export function useCheckInLogs(
  eventId?: string,
  params?: { result?: string; page?: number; limit?: number },
) {
  return useQuery({
    queryKey: checkInKeys.logs(eventId || '', params),
    queryFn: () => checkInApi.getLogs(eventId!, params),
    enabled: Boolean(eventId),
  });
}

export function useGuestPass(eventId?: string, guestId?: string) {
  return useQuery({
    queryKey: checkInKeys.pass(eventId || '', guestId || ''),
    queryFn: () => checkInApi.getGuestPass(eventId!, guestId!),
    enabled: Boolean(eventId) && Boolean(guestId),
    refetchInterval: 25_000, // Refresh dynamic token before expiration
  });
}

export function useValidateScan() {
  return useMutation({
    mutationFn: (data: {
      eventId: string;
      token: string;
      deviceId?: string;
      method?: 'qr' | 'manual' | 'nfc';
    }) => checkInApi.validateScan(data),
  });
}

export function useConfirmCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      eventId: string;
      guestId: string;
      token?: string;
      deviceId?: string;
      method?: 'qr' | 'manual' | 'nfc';
    }) => checkInApi.confirmCheckIn(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: checkInKeys.stats(vars.eventId) });
      qc.invalidateQueries({ queryKey: checkInKeys.logs(vars.eventId) });
      qc.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}

export function useManualLookup() {
  return useMutation({
    mutationFn: ({ eventId, query }: { eventId: string; query: string }) =>
      checkInApi.manualLookup(eventId, query),
  });
}

export function useUndoCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, guestId }: { eventId: string; guestId: string }) =>
      checkInApi.undoCheckIn(eventId, guestId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: checkInKeys.stats(vars.eventId) });
      qc.invalidateQueries({ queryKey: checkInKeys.logs(vars.eventId) });
      qc.invalidateQueries({ queryKey: ['guests'] });
    },
  });
}
