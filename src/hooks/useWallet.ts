import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../lib/api';
import { toast } from 'sonner';

export const WALLET_QUERY_KEYS = {
  wallet: ['wallet'] as const,
  stats: ['wallet', 'stats'] as const,
  transactions: (params?: any) => ['wallet', 'transactions', params] as const,
};

export function useWallet() {
  return useQuery({
    queryKey: WALLET_QUERY_KEYS.wallet,
    queryFn: walletApi.getWallet,
    staleTime: 30_000,
  });
}

export function useWalletStats() {
  return useQuery({
    queryKey: WALLET_QUERY_KEYS.stats,
    queryFn: walletApi.getStats,
    staleTime: 15_000,
  });
}

export function useWalletTransactions(params?: {
  page?: number;
  limit?: number;
  type?: string;
  direction?: string;
}) {
  return useQuery({
    queryKey: WALLET_QUERY_KEYS.transactions(params),
    queryFn: () => walletApi.getTransactions(params),
    staleTime: 15_000,
  });
}

export function useSetWalletPin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.setPin,
    onSuccess: (data) => {
      toast.success(data.message || 'PIN set successfully');
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.stats });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update PIN');
    },
  });
}

export function useWithdraw() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.withdraw,
    onSuccess: (data) => {
      toast.success(data.message || 'Withdrawal initiated successfully');
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    },
  });
}

export function useDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.deposit,
    onSuccess: (data) => {
      toast.success(data.message || 'Funds deposited successfully');
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.stats });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Deposit failed');
    },
  });
}

export function useSavePayoutAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.savePayoutAccount,
    onSuccess: (data) => {
      toast.success(data.message || 'Payout account saved');
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.stats });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save payout account');
    },
  });
}

export function useDeletePayoutAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: walletApi.deletePayoutAccount,
    onSuccess: (data) => {
      toast.success(data.message || 'Payout account deleted');
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.wallet });
      queryClient.invalidateQueries({ queryKey: WALLET_QUERY_KEYS.stats });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to remove payout account');
    },
  });
}
