import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Plus,
  Sparkles,
  Check,
  Building2,
  DollarSign,
  MapPin,
  Clock,
  Users,
  Loader2,
  CalendarCheck,
  ShieldCheck,
  AlertCircle,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useEvents, useCreateEvent } from '../../hooks/useEvents';
import { useCreateVendor } from '../../hooks/useVendors';
import { useLocale } from '../../hooks/useLocale';
import { formatCurrency, SUPPORTED_CURRENCIES, getCurrencySymbol } from '../../utils/formatters';
import DatePicker from '../DatePicker';
import type { VendorListing, Event } from '../../types';
import { toast } from 'sonner';

interface BookVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: VendorListing;
  initialEventId?: string;
  onSuccess?: (eventId: string) => void;
}

const EVENT_TYPE_OPTIONS: { value: NonNullable<Event['type']>; label: string; icon: string }[] = [
  { value: 'wedding', label: 'Wedding', icon: '💍' },
  { value: 'conference', label: 'Conference', icon: '💼' },
  { value: 'gala', label: 'Gala / Dinner', icon: '✨' },
  { value: 'concert', label: 'Concert', icon: '🎵' },
  { value: 'festival', label: 'Festival', icon: '🎪' },
  { value: 'fundraiser', label: 'Fundraiser', icon: '🤝' },
  { value: 'corporate', label: 'Corporate Event', icon: '🏢' },
  { value: 'other', label: 'Other Event', icon: '🎉' },
];

export default function BookVendorModal({
  isOpen,
  onClose,
  listing,
  initialEventId,
  onSuccess,
}: BookVendorModalProps) {
  const navigate = useNavigate();
  const { localCurrency } = useLocale();
  const { data: events = [], isLoading: isLoadingEvents } = useEvents();
  const createEvent = useCreateEvent();
  const createVendor = useCreateVendor();

  const [bookingMode, setBookingMode] = useState<'existing' | 'new'>(
    events.length > 0 ? 'existing' : 'new'
  );

  // Existing Event form state
  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialEventId || events[0]?._id || ''
  );
  const [contractValue, setContractValue] = useState<number>(listing.base_price || 0);
  const [notes, setNotes] = useState('');

  // New Event form state - strictly default to logged-in user currency
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventVenue, setNewEventVenue] = useState('');
  const [newEventType, setNewEventType] = useState<NonNullable<Event['type']>>('wedding');
  const [newEventCurrency, setNewEventCurrency] = useState(localCurrency || 'USD');
  const [newEventGuestCount, setNewEventGuestCount] = useState<number>(100);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (localCurrency) {
      setNewEventCurrency(localCurrency);
    }
  }, [localCurrency]);

  if (!isOpen) return null;

  const selectedEventObj = events.find((ev) => ev._id === selectedEventId);
  const activeCurrency = bookingMode === 'existing'
    ? (selectedEventObj?.currency || localCurrency || 'USD')
    : (newEventCurrency || localCurrency || 'USD');

  const mapCategory = (rawCategory: string) => {
    const c = (rawCategory || '').toLowerCase();
    if (c === 'caterer' || c === 'catering') return 'catering';
    if (c === 'decorator' || c === 'decor') return 'decor';
    if (c === 'photographer' || c === 'photography' || c === 'videographer') return 'photography';
    if (c === 'dj' || c === 'music' || c === 'entertainment') return 'music';
    if (c === 'security') return 'security';
    if (c === 'equipment_rental' || c === 'av' || c === 'venue') return 'av';
    return 'other';
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let targetEventId = selectedEventId;

      if (bookingMode === 'new') {
        if (!newEventName.trim()) {
          toast.error('Please enter an event name');
          setIsSubmitting(false);
          return;
        }

        // 1. Create the new event using logged-in user's currency
        const createdEvent = await createEvent.mutateAsync({
          name: newEventName.trim(),
          date: newEventDate || new Date().toISOString().split('T')[0],
          venue: newEventVenue.trim() || 'Venue TBD',
          type: newEventType,
          currency: newEventCurrency || localCurrency,
          guestCount: newEventGuestCount,
          status: 'planning',
        });

        targetEventId = createdEvent._id;
      }

      if (!targetEventId) {
        toast.error('Please select or create an event to assign this vendor');
        setIsSubmitting(false);
        return;
      }

      // 2. Attach and confirm the vendor to the target event
      await createVendor.mutateAsync({
        name: listing.title,
        category: mapCategory(listing.category) as any,
        contactName: listing.title,
        phone: listing.contact_phone || '',
        contractValue: Number(contractValue) || 0,
        notes: notes.trim() || `Booked directly from Marketplace. Tagline: ${listing.tagline || ''}`,
        eventId: targetEventId,
        status: 'confirmed',
      });

      toast.success(`${listing.title} has been successfully booked!`);
      if (onSuccess) onSuccess(targetEventId);
      onClose();
      navigate(`/events/${targetEventId}/vendors`);
    } catch (err: any) {
      console.error('Booking failed:', err);
      toast.error(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 pb-3 sm:pb-3.5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-b from-slate-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-2xs">
              <img
                src={listing.cover_image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80'}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-[9.5px] sm:text-[10px] font-bold text-[#7A1F1F] uppercase tracking-wider block">
                Book Service
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {listing.title}
              </h2>
              <p className="text-[10.5px] sm:text-xs text-slate-500 mt-0.5">
                {listing.pricing_type === 'starting_at' ? 'Starting from ' : ''}
                <span className="font-extrabold text-slate-800">
                  {formatCurrency(listing.base_price, activeCurrency)}
                </span>
                <span className="text-slate-400 font-normal"> / {listing.pricing_type?.replace('_', ' ') || 'event'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body & Form */}
        <form onSubmit={handleBooking} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Pathway Selection Tabs */}
          <div>
            <label className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Choose Booking Destination
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBookingMode('existing')}
                disabled={events.length === 0}
                className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  bookingMode === 'existing'
                    ? 'border-[#7A1F1F] bg-[#FAF0E8] ring-1 ring-[#7A1F1F]/20 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 opacity-80'
                } ${events.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    bookingMode === 'existing' ? 'bg-[#7A1F1F] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Calendar size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-900 block truncate">
                    Existing Event
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">
                    {events.length > 0 ? `${events.length} event${events.length > 1 ? 's' : ''} available` : 'No events created'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setBookingMode('new')}
                className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  bookingMode === 'new'
                    ? 'border-[#7A1F1F] bg-[#FAF0E8] ring-1 ring-[#7A1F1F]/20 shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 opacity-80'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    bookingMode === 'new' ? 'bg-[#7A1F1F] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Sparkles size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-900 block truncate">
                    Create New Event
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate">
                    Auto-book vendor
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* PATHWAY 1: ADD TO EXISTING EVENT */}
          {bookingMode === 'existing' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="text-[10.5px] sm:text-xs font-bold text-slate-700 block mb-1">
                  Select Target Event *
                </label>
                <div className="relative">
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full appearance-none px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 font-semibold pr-8"
                    required
                  >
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.name} ({ev.date ? new Date(ev.date).toLocaleDateString() : 'Date TBD'}) {ev.currency ? `[${ev.currency}]` : ''} {ev.venue ? `— ${ev.venue}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {selectedEventObj && (
                <div className="p-2.5 bg-[#FAF0E8] border border-[#7A1F1F]/20 rounded-xl text-[10.5px] text-[#7A1F1F] flex items-center gap-2">
                  <CalendarCheck size={14} className="text-[#7A1F1F] shrink-0" />
                  <span className="truncate">
                    Assigning to <strong>{selectedEventObj.name}</strong> ({selectedEventObj.type || 'Event'})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PATHWAY 2: CREATE NEW EVENT */}
          {bookingMode === 'new' && (
            <div className="space-y-3 animate-in fade-in duration-150 bg-slate-50/60 border border-slate-200/60 rounded-2xl p-3.5 sm:p-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Sparkles size={13} className="text-[#D4A24C]" />
                <span>New Event Details</span>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  placeholder="e.g. Sarah & Ade Wedding Gala 2026"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Event Date
                  </label>
                  <DatePicker
                    value={newEventDate}
                    onChange={setNewEventDate}
                    placeholder="Choose event date"
                  />
                </div>

                <div>
                  <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Event Type
                  </label>
                  <div className="relative">
                    <select
                      value={newEventType}
                      onChange={(e: any) => setNewEventType(e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 pr-8"
                    >
                      {EVENT_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Venue / Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newEventVenue}
                    onChange={(e) => setNewEventVenue(e.target.value)}
                    placeholder="e.g. Grand Ballroom / Virtual"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium pr-8 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  />
                  <MapPin size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          {/* COMMON CONTRACT DETAILS */}
          <div className="space-y-3 pt-1 border-t border-slate-100">


            <div>
              <label className="text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                Deliverables / Specific Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 5-hour performance, 2 wireless microphones, sound check by 3 PM..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 resize-none"
              />
            </div>
          </div>

          {/* Policy assurance */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60 text-[10px] text-slate-500 space-y-1">
            <p className="flex items-center gap-1.5">
              <ShieldCheck size={12} className="text-emerald-600 shrink-0" />
              <span>Direct contractor assignment to event vendor lineup</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Check size={12} className="text-emerald-600 shrink-0" />
              <span>Track milestones, payments, and deliverables in Event Suite</span>
            </p>
          </div>

          {/* Modal Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 transition-all flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Processing Booking...</span>
                </>
              ) : (
                <>
                  <CalendarCheck size={13} />
                  <span>
                    {bookingMode === 'new' ? 'Create Event & Book Vendor' : 'Confirm & Book Vendor'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
