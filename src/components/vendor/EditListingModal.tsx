import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
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
  Store,
} from 'lucide-react';
import { useUpdateVendorListing, useVendorCategories } from '../../hooks/useVendorListings';
import { useLocale } from '../../hooks/useLocale';
import { uploadApi } from '../../lib/api';
import type { VendorListing, VendorCategoryType } from '../../types';

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: VendorListing;
  onSuccess?: () => void;
}

export default function EditListingModal({
  isOpen,
  onClose,
  listing,
  onSuccess,
}: EditListingModalProps) {
  const { localCurrency } = useLocale();
  const [category, setCategory] = useState<VendorCategoryType>(listing.category);
  const [title, setTitle] = useState(listing.title);
  const [tagline, setTagline] = useState(listing.tagline || '');
  const [description, setDescription] = useState(listing.description || '');
  const [pricingType, setPricingType] = useState(listing.pricing_type || 'starting_at');
  const [basePrice, setBasePrice] = useState<number | ''>(listing.base_price || 0);
  const [currency, setCurrency] = useState(listing.currency || localCurrency);
  const [location, setLocation] = useState(listing.location || '');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(listing.service_radius_km || 50);
  const [coverImage, setCoverImage] = useState(listing.cover_image || '');
  const [uploading, setUploading] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  const [amenities, setAmenities] = useState<string[]>(listing.amenities || []);
  const [status, setStatus] = useState<'published' | 'draft' | 'paused'>(listing.status || 'published');
  const [contactEmail, setContactEmail] = useState(listing.contact_email || '');
  const [contactPhone, setContactPhone] = useState(listing.contact_phone || '');
  const [website, setWebsite] = useState(listing.website || '');
  const [instagram, setInstagram] = useState(listing.instagram || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useVendorCategories();
  const updateMutation = useUpdateVendorListing();

  useEffect(() => {
    setCategory(listing.category);
    setTitle(listing.title);
    setTagline(listing.tagline || '');
    setDescription(listing.description || '');
    setPricingType(listing.pricing_type || 'starting_at');
    setBasePrice(listing.base_price || 0);
    setCurrency(listing.currency || localCurrency);
    setLocation(listing.location || '');
    setServiceRadiusKm(listing.service_radius_km || 50);
    setCoverImage(listing.cover_image || '');
    setAmenities(listing.amenities || []);
    setStatus(listing.status || 'published');
    setContactEmail(listing.contact_email || '');
    setContactPhone(listing.contact_phone || '');
    setWebsite(listing.website || '');
    setInstagram(listing.instagram || '');
  }, [listing]);

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
    await updateMutation.mutateAsync({
      id: listing._id,
      data: {
        category,
        title,
        tagline,
        description,
        pricing_type: pricingType as any,
        base_price: Number(basePrice) || 0,
        currency,
        location,
        service_radius_km: serviceRadiusKm,
        cover_image: coverImage,
        amenities,
        status,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        website,
        instagram,
      },
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
              Edit Service
            </span>
            <h2 className="text-xl font-bold text-slate-900">{listing.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Status *
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              >
                <option value="published">Published (Visible to Clients)</option>
                <option value="draft">Draft (Hidden)</option>
                <option value="paused">Paused (Temporarily Unavailable)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-semibold focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Pricing Model
              </label>
              <select
                value={pricingType}
                onChange={(e: any) => setPricingType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              >
                <option value="starting_at">Starting From</option>
                <option value="fixed">Fixed Flat Rate</option>
                <option value="hourly">Hourly Rate</option>
                <option value="custom_quote">Custom Quote</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Base Price
              </label>
              <input
                type="number"
                min={0}
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold focus:bg-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white"
              >
                <option value="USD">USD ($)</option>
                <option value="NGN">NGN (₦)</option>
                <option value="CAD">CAD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Location / Base City
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                placeholder="e.g. Lagos, Nigeria / New York, NY"
              />
              <MapPin size={14} className="absolute right-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Cover Photo Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Cover Photo (Image File)
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
                className="border-2 border-dashed border-slate-200 hover:border-[#7A1F1F]/60 bg-slate-50/70 hover:bg-[#FAF0E8]/20 rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5"
              >
                {uploading ? (
                  <>
                    <Loader2 className="animate-spin text-[#7A1F1F]" size={22} />
                    <span className="text-xs font-bold text-[#7A1F1F]">Uploading image file...</span>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#7A1F1F]">
                      <Upload size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Click to upload image file
                      </span>
                      <span className="text-[10px] text-slate-400">
                        or drag and drop your photo here
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Features & Amenities
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
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                placeholder="Add feature..."
              />
              <button
                type="button"
                onClick={handleAddAmenity}
                className="px-3.5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
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

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending || !title.trim()}
              className="py-2.5 px-5 rounded-xl bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
