import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/api';

export const DASHBOARD_QUERY_KEYS = {
  summary: ['dashboard', 'summary'] as const,
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.summary,
    queryFn: dashboardApi.getSummary,
    staleTime: 15_000,
  });
}
