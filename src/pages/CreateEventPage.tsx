import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Sparkles, Check,
  Heart, Presentation, PartyPopper, Music, Tent, HandHeart, Briefcase, MoreHorizontal,
} from 'lucide-react';
import { useCreateEvent } from '../hooks/useEvents';
import SEO from '../components/SEO';
import DatePicker from '../components/DatePicker';
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
  });

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    createEvent.mutate(form, {
      onSuccess: created => navigate(`/events/${created._id}`),
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
            <div className="relative px-7 pt-8 pb-5 sm:px-9">
              <h1 className="text-3xl font-extrabold" style={{ color: R, fontFamily: 'Playfair Display, serif' }}>
                {t('events.modal.title')}
              </h1>
              <div className="w-12 h-1 rounded-full mt-3 mb-3" style={{ background: G }} />
              <p className="text-sm text-slate-500">Set the basics — you can fill in the rest once it's created.</p>
            </div>

            {errorMessage && (
              <div className="mx-7 sm:mx-9 mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                {errorMessage}
              </div>
            )}

            <div className="px-7 pb-4 sm:px-9">
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
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">{t('events.modal.venue')}</label>
                  <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all" placeholder={t('events.modal.venue_placeholder')} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">{t('events.modal.date')}</label>
                  <DatePicker value={form.date} onChange={date => setForm(f => ({ ...f, date }))} />
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0" style={{ backgroundColor: R }}>2</span>
                <h3 className="text-sm font-semibold text-slate-700">What type of event is this?</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {EVENT_TYPES.map(({ value, label, icon: Icon }) => {
                  const selected = form.type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: value }))}
                      className={`relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all ${
                        selected ? 'bg-[#FAF0E8]' : 'bg-white border-slate-150 hover:border-slate-300'
                      }`}
                      style={selected ? { borderColor: R } : { borderColor: '#E7E1D8' }}
                    >
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: R }}>
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </span>
                      )}
                      <Icon size={20} style={{ color: selected ? R : '#94A3B8' }} />
                      <span className="text-xs font-medium" style={{ color: selected ? R : '#64748B' }}>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-7 py-5 sm:px-9" style={{ borderTop: '1px solid #EFEAE2' }}>
              <button onClick={() => navigate('/events')} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name.trim() || createEvent.isPending}
                className="flex items-center gap-2 px-5 py-2.5 text-sm text-white font-semibold rounded-xl hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
              >
                {createEvent.isPending ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                ) : (
                  <><Sparkles size={14} />{t('events.modal.submit')}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
