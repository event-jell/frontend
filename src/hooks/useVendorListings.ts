import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorListingsApi } from '../lib/api';
import { toast } from 'sonner';
import type { VendorListing } from '../types';

export const VENDOR_LISTINGS_QUERY_KEYS = {
  myListings: ['vendor-listings', 'my-listings'] as const,
  categories: ['vendor-listings', 'categories'] as const,
  listing: (id: string) => ['vendor-listings', id] as const,
  explore: (params?: any) => ['vendor-listings', 'explore', params] as const,
};

export function useVendorCategories() {
  return useQuery({
    queryKey: VENDOR_LISTINGS_QUERY_KEYS.categories,
    queryFn: vendorListingsApi.getCategories,
    staleTime: 5 * 60_000,
  });
}

export function useExploreVendorListings(params?: {
  category?: string;
  search?: string;
  location?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: VENDOR_LISTINGS_QUERY_KEYS.explore(params),
    queryFn: () => vendorListingsApi.explore(params),
    staleTime: 30_000,
  });
}

export function useMyVendorListings() {
  return useQuery({
    queryKey: VENDOR_LISTINGS_QUERY_KEYS.myListings,
    queryFn: vendorListingsApi.getMyListings,
    staleTime: 30_000,
  });
}

export function useVendorListing(id: string) {
  return useQuery({
    queryKey: VENDOR_LISTINGS_QUERY_KEYS.listing(id),
    queryFn: () => vendorListingsApi.getOne(id),
    enabled: !!id,
  });
}

export function useCreateVendorListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorListingsApi.create,
    onSuccess: () => {
      toast.success('Vendor listing created successfully');
      queryClient.invalidateQueries({ queryKey: VENDOR_LISTINGS_QUERY_KEYS.myListings });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    },
  });
}

export function useUpdateVendorListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VendorListing> }) =>
      vendorListingsApi.update(id, data),
    onSuccess: (updated) => {
      toast.success('Listing updated successfully');
      queryClient.invalidateQueries({ queryKey: VENDOR_LISTINGS_QUERY_KEYS.myListings });
      queryClient.invalidateQueries({ queryKey: VENDOR_LISTINGS_QUERY_KEYS.listing(updated._id) });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update listing');
    },
  });
}

export function useUpdateListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'published' | 'draft' | 'paused' }) =>
      vendorListingsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Listing status updated');
      queryClient.invalidateQueries({ queryKey: VENDOR_LISTINGS_QUERY_KEYS.myListings });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });
}

export function useDeleteVendorListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorListingsApi.remove(id),
    onSuccess: () => {
      toast.success('Listing deleted successfully');
      queryClient.invalidateQueries({ queryKey: VENDOR_LISTINGS_QUERY_KEYS.myListings });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete listing');
    },
  });
}
