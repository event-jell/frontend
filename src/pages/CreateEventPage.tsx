import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Sparkles, Check,
  Heart, Presentation, PartyPopper, Music, Tent, HandHeart, Briefcase, MoreHorizontal,
  Upload, Trash2, Loader2, Video, MapPin, Plus, Clock, Calendar, Users,
} from 'lucide-react';
import { useCreateEvent } from '../hooks/useEvents';
import { uploadApi } from '../lib/api';
import SEO from '../components/SEO';
import DatePicker from '../components/DatePicker';
import TimePicker from '../components/TimePicker';
import type { Event } from '../types';

const R = '#7A1F1F';
const RD = '#9c3030';
const G = '#D4A24C';

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

export default function CreateEventPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createEvent = useCreateEvent();

  const [form, setForm] = useState({
    name: '', venue: '', date: '',
    status: 'draft' as Event['status'],
    type: 'wedding' as NonNullable<Event['type']>,
    coverImage: '',
    isVirtual: false,
    virtualLink: '',
    guestCount: 150,
    dates: [] as { date: string; startTime: string; endTime: string }[],
  });
  const [uploading, setUploading] = useState(false);
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

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: '#FAF9F7' }}>
      <SEO title="Create Event" />
      <div className="flex justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-2xl">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Events
          </button>

          <div className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden" style={{ background: '#FDFBF8' }}>
            <div className="relative px-4 pt-6 pb-4 sm:px-9 sm:pt-8 sm:pb-5">
              <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: R, fontFamily: 'Playfair Display, serif' }}>
                {t('events.modal.title')}
              </h1>
              <div className="w-12 h-1 rounded-full mt-2 mb-2" style={{ background: G }} />
              <p className="text-xs sm:text-sm text-slate-500">Set the basics — you can fill in the rest once it's created.</p>
            </div>

            {errorMessage && (
              <div className="mx-4 sm:mx-9 mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="px-4 pb-4 sm:px-9">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: R }}>1</span>
                <h3 className="text-sm font-semibold text-slate-700">Event Basics</h3>
              </div>
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">{t('events.modal.name')}</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    autoFocus
                    className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all" placeholder={t('events.modal.name_placeholder')} />
                </div>
                {/* Event Location Type Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 block">Location Type</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, isVirtual: false }))}
                      className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                        !form.isVirtual
                          ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Physical Venue
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, isVirtual: true }))}
                      className={`px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap ${
                        form.isVirtual
                          ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      Virtual Event
                    </button>
                  </div>
                </div>

                {form.isVirtual ? (
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Virtual Join Link</label>
                    <input
                      value={form.virtualLink}
                      onChange={e => setForm(f => ({ ...f, virtualLink: e.target.value }))}
                      className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                      placeholder="e.g. https://zoom.us/j/1234567890"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">{t('events.modal.venue')}</label>
                    <input
                      value={form.venue}
                      onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                      className="w-full px-3 py-2 text-sm text-slate-800 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                      placeholder={t('events.modal.venue_placeholder')}
                    />
                  </div>
                )}

                {/* Multiple Dates builder */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-600 block">Date & Time</label>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        dates: [...f.dates, { date: f.date || '', startTime: '', endTime: '' }]
                      }))}
                      className="text-[11px] text-[#7A1F1F] hover:underline font-bold flex items-center gap-0.5"
                    >
                      <Plus size={12} /> Add Date
                    </button>
                  </div>

                  {form.dates.length === 0 ? (
                    <div>
                      <DatePicker value={form.date} onChange={date => setForm(f => ({ ...f, date }))} />
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {form.dates.map((d, index) => (
                        <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 bg-slate-50/50 p-2.5 sm:p-3 rounded-xl border border-slate-200/60 relative">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Date {index + 1}</label>
                            <DatePicker
                              value={d.date}
                              onChange={val => {
                                const copy = [...form.dates];
                                copy[index].date = val;
                                setForm({ ...form, dates: copy });
                              }}
                            />
                          </div>
                          <div className="w-full sm:w-3/12">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">Start</label>
                            <TimePicker
                              value={d.startTime}
                              onChange={val => {
                                const copy = [...form.dates];
                                copy[index].startTime = val;
                                setForm({ ...form, dates: copy });
                              }}
                            />
                          </div>
                          <div className="w-full sm:w-3/12">
                            <label className="text-[10px] font-bold text-slate-500 block mb-1">End</label>
                            <TimePicker
                              value={d.endTime}
                              onChange={val => {
                                const copy = [...form.dates];
                                copy[index].endTime = val;
                                setForm({ ...form, dates: copy });
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = form.dates.filter((_, i) => i !== index);
                              setForm({ ...form, dates: copy });
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg bg-white shrink-0 flex items-center justify-center"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Guest Capacity Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-600 block">Expected Guest Capacity</label>
                    <span className="text-[11px] sm:text-xs font-bold text-[#7A1F1F]">
                      {form.guestCount > 0 ? `${form.guestCount} Guests Selected` : 'Set capacity'}
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
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {cnt}<span className="hidden sm:inline"> Guests</span>
                        </button>
                      );
                    })}

                    {/* Custom Capacity Pill */}
                    {(() => {
                      const isCustomSelected = ![50, 100, 150, 250, 500, 1000].includes(form.guestCount);
                      return (
                        <div
                          className={`h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border transition-all flex items-center gap-1 ${
                            isCustomSelected && form.guestCount > 0
                              ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F] ring-1 ring-[#7A1F1F]/20'
                              : 'bg-white border-slate-200 text-slate-600 focus-within:border-[#7A1F1F]'
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
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Event Banner (Optional)</label>
                  {form.coverImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-[21/9]">
                      <img src={form.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-lg text-white hover:bg-black/80 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl py-3.5 sm:py-6 cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="animate-spin text-[#7A1F1F] mb-1" size={18} />
                          <span className="text-xs text-slate-500 font-medium">Uploading image...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="text-slate-400 mb-1" size={18} />
                          <span className="text-xs text-slate-500 font-semibold">Upload event banner</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">JPEG or PNG, up to 5MB</span>
                        </>
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
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: R }}>2</span>
                <h3 className="text-sm font-semibold text-slate-700">What type of event is this?</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {EVENT_TYPES.map(({ value, label, icon: Icon }) => {
                  const selected = form.type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: value }))}
                      className={`relative flex flex-col items-center gap-1.5 py-2.5 sm:py-4 px-2 rounded-xl sm:rounded-2xl border-2 transition-all ${
                        selected ? 'bg-[#FAF0E8]' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                      style={selected ? { borderColor: R } : { borderColor: '#E7E1D8' }}
                    >
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: R }}>
                          <Check size={9} className="text-white" strokeWidth={3} />
                        </span>
                      )}
                      <Icon size={18} style={{ color: selected ? R : '#94A3B8' }} />
                      <span className="text-[11px] sm:text-xs font-medium text-center" style={{ color: selected ? R : '#64748B' }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-4 sm:px-9 sm:py-5" style={{ borderTop: '1px solid #EFEAE2' }}>
              <button onClick={() => navigate('/events')} className="px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || createEvent.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm text-white font-semibold rounded-xl hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed whitespace-nowrap"
                style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
              >
                {createEvent.isPending ? (
                  <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                ) : (
                  <><Sparkles size={13} />{t('events.modal.submit')}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
