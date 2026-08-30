import React, { useState, useRef } from 'react';
import {
  X,
  Store,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  MapPin,
  Sparkles,
  Image,
  Upload,
  Tag,
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
} from 'lucide-react';
import { useCreateVendorListing, useVendorCategories } from '../../hooks/useVendorListings';
import { useLocale } from '../../hooks/useLocale';
import { uploadApi } from '../../lib/api';
import type { VendorCategoryType } from '../../types';

interface CreateListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

export default function CreateListingModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateListingModalProps) {
  const { localCurrency } = useLocale();
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
  const [uploading, setUploading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>(['Professional Equipment', 'Licensed & Insured']);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [depositPercentage, setDepositPercentage] = useState<number>(20);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useVendorCategories();
  const createMutation = useCreateVendorListing();

  if (!isOpen) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      category,
      title,
      tagline,
      description,
      pricing_type: pricingType,
      base_price: Number(basePrice) || 0,
      currency,
      location,
      service_radius_km: serviceRadiusKm,
      cover_image: coverImage || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80',
      amenities,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      website,
      instagram,
      deposit_percentage: depositPercentage,
      status: 'published',
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-[#7A1F1F] uppercase tracking-wider block">
              Step {step} of 3
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {step === 1
                ? 'Select Service Category'
                : step === 2
                ? 'Listing Details & Pricing'
                : 'Features, Media & Contact'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto pr-1 flex-1 space-y-5">
          {/* STEP 1: Category Picker */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Choose the service category that best matches this listing. You can create multiple listings across different categories anytime.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.id] || Store;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col gap-2 transition-all relative ${
                        isSelected
                          ? 'border-[#7A1F1F] bg-[#FAF0E8] ring-2 ring-[#7A1F1F]/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-[#7A1F1F] text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          {cat.name}
                        </span>
                        <span className="text-[10px] text-slate-500 line-clamp-1 leading-tight">
                          {cat.desc}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#7A1F1F] text-white flex items-center justify-center">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Basic Info & Pricing */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Listing Title *
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
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Short Tagline
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
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Pricing Model *
                  </label>
                  <select
                    value={pricingType}
                    onChange={(e: any) => setPricingType(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  >
                    <option value="starting_at">Starting From</option>
                    <option value="fixed">Fixed Flat Rate</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="custom_quote">Custom Quote Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Base Price *
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
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold focus:bg-white"
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
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Location / Base City *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                      placeholder="e.g. Lagos, Nigeria / New York, NY"
                      required
                    />
                    <MapPin size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Service Travel Radius (km)
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
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Detailed Bio & Offerings
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 resize-none"
                  placeholder="Describe your equipment, background experience, standard performance duration, package options..."
                />
              </div>
            </div>
          )}

          {/* STEP 3: Media, Amenities & Contact */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Cover Photo Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Cover Photo (Image File) *
                  </label>
                  <span className="text-[10px] text-slate-400">PNG, JPG, WEBP up to 5MB</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                {coverImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/9] group">
                    <img
                      src={coverImage}
                      alt="Cover Preview"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-slate-900 text-xs font-bold rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        Change Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="p-1.5 bg-red-600 text-white rounded-xl shadow-sm hover:bg-red-700 transition-colors"
                        title="Remove Photo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 hover:border-[#7A1F1F]/60 bg-slate-50/70 hover:bg-[#FAF0E8]/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="animate-spin text-[#7A1F1F]" size={24} />
                        <span className="text-xs font-bold text-[#7A1F1F]">Uploading image file...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#7A1F1F]">
                          <Upload size={18} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            Click to upload image file
                          </span>
                          <span className="text-[11px] text-slate-400">
                            or drag and drop your photo here
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Amenities / Feature Tags */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Key Features & Amenities
                </label>
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
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    placeholder="e.g. Wireless Mics, Smoke Machine, 4K Video..."
                  />
                  <button
                    type="button"
                    onClick={handleAddAmenity}
                    className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF0E8] text-[#7A1F1F] text-xs font-semibold rounded-full border border-[#7A1F1F]/20"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(idx)}
                        className="hover:text-red-600"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    placeholder="bookings@vendor.com"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Contact Phone / WhatsApp
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
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Website URL
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
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
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
          )}
        </div>

        {/* Footer Navigation */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1 && !category) return;
                if (step === 2 && !title.trim()) return;
                setStep((s) => (s + 1) as any);
              }}
              disabled={step === 2 && !title.trim()}
              className="py-3 px-6 rounded-xl bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold shadow-md shadow-[#7A1F1F]/20 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-98"
            >
              <span>Next Step</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createMutation.isPending || !title.trim()}
              className="py-3 px-6 rounded-xl bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold shadow-md shadow-[#7A1F1F]/20 flex items-center gap-2 transition-all disabled:opacity-50 active:scale-98"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Publish Vendor Listing</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
