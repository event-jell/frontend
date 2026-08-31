import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Plus,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Sparkles,
  MapPin,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Edit3,
  Trash2,
  ExternalLink,
  ChevronRight,
  Disc3,
  Utensils,
  ClipboardCheck,
  Speaker,
  Building2,
  Camera,
  Video,
  Mic2,
  Brush,
  Cake,
  Flower2,
  ShieldCheck,
  Car,
  Music,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import {
  useMyVendorListings,
  useVendorCategories,
  useUpdateListingStatus,
  useDeleteVendorListing,
} from '../hooks/useVendorListings';
import EditListingModal from '../components/vendor/EditListingModal';
import ConfirmModal from '../components/common/ConfirmModal';
import SEO from '../components/SEO';
import { formatCurrency } from '../utils/formatters';
import type { VendorListing, VendorCategoryType } from '../types';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  dj: Disc3,
  caterer: Utensils,
  event_planner: ClipboardCheck,
  decorator: Sparkles,
  equipment_rental: Speaker,
  venue: Building2,
  photographer: Camera,
  videographer: Video,
  mc_host: Mic2,
  makeup_artist: Brush,
  baker: Cake,
  florist: Flower2,
  security: ShieldCheck,
  transportation: Car,
  entertainment: Music,
  other: Store,
};

export default function VendorHubPage() {
  const navigate = useNavigate();
  const { data: listingsData, isLoading } = useMyVendorListings();
  const { data: categories = [] } = useVendorCategories();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingListing, setEditingListing] = useState<VendorListing | null>(null);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);

  const updateStatusMutation = useUpdateListingStatus();
  const deleteMutation = useDeleteVendorListing();

  const listings = listingsData?.listings || [];
  const metrics = listingsData?.metrics || {
    total_listings: 0,
    published_listings: 0,
    total_views: 0,
    total_inquiries: 0,
    total_bookings: 0,
  };

  const filteredListings = listings.filter((l) => {
    const matchesCategory =
      selectedCategory === 'all' || l.category === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const hasListings = listings.length > 0;

  return (
    <>
      <SEO
        title="Vendor Management Hub — EventJell"
        description="Create and manage your vendor service listings across DJ, Catering, Decor, Equipment Rental, Venues, and more"
      />

      {/* Modals */}
      {editingListing && (
        <EditListingModal
          isOpen={!!editingListing}
          onClose={() => setEditingListing(null)}
          listing={editingListing}
        />
      )}

      {deletingListingId && (
        <ConfirmModal
          isOpen={!!deletingListingId}
          onClose={() => setDeletingListingId(null)}
          onConfirm={async () => {
            await deleteMutation.mutateAsync(deletingListingId);
            setDeletingListingId(null);
          }}
          title="Delete Vendor Listing?"
          message="Are you sure you want to permanently delete this listing? This action cannot be undone."
          confirmText="Delete Listing"
          variant="danger"
        />
      )}

      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-3 sm:p-8 space-y-3.5 sm:space-y-6 w-full max-w-7xl mx-auto pb-28 sm:pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xs">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#7A1F1F] text-[10px] sm:text-[11px] font-bold tracking-wide">
                VENDOR MARKETPLACE
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400">Single Account • Multiple Categories</span>
            </div>
            <h1
              className="text-[17px] xs:text-lg sm:text-2xl md:text-3xl font-black text-slate-900 leading-snug"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Vendor Services & Listings
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 sm:mt-1 leading-relaxed">
              Create and manage multiple service listings to be discovered by event organizers.
            </p>
          </div>

          <button
            onClick={() => navigate('/vendor/listings/new')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-3 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 transition-all active:scale-98 shrink-0"
          >
            <Plus size={15} />
            <span>{hasListings ? 'Add New Listing' : 'Create Your First Listing'}</span>
          </button>
        </div>

        {/* ─── STATE 1: NO LISTINGS (EMPTY ONBOARDING STATE) ────────────────────── */}
        {!hasListings && !isLoading && (
          <div className="space-y-3.5 sm:space-y-6">
            {/* Encouraging Hero Banner */}
            <div className="bg-gradient-to-br from-[#7A1F1F] via-[#661919] to-[#451111] rounded-2xl sm:rounded-3xl p-4 sm:p-12 text-white shadow-xl relative overflow-hidden space-y-3 sm:space-y-6 text-center sm:text-left">
              <div className="max-w-xl space-y-2 sm:space-y-3">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-white/15 text-amber-200 text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>Start Earning With EventJell</span>
                </span>
                <h2 className="text-[17px] xs:text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-snug" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Turn Your Event Services Into Consistent Bookings
                </h2>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  List your DJ services, catering, venue rentals, photography, equipment hire, and more. Event organizers across your city can discover your offerings and book your services directly.
                </p>
                <div className="pt-2 sm:pt-3 flex flex-wrap gap-2.5 justify-center sm:justify-start">
                  <button
                    onClick={() => navigate('/vendor/listings/new')}
                    className="py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl bg-white text-[#7A1F1F] text-xs font-black shadow-lg hover:bg-amber-50 transition-all flex items-center gap-1.5 active:scale-98"
                  >
                    <Plus size={14} />
                    <span>Create Your First Listing</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Step Process (Compact) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-5">
              <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs space-y-1.5 sm:space-y-3">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] font-black flex items-center justify-center text-xs sm:text-sm">
                  1
                </div>
                <h3 className="text-xs sm:text-base font-bold text-slate-900">List in Multiple Categories</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  Have equipment rentals and DJ services? Create separate, dedicated listings under one account with custom pricing.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs space-y-1.5 sm:space-y-3">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-700 font-black flex items-center justify-center text-xs sm:text-sm">
                  2
                </div>
                <h3 className="text-xs sm:text-base font-bold text-slate-900">Receive Direct Client Requests</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  Event planners browsing the EventJell directory can view your portfolio, send direct inquiries, and reserve dates.
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xs space-y-1.5 sm:space-y-3">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-green-50 text-green-700 font-black flex items-center justify-center text-xs sm:text-sm">
                  3
                </div>
                <h3 className="text-xs sm:text-base font-bold text-slate-900">Instant Payouts to Wallet</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                  Earnings are credited automatically to your EventJell Wallet and ready for withdrawal to your bank account anytime.
                </p>
              </div>
            </div>

            {/* Category Showcase Grid (Compact) */}
            <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 shadow-xs space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-xs sm:text-base font-bold text-slate-900">Supported Vendor Categories</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Pick any category to create your first listing</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.id] || Store;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => navigate('/vendor/listings/new')}
                      className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-[#7A1F1F] hover:bg-[#FAF0E8]/40 flex flex-col items-center text-center gap-1.5 xs:flex-row xs:items-start xs:text-left xs:gap-2 sm:gap-3 transition-all group"
                    >
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100 group-hover:bg-[#7A1F1F] group-hover:text-white flex items-center justify-center text-slate-700 shrink-0 transition-colors">
                        <Icon size={15} className="sm:w-[18px] sm:h-[18px]" />
                      </div>
                      <div className="min-w-0 w-full">
                        {/* Wraps to two lines rather than truncating — names like
                            "Security & Bouncers" never fit one line in a 2-up grid. */}
                        <span className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-[#7A1F1F] block leading-tight line-clamp-2">
                          {cat.name}
                        </span>
                        <span className="hidden xs:block text-[9px] sm:text-[10px] text-slate-400 truncate mt-0.5">
                          {cat.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── STATE 2: HAS LISTINGS (MANAGEMENT DASHBOARD) ────────────────────── */}
        {hasListings && (
          <div className="space-y-3.5 sm:space-y-6">
            {/* KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3.5">
              <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Listings
                </span>
                <span className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1 block">
                  {metrics.total_listings}
                </span>
                <span className="text-[10px] sm:text-[11px] text-green-700 font-semibold">
                  {metrics.published_listings} active
                </span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Views
                </span>
                <span className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1 block">
                  {metrics.total_views.toLocaleString()}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400">Across all listings</span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Client Inquiries
                </span>
                <span className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1 block">
                  {metrics.total_inquiries}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400">Direct inquiries</span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-xs">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Confirmed Bookings
                </span>
                <span className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 sm:mt-1 block">
                  {metrics.total_bookings}
                </span>
                <span className="text-[10px] sm:text-[11px] text-slate-400">Completed events</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-xs">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-2 sm:py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-[#7A1F1F] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({listings.length})
                </button>
                {categories
                  .filter((cat) => listings.some((l) => l.category === cat.id))
                  .map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-2 sm:py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#7A1F1F] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
              </div>

              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search listings..."
                  className="pl-8 pr-3 h-10 sm:h-8 text-base sm:text-xs bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 w-full sm:w-56"
                />
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {filteredListings.map((listing) => {
                const Icon = CATEGORY_ICONS[listing.category] || Store;
                return (
                  <div
                    key={listing._id}
                    className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative h-32 sm:h-44 bg-slate-100 overflow-hidden">
                        {listing.cover_image ? (
                          <img
                            src={listing.cover_image}
                            alt={listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#7A1F1F]/10 to-[#D4A24C]/10 text-[#7A1F1F]">
                            <Icon size={32} className="opacity-40" />
                          </div>
                        )}

                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <Icon size={10} />
                            <span>{listing.category.replace('_', ' ')}</span>
                          </span>
                        </div>

                        <div className="absolute top-2.5 right-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs ${
                              listing.status === 'published'
                                ? 'bg-green-500 text-white'
                                : listing.status === 'paused'
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-600 text-white'
                            }`}
                          >
                            {listing.status}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-3 sm:p-5 space-y-2 sm:space-y-3">
                        <div>
                          <h3 className="text-xs sm:text-base font-bold text-slate-900 group-hover:text-[#7A1F1F] transition-colors line-clamp-1">
                            {listing.title}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 mt-0.5">
                            {listing.tagline || listing.description || 'No description provided'}
                          </p>
                        </div>

                        {/* Location & Radius */}
                        {listing.location && (
                          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500">
                            <MapPin size={11} className="text-[#7A1F1F] shrink-0" />
                            <span className="line-clamp-1">{listing.location}</span>
                            {listing.service_radius_km && (
                              <span className="text-[9.5px] text-slate-400 truncate">
                                (±{listing.service_radius_km}km)
                              </span>
                            )}
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="flex items-baseline justify-between pt-1.5 border-t border-slate-100">
                          <div>
                            <span className="text-[8.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Pricing
                            </span>
                            <span className="text-sm sm:text-lg font-black text-slate-900">
                              {formatCurrency(listing.base_price, listing.currency)}
                              <span className="text-[9.5px] sm:text-[11px] font-medium text-slate-500 ml-0.5">
                                / {listing.pricing_type.replace('_', ' ')}
                              </span>
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[8.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Views
                            </span>
                            <span className="text-[11px] sm:text-xs font-bold text-slate-700 flex items-center justify-end gap-0.5">
                              <Eye size={11} />
                              {listing.views_count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-2.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingListing(listing)}
                          className="p-2.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:text-[#7A1F1F] hover:bg-white border border-transparent hover:border-slate-200 transition-all text-[11px] sm:text-xs font-bold flex items-center gap-1"
                          title="Edit Listing"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            const nextStatus =
                              listing.status === 'published' ? 'paused' : 'published';
                            updateStatusMutation.mutate({
                              id: listing._id,
                              status: nextStatus,
                            });
                          }}
                          className="p-2.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:text-amber-700 hover:bg-white border border-transparent hover:border-slate-200 transition-all text-[11px] sm:text-xs font-bold flex items-center gap-1"
                          title={listing.status === 'published' ? 'Pause Listing' : 'Publish Listing'}
                        >
                          {listing.status === 'published' ? (
                            <>
                              <PauseCircle size={13} />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <PlayCircle size={13} />
                              <span>Publish</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => setDeletingListingId(listing._id)}
                        className="p-2.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                        title="Delete Listing"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
