import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Store,
  Disc3,
  Utensils,
  ClipboardCheck,
  Sparkles,
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
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import SEO from '../components/SEO';
import Logo from '../components/Logo';
import { useExploreVendorListings, useVendorCategories } from '../hooks/useVendorListings';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../hooks/useLocale';
import { formatCurrency } from '../utils/formatters';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  dj: Disc3,
  caterer: Utensils,
  catering: Utensils,
  event_planner: ClipboardCheck,
  decorator: Sparkles,
  decor: Sparkles,
  equipment_rental: Speaker,
  av: Speaker,
  venue: Building2,
  photographer: Camera,
  photography: Camera,
  videographer: Video,
  mc_host: Mic2,
  makeup_artist: Brush,
  baker: Cake,
  florist: Flower2,
  security: ShieldCheck,
  transportation: Car,
  entertainment: Music,
  music: Music,
  other: Store,
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  dj: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
  caterer: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80',
  event_planner: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80',
  decorator: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
  decor: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
  equipment_rental: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
  av: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80',
  photographer: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80',
  photography: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80',
  videographer: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80',
  mc_host: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
  makeup_artist: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80',
  baker: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80',
  florist: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
  security: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=600&q=80',
  transportation: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  music: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
  other: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
};

const R = '#7A1F1F';
const RD = '#3D0F0F';

export default function ExplorePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { localCurrency } = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(9);

  const { data: categories = [] } = useVendorCategories();
  const { data: exploreData, isLoading } = useExploreVendorListings({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: searchQuery.trim() || undefined,
    location: selectedLocation.trim() || undefined,
    page,
    limit,
  });

  const listings = exploreData?.listings || [];
  const totalCount = exploreData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEO
        title="Explore Event Vendors & Services — EventJell"
        description="Discover and book professional event suppliers, catering, decor, AV equipment, and music for your wedding, corporate meeting, or social event."
        canonical="/explore"
        keywords="event vendors, event suppliers, catering, event decor, DJ hire, photographer, wedding vendors, party rentals, book event services"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Explore Event Vendors & Services',
            description:
              'Discover and book professional event suppliers, catering, decor, AV equipment, and music.',
            url: 'https://eventjell.com/explore',
            isPartOf: { '@id': 'https://eventjell.com/#website' },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://eventjell.com/' },
              { '@type': 'ListItem', position: 2, name: 'Explore Vendors', item: 'https://eventjell.com/explore' },
            ],
          },
        ]}
      />

      {/* Public Header (shown only to logged out guests) */}
      {!user && (
        <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 px-4 py-3 sm:px-8 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size={32} />
            <span className="text-lg font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              EventJell
            </span>
            <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E8] text-[#7A1F1F] border border-[#7A1F1F]/10">
              Marketplace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-xs font-bold text-white bg-[#7A1F1F] hover:bg-[#661919] rounded-xl transition-all shadow-xs cursor-pointer active:scale-97"
            >
              Register
            </button>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-8 space-y-6">
        {/* Title Block */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            Discover Professional Suppliers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-normal">
            Find the perfect vendors, service providers, and equipment rentals to bring your event vision to life.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by company name, services, or bio..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 transition-all placeholder:text-slate-400 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Location Input */}
              <div className="relative flex-1 md:flex-none">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Filter by city..."
                  className="w-full md:w-44 pl-8 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 transition-all placeholder:text-slate-400 text-slate-800"
                />
              </div>

              {/* Items Per Page */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
                <span className="hidden sm:inline text-[11px] text-slate-400">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 font-bold text-slate-700 cursor-pointer"
                >
                  <option value={9}>9 / page</option>
                  <option value={12}>12 / page</option>
                  <option value={18}>18 / page</option>
                  <option value={24}>24 / page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Categories Horizontal scroll */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer active:scale-95 ${
                selectedCategory === 'all'
                  ? 'bg-[#7A1F1F] text-white border-[#7A1F1F] shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Store size={14} />
              <span>All Categories</span>
            </button>

            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id] || Store;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#7A1F1F] text-white border-[#7A1F1F] shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  <Icon size={14} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>
            Showing <strong className="text-slate-800">{totalCount > 0 ? (page - 1) * limit + 1 : 0} - {Math.min(page * limit, totalCount)}</strong> of <strong className="text-slate-800">{totalCount}</strong> published listings
          </span>
          {totalPages > 1 && (
            <span className="text-[11px] text-slate-400">
              Page <strong className="text-slate-700">{page}</strong> of {totalPages}
            </span>
          )}
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs space-y-3 p-3">
                <div className="h-44 bg-slate-100 rounded-2xl w-full" />
                <div className="p-2 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-20 bg-slate-100 rounded-full" />
                    <div className="h-4 w-12 bg-slate-100 rounded-md" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-5 w-20 bg-slate-200 rounded-md" />
                    <div className="h-8 w-20 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200/80 rounded-3xl p-16 text-center space-y-4 max-w-xl mx-auto shadow-3xs my-8">
            <Store size={40} className="text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No listing matches found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-normal">
              Try updating your search query or switching categories to discover other event services.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setSelectedLocation('');
                setPage(1);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {listings.map((listing) => {
              const coverSrc = listing.cover_image || CATEGORY_FALLBACK_IMAGES[listing.category] || CATEGORY_FALLBACK_IMAGES.other;
              return (
                <div
                  key={listing._id}
                  onClick={() => navigate(`/vendor/listings/${listing._id}`)}
                  className="bg-white border border-slate-200/90 hover:border-[#7A1F1F]/40 rounded-3xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:-translate-y-0.5 cursor-pointer"
                >
                  <div>
                    {/* Image block */}
                    <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden border-b border-slate-100">
                      <img
                        src={coverSrc}
                        alt={listing.title}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = CATEGORY_FALLBACK_IMAGES[listing.category] || CATEGORY_FALLBACK_IMAGES.other;
                        }}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      
                      <span className="absolute top-3.5 left-3.5 px-3 py-1 bg-white/95 backdrop-blur-xs text-slate-800 text-[10.5px] font-extrabold rounded-lg shadow-sm tracking-wide uppercase border border-slate-100">
                        {listing.category?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Content Block */}
                    <div className="p-5 space-y-2">
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-[#7A1F1F] transition-colors leading-snug line-clamp-1">
                        {listing.title}
                      </h3>
                      {listing.tagline && (
                        <p className="text-slate-500 text-[11px] sm:text-xs font-medium leading-normal line-clamp-2">
                          {listing.tagline}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold pt-1">
                        <MapPin size={12} className="text-[#7A1F1F]" />
                        <span>{listing.location || 'Anywhere'}</span>
                        {listing.service_radius_km && (
                          <span className="text-[10px] text-slate-300">
                            • Serves up to {listing.service_radius_km}km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing footer block */}
                  <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      {listing.pricing_type === 'starting_at' ? 'Starting From' : listing.pricing_type === 'hourly' ? 'Hourly Rate' : 'Fixed Rate'}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-slate-800">
                      {formatCurrency(listing.base_price, listing.currency || localCurrency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-8">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-9 h-9 text-xs font-bold rounded-xl border transition-all active:scale-95 cursor-pointer ${
                  page === p
                    ? 'bg-[#7A1F1F] border-[#7A1F1F] text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>

      {/* Public Footer */}
      {!user && (
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-[11px] text-slate-400 font-semibold tracking-wide">
          EventJell © 2026 - Discover and Book Event Services Globally.
        </footer>
      )}
    </div>
  );
}
