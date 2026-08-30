import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
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
  Store,
  ChevronRight,
  Share2,
  DollarSign,
  Heart,
  Check,
  MessageSquare,
} from 'lucide-react';
import SEO from '../components/SEO';
import { useVendorListing } from '../hooks/useVendorListings';
import { useCreateVendor, useVendors } from '../hooks/useVendors';
import { useEvents } from '../hooks/useEvents';
import { useLocale } from '../hooks/useLocale';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../contexts/AuthContext';
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
  decor: 'Decor & Styling',
  equipment_rental: 'Equipment Rental',
  av: 'A/V & Equipment',
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
  music: 'Live Music & Band',
  other: 'Specialized Service',
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  dj: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  caterer: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
  catering: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
  event_planner: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  decorator: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  decor: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  equipment_rental: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  av: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80',
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  photographer: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
  photography: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
  videographer: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
  mc_host: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
  makeup_artist: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
  baker: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=1200&q=80',
  florist: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=1200&q=80',
  security: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=1200&q=80',
  transportation: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  music: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  other: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
};

export default function VendorProfilePage() {
  const { id: eventId, listingId } = useParams<{ id?: string; listingId?: string }>();
  const navigate = useNavigate();
  const { localCurrency } = useLocale();
  const { user } = useAuth();

  const resolvedListingId = listingId || (eventId && !listingId ? eventId : '');
  const { data: listing, isLoading, error } = useVendorListing(resolvedListingId);
  const { data: events = [] } = useEvents();
  const { data: eventVendors = [] } = useVendors();
  const createVendor = useCreateVendor();

  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || (events[0]?._id || ''));
  const [bookingNotes, setBookingNotes] = useState('');
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBookedSuccess, setIsBookedSuccess] = useState(false);

  const priceToUse = customPrice !== undefined ? customPrice : (listing?.base_price || 0);

  const isAlreadyBooked = listing && eventVendors.some(
    (v) => v.name.toLowerCase() === listing.title.toLowerCase()
  );

  const handleInitiateChat = () => {
    if (!listing) return;
    const currentUserId = user?._id || user?.id;
    const vendorUserId = listing.owner_id;
    if (!currentUserId) {
      toast.error('Please log in to chat with this vendor');
      return;
    }
    const conversationId = [currentUserId, vendorUserId].sort().join('_');
    navigate(`/messages/${conversationId}`, {
      state: {
        recipientUser: {
          _id: listing.owner_id,
          first_name: listing.title,
          email: listing.contact_email,
        },
        vendorListing: listing,
      }
    });
  };

  const handleBookVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;
    const targetEvent = selectedEventId || eventId;
    if (!targetEvent) {
      toast.error('Please select an event to book this vendor for');
      return;
    }

    setIsSubmitting(true);
    try {
      await createVendor.mutateAsync({
        name: listing.title,
        category: listing.category as any,
        contactName: listing.title,
        email: listing.contact_email,
        phone: listing.contact_phone,
        contractValue: priceToUse,
        notes: bookingNotes.trim() || `Booked from Marketplace. Tagline: ${listing.tagline || ''}`,
        eventId: targetEvent,
        status: 'confirmed',
      });

      setIsBookedSuccess(true);
      toast.success(`${listing.title} has been booked for your event!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to book vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Vendor profile link copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#7A1F1F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Store size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Vendor Not Found</h2>
          <p className="text-xs text-slate-500">
            The vendor listing you requested could not be located or may have been removed.
          </p>
          <button
            type="button"
            onClick={() => (eventId ? navigate(`/events/${eventId}/vendors`) : navigate(-1))}
            className="px-5 py-2.5 bg-[#7A1F1F] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#661919]"
          >
            Back to Vendors Directory
          </button>
        </div>
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[listing.category] || Store;
  const coverSrc = listing.cover_image || CATEGORY_FALLBACK_IMAGES[listing.category] || CATEGORY_FALLBACK_IMAGES.other;

  return (
    <div className="min-h-full bg-slate-50/50 no-scrollbar pb-20">
      <SEO
        title={`${listing.title} — EventJelly Vendor Marketplace`}
        description={listing.tagline || listing.description || 'Verified event supplier on EventJelly'}
      />



      {/* Top Breadcrumbs & Back Navigation */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3.5 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => (eventId ? navigate(`/events/${eventId}/vendors`) : navigate(-1))}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#7A1F1F] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to {eventId ? 'Event Vendors' : 'Directory'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleInitiateChat}
              className="px-4 py-2 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-xs font-bold rounded-xl border border-[#7A1F1F]/20 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <MessageSquare size={14} />
              <span>Chat with Vendor</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              title="Share Vendor Profile"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8">
        {/* Hero Header & Gallery Banner */}
        <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
          <div className="relative h-64 sm:h-96 w-full bg-slate-900 overflow-hidden">
            <img
              src={coverSrc}
              alt={listing.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = CATEGORY_FALLBACK_IMAGES[listing.category] || CATEGORY_FALLBACK_IMAGES.other;
              }}
              className="w-full h-full object-cover opacity-90 hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Badges on Hero */}
            <div className="absolute top-5 left-5 flex items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#7A1F1F] text-xs font-extrabold uppercase tracking-wide shadow-md flex items-center gap-1.5">
                <Icon size={14} />
                <span>{CATEGORY_LABELS[listing.category] || listing.category}</span>
              </span>

              <span className="px-3 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                <ShieldCheck size={14} />
                <span>Verified Supplier</span>
              </span>
            </div>

            <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-sm font-bold border border-white/10 shadow-md">
              <Star size={15} className="fill-amber-400 text-amber-400" />
              <span>{listing.rating ? listing.rating.toFixed(1) : '5.0'}</span>
              <span className="text-white/60 text-xs font-normal">({listing.reviews_count || 14} reviews)</span>
            </div>

            {/* Title & Tagline in Hero Banner */}
            <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
              <h1
                className="text-2xl sm:text-4xl font-black tracking-tight"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {listing.title}
              </h1>
              {listing.tagline && (
                <p className="text-sm sm:text-base text-white/90 font-medium max-w-3xl leading-relaxed">
                  {listing.tagline}
                </p>
              )}
              {listing.location && (
                <div className="flex items-center gap-2 text-xs text-amber-200 font-semibold pt-1">
                  <MapPin size={14} className="text-amber-300" />
                  <span>{listing.location}</span>
                  {listing.service_radius_km && (
                    <span className="text-white/70 font-normal">
                      • Service radius up to {listing.service_radius_km} km
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Vendor Bio, Offerings & Details (2 Cols) */}
          <div className="lg:col-span-2 space-y-7">
            {/* About & Bio Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Store size={18} className="text-[#7A1F1F]" />
                <span>About this Vendor & Service</span>
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description ||
                  'Professional event vendor providing top-quality services with years of experience across luxury weddings, corporate banquets, private celebrations, and club nights.'}
              </p>
            </div>

            {/* Inclusions & Amenities Card */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#D4A24C]" />
                  <span>Key Features & Inclusions</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {listing.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-800"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Contact & Social Card */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Phone size={18} className="text-[#7A1F1F]" />
                  <span>Direct Contact & Messaging</span>
                </h2>
                <button
                  type="button"
                  onClick={handleInitiateChat}
                  className="px-3.5 py-1.5 rounded-xl bg-[#7A1F1F] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#661919]"
                >
                  <MessageSquare size={13} />
                  <span>Chat Now</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {listing.contact_phone && (
                  <a
                    href={`tel:${listing.contact_phone}`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#7A1F1F]/30 hover:bg-[#FAF0E8]/40 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#7A1F1F] group-hover:scale-105 transition-transform">
                      <Phone size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Phone / WhatsApp
                      </span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-[#7A1F1F]">
                        {listing.contact_phone}
                      </span>
                    </div>
                  </a>
                )}

                {listing.contact_email && (
                  <a
                    href={`mailto:${listing.contact_email}`}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#7A1F1F]/30 hover:bg-[#FAF0E8]/40 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#7A1F1F] group-hover:scale-105 transition-transform">
                      <Mail size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Email Inquiry
                      </span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-[#7A1F1F] truncate max-w-[180px] block">
                        {listing.contact_email}
                      </span>
                    </div>
                  </a>
                )}

                {listing.website && (
                  <a
                    href={listing.website.startsWith('http') ? listing.website : `https://${listing.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-[#7A1F1F]/30 hover:bg-[#FAF0E8]/40 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#7A1F1F] group-hover:scale-105 transition-transform">
                      <Globe size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Official Website
                      </span>
                      <span className="text-xs font-bold text-slate-900 group-hover:text-[#7A1F1F] truncate max-w-[180px] block">
                        {listing.website}
                      </span>
                    </div>
                  </a>
                )}

                {listing.instagram && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-2xs flex items-center justify-center text-[#7A1F1F]">
                      <Globe size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Instagram Handle
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {listing.instagram}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Booking / Contract Card */}
          <div className="space-y-6 sticky top-20">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
              {/* Pricing Box */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {listing.pricing_type === 'starting_at'
                    ? 'Starting From'
                    : listing.pricing_type === 'hourly'
                    ? 'Hourly Rate'
                    : listing.pricing_type === 'fixed'
                    ? 'Flat Agreed Rate'
                    : 'Estimated Pricing'}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {listing.base_price ? formatCurrency(listing.base_price, listing.currency) : 'Custom Quote'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    / {listing.pricing_type?.replace('_', ' ') || 'event'}
                  </span>
                </div>
                {listing.deposit_percentage && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Requires {listing.deposit_percentage}% deposit upon confirmation.
                  </p>
                )}
              </div>

              {/* Chat Action Button */}
              <button
                type="button"
                onClick={handleInitiateChat}
                className="w-full py-3 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-xs font-bold rounded-2xl border border-[#7A1F1F]/20 flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <MessageSquare size={16} />
                <span>Chat with {listing.title}</span>
              </button>

              {/* Booking Form */}
              {isBookedSuccess || isAlreadyBooked ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
                    <Check size={20} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">Vendor Booked for Event!</h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      This vendor is now part of your event lineup.
                    </p>
                  </div>
                  <div className="pt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleInitiateChat}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={14} />
                      <span>Message Vendor</span>
                    </button>
                    {eventId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${eventId}/vendors`)}
                        className="w-full py-2.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl"
                      >
                        View Event Lineup
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookVendor} className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Book for Your Event
                  </h3>

                  {/* Target Event Selector */}
                  {!eventId && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Select Target Event *
                      </label>
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7A1F1F]/20 font-medium"
                        required
                      >
                        <option value="">-- Choose your event --</option>
                        {events.map((ev) => (
                          <option key={ev._id} value={ev._id}>
                            {ev.name} ({new Date(ev.date).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Agreed Contract Value */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Agreed Contract Value ({listing.currency || localCurrency})
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={priceToUse}
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7A1F1F]/20 font-bold"
                    />
                  </div>

                  {/* Booking Deliverables Notes */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Deliverables / Event Notes
                    </label>
                    <textarea
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="e.g. 5-hour reception DJ set, 2 wireless microphones, arrival by 4:00 PM..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#7A1F1F]/20 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#7A1F1F]/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    <CalendarCheck size={16} />
                    <span>{isSubmitting ? 'Confirming Booking...' : 'Confirm & Book Vendor'}</span>
                  </button>
                </form>
              )}

              {/* Policy Notes */}
              <div className="space-y-1.5 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  <span>Direct contractor assignment to event</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>Track payment & contract milestones in dashboard</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
