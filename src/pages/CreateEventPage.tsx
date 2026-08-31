import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Sparkles, Check,
  Heart, Presentation, PartyPopper, Music, Tent, HandHeart, Briefcase, MoreHorizontal,
  Upload, Trash2, Loader2, Video, MapPin, Plus, Users, Coins, ChevronDown, Minus, CalendarDays,
} from 'lucide-react';
import { useCreateEvent } from '../hooks/useEvents';
import { useAuth } from '../contexts/AuthContext';
import { uploadApi } from '../lib/api';
import SEO from '../components/SEO';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import { SUPPORTED_CURRENCIES, getCurrencyForCountry } from '../utils/formatters';
import type { Event } from '../types';

const R = '#7A1F1F';
const RD = '#9c3030';
const G = '#D4A24C';

const PRESET_CAPACITIES = [50, 100, 150, 250, 500, 1000];

const EVENT_TYPES: { value: NonNullable<Event['type']>; label: string; icon: React.ElementType }[] = [
  { value: 'wedding', label: 'Wedding', icon: Heart },
  { value: 'conference', label: 'Conference', icon: Presentation },
  { value: 'gala', label: 'Gala', icon: PartyPopper },
  { value: 'concert', label: 'Concert', icon: Music },
  { value: 'festival', label: 'Festival', icon: Tent },
  { value: 'fundraiser', label: 'Fundraiser', icon: HandHeart },
  { value: 'corporate', label: 'Corporate', icon: Briefcase },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

/* Field text stays at 16px on phones so iOS Safari never zooms on focus — only
   the padding tightens below the xs breakpoint. */
const INPUT_CLS =
  'w-full h-12 lg:h-11 px-3 xs:px-3.5 text-base lg:text-sm text-slate-800 bg-white border border-slate-200 rounded-2xl lg:rounded-xl ' +
  'placeholder:text-slate-400 focus:outline-none focus:border-[#7A1F1F]/60 focus:ring-4 focus:ring-[#7A1F1F]/10 transition-all';

function Label({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <label className="text-[12.5px] xs:text-[13px] lg:text-xs font-semibold text-slate-700 leading-tight min-w-0">
        {children}
      </label>
      {hint}
    </div>
  );
}

function SectionHeading({ step, title, caption }: { step: number; title: string; caption?: string }) {
  return (
    <div className="flex items-start gap-2 xs:gap-2.5 mb-3.5 xs:mb-4">
      <span
        className="w-5.5 h-5.5 xs:w-6 xs:h-6 lg:w-5 lg:h-5 mt-px rounded-full flex items-center justify-center text-white text-[10.5px] xs:text-[11px] font-bold flex-shrink-0 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
      >
        {step}
      </span>
      <div className="min-w-0">
        <h3 className="text-[13.5px] xs:text-[15px] lg:text-sm font-bold text-slate-800 leading-tight">{title}</h3>
        {caption && <p className="text-[11px] xs:text-[12px] lg:text-[11px] text-slate-400 mt-0.5 leading-snug">{caption}</p>}
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const [form, setForm] = useState({
    name: '', venue: '', date: '',
    status: 'draft' as Event['status'],
    type: 'wedding' as NonNullable<Event['type']>,
    currency: getCurrencyForCountry(user?.country),
    coverImage: '',
    isVirtual: false,
    virtualLink: '',
    guestCount: 150,
    dates: [] as { date: string; startTime: string; endTime: string }[],
  });
  const [uploading, setUploading] = useState(false);
  const isCustomCapacity = !PRESET_CAPACITIES.includes(form.guestCount);
  const [showCustomCapacity, setShowCustomCapacity] = useState(isCustomCapacity);
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

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    createEvent.mutate(form, {
      onSuccess: created => navigate(`/events/${created.slug || created._id}`),
    });
  };

  const errorMessage = createEvent.error instanceof Error
    ? (createEvent.error as any).response?.data?.message ?? createEvent.error.message
    : null;

  const selectedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === form.currency);

  /* Drives the progress ring so the form feels answerable, not endless. */
  const checkpoints = [
    !!form.name.trim(),
    form.isVirtual ? !!form.virtualLink.trim() : !!form.venue.trim(),
    form.dates.length > 0 ? form.dates.some(d => d.date) : !!form.date,
    form.guestCount > 0,
    !!form.type,
  ];
  const progress = Math.round((checkpoints.filter(Boolean).length / checkpoints.length) * 100);
  const ringLength = 2 * Math.PI * 15.5;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#FAF9F7' }}>
      <SEO title="Create Event" />

      {/* Mobile command bar — back, context, and live progress pinned to the top of the scroller */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-2.5 xs:gap-3 px-3 xs:px-4 py-2 xs:py-2.5 bg-[#FAF9F7]/90 backdrop-blur-md border-b border-[#EFE7DC]">
        <button
          onClick={() => navigate('/events')}
          className="w-9 h-9 xs:w-10 xs:h-10 -ml-0.5 rounded-full flex items-center justify-center text-slate-600 bg-white border border-slate-200 flex-shrink-0 active:scale-95 transition-transform"
          aria-label="Back to events"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9.5px] xs:text-[10px] font-semibold uppercase tracking-wider text-slate-400 leading-none">New</p>
          <p className="text-[13.5px] xs:text-[15px] font-bold text-slate-800 truncate leading-tight mt-0.5">
            {form.name.trim() || t('events.modal.title')}
          </p>
        </div>
        <div className="relative w-8 h-8 xs:w-9 xs:h-9 flex-shrink-0" aria-label={`${progress}% complete`}>
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EFE7DC" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15.5" fill="none" stroke={R} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${(progress / 100) * ringLength} ${ringLength}`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[8.5px] xs:text-[9px] font-bold" style={{ color: R }}>
            {progress}%
          </span>
        </div>
      </div>

      <div className="flex justify-center px-3 pt-3 pb-6 xs:px-4 xs:pt-4 lg:px-6 lg:py-12">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => navigate('/events')}
            className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft size={13} /> Back to Events
          </button>

          {/* Hero */}
          <div
            className="relative overflow-hidden rounded-2xl xs:rounded-3xl px-4 py-4.5 xs:px-5 xs:py-6 lg:px-9 lg:py-8 text-white shadow-lg shadow-[#7A1F1F]/10"
            style={{ background: `linear-gradient(135deg, ${R} 0%, #5E1616 100%)` }}
          >
            <div
              className="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full opacity-30 blur-2xl"
              style={{ background: `radial-gradient(circle, ${G} 0%, transparent 70%)` }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-full bg-white/15 text-[9.5px] xs:text-[10px] font-bold uppercase tracking-wider">
                <Sparkles size={10} style={{ color: G }} /> New Event
              </span>
              <h1 className="text-[21px] xs:text-[26px] lg:text-3xl font-extrabold mt-2 xs:mt-3 leading-tight">
                {t('events.modal.title')}
              </h1>
              <div className="w-9 xs:w-11 h-1 rounded-full mt-1.5 xs:mt-2" style={{ background: G }} />
              <p className="text-[11.5px] xs:text-[13px] lg:text-sm text-white/70 mt-2 xs:mt-2.5 leading-relaxed">
                Set the basics — you can fill in the rest once it's created.
              </p>

              <div className="mt-4 xs:mt-5 lg:hidden">
                <div className="flex items-center justify-between gap-2 text-[10.5px] xs:text-[11px] font-semibold text-white/70 mb-1.5">
                  <span>Setup progress</span>
                  <span className="whitespace-nowrap">{checkpoints.filter(Boolean).length} of {checkpoints.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${G} 0%, #E8C87E 100%)` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mt-3 xs:mt-4 px-3.5 py-2.5 xs:px-4 xs:py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[12.5px] xs:text-[13px] lg:text-sm">
              {errorMessage}
            </div>
          )}

          {/* SECTION 1 — Event basics */}
          <section className="mt-3 xs:mt-4 rounded-2xl xs:rounded-3xl bg-white border border-[#EFE7DC] shadow-sm p-3 xs:p-4 lg:p-7">
            <SectionHeading step={1} title="Event Basics" caption="The essentials guests will see first." />

            <div className="space-y-4 xs:space-y-5">
              <div>
                <Label>{t('events.modal.name')}</Label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  autoFocus={typeof window !== 'undefined' && window.innerWidth >= 1024}
                  className={INPUT_CLS}
                  placeholder={t('events.modal.name_placeholder')}
                />
              </div>

              {/* Location type — segmented control with a sliding indicator */}
              <div>
                <Label>Location Type</Label>
                <div className="relative grid grid-cols-2 p-1 rounded-2xl bg-[#F4EFE8] border border-[#EFE7DC]">
                  <span
                    className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-sm transition-transform duration-300 ease-out"
                    style={{ transform: form.isVirtual ? 'translateX(100%)' : 'translateX(0)' }}
                  />
                  {[
                    { virtual: false, label: 'Physical Venue', icon: MapPin },
                    { virtual: true, label: 'Virtual Event', icon: Video },
                  ].map(({ virtual, label, icon: Icon }) => {
                    const active = form.isVirtual === virtual;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, isVirtual: virtual }))}
                        className={`relative z-10 h-10 px-1 flex items-center justify-center gap-1.5 rounded-xl text-[11.5px] xs:text-[13px] lg:text-xs font-bold whitespace-nowrap transition-colors ${
                          active ? 'text-[#7A1F1F]' : 'text-slate-500'
                        }`}
                      >
                        <Icon size={14} className="hidden xs:block flex-shrink-0" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.isVirtual ? (
                <div>
                  <Label>Virtual Join Link</Label>
                  <div className="relative">
                    <Video size={16} className="absolute left-3 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={form.virtualLink}
                      onChange={e => setForm(f => ({ ...f, virtualLink: e.target.value }))}
                      inputMode="url"
                      autoCapitalize="none"
                      autoCorrect="off"
                      className={`${INPUT_CLS} pl-9 xs:pl-10`}
                      placeholder="https://zoom.us/j/123456"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label>{t('events.modal.venue')}</Label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 xs:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      value={form.venue}
                      onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                      className={`${INPUT_CLS} pl-9 xs:pl-10`}
                      placeholder={t('events.modal.venue_placeholder')}
                    />
                  </div>
                </div>
              )}

              {/* Date & time */}
              <div>
                <Label
                  hint={
                    <button
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        dates: [...f.dates, { date: f.dates.length === 0 ? f.date || '' : '', startTime: '', endTime: '' }],
                      }))}
                      className="flex items-center gap-1 h-9 px-2.5 xs:px-3 -mr-0.5 rounded-full text-[11.5px] xs:text-[12px] lg:text-[11px] font-bold whitespace-nowrap flex-shrink-0 text-[#7A1F1F] bg-[#FAF0E8] active:scale-95 transition-transform"
                    >
                      <Plus size={12} /> Add Date
                    </button>
                  }
                >
                  Date &amp; Time
                </Label>

                {form.dates.length === 0 ? (
                  <DatePicker value={form.date} onChange={date => setForm(f => ({ ...f, date }))} />
                ) : (
                  <div className="space-y-2.5">
                    {form.dates.map((d, index) => (
                      <div key={index} className="rounded-2xl border border-[#EFE7DC] bg-[#FBF9F6] p-2.5 xs:p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-1.5 text-[11.5px] xs:text-[12px] font-bold text-slate-600">
                            <CalendarDays size={13} style={{ color: R }} /> Day {index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, dates: f.dates.filter((_, i) => i !== index) }))}
                            className="w-9 h-9 -mr-1 flex items-center justify-center rounded-full text-slate-400 active:bg-red-50 active:text-red-500 transition-colors"
                            aria-label={`Remove day ${index + 1}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <DatePicker
                          value={d.date}
                          onChange={val => setForm(f => ({
                            ...f,
                            dates: f.dates.map((row, i) => (i === index ? { ...row, date: val } : row)),
                          }))}
                        />
                        {/* Stacked on narrow screens — two time pickers side by side truncate below 380px */}
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mt-2">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1">Start</span>
                            <TimePicker
                              value={d.startTime}
                              onChange={val => setForm(f => ({
                                ...f,
                                dates: f.dates.map((row, i) => (i === index ? { ...row, startTime: val } : row)),
                              }))}
                            />
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold text-slate-500 block mb-1">End</span>
                            <TimePicker
                              value={d.endTime}
                              onChange={val => setForm(f => ({
                                ...f,
                                dates: f.dates.map((row, i) => (i === index ? { ...row, endTime: val } : row)),
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guest capacity — swipeable chips on mobile, wrapped row on desktop */}
              <div>
                <Label
                  hint={
                    <span className="text-[11.5px] xs:text-[12px] lg:text-xs font-bold whitespace-nowrap flex-shrink-0" style={{ color: R }}>
                      {form.guestCount > 0 ? `${form.guestCount.toLocaleString()} guests` : 'Set capacity'}
                    </span>
                  }
                >
                  <span className="xs:hidden">Guest Capacity</span>
                  <span className="hidden xs:inline">Expected Guest Capacity</span>
                </Label>

                <div className="flex gap-1.5 xs:gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-3 px-3 pb-0.5 xs:-mx-4 xs:px-4 lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible">
                  {PRESET_CAPACITIES.map(cnt => {
                    const selected = !showCustomCapacity && form.guestCount === cnt;
                    return (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => { setShowCustomCapacity(false); setForm(f => ({ ...f, guestCount: cnt })); }}
                        className={`h-10 xs:h-11 lg:h-9 px-3.5 xs:px-4 shrink-0 snap-start rounded-full text-[12.5px] xs:text-[13px] lg:text-xs font-bold border transition-all active:scale-95 ${
                          selected
                            ? 'bg-[#7A1F1F] text-white border-[#7A1F1F] shadow-sm shadow-[#7A1F1F]/25'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {cnt.toLocaleString()}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowCustomCapacity(true)}
                    className={`h-10 xs:h-11 lg:h-9 px-3.5 xs:px-4 shrink-0 snap-start rounded-full text-[12.5px] xs:text-[13px] lg:text-xs font-bold border flex items-center gap-1.5 transition-all active:scale-95 ${
                      showCustomCapacity
                        ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F]'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <Users size={13} /> Custom
                  </button>
                </div>

                {showCustomCapacity && (
                  <div className="mt-2.5 flex items-center gap-1.5 xs:gap-2 p-1.5 rounded-2xl border border-[#7A1F1F]/30 bg-[#FAF0E8]/60">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, guestCount: Math.max(0, f.guestCount - 10) }))}
                      className="w-9 h-9 xs:w-10 xs:h-10 flex-shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
                      aria-label="Decrease capacity"
                    >
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={100000}
                      inputMode="numeric"
                      value={form.guestCount > 0 ? form.guestCount : ''}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10);
                        setForm(f => ({ ...f, guestCount: isNaN(val) ? 0 : Math.max(0, Math.min(100000, val)) }));
                      }}
                      placeholder="Enter number"
                      className="flex-1 min-w-0 h-9 xs:h-10 bg-transparent text-center text-base lg:text-sm font-bold text-[#7A1F1F] outline-none placeholder:font-medium placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, guestCount: Math.min(100000, f.guestCount + 10) }))}
                      className="w-9 h-9 xs:w-10 xs:h-10 flex-shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
                      aria-label="Increase capacity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                )}
              </div>



              {/* Banner */}
              <div>
                <Label hint={<span className="text-[10.5px] xs:text-[11px] font-medium text-slate-400 flex-shrink-0">Optional</span>}>
                  Event Banner
                </Label>
                {form.coverImage ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-[16/9] lg:aspect-[21/9]">
                    <img src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                      className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center bg-black/55 backdrop-blur-sm rounded-full text-white active:scale-95 transition-transform"
                      aria-label="Remove banner"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full flex flex-col items-center justify-center gap-1.5 xs:gap-2 border-2 border-dashed border-[#E3D9CB] rounded-2xl py-5 xs:py-7 bg-[#FBF9F6] active:bg-[#F4EFE8] transition-colors"
                  >
                    <span className="w-10 h-10 xs:w-11 xs:h-11 rounded-full flex items-center justify-center bg-white border border-[#EFE7DC] shadow-sm">
                      {uploading
                        ? <Loader2 className="animate-spin" size={17} style={{ color: R }} />
                        : <Upload size={17} style={{ color: R }} />}
                    </span>
                    <span className="text-[12.5px] xs:text-[13px] font-bold text-slate-700">
                      {uploading ? 'Uploading image…' : 'Upload event banner'}
                    </span>
                    <span className="text-[10.5px] xs:text-[11px] text-slate-400">JPEG or PNG, up to 5MB</span>
                  </button>
                )}
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
          </section>

          {/* SECTION 2 — Event type. Icon stacks above the label on narrow screens so
              "Conference" and "Fundraiser" stay on one line in a two-up grid. */}
          <section className="mt-3 xs:mt-4 rounded-2xl xs:rounded-3xl bg-white border border-[#EFE7DC] shadow-sm p-3 xs:p-4 lg:p-7">
            <SectionHeading step={2} title="What type of event is this?" caption="We tailor templates and tools to match." />

            <div className="grid grid-cols-2 gap-2 xs:gap-2.5 lg:grid-cols-4 lg:gap-3">
              {EVENT_TYPES.map(({ value, label, icon: Icon }) => {
                const selected = form.type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: value }))}
                    className={`relative flex flex-col items-center justify-center gap-1.5 py-2.5 px-1.5 rounded-2xl border transition-all active:scale-[0.97] xs:flex-row xs:justify-start xs:gap-2.5 xs:p-2.5 lg:flex-col lg:justify-center lg:gap-2 lg:py-4 lg:px-2 ${
                      selected ? 'bg-[#FAF0E8] shadow-sm' : 'bg-white hover:border-slate-300'
                    }`}
                    style={{ borderColor: selected ? R : '#E7E1D8' }}
                  >
                    <span
                      className="w-8 h-8 xs:w-9 xs:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{ background: selected ? R : '#F4EFE8' }}
                    >
                      <Icon size={15} style={{ color: selected ? '#fff' : '#94A3B8' }} />
                    </span>
                    <span
                      className="text-[12px] xs:text-[13px] lg:text-xs font-bold text-center xs:text-left lg:text-center leading-tight"
                      style={{ color: selected ? R : '#475569' }}
                    >
                      {label}
                    </span>
                    {selected && (
                      <span
                        className="absolute top-1 right-1 xs:top-1.5 xs:right-1.5 w-4 h-4 rounded-full flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: R }}
                      >
                        <Check size={9} className="text-white" strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Action bar — docks above the mobile tab bar, sits inline on desktop */}
          <div className="sticky bottom-0 z-20 mt-3 xs:mt-4 lg:static lg:mt-6">
            <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-[#FAF9F7] to-transparent lg:hidden" />
            <div className="relative rounded-2xl border border-[#EFE7DC] bg-white/95 backdrop-blur-md p-2 xs:p-2.5 shadow-[0_-8px_28px_-16px_rgba(0,0,0,0.35)] lg:border-0 lg:bg-transparent lg:backdrop-blur-none lg:p-0 lg:shadow-none">
              {!form.name.trim() && (
                <p className="lg:hidden text-[10.5px] xs:text-[11px] text-center text-slate-400 pb-1.5 xs:pb-2">
                  Add an event name to continue
                </p>
              )}
              <div className="flex items-center gap-2 xs:gap-2.5 lg:justify-end">
                <button
                  onClick={() => navigate('/events')}
                  className="h-11 xs:h-12 lg:h-11 px-3.5 xs:px-5 text-[13px] xs:text-[14px] lg:text-sm font-semibold whitespace-nowrap flex-shrink-0 text-slate-600 border border-slate-200 rounded-2xl lg:rounded-xl bg-white active:scale-[0.98] transition-transform"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!form.name.trim() || createEvent.isPending}
                  className="flex-1 lg:flex-none min-w-0 h-11 xs:h-12 lg:h-11 px-3 xs:px-6 flex items-center justify-center gap-1.5 text-[13.5px] xs:text-[15px] lg:text-sm text-white font-bold whitespace-nowrap rounded-2xl lg:rounded-xl shadow-lg shadow-[#7A1F1F]/25 active:scale-[0.98] transition-all disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
                >
                  {createEvent.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" /> Creating…</>
                  ) : (
                    <><Sparkles size={14} className="flex-shrink-0" /> {t('events.modal.submit')}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
