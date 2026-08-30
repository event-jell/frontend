import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import {
  Sparkles, Heart, Presentation, PartyPopper, Music, Tent, HandHeart, Briefcase,
  MoreHorizontal, Calendar, MapPin, Users, ArrowRight, ArrowLeft, Check, Upload,
  Loader2, Zap, Rocket, Star, Compass, Layers, CheckCircle2, ShieldCheck, Coins, ChevronDown
} from 'lucide-react';
import { useCreateEvent } from '../hooks/useEvents';
import { useAuth } from '../contexts/AuthContext';
import { uploadApi } from '../lib/api';
import Logo from '../components/Logo';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import { SUPPORTED_CURRENCIES, getCurrencyForCountry } from '../utils/formatters';
import type { Event } from '../types';

const R = '#7A1F1F';
const RD = '#3D0F0F';
const G = '#D4A24C';

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding & Reception', icon: Heart, desc: 'Seating plans, RSVPs & romantic layouts' },
  { value: 'gala', label: 'Gala & Award Night', icon: PartyPopper, desc: 'VIP banquet tables & stage design' },
  { value: 'conference', label: 'Conference & Summit', icon: Presentation, desc: 'Auditorium seating & exhibitor booths' },
  { value: 'concert', label: 'Concert & Live Show', icon: Music, desc: 'Stage zoning, standing areas & ticketing' },
  { value: 'festival', label: 'Festival & Outdoor', icon: Tent, desc: 'Multi-stage grounds & food vendor maps' },
  { value: 'corporate', label: 'Corporate Event', icon: Briefcase, desc: 'Executive meetings, seminars & launches' },
  { value: 'fundraiser', label: 'Charity & Fundraiser', icon: HandHeart, desc: 'Donation tracking & donor seating' },
  { value: 'other', label: 'Other Special Event', icon: MoreHorizontal, desc: 'Custom layout & guest management' },
] as const;

const PRESET_BANNERS = [
  { id: 'luxe-gold', name: 'Luxe Gold & Wine', url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80' },
  { id: 'rose-wedding', name: 'Rose & Champagne', url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80' },
  { id: 'emerald-night', name: 'Emerald Gala Night', url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80' },
  { id: 'neon-concert', name: 'Neon Live Festival', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80' },
  { id: 'modern-corporate', name: 'Executive Modern', url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80' },
];

export default function EventOnboardingPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState({
    name: '',
    type: 'wedding' as NonNullable<Event['type']>,
    currency: getCurrencyForCountry(user?.country),
    venue: '',
    date: '',
    startTime: '18:00',
    endTime: '23:00',
    isVirtual: false,
    virtualLink: '',
    guestCount: 150,
    coverImage: PRESET_BANNERS[0].url,
  });

  const [uploading, setUploading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      setForm(f => ({ ...f, coverImage: res.url }));
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleLaunch = () => {
    if (!form.name.trim()) return;
    setStep(4);
    setIsLaunching(true);

    // Simulate animated setup steps
    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      setLaunchProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        // Create event
        createEvent.mutate(
          {
            name: form.name.trim(),
            type: form.type,
            venue: form.isVirtual ? 'Virtual Event' : form.venue,
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            coverImage: form.coverImage,
            guestCount: form.guestCount,
            status: 'planning',
          },
          {
            onSuccess: (created) => {
              setTimeout(() => {
                navigate(`/events/${created._id}/planner`, { replace: true });
              }, 400);
            },
          }
        );
      }
    }, 400);
  };

  const selectedTypeObj = EVENT_TYPES.find(t => t.value === form.type) || EVENT_TYPES[0];
  const TypeIcon = selectedTypeObj.icon;

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-x-hidden" style={{ background: '#FAF7F2', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEO title="Set Up Your First Event" />

      {/* Top Header */}
      <header className="px-4 py-3 sm:px-6 sm:py-5 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between h-[64px] sm:h-auto">
        <div className="flex items-center gap-2.5">
          <Logo size={28} className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px]" />
          <span className="text-[17px] sm:text-lg font-extrabold text-slate-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            EventJelly
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FAF0E8] text-[#7A1F1F] border border-[#7A1F1F]/20">
            <Sparkles size={12} /> First Event Onboarding
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className={`flex items-center justify-center w-[26px] h-[26px] sm:w-auto sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all ${
                step === n
                  ? 'bg-[#7A1F1F] text-white shadow-sm'
                  : step > n
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > n ? <Check size={11} strokeWidth={3} /> : n}
              <span className="hidden md:inline ml-1.5">
                {n === 1 ? 'Event Type' : n === 2 ? 'Details & Location' : 'Theme & Banner'}
              </span>
            </div>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-5 sm:px-6 sm:py-12 flex flex-col justify-center">
        {/* Step 1: Event Type & Name */}
        {step === 1 && (
          <div className="space-y-5 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-[10px] py-[7px] sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold mb-3 sm:mb-4 bg-amber-50 text-amber-700 border border-amber-200">
                <Star size={12} className="fill-amber-500 text-amber-500" /> Welcome aboard! Let's build something unforgettable.
              </div>
              <h1 className="text-[24px] leading-[28px] sm:text-3xl sm:leading-[36px] md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2 sm:mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                What event are you planning?
              </h1>
              <p className="text-[13px] sm:text-sm text-slate-500 leading-normal sm:leading-relaxed">
                Select your event style to automatically tailor your floor planner, seating maps, and guest tools.
              </p>
            </div>

            {/* Event Name Input */}
            <div className="w-full max-w-xl mx-auto bg-white p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm h-auto">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Victoria & David's Wedding Gala 2026"
                className="w-full px-3.5 py-2.5 h-[44px] sm:h-[48px] text-[14px] text-slate-900 font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] transition-all"
              />
            </div>

            {/* Event Type Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {EVENT_TYPES.map(({ value, label, icon: Icon, desc }) => {
                const selected = form.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: value as any }))}
                    className={`relative p-3.5 py-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-200 group flex flex-col justify-between h-[125px] sm:h-auto ${
                      selected
                        ? 'bg-white border-[#7A1F1F] shadow-lg sm:-translate-y-1'
                        : 'bg-white/70 border-slate-200/80 hover:border-slate-300 hover:bg-white hover:-translate-y-0.5'
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#7A1F1F] text-white flex items-center justify-center shadow-sm">
                        <Check size={10} strokeWidth={3} className="sm:w-3 sm:h-3" />
                      </span>
                    )}

                    <div>
                      <div
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 transition-transform group-hover:scale-105 ${
                          selected ? 'bg-[#7A1F1F] text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon size={18} className="sm:w-5 sm:h-5" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-[14px] sm:text-sm mb-0.5 leading-snug truncate sm:whitespace-normal">{label}</h3>
                      <p className="text-[11px] text-slate-400 leading-tight line-clamp-2 sm:line-clamp-none">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Button */}
            <div className="flex justify-center pt-4">
              <button
                type="button"
                disabled={!form.name.trim()}
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                style={{ background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)` }}
              >
                Next: Date & Location <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date, Time & Venue */}
        {step === 2 && (
          <div className="space-y-5 sm:space-y-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center max-w-xl mx-auto">
              <h1 className="text-[24px] leading-[28px] sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 sm:mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                When & where is it happening?
              </h1>
              <p className="text-[13px] sm:text-sm text-slate-500">
                Provide your event date, timing, and venue location.
              </p>
            </div>

            <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Event Date
                  </label>
                  <DatePicker value={form.date} onChange={date => setForm(f => ({ ...f, date }))} />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Start Time
                  </label>
                  <TimePicker
                    value={form.startTime}
                    onChange={val => setForm(f => ({ ...f, startTime: val }))}
                    placeholder="Start time"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    End Time
                  </label>
                  <TimePicker
                    value={form.endTime}
                    onChange={val => setForm(f => ({ ...f, endTime: val }))}
                    placeholder="End time"
                  />
                </div>
              </div>

              {/* Location Type Switcher */}
              <div className="space-y-1.5">
                <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                  Location Type
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isVirtual: false }))}
                    className={`py-2.5 px-3.5 h-[44px] rounded-xl border text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      !form.isVirtual
                        ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin size={14} /> In-Person Venue
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, isVirtual: true }))}
                    className={`py-2.5 px-3.5 h-[44px] rounded-xl border text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      form.isVirtual
                        ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Compass size={14} /> Virtual Event
                  </button>
                </div>
              </div>

              {/* Venue Address or Link */}
              {!form.isVirtual ? (
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Venue Name & City
                  </label>
                  <div className="relative">
                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.venue}
                      onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                      placeholder="e.g. Eko Hotel Grand Ballroom, Lagos"
                      className="w-full pl-9 pr-3 h-[44px] sm:h-[48px] text-[14px] font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Virtual Meeting Link
                  </label>
                  <input
                    type="url"
                    value={form.virtualLink}
                    onChange={e => setForm(f => ({ ...f, virtualLink: e.target.value }))}
                    placeholder="https://zoom.us/j/1234567890"
                    className="w-full px-3.5 h-[44px] sm:h-[48px] text-[14px] font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]"
                  />
                </div>
              )}

              {/* Guest Capacity Buttons & Custom Dynamic Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                    Expected Guest Capacity
                  </label>
                  <span className="text-xs font-bold text-[#7A1F1F]">
                    {form.guestCount > 0 ? `${form.guestCount} Guests Selected` : 'Set custom capacity'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {[50, 100, 150, 250, 500, 1000].map(cnt => {
                    const isSelected = form.guestCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, guestCount: cnt }))}
                        className={`h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-full text-[11px] sm:text-xs font-bold border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#7A1F1F] text-white border-[#7A1F1F] shadow-sm'
                            : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {cnt}<span className="hidden sm:inline"> Guests</span>
                      </button>
                    );
                  })}

                  {/* Custom Dynamic Capacity Pill */}
                  {(() => {
                    const isCustomSelected = ![50, 100, 150, 250, 500, 1000].includes(form.guestCount);
                    return (
                      <div
                        className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border transition-all flex items-center gap-1 ${
                          isCustomSelected && form.guestCount > 0
                            ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] ring-1 ring-[#7A1F1F]/20'
                            : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 focus-within:border-[#7A1F1F] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#7A1F1F]/20'
                        }`}
                      >
                        <Users size={12} className={isCustomSelected && form.guestCount > 0 ? 'text-[#7A1F1F]' : 'text-slate-400'} />
                        <input
                          type="number"
                          min={1}
                          max={100000}
                          value={isCustomSelected && form.guestCount > 0 ? form.guestCount : ''}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setForm(f => ({ ...f, guestCount: isNaN(val) ? 0 : Math.max(0, val) }));
                          }}
                          placeholder="Custom..."
                          className="w-16 sm:w-20 bg-transparent text-[11px] sm:text-xs font-bold outline-none text-slate-800 placeholder:text-slate-400"
                        />
                      </div>
                    );
                  })()}
                </div>

                {/* Event Currency selector */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Coins size={13} className="text-[#7A1F1F]" />
                      Event Currency
                    </label>
                    <span className="text-xs font-bold text-[#7A1F1F]">
                      {SUPPORTED_CURRENCIES.find(c => c.code === form.currency)?.name}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={form.currency}
                      onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full appearance-none px-3.5 h-[44px] sm:h-[48px] text-[14px] font-semibold border border-slate-200 rounded-xl bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F] pr-10"
                    >
                      {SUPPORTED_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code} ({c.symbol}) - {c.country}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400">Tickets and registrations will default to this currency.</p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)` }}
              >
                Next: Theme & Banner <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Theme & Banner */}
        {step === 3 && (
          <div className="space-y-5 sm:space-y-8 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="text-center max-w-xl mx-auto">
              <h1 className="text-[24px] leading-[28px] sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-1 sm:mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Pick an aesthetic theme
              </h1>
              <p className="text-[13px] sm:text-sm text-slate-500">
                Choose a banner to set the visual tone for your event invitation and dashboard.
              </p>
            </div>

            {/* Banner Preview Card */}
            <div className="relative rounded-xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200 aspect-[21/9] bg-slate-900 group">
              <img src={form.coverImage} alt="Cover Banner" className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 sm:p-8 flex flex-col justify-end">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/90 bg-white/20 backdrop-blur-md w-fit mb-1.5">
                  <TypeIcon size={11} /> {selectedTypeObj.label}
                </div>
                <h2 className="text-lg sm:text-3xl font-black text-white leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {form.name || 'Untitled Event'}
                </h2>
                <p className="text-[10px] sm:text-xs text-white/80 mt-1 font-medium flex flex-wrap items-center gap-2">
                  {form.date && <span>📅 {form.date}</span>}
                  {form.venue && <span className="truncate max-w-[150px] sm:max-w-none">📍 {form.venue}</span>}
                  <span>👥 {form.guestCount} Guests</span>
                </p>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Theme Banner
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
                {PRESET_BANNERS.map(preset => {
                  const selected = form.coverImage === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, coverImage: preset.url }))}
                      className={`relative rounded-xl overflow-hidden border-2 aspect-video transition-all ${
                        selected ? 'border-[#7A1F1F] ring-4 ring-[#7A1F1F]/20 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2 text-center">
                        <span className="text-[10px] font-bold text-white leading-tight">{preset.name}</span>
                      </div>
                      {selected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#7A1F1F] text-white flex items-center justify-center">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Upload Option */}
            <div className="pt-1">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-between p-3.5 sm:p-4 bg-white border border-dashed border-slate-300 rounded-xl sm:rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 flex-shrink-0">
                    {uploading ? <Loader2 size={16} className="animate-spin text-[#7A1F1F]" /> : <Upload size={16} />}
                  </div>
                  <div>
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800">Or upload your own custom banner</p>
                    <p className="text-[9px] sm:text-[10px] text-slate-400">High resolution JPEG or PNG</p>
                  </div>
                </div>
                <span className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] sm:text-xs font-bold transition-colors">
                  Browse
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                type="button"
                onClick={handleLaunch}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-100"
                style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)`, boxShadow: `0 8px 24px rgba(122,31,31,0.2)` }}
              >
                <Rocket size={15} /> Launch Event Workspace
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Celebration Launch Sequence */}
        {step === 4 && (
          <div className="max-w-md mx-auto w-full text-center space-y-4 sm:space-y-6 py-4 sm:py-8 animate-in zoom-in-95 duration-300">
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#7A1F1F]/10 animate-ping" />
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#7A1F1F] to-[#D4A24C] text-white flex items-center justify-center shadow-xl">
                <Rocket size={24} className="animate-bounce sm:w-9 sm:h-9" />
              </div>
            </div>

            <div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                Creating Your Event Workspace...
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Generating floor plan canvas, guest list & ticketing modules</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-[#7A1F1F] to-[#D4A24C] rounded-full transition-all duration-300"
                  style={{ width: `${launchProgress}%` }}
                />
              </div>
              <p className="text-xs font-bold text-[#7A1F1F]">{launchProgress}% Completed</p>
            </div>

            {/* Animated Setup Checklist */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 text-left space-y-3 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className={launchProgress >= 25 ? 'text-emerald-500' : 'text-slate-300'} />
                <span className={launchProgress >= 25 ? 'font-bold text-slate-800' : 'text-slate-400'}>
                  Initialized event database record
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className={launchProgress >= 50 ? 'text-emerald-500' : 'text-slate-300'} />
                <span className={launchProgress >= 50 ? 'font-bold text-slate-800' : 'text-slate-400'}>
                  Generated interactive floor plan canvas
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className={launchProgress >= 75 ? 'text-emerald-500' : 'text-slate-300'} />
                <span className={launchProgress >= 75 ? 'font-bold text-slate-800' : 'text-slate-400'}>
                  Prepared RSVP tracking & guest seating
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={16} className={launchProgress >= 100 ? 'text-emerald-500' : 'text-slate-300'} />
                <span className={launchProgress >= 100 ? 'font-bold text-slate-800' : 'text-slate-400'}>
                  Ready to design! Redirecting to planner...
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
        EventJelly © 2026 · Premium Event Management Platform
      </footer>
    </div>
  );
}
