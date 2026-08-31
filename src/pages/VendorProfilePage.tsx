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
import Logo from '../components/Logo';
import BookVendorModal from '../components/vendor/BookVendorModal';
import { useVendorListing } from '../hooks/useVendorListings';
import { useCreateVendor, useVendors } from '../hooks/useVendors';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../hooks/useLocale';
import { formatCurrency } from '../utils/formatters';
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
  const { user } = useAuth();
  const { localCurrency } = useLocale();

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
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  const priceToUse = customPrice !== undefined ? customPrice : (listing?.base_price || 0);

  const isAlreadyBooked = listing && eventVendors.some(
    (v) => v.name.toLowerCase() === listing.title.toLowerCase()
  );

  const handleInitiateChat = () => {
    if (!listing) return;
    const currentUserId = user?.id || user?._id;
    const vendorUserId = listing.owner_id;
    if (!currentUserId || !vendorUserId) {
      navigate('/login');
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
      const rawCategory = listing.category || '';
      let mappedCategory = 'other';
      const c = rawCategory.toLowerCase();
      if (c === 'caterer' || c === 'catering') {
        mappedCategory = 'catering';
      } else if (c === 'decorator' || c === 'decor') {
        mappedCategory = 'decor';
      } else if (c === 'photographer' || c === 'photography' || c === 'videographer') {
        mappedCategory = 'photography';
      } else if (c === 'dj' || c === 'music') {
        mappedCategory = 'music';
      } else if (c === 'security') {
        mappedCategory = 'security';
      } else if (c === 'av') {
        mappedCategory = 'av';
      }

      await createVendor.mutateAsync({
        name: listing.title,
        category: mappedCategory as any,
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

  const handleBack = () => {
    if (eventId) {
      navigate(`/events/${eventId}/vendors`);
    } else if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/explore');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-[#7A1F1F] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-slate-600">Loading vendor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <Store size={24} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Vendor Not Found</h2>
          <p className="text-xs text-slate-500">
            The vendor listing you requested could not be located or may have been removed.
          </p>
          <button
            type="button"
            onClick={() => (eventId ? navigate(`/events/${eventId}/vendors`) : navigate(-1))}
            className="px-4 py-2.5 bg-[#7A1F1F] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#661919]"
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
    <div className="min-h-full bg-slate-50/50 no-scrollbar pb-28 sm:pb-20">
      <SEO
        title={`${listing.title} — EventJell Vendor Marketplace`}
        description={listing.tagline || listing.description || 'Verified event supplier on EventJell'}
      />

      {/* Top Breadcrumbs & Back Navigation */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-3 py-2 sm:px-8 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            {!user && (
              <div className="flex items-center gap-1.5 mr-2 sm:mr-4 cursor-pointer" onClick={() => navigate('/explore')}>
                <Logo size={24} />
                <span className="text-sm font-extrabold text-slate-900 tracking-tight hidden xs:inline" style={{ fontFamily: 'Playfair Display, serif' }}>
                  EventJell
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#7A1F1F] transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span>Back<span className="hidden sm:inline"> to {eventId ? 'Event Vendors' : 'Explore'}</span></span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleInitiateChat}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-[11px] sm:text-xs font-bold rounded-xl border border-[#7A1F1F]/20 flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <MessageSquare size={13} />
              <span className="hidden sm:inline">Chat with Vendor</span>
              <span className="sm:hidden">Chat</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-all"
              title="Share Vendor Profile"
            >
              <Share2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-3 py-3.5 sm:px-8 sm:py-8 space-y-3.5 sm:space-y-8">
        {/* Hero Header & Gallery Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xs">
          <div className="relative h-52 sm:h-80 md:h-96 w-full bg-slate-900 overflow-hidden">
            <img
              src={coverSrc}
              alt={listing.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = CATEGORY_FALLBACK_IMAGES[listing.category] || CATEGORY_FALLBACK_IMAGES.other;
              }}
              className="w-full h-full object-cover opacity-90 hover:scale-102 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            {/* Top Badges Container (Responsive & Non-overlapping) */}
            <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-5 sm:left-5 sm:right-5 flex flex-wrap items-center justify-between gap-1.5 z-10">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-md text-[#7A1F1F] text-[9.5px] sm:text-xs font-extrabold uppercase tracking-wide shadow-sm flex items-center gap-1">
                  <Icon size={10} />
                  <span>{CATEGORY_LABELS[listing.category] || listing.category}</span>
                </span>

                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-emerald-500 text-white text-[9.5px] sm:text-xs font-bold flex items-center gap-1 shadow-sm">
                  <ShieldCheck size={10} />
                  <span>Verified</span>
                </span>
              </div>

              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-white text-[10px] sm:text-xs font-bold border border-white/10 shadow-sm ml-auto">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                <span>{listing.rating ? listing.rating.toFixed(1) : '5.0'}</span>
                <span className="text-white/60 text-[8.5px] sm:text-[10px]">({listing.reviews_count || 14})</span>
              </div>
            </div>

            {/* Title & Tagline in Hero Banner */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-6 sm:left-6 sm:right-6 text-white space-y-1 sm:space-y-2">
              <h1
                className="text-lg sm:text-3xl md:text-4xl font-black tracking-tight leading-snug"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {listing.title}
              </h1>
              {listing.tagline && (
                <p className="text-[11px] sm:text-sm md:text-base text-white/90 font-medium max-w-3xl leading-relaxed line-clamp-2">
                  {listing.tagline}
                </p>
              )}
              {listing.location && (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-200 font-semibold pt-0.5">
                  <MapPin size={11} className="text-amber-300 shrink-0" />
                  <span>{listing.location}</span>
                  {listing.service_radius_km && (
                    <span className="text-white/70 font-normal truncate">
                      • Radius up to {listing.service_radius_km} km
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-8 items-start">
          {/* Left Column: Vendor Bio, Offerings & Details (2 Cols) */}
          <div className="lg:col-span-2 space-y-3.5 sm:space-y-7">
            {/* About & Bio Card */}
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 shadow-xs space-y-2.5 sm:space-y-4">
              <h2 className="text-xs sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                <Store size={15} className="text-[#7A1F1F] sm:w-[18px] sm:h-[18px]" />
                <span>About this Vendor & Service</span>
              </h2>
              <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {listing.description ||
                  'Professional event vendor providing top-quality services with years of experience across luxury weddings, corporate banquets, private celebrations, and club nights.'}
              </p>
            </div>

            {/* Inclusions & Amenities Card */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 shadow-xs space-y-2.5 sm:space-y-4">
                <h2 className="text-xs sm:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                  <Sparkles size={15} className="text-[#D4A24C] sm:w-[18px] sm:h-[18px]" />
                  <span>Key Features & Inclusions</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3">
                  {listing.amenities.map((amenity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-[10.5px] sm:text-xs font-semibold text-slate-800"
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <span className="truncate">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>

          {/* Right Column: Sticky Booking / Contract Card */}
          <div className="space-y-3.5 sm:space-y-6 lg:sticky lg:top-20">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xs sm:shadow-lg space-y-3 sm:space-y-6">
              {/* Pricing Box */}
              <div>
                <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {listing.pricing_type === 'starting_at'
                    ? 'Starting From'
                    : listing.pricing_type === 'hourly'
                    ? 'Hourly Rate'
                    : listing.pricing_type === 'fixed'
                    ? 'Flat Agreed Rate'
                    : 'Estimated Pricing'}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl sm:text-3xl font-black text-slate-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {listing.base_price ? formatCurrency(listing.base_price, listing.currency) : 'Custom Quote'}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium">
                    / {listing.pricing_type?.replace('_', ' ') || 'event'}
                  </span>
                </div>
                {listing.deposit_percentage && (
                  <p className="text-[9.5px] sm:text-[11px] text-slate-500 mt-0.5">
                    Requires {listing.deposit_percentage}% deposit upon confirmation.
                  </p>
                )}
              </div>

              {/* Chat Action Button */}
              <button
                type="button"
                onClick={handleInitiateChat}
                className="w-full py-2 sm:py-3 bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-[11px] sm:text-xs font-bold rounded-xl sm:rounded-2xl border border-[#7A1F1F]/20 flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-2xs"
              >
                <MessageSquare size={13} />
                <span>Chat with {listing.title}</span>
              </button>

              {/* Booking Action or Status */}
              {!user ? (
                <div className="p-4 rounded-xl sm:rounded-2xl bg-amber-50/50 border border-amber-100 text-center space-y-3 pt-3">
                  <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                    Log in or register an account to book this supplier for your event!
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="w-full py-2.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    Sign In to Book
                  </button>
                </div>
              ) : isBookedSuccess || isAlreadyBooked ? (
                <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 sm:space-y-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xs">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-emerald-900">Vendor Booked for Event!</h3>
                    <p className="text-[10px] sm:text-[11px] text-emerald-700 mt-0.5">
                      This vendor is now part of your event lineup.
                    </p>
                  </div>
                  <div className="pt-0.5 flex flex-col gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBookModalOpen(true)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <CalendarCheck size={13} />
                      <span>Book for Another Event</span>
                    </button>
                    {eventId && (
                      <button
                        type="button"
                        onClick={() => navigate(`/events/${eventId}/vendors`)}
                        className="w-full py-1.5 sm:py-2.5 bg-white border border-emerald-300 text-emerald-800 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl"
                      >
                        View Event Lineup
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(true)}
                    className="w-full py-3 sm:py-3.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl shadow-md shadow-[#7A1F1F]/20 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                  >
                    <CalendarCheck size={16} />
                    <span>Book for Your Event</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Add to an existing event or create a new event instantly
                  </p>
                </div>
              )}

              {/* Policy Notes */}
              <div className="space-y-1 pt-2.5 sm:pt-4 border-t border-slate-100 text-[9.5px] sm:text-[11px] text-slate-400">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 size={10} className="text-emerald-600 shrink-0" />
                  <span>Direct contractor assignment to event</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <ShieldCheck size={10} className="text-emerald-600 shrink-0" />
                  <span>Track payment & contract milestones in dashboard</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Vendor Modal */}
      {listing && (
        <BookVendorModal
          isOpen={isBookModalOpen}
          onClose={() => setIsBookModalOpen(false)}
          listing={listing}
          initialEventId={eventId}
          onSuccess={() => setIsBookedSuccess(true)}
        />
      )}    </div>
  );
}
