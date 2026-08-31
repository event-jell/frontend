import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  MapPin,
  Sparkles,
  Image as ImageIcon,
  Plus,
  Trash2,
  Loader2,
  Check,
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
  ArrowLeft,
  Eye,
  Info,
  HelpCircle,
  X,
  Upload,
  Link2,
  Grid,
} from 'lucide-react';
import { useCreateVendorListing, useVendorCategories } from '../hooks/useVendorListings';
import { useLocale } from '../hooks/useLocale';
import { uploadApi } from '../lib/api';
import SEO from '../components/SEO';
import { formatCurrency } from '../utils/formatters';
import type { VendorCategoryType } from '../types';

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

const SAMPLE_COVERS: Record<string, string> = {
  dj: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
  caterer: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
  decorator: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
  photographer: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
  videographer: 'https://images.unsplash.com/photo-1579632652768-6cb9dcf85912?auto=format&fit=crop&w=1200&q=80',
  venue: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  event_planner: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  other: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
};

const CATEGORY_PRESETS: Record<string, { label: string; url: string }[]> = {
  dj: [
    { label: 'Club Stage & Lights', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Turntable & Vinyl', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Festival Crowd', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80' },
  ],
  caterer: [
    { label: 'Gourmet Buffet', url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Plated Fine Dining', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Canapés & Drinks', url: 'https://images.unsplash.com/photo-1532635241-17e820acc59f?auto=format&fit=crop&w=1200&q=80' },
  ],
  decorator: [
    { label: 'Floral Arch & Hall', url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Romantic Table Decor', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Backdrop & Ambience', url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1200&q=80' },
  ],
  photographer: [
    { label: 'Wedding Portrait', url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Portrait Shoot', url: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Studio & Lens', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80' },
  ],
  videographer: [
    { label: 'Cinematic Camera', url: 'https://images.unsplash.com/photo-1579632652768-6cb9dcf85912?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Live Filming', url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80' },
  ],
  venue: [
    { label: 'Grand Ballroom', url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Garden & Outdoor', url: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?auto=format&fit=crop&w=1200&q=80' },
  ],
  event_planner: [
    { label: 'Luxury Reception', url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Design & Coordination', url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80' },
  ],
  other: [
    { label: 'Celebration Confetti', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Evening Lights', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80' },
  ],
};

const LABEL =
  'text-[10.5px] xs:text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5';
const FIELD =
  'w-full h-12 sm:h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm ' +
  'placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7A1F1F]/10 focus:border-[#7A1F1F]/60 transition-all';

export default function CreateVendorListingPage() {
  const navigate = useNavigate();
  const { localCurrency } = useLocale();
  const { data: categories = [] } = useVendorCategories();
  const createMutation = useCreateVendorListing();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<VendorCategoryType>('dj');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [pricingType, setPricingType] = useState<'fixed' | 'hourly' | 'starting_at' | 'custom_quote'>('starting_at');
  const [basePrice, setBasePrice] = useState<number | ''>(250);
  const [currency, setCurrency] = useState(localCurrency);
  const [location, setLocation] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(50);
  
  // Cover image & upload state
  const [coverImage, setCoverImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePickerTab, setImagePickerTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [amenityInput, setAmenityInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>([
    'Professional Equipment',
    'Licensed & Insured',
    'Custom Playlists / Setlists',
  ]);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [depositPercentage, setDepositPercentage] = useState<number>(20);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      setCoverImage(res.url);
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !amenities.includes(amenityInput.trim())) {
      setAmenities([...amenities, amenityInput.trim()]);
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index));
  };

  const activeCover = coverImage || SAMPLE_COVERS[category] || SAMPLE_COVERS.other;
  const activeCatInfo = categories.find((c) => c.id === category);
  const currentPresets = CATEGORY_PRESETS[category] || CATEGORY_PRESETS.other;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createMutation.mutateAsync({
      category,
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      pricing_type: pricingType,
      base_price: Number(basePrice) || 0,
      currency,
      location: location.trim(),
      service_radius_km: serviceRadiusKm,
      cover_image: activeCover,
      amenities,
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      website: website.trim(),
      instagram: instagram.trim(),
      deposit_percentage: depositPercentage,
      status: 'published',
    });

    navigate('/vendor/listings');
  };

  const STEPS = [
    { num: 1 as const, label: 'Category' },
    { num: 2 as const, label: 'Details' },
    { num: 3 as const, label: 'Media' },
  ];

  /* Docks above the mobile tab bar; falls back to inline flow on desktop. */
  const ActionBar = ({ children }: { children: React.ReactNode }) => (
    <div className="sticky bottom-0 z-20 -mx-3 mt-1 px-3 pt-2.5 pb-2.5 bg-white/95 backdrop-blur-md border-t border-slate-100 sm:static sm:mx-0 sm:px-0 sm:pb-0 sm:bg-transparent sm:backdrop-blur-none sm:border-slate-100 sm:pt-4 sm:border-t">
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );

  return (
    <>
      <SEO
        title="Setup Vendor Listing — EventJelly"
        description="List your DJ, Catering, Decor, Photography, or Event services on EventJelly Marketplace"
      />

      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-3 sm:p-8 space-y-3 sm:space-y-6 w-full max-w-6xl mx-auto pb-6 sm:pb-20">
        {/* Breadcrumb & step counter */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/vendor/listings"
            className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-slate-900 transition-colors group min-w-0"
          >
            <span className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-300 shadow-2xs flex-shrink-0">
              <ArrowLeft size={14} />
            </span>
            <span className="text-[11.5px] sm:text-xs truncate">Back to Vendor Hub</span>
          </Link>

          <span className="px-2.5 py-1 rounded-full bg-[#FAF0E8] text-[#7A1F1F] text-[10.5px] sm:text-[11px] font-bold whitespace-nowrap flex-shrink-0">
            Step {step} of 3
          </span>
        </div>

        {/* Header Title Card */}
        <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />
          <div className="max-w-2xl">
            <h1
              className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 leading-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Setup Your Vendor Listing
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-1 leading-snug line-clamp-1 sm:line-clamp-none">
              Showcase your event services to organizers, brides, and corporate clients looking to book trusted talent directly.
            </p>
          </div>

          {/* Stepper Header Tabs (Clean, never-truncating) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 mt-3 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-100">
            {STEPS.map((s) => {
              const isCurrent = step === s.num;
              const isDone = step > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num === 1) setStep(1);
                    if (s.num === 2 && category) setStep(2);
                    if (s.num === 3 && title.trim()) setStep(3);
                  }}
                  className={`py-2 px-1 sm:py-2.5 sm:px-3 rounded-xl text-center transition-all border text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 ${
                    isCurrent
                      ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] ring-1 ring-[#7A1F1F]/20 shadow-2xs'
                      : isDone
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                  }`}
                >
                  {isDone ? (
                    <Check size={12} strokeWidth={3} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <span className="flex-shrink-0">{s.num}.</span>
                  )}
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content & Live Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start">
          {/* Left Form Area (7-8 cols on desktop, full width on mobile) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xs space-y-4 sm:space-y-6">
            {/* STEP 1: Category Selection */}
            {step === 1 && (
              <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[15px] sm:text-lg font-bold text-slate-900 leading-tight">
                    What type of service are you offering?
                  </h2>
                  <p className="text-[11.5px] sm:text-xs text-slate-500 mt-1">
                    Select the category that best describes your business.
                  </p>
                </div>

                {/* 2-Column Vertical Tile Grid (Plenty of room for full title text) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.id] || Store;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left flex flex-col justify-between min-h-[72px] sm:min-h-[88px] transition-all relative ${
                          isSelected
                            ? 'border-[#7A1F1F] bg-[#FAF0E8] ring-1 ring-[#7A1F1F]/20 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#7A1F1F] text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Icon size={14} className="sm:w-4 sm:h-4" />
                          </div>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-[#7A1F1F] text-white flex items-center justify-center shadow-2xs">
                              <Check size={9} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <div className="w-full min-w-0">
                          <span className="text-[11px] sm:text-xs font-bold text-slate-900 block truncate leading-tight">
                            {cat.name}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 block truncate leading-tight mt-0.5">
                            {cat.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <ActionBar>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full h-12 sm:h-11 px-5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-[14px] sm:text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <span>Continue to Details & Pricing</span>
                    <ChevronRight size={15} className="flex-shrink-0" />
                  </button>
                </ActionBar>
              </div>
            )}

            {/* STEP 2: Basic Info & Pricing */}
            {step === 2 && (
              <div className="space-y-3.5 sm:space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[15px] sm:text-lg font-bold text-slate-900 leading-tight">
                    Listing Details &amp; Pricing Structure
                  </h2>
                  <p className="text-[11.5px] sm:text-xs text-slate-500 mt-1">
                    Provide clear rates and service specifications so event planners can book with confidence.
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-3.5">
                  <div>
                    <label className={LABEL}>Business or Listing Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={FIELD}
                      placeholder="e.g. Starlight Sound & DJ Services"
                      required
                    />
                  </div>

                  <div>
                    <label className={LABEL}>Catchy Headline / Tagline</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className={FIELD}
                      placeholder="e.g. High-energy DJ sets and premium lighting for luxury events"
                    />
                  </div>

                  {/* Pricing Model & Base Amount in 2-column row on mobile */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className={LABEL}>Pricing Model *</label>
                      <select
                        value={pricingType}
                        onChange={(e: any) => setPricingType(e.target.value)}
                        className={FIELD}
                      >
                        <option value="starting_at">Starting From</option>
                        <option value="fixed">Fixed Flat Rate</option>
                        <option value="hourly">Hourly Rate</option>
                        <option value="custom_quote">Custom Quote Only</option>
                      </select>
                    </div>

                    <div>
                      <label className={LABEL}>Base Amount *</label>
                      <input
                        type="number"
                        min={0}
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : '')}
                        className={FIELD}
                        placeholder="250"
                      />
                    </div>

                    <div className="xs:col-span-2 sm:col-span-1">
                      <label className={LABEL}>Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className={FIELD}
                      >
                        <option value="USD">USD ($)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
                    <div>
                      <label className={LABEL}>Location / Base City *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className={`${FIELD} pr-9`}
                          placeholder="e.g. Lagos, Nigeria / Atlanta, GA"
                          required
                        />
                        <MapPin size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className={LABEL}>Radius (km)</label>
                      <input
                        type="number"
                        min={1}
                        value={serviceRadiusKm}
                        onChange={(e) => setServiceRadiusKm(Number(e.target.value) || 50)}
                        className={FIELD}
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Detailed Bio &amp; Offerings</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base sm:text-sm placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7A1F1F]/10 focus:border-[#7A1F1F]/60 resize-none transition-all"
                      placeholder="Describe your equipment, background experience, package tiers..."
                    />
                  </div>
                </div>

                <ActionBar>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 sm:h-11 px-4 sm:px-5 rounded-xl border border-slate-200 text-slate-700 text-[14px] sm:text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-[0.98] transition-transform"
                  >
                    <ChevronLeft size={15} className="flex-shrink-0" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!title.trim()) return;
                      setStep(3);
                    }}
                    disabled={!title.trim()}
                    className="flex-1 h-12 sm:h-11 px-5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-[14px] sm:text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    <span className="truncate">Continue to Media & Contact</span>
                    <ChevronRight size={15} className="flex-shrink-0" />
                  </button>
                </ActionBar>
              </div>
            )}

            {/* STEP 3: Media, Amenities & Contact with Image Picker */}
            {step === 3 && (
              <div className="space-y-3.5 sm:space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-[15px] sm:text-lg font-bold text-slate-900 leading-tight">
                    Media, Amenities &amp; Direct Contact
                  </h2>
                  <p className="text-[11.5px] sm:text-xs text-slate-500 mt-1">
                    Upload your service photos and provide direct contact channels.
                  </p>
                </div>

                <div className="space-y-3.5 sm:space-y-4">
                  {/* IMAGE PICKER COMPONENT */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-[#7A1F1F]" />
                        <span>Cover Photo</span>
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        High Quality 16:9 Recommended
                      </span>
                    </div>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Active Selected Cover Preview */}
                    {coverImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-[16/9] group bg-slate-900 shadow-xs">
                        <img
                          src={coverImage}
                          alt="Cover Preview"
                          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-1"
                          >
                            <Upload size={12} />
                            <span>Change</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setCoverImage('')}
                            className="p-1.5 bg-red-600 text-white rounded-xl shadow-sm hover:bg-red-700"
                            title="Remove Photo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-bold">
                            ✓ Custom Cover Selected
                          </span>
                          <button
                            type="button"
                            onClick={() => setCoverImage('')}
                            className="pointer-events-auto px-2 py-0.5 rounded-md bg-white/90 text-slate-800 text-[10px] font-bold hover:bg-white sm:hidden"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Image Source Options Tabs */
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => setImagePickerTab('upload')}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              imagePickerTab === 'upload'
                                ? 'bg-[#7A1F1F] text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Upload size={12} />
                            <span>Upload Image</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setImagePickerTab('presets')}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              imagePickerTab === 'presets'
                                ? 'bg-[#7A1F1F] text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Grid size={12} />
                            <span>Curated Presets</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setImagePickerTab('url')}
                            className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                              imagePickerTab === 'url'
                                ? 'bg-[#7A1F1F] text-white shadow-2xs'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Link2 size={12} />
                            <span>Image URL</span>
                          </button>
                        </div>

                        {/* Tab 1: Upload Dropzone */}
                        {imagePickerTab === 'upload' && (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-200 hover:border-[#7A1F1F]/60 bg-white hover:bg-[#FAF0E8]/20 rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="animate-spin text-[#7A1F1F]" size={22} />
                                <span className="text-xs font-bold text-[#7A1F1F]">Uploading image...</span>
                              </>
                            ) : (
                              <>
                                <div className="w-9 h-9 rounded-xl bg-[#FAF0E8] border border-[#7A1F1F]/20 flex items-center justify-center text-[#7A1F1F]">
                                  <Camera size={16} />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-800 block">
                                    Tap to choose photo from device
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Supports JPG, PNG, WEBP up to 5MB
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Tab 2: Curated Presets Gallery */}
                        {imagePickerTab === 'presets' && (
                          <div className="space-y-1.5">
                            <p className="text-[10.5px] text-slate-500 font-medium">
                              Select from high-resolution {activeCatInfo?.name || 'Service'} photos:
                            </p>
                            <div className="grid grid-cols-3 gap-1.5">
                              {currentPresets.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setCoverImage(preset.url)}
                                  className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100 hover:ring-2 hover:ring-[#7A1F1F] transition-all text-left"
                                >
                                  <img
                                    src={preset.url}
                                    alt={preset.label}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1">
                                    <span className="text-[9px] font-bold text-white leading-tight line-clamp-1">
                                      {preset.label}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tab 3: Direct URL */}
                        {imagePickerTab === 'url' && (
                          <div className="space-y-1">
                            <div className="relative">
                              <input
                                type="url"
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                inputMode="url"
                                autoCapitalize="none"
                                autoCorrect="off"
                                className={`${FIELD} pr-10`}
                                placeholder="https://images.unsplash.com/..."
                              />
                              <ImageIcon size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Paste any direct web link to a high-resolution photo.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Highlights & Amenities Tags */}
                  <div>
                    <label className={LABEL}>Highlights &amp; Amenities Tags</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={amenityInput}
                        onChange={(e) => setAmenityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddAmenity();
                          }
                        }}
                        className={`${FIELD} flex-1 min-w-0`}
                        placeholder="e.g. Wireless Microphones"
                      />
                      <button
                        type="button"
                        onClick={handleAddAmenity}
                        className="h-12 sm:h-11 px-4 bg-slate-900 text-white rounded-xl text-[14px] sm:text-xs font-bold hover:bg-slate-800 flex-shrink-0 active:scale-[0.98] transition-transform"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-[#FAF0E8] text-[#7A1F1F] text-[11px] font-semibold rounded-full border border-[#7A1F1F]/20"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(idx)}
                            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#7A1F1F]/10 hover:text-red-600 transition-colors"
                            aria-label={`Remove ${item}`}
                          >
                            <X size={11} strokeWidth={3} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Contact fields: Phone / WhatsApp, Website, Instagram (all optional, Email removed) */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Contact &amp; Social Profiles
                      </h3>
                      <span className="text-[10px] text-slate-400 font-medium">Optional</span>
                    </div>
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className={LABEL}>Phone / WhatsApp (Optional)</label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          inputMode="tel"
                          className={FIELD}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div>
                        <label className={LABEL}>Website (Optional)</label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          inputMode="url"
                          autoCapitalize="none"
                          autoCorrect="off"
                          className={FIELD}
                          placeholder="https://brand.com"
                        />
                      </div>

                      <div className="xs:col-span-2 sm:col-span-1">
                        <label className={LABEL}>Instagram (Optional)</label>
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          autoCapitalize="none"
                          autoCorrect="off"
                          className={FIELD}
                          placeholder="@handle"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <ActionBar>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="h-12 sm:h-11 px-4 sm:px-5 rounded-xl border border-slate-200 text-slate-700 text-[14px] sm:text-xs font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5 flex-shrink-0 active:scale-[0.98] transition-transform"
                  >
                    <ChevronLeft size={15} className="flex-shrink-0" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !title.trim()}
                    className="flex-1 h-12 sm:h-11 px-6 bg-[#7A1F1F] hover:bg-[#661919] text-white text-[14px] sm:text-xs font-bold rounded-xl shadow-lg shadow-[#7A1F1F]/25 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-[0.98]"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin flex-shrink-0" />
                        <span>Publishing...</span>
                      </>
                    ) : (
                      <>
                        <Check size={15} strokeWidth={3} className="flex-shrink-0" />
                        <span>Publish Listing</span>
                      </>
                    )}
                  </button>
                </ActionBar>
              </div>
            )}

            {/* Mobile preview toggle button */}
            <div className="lg:hidden pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setShowMobilePreview(!showMobilePreview)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-slate-50"
              >
                <Eye size={12} />
                <span>{showMobilePreview ? 'Hide Live Preview' : 'Show Live Preview'}</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview Card (Visible on desktop, collapsible on mobile) */}
          <div className={`${showMobilePreview ? 'block' : 'hidden'} lg:block lg:col-span-5 xl:col-span-4 sticky top-6 space-y-2 sm:space-y-4`}>
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Eye size={11} />
                <span>Live Marketplace Preview</span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Instant Publish
              </span>
            </div>

            {/* Mock Listing Card */}
            <div className="bg-white rounded-xl sm:rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs">
              {/* Card Cover */}
              <div className="h-28 sm:h-44 relative overflow-hidden bg-slate-100">
                <img
                  src={activeCover}
                  alt="Listing Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-2 left-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[#7A1F1F] text-[9px] font-extrabold uppercase tracking-wide shadow-2xs">
                    {activeCatInfo?.name || category}
                  </span>
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <span className="text-xs sm:text-lg font-bold block leading-tight truncate">
                    {title.trim() || 'Your Listing Title'}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/80 line-clamp-1">
                    {location || 'Location Not Specified'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3 sm:p-5 space-y-2 sm:space-y-4">
                <p className="text-[10.5px] sm:text-xs text-slate-600 line-clamp-2">
                  {tagline.trim() || description.trim() || 'Your service tagline and description will appear here.'}
                </p>

                {/* Highlights tags */}
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {amenities.slice(0, 3).map((a, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] font-semibold"
                      >
                        ✓ {a}
                      </span>
                    ))}
                    {amenities.length > 3 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[9px]">
                        +{amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[8.5px] text-slate-400 font-medium block">
                      {pricingType === 'starting_at'
                        ? 'Starting from'
                        : pricingType === 'hourly'
                        ? 'Hourly rate'
                        : pricingType === 'fixed'
                        ? 'Fixed package'
                        : 'Custom quote'}
                    </span>
                    <span className="text-xs sm:text-base font-black text-slate-900">
                      {basePrice !== '' ? formatCurrency(Number(basePrice), currency) : 'Custom Quote'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="px-2.5 py-1 rounded-lg bg-[#FAF0E8] text-[#7A1F1F] text-[10px] font-bold opacity-80"
                  >
                    Request Booking
                  </button>
                </div>
              </div>
            </div>

            {/* Help / Tip Card */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-xl p-2.5 text-xs text-amber-900/80 space-y-0.5">
              <div className="flex items-center gap-1 font-bold text-amber-950">
                <Sparkles size={11} className="text-[#D4A24C]" />
                <span className="text-[11px]">Pro Tip for Vendors</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Listings with clear rates, 3+ amenities tags, and an active WhatsApp/Phone number receive over 3× more booking inquiries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
