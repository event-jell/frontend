import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Store,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  MapPin,
  Star,
  Eye,
  MessageSquare,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  ShieldCheck,
  Check,
  CalendarCheck,
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
  Car,
  Music,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../hooks/useVendors';
import { useExploreVendorListings, useVendorCategories } from '../hooks/useVendorListings';
import { useLocale } from '../hooks/useLocale';
import { formatCurrency } from '../utils/formatters';
import ChatDrawer from '../components/chat/ChatDrawer';
import type { Vendor, VendorListing } from '../types';
import { toast } from 'sonner';

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

const CATEGORY_LABELS: Record<string, string> = {
  dj: 'DJ & Sound',
  caterer: 'Catering & Food',
  catering: 'Catering',
  event_planner: 'Event Planner',
  decorator: 'Event Decorator',
  decor: 'Decor',
  equipment_rental: 'Equipment Rental',
  av: 'A/V & Tech',
  venue: 'Venue Rental',
  photographer: 'Photographer',
  photography: 'Photography',
  videographer: 'Videographer',
  mc_host: 'MC / Host',
  makeup_artist: 'Makeup & Glam',
  baker: 'Cake & Bakery',
  florist: 'Florist',
  security: 'Security & Bouncers',
  transportation: 'Transportation',
  entertainment: 'Live Entertainment',
  music: 'Music & Entertainment',
  other: 'Other Services',
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  dj: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  caterer: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=80',
  event_planner: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
  decorator: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
  decor: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
  equipment_rental: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
  av: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=800&q=80',
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80',
  photographer: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
  photography: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=80',
  videographer: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
  mc_host: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
  makeup_artist: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80',
  baker: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=800&q=80',
  florist: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
  security: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=800&q=80',
  transportation: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  music: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  other: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
};

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' },
  pending: { label: 'Pending', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: '#EF4444', bg: '#FEF2F2' },
};

// ─── Manual Add Vendor Modal (For Custom Offline Suppliers) ───────────────────

interface AddVendorModalProps {
  onClose: () => void;
  onSave: (data: Partial<Vendor>) => void;
}

function AddVendorModal({ onClose, onSave }: AddVendorModalProps) {
  const { localCurrency } = useLocale();
  const [form, setForm] = useState({
    name: '',
    category: 'catering',
    contactName: '',
    email: '',
    phone: '',
    contractValue: 0,
    notes: '',
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 relative">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Add Custom Vendor</h2>
        <p className="text-xs text-slate-500 mb-5">
          Add an unlisted or offline contractor directly to your event lineup.
        </p>

        <div className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
              Vendor / Business Name *
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 font-semibold"
              placeholder="e.g. DJ Spinall or Royal Catering"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
            >
              <option value="catering">Catering & Food</option>
              <option value="dj">DJ & Sound</option>
              <option value="decor">Decor & Styling</option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="av">A/V & Equipment</option>
              <option value="venue">Venue</option>
              <option value="mc_host">MC / Host</option>
              <option value="security">Security</option>
              <option value="music">Live Entertainment</option>
              <option value="other">Other Services</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                Contact Person
              </label>
              <input
                value={form.contactName}
                onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                placeholder="Manager Name"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                Agreed Contract ({localCurrency})
              </label>
              <input
                type="number"
                min={0}
                value={form.contractValue}
                onChange={(e) => setForm((f) => ({ ...f, contractValue: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                placeholder="vendor@example.com"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                Phone / WhatsApp
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                placeholder="+234 800 000 0000"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 block">
              Contract Notes / Deliverables
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 resize-none"
              rows={2}
              placeholder="e.g. 5 hours DJ set, 2 wireless microphones, arrival by 4:00 PM..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (form.name.trim()) {
                onSave(form);
                onClose();
              }
            }}
            className="px-5 py-2.5 text-xs text-white font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 hover:bg-[#661919] transition-all bg-[#7A1F1F]"
          >
            Add Vendor
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Vendors Page Component ──────────────────────────────────────────────

export default function VendorsPage() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { localCurrency } = useLocale();

  // Active event vendors
  const { data: eventVendors = [], isLoading: loadingEventVendors } = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  // Marketplace Explore data & Pagination State
  const [activeTab, setActiveTab] = useState<'marketplace' | 'booked'>('marketplace');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [chatVendor, setChatVendor] = useState<VendorListing | null>(null);

  // Pagination states
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(6);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedCategory, searchQuery, selectedLocation, limit]);

  const { data: categories = [] } = useVendorCategories();
  const { data: exploreData, isLoading: loadingExplore } = useExploreVendorListings({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery.trim() || undefined,
    location: selectedLocation.trim() || undefined,
    page,
    limit,
  });

  const marketplaceListings = exploreData?.listings || [];
  const totalCount = exploreData?.total || 0;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  // Metrics for booked vendors
  const totalContract = eventVendors.reduce((s, v) => s + (v.contractValue || 0), 0);
  const confirmedCount = eventVendors.filter((v) => v.status === 'confirmed').length;
  const paidCount = eventVendors.filter((v) => v.paid).length;

  const handleNavigateToVendor = (listingId: string) => {
    if (eventId) {
      navigate(`/events/${eventId}/vendors/marketplace/${listingId}`);
    } else {
      navigate(`/vendors/${listingId}`);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/40 no-scrollbar">
      <SEO
        title="Vendors & Marketplace — EventJelly"
        description="Browse, book, and manage verified DJs, Caterers, Photographers, and Venues for your event"
      />

      {/* Real-time Chat Drawer */}
      {chatVendor && (
        <ChatDrawer
          isOpen={!!chatVendor}
          onClose={() => setChatVendor(null)}
          recipientUser={{
            _id: chatVendor.owner_id,
            first_name: chatVendor.title,
            email: chatVendor.contact_email,
          }}
          vendorListing={chatVendor}
          eventId={eventId}
          onBookVendor={() => {
            const vendorId = chatVendor._id;
            setChatVendor(null);
            handleNavigateToVendor(vendorId);
          }}
        />
      )}

      {/* Manual Add Custom Vendor Modal */}
      {showAddCustom && (
        <AddVendorModal
          onClose={() => setShowAddCustom(false)}
          onSave={(data) => {
            createVendor.mutate({ ...data, eventId });
            setActiveTab('booked');
          }}
        />
      )}

      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#7A1F1F] text-[11px] font-bold tracking-wide">
                EVENT DIRECTORY & SUPPLIERS
              </span>
              <span className="text-xs text-slate-400">
                {eventVendors.length} booked for this event
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-black text-slate-900"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Vendors & Marketplace
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Tab Toggle Switcher */}
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'marketplace'
                    ? 'bg-white text-[#7A1F1F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={14} className={activeTab === 'marketplace' ? 'text-[#D4A24C]' : ''} />
                <span>Browse Marketplace</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('booked')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'booked'
                    ? 'bg-white text-[#7A1F1F] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarCheck size={14} />
                <span>Booked Lineup ({eventVendors.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowAddCustom(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 transition-all active:scale-98"
            >
              <Plus size={15} />
              <span>Add Custom Vendor</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body with hidden scrollbar */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 sm:px-8 max-w-7xl mx-auto w-full space-y-7 pb-16">
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: BROWSE & BOOK MARKETPLACE VENDORS                                 */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'marketplace' && (
          <div className="space-y-7 animate-in fade-in duration-200">
            {/* Category Filter Pills */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by vendor name, service, or bio..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      placeholder="Filter city (e.g. Lagos)..."
                      className="pl-8 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 w-44"
                    />
                  </div>

                  {/* Limit per page selector */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                    <span className="hidden sm:inline text-[11px] text-slate-400">Limit:</span>
                    <select
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 font-bold text-slate-700"
                    >
                      <option value={6}>6 / page</option>
                      <option value={9}>9 / page</option>
                      <option value={12}>12 / page</option>
                      <option value={18}>18 / page</option>
                      <option value={24}>24 / page</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Scrollable Category Bar (No Scrollbar) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    selectedCategory === 'all'
                      ? 'bg-[#7A1F1F] text-white border-[#7A1F1F] shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
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
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#7A1F1F] text-white border-[#7A1F1F] shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Results Info & Count Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>
                Showing{' '}
                <strong className="text-slate-800">
                  {totalCount > 0 ? (page - 1) * limit + 1 : 0} -{' '}
                  {Math.min(page * limit, totalCount)}
                </strong>{' '}
                of <strong className="text-slate-800">{totalCount}</strong> published vendors
              </span>

              {totalPages > 1 && (
                <span className="text-[11px] text-slate-400">
                  Page <strong className="text-slate-700">{page}</strong> of {totalPages}
                </span>
              )}
            </div>

            {/* Marketplace Grid with Card Navigation */}
            {loadingExplore ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <div className="w-8 h-8 border-2 border-[#7A1F1F] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium">Finding top-rated event vendors...</p>
              </div>
            ) : marketplaceListings.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
                <Store size={36} className="text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No vendors found matching your filter</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try clearing your search query or selecting a different category from above.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                    setSelectedLocation('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8">
                {marketplaceListings.map((listing) => {
                  const Icon = CATEGORY_ICONS[listing.category] || Store;
                  const isAlreadyBooked = eventVendors.some(
                    (v) => v.name.toLowerCase() === listing.title.toLowerCase()
                  );
                  const coverSrc = listing.cover_image || CATEGORY_FALLBACK_IMAGES[listing.category] || CATEGORY_FALLBACK_IMAGES.other;

                  return (
                    <div
                      key={listing._id}
                      onClick={() => handleNavigateToVendor(listing._id)}
                      className="bg-white border border-slate-200/90 hover:border-[#7A1F1F]/40 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 cursor-pointer"
                    >
                      <div>
                        {/* Cover Image & Badges */}
                        <div className="relative h-48 sm:h-52 bg-slate-100 overflow-hidden border-b border-slate-100">
                          <img
                            src={coverSrc}
                            alt={listing.title}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = CATEGORY_FALLBACK_IMAGES[listing.category] || CATEGORY_FALLBACK_IMAGES.other;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                          {/* Top Category Badge */}
                          <div className="absolute top-3.5 left-3.5">
                            <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#7A1F1F] text-[10px] font-extrabold uppercase tracking-wide shadow-sm flex items-center gap-1 border border-slate-100">
                              <Icon size={12} />
                              <span>{CATEGORY_LABELS[listing.category] || listing.category}</span>
                            </span>
                          </div>

                          {/* Top Rating Badge */}
                          <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-bold border border-white/10">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span>{listing.rating ? listing.rating.toFixed(1) : '5.0'}</span>
                            <span className="text-white/60 text-[10px]">({listing.reviews_count || 12})</span>
                          </div>

                          {/* Bottom info on image */}
                          <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                            <h3 className="text-lg font-bold leading-snug line-clamp-1 group-hover:text-amber-200 transition-colors">
                              {listing.title}
                            </h3>
                            {listing.location && (
                              <p className="text-xs text-white/85 flex items-center gap-1 mt-1">
                                <MapPin size={11} className="text-amber-300" />
                                <span className="font-medium">{listing.location}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Card Content Body with Generous Padding */}
                        <div className="p-6 space-y-4">
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[34px]">
                            {listing.tagline || listing.description || 'Professional event vendor ready for bookings.'}
                          </p>

                          {/* Amenities / Feature Pills */}
                          {listing.amenities && listing.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {listing.amenities.slice(0, 3).map((a, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 text-[10.5px] font-semibold border border-slate-200/60"
                                >
                                  ✓ {a}
                                </span>
                              ))}
                              {listing.amenities.length > 3 && (
                                <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 text-[10.5px] border border-slate-200/60">
                                  +{listing.amenities.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Contact Shortcuts */}
                          <div
                            className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {listing.contact_phone && (
                              <a
                                href={`tel:${listing.contact_phone}`}
                                className="flex items-center gap-1 text-slate-600 hover:text-[#7A1F1F] font-medium"
                                title="Call / WhatsApp"
                              >
                                <Phone size={12} className="text-[#7A1F1F]" />
                                <span className="text-[11px]">Phone</span>
                              </a>
                            )}
                            {listing.contact_email && (
                              <a
                                href={`mailto:${listing.contact_email}`}
                                className="flex items-center gap-1 text-slate-600 hover:text-[#7A1F1F] font-medium"
                                title="Send Email"
                              >
                                <Mail size={12} className="text-[#7A1F1F]" />
                                <span className="text-[11px]">Email</span>
                              </a>
                            )}
                            {listing.instagram && (
                              <span className="flex items-center gap-1 text-slate-400">
                                <Globe size={12} />
                                <span className="text-[11px] truncate max-w-[100px]">{listing.instagram}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                            {listing.pricing_type === 'starting_at'
                              ? 'Starting from'
                              : listing.pricing_type === 'hourly'
                              ? 'Hourly rate'
                              : listing.pricing_type === 'fixed'
                              ? 'Flat rate'
                              : 'Custom quote'}
                          </span>
                          <span className="text-base font-black text-slate-900">
                            {listing.base_price ? formatCurrency(listing.base_price, listing.currency) : 'Contact'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatVendor(listing);
                            }}
                            className="px-3 py-2.5 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-xs font-bold rounded-xl border border-[#7A1F1F]/20 transition-all flex items-center gap-1"
                            title="Chat with vendor"
                          >
                            <MessageSquare size={13} />
                            <span>Chat</span>
                          </button>

                          {isAlreadyBooked ? (
                            <span className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1 border border-emerald-200 shadow-2xs">
                              <Check size={13} strokeWidth={3} />
                              <span>Booked</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigateToVendor(listing._id);
                              }}
                              className="px-4 py-2.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-98"
                            >
                              <span>View & Book</span>
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-500">
                  Page <strong className="text-slate-800">{page}</strong> of{' '}
                  <strong className="text-slate-800">{totalPages}</strong>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                      .map((p, index, array) => {
                        const showEllipsis = index > 0 && p - array[index - 1] > 1;
                        return (
                          <div key={p} className="flex items-center">
                            {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                            <button
                              type="button"
                              onClick={() => setPage(p)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                page === p
                                  ? 'bg-[#7A1F1F] text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-all"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: BOOKED EVENT VENDORS LINEUP                                       */}
        {/* ──────────────────────────────────────────────────────────────────────── */}
        {activeTab === 'booked' && (
          <div className="space-y-7 animate-in fade-in duration-200">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
              {[
                { icon: Store, label: 'Total Vendors', value: eventVendors.length, color: '#7A1F1F' },
                { icon: CheckCircle2, label: 'Confirmed', value: confirmedCount, color: '#10B981' },
                {
                  icon: DollarSign,
                  label: 'Total Contracts',
                  value: formatCurrency(totalContract, localCurrency),
                  color: '#F59E0B',
                },
                { icon: CheckCircle2, label: 'Paid in Full', value: `${paidCount} / ${eventVendors.length}`, color: '#7A1F1F' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-2">
                    <Icon size={15} />
                    <span>{label}</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900" style={{ color }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* List */}
            {loadingEventVendors ? (
              <div className="flex items-center justify-center py-20 text-slate-400">Loading booked vendors...</div>
            ) : eventVendors.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-12 sm:p-16 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center mx-auto">
                  <Store size={28} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">No vendors booked for this event yet</h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                    Browse our curated marketplace to discover DJs, caterers, photographers, and decorators ready for your event.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setActiveTab('marketplace')}
                    className="px-5 py-3 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 flex items-center gap-2 transition-all active:scale-98"
                  >
                    <Sparkles size={14} />
                    <span>Browse & Book Marketplace Vendors</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(true)}
                    className="px-4 py-3 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    + Add Custom Vendor
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {eventVendors.map((vendor) => {
                  const status = STATUS_CONFIG[vendor.status] || STATUS_CONFIG.pending;
                  const StatusIcon = status.icon;
                  const Icon = CATEGORY_ICONS[vendor.category] || Store;

                  return (
                    <div
                      key={vendor._id}
                      className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-black bg-[#7A1F1F] shadow-2xs">
                              <Icon size={18} />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{vendor.name}</h3>
                              <p className="text-xs text-slate-400">
                                {CATEGORY_LABELS[vendor.category] ?? vendor.category}
                              </p>
                            </div>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                            style={{ background: status.bg, color: status.color, borderColor: `${status.color}30` }}
                          >
                            <StatusIcon size={11} />
                            {status.label}
                          </span>
                        </div>

                        {(vendor.contactName || vendor.email || vendor.phone) && (
                          <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                            {vendor.contactName && <p className="font-medium">👤 {vendor.contactName}</p>}
                            {vendor.email && <p className="text-slate-600">✉️ {vendor.email}</p>}
                            {vendor.phone && <p className="text-slate-600">📞 {vendor.phone}</p>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contract</p>
                          <p className="font-black text-slate-900 text-base">
                            {formatCurrency(vendor.contractValue || 0, localCurrency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateVendor.mutate({ id: vendor._id, data: { paid: !vendor.paid } })}
                            className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                              vendor.paid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {vendor.paid ? '✓ Paid' : 'Mark Paid'}
                          </button>
                          {vendor.status !== 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => updateVendor.mutate({ id: vendor._id, data: { status: 'confirmed' } })}
                              className="text-xs px-3 py-1.5 rounded-xl font-bold bg-[#FAF0E8] text-[#7A1F1F] hover:bg-[#F5E6D3] transition-all"
                            >
                              Confirm
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Remove vendor from this event?')) deleteVendor.mutate(vendor._id);
                            }}
                            className="text-xs text-slate-400 hover:text-red-600 transition-colors p-1.5"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
