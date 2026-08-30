import React, { useState } from 'react';
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
} from 'lucide-react';
import { useCreateVendorListing, useVendorCategories } from '../hooks/useVendorListings';
import { useLocale } from '../hooks/useLocale';
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
  const [coverImage, setCoverImage] = useState('');
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

  return (
    <>
      <SEO
        title="Setup Vendor Listing — EventJelly"
        description="List your DJ, Catering, Decor, Photography, or Event services on EventJelly Marketplace"
      />

      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-4 sm:p-8 space-y-6 max-w-6xl mx-auto">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/vendor/listings"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors group"
          >
            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-300 shadow-2xs">
              <ArrowLeft size={14} />
            </div>
            <span>Back to Vendor Hub</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#FAF0E8] text-[#7A1F1F] text-[11px] font-bold">
              Step {step} of 3
            </span>
          </div>
        </div>

        {/* Header Title Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />
          <div className="max-w-2xl">
            <h1
              className="text-2xl sm:text-3xl font-black text-slate-900"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Setup Your Vendor Listing
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Showcase your event services to organizers, brides, and corporate clients looking to book trusted talent directly.
            </p>
          </div>

          {/* Stepper Header Pills */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
            {[
              { num: 1, title: '1. Select Category', desc: 'Choose your specialty' },
              { num: 2, title: '2. Details & Pricing', desc: 'Rates, bio & travel' },
              { num: 3, title: '3. Media & Contact', desc: 'Photos, features & info' },
            ].map((s) => {
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
                  className={`text-left p-3 rounded-2xl transition-all border ${
                    isCurrent
                      ? 'bg-[#FAF0E8] border-[#7A1F1F] ring-2 ring-[#7A1F1F]/20'
                      : isDone
                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                      : 'bg-slate-50/60 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-[#7A1F1F]'
                          : isDone
                          ? 'text-emerald-700'
                          : 'text-slate-500'
                      }`}
                    >
                      {s.title}
                    </span>
                    {isDone && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 hidden sm:block">
                    {s.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content & Live Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Area (7-8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            {/* STEP 1: Category Selection */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    What type of service are you offering?
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select the category that best describes your business. You can add more listings in other categories anytime.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat.id] || Store;
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all relative ${
                          isSelected
                            ? 'border-[#7A1F1F] bg-[#FAF0E8] ring-2 ring-[#7A1F1F]/20 shadow-xs scale-[1.01]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              isSelected
                                ? 'bg-[#7A1F1F] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Icon size={20} />
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#7A1F1F] text-white flex items-center justify-center shadow-xs">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-sm font-bold text-slate-900 block mb-0.5">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                            {cat.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 flex items-center gap-2 transition-all active:scale-98"
                  >
                    <span>Continue to Details & Pricing</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Basic Info & Pricing */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Listing Details & Pricing Structure
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Provide clear rates and service specifications so event planners can book or send inquiries with confidence.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Business or Listing Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                      placeholder="e.g. Starlight Sound & DJ Services"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Catchy Headline / Tagline
                    </label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                      placeholder="e.g. High-energy DJ sets and premium lighting for luxury events"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                        Pricing Model *
                      </label>
                      <select
                        value={pricingType}
                        onChange={(e: any) => setPricingType(e.target.value)}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                      >
                        <option value="starting_at">Starting From</option>
                        <option value="fixed">Fixed Flat Rate</option>
                        <option value="hourly">Hourly Rate</option>
                        <option value="custom_quote">Custom Quote Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                        Base Amount *
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                        placeholder="250"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                        Currency
                      </label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                        Location / Base City *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                          placeholder="e.g. Lagos, Nigeria / Atlanta, GA"
                          required
                        />
                        <MapPin size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                        Travel / Service Radius (km)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={serviceRadiusKm}
                        onChange={(e) => setServiceRadiusKm(Number(e.target.value) || 50)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white"
                        placeholder="50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Detailed Bio & Offerings
                    </label>
                    <textarea
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 resize-none"
                      placeholder="Describe your equipment, background experience, standard performance duration, package tiers, setup requirements..."
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="py-3 px-5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!title.trim()) return;
                      setStep(3);
                    }}
                    disabled={!title.trim()}
                    className="px-6 py-3 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 flex items-center gap-2 transition-all disabled:opacity-50 active:scale-98"
                  >
                    <span>Continue to Media & Contact</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Media, Features & Contact */}
            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Media, Amenities & Direct Contact
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add photos and contact channels so event planners can verify your portfolio and book your services.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Cover Photo Image URL
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white"
                        placeholder="https://images.unsplash.com/..."
                      />
                      <ImageIcon size={16} className="absolute right-3.5 top-3.5 text-slate-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Leave empty to automatically use our high-resolution curated cover for your category.
                    </p>
                  </div>

                  {/* Amenities Tags */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                      Key Highlights & Amenities Tags
                    </label>
                    <div className="flex gap-2 mb-2.5">
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
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        placeholder="e.g. Wireless Microphones, Backup Generator, Free Consultation..."
                      />
                      <button
                        type="button"
                        onClick={handleAddAmenity}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
                      >
                        Add Tag
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {amenities.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF0E8] text-[#7A1F1F] text-xs font-semibold rounded-full border border-[#7A1F1F]/20 shadow-2xs"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(idx)}
                            className="hover:text-red-600 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Direct Contact Channels */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Direct Contact & Social Profiles
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Bookings Email
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          placeholder="bookings@mybrand.com"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Phone / WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          placeholder="https://mybrand.com"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Instagram Handle
                        </label>
                        <input
                          type="text"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          placeholder="@myvendorhandle"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="py-3 px-5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !title.trim()}
                    className="px-8 py-3.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#7A1F1F]/25 flex items-center gap-2 transition-all disabled:opacity-50 active:scale-98"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Publishing Listing...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Publish Vendor Listing</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Card (4-5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={13} />
                <span>Live Marketplace Preview</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                Instant Publish
              </span>
            </div>

            {/* Mock Listing Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-md">
              {/* Card Cover */}
              <div className="h-44 relative overflow-hidden bg-slate-100">
                <img
                  src={activeCover}
                  alt="Listing Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[#7A1F1F] text-[10px] font-extrabold uppercase tracking-wide shadow-xs">
                    {activeCatInfo?.name || category}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-lg font-bold block leading-tight truncate">
                    {title.trim() || 'Your Listing Title'}
                  </span>
                  <span className="text-xs text-white/80 line-clamp-1">
                    {location || 'Location Not Specified'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-600 line-clamp-2">
                  {tagline.trim() || description.trim() || 'Your service tagline and description will appear here on EventJelly marketplace.'}
                </p>

                {/* Highlights tags */}
                {amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {amenities.slice(0, 3).map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold"
                      >
                        ✓ {a}
                      </span>
                    ))}
                    {amenities.length > 3 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px]">
                        +{amenities.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {pricingType === 'starting_at'
                        ? 'Starting from'
                        : pricingType === 'hourly'
                        ? 'Hourly rate'
                        : pricingType === 'fixed'
                        ? 'Fixed package'
                        : 'Custom quote'}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      {basePrice !== '' ? formatCurrency(Number(basePrice), currency) : 'Custom Quote'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="px-3.5 py-1.5 rounded-xl bg-[#FAF0E8] text-[#7A1F1F] text-xs font-bold opacity-80"
                  >
                    Request Booking
                  </button>
                </div>
              </div>
            </div>

            {/* Help / Tip Card */}
            <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4 text-xs text-amber-900/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                <Sparkles size={14} className="text-[#D4A24C]" />
                <span>Pro Tip for Vendors</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Listings with clear rates, 3+ amenities tags, and an active WhatsApp/Phone number receive over 3× more booking inquiries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
