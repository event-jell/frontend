import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Ticket, MessageSquare, Filter, ArrowUpDown, Plus, ChevronRight, MessageCircle, Sparkles, Loader2 } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../contexts/AuthContext';
import type { Event } from '../types';
import SEO from '../components/SEO';

const R = '#7A1F1F';
const RD = '#9c3030';
const G = '#D4A24C';

const STATUS_CONFIG = {
  live: { label: 'Live', dot: '#10B981', text: '#10B981', bg: '#ECFDF5' },
  planning: { label: 'Planning', dot: '#F59E0B', text: '#D97706', bg: '#FFFBEB' },
  confirmed: { label: 'Confirmed', dot: '#7A1F1F', text: '#7A1F1F', bg: '#FAF7F2' },
  draft: { label: 'Draft', dot: '#94A3B8', text: '#64748B', bg: '#F8FAFC' },
};

function StatCard({ icon: Icon, label, value, sub, subColor, gradient }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; subColor?: string; gradient: string;
}) {
  return (
    <div className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
          style={{ background: gradient }}
        >
          <Icon size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900 tabular-nums">{value}</div>
      {sub && <div className="text-xs mt-1 font-medium" style={{ color: subColor || '#94a3b8' }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
    </div>
  );
}

function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const { t } = useTranslation();
  const status = STATUS_CONFIG[event.status] ?? STATUS_CONFIG.draft;
  const guestPct = event.guestCount > 0 ? Math.round(event.guestRsvp / event.guestCount * 100) : 0;
  const ticketPct = event.ticketsTotal > 0 ? Math.round(event.ticketsSold / event.ticketsTotal * 100) : 0;
  const seatPct = event.seatedTotal > 0 ? Math.round(event.seatedCount / event.seatedTotal * 100) : 0;
  const isActive = event.status === 'live';

  return (
    <div
      onClick={onClick}
      className={`group bg-white border rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${isActive ? 'border-[#7A1F1F]/40 ring-1 ring-[#7A1F1F]/15' : 'border-slate-100'}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
          >
            {event.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm truncate">{event.name}</h3>
              {event.status === 'live' && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981] flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />{t('events.status.live')}
                </span>
              )}
              {event.status !== 'live' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: status.bg, color: status.text }}>
                  {t(`events.status.${event.status}`)}
                </span>
              )}
            </div>
            {(event.venue || event.date) && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {[event.venue, event.date].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        {(event.commCount ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs bg-rose-50 text-rose-500 px-2 py-1 rounded-full font-medium flex-shrink-0">
            <MessageCircle size={12} />{event.commCount}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { label: t('events.card.guests_rsvp'), value: `${guestPct}%`, sub: `${event.guestRsvp}/${event.guestCount}`, color: R },
          { label: t('events.card.tickets'), value: `${ticketPct}%`, sub: `${event.ticketsSold}/${event.ticketsTotal}`, color: '#EF9F27' },
          { label: t('events.card.floor_plan'), value: `${seatPct}%`, sub: t('events.card.seated'), color: R },
        ].map(({ label, value, sub, color }) => (
          <div key={label}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800">{value} <span className="text-xs font-normal text-slate-500">{sub}</span></p>
            <ProgressBar value={parseInt(value)} color={color} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-50">
        <span>🏪 {t('events.card.vendors', { count: event.vendorCount ?? 0 })}</span>
        <span
          className={`flex items-center gap-1 font-semibold transition-all group-hover:gap-1.5 ${isActive ? 'text-[#7A1F1F]' : 'text-slate-600'}`}
        >
          {isActive ? t('events.card.currently_open') : t('events.card.open')}<ChevronRight size={13} />
        </span>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: events = [], isLoading } = useEvents();

  const [search] = useState('');

  const filtered = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const liveCount = events.filter(e => e.status === 'live').length;
  const totalGuests = events.reduce((s, e) => s + (e.guestCount ?? 0), 0);
  const totalTickets = events.reduce((s, e) => s + (e.ticketsSold ?? 0), 0);
  const totalComms = events.reduce((s, e) => s + (e.commCount ?? 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#FAF9F7' }}>
      <SEO title="My Events" />

      {/* Header */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(120deg, #3D0F0F 0%, ${R} 55%, ${RD} 100%)` }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${G}, transparent)` }} />
          <div className="absolute -bottom-24 left-1/4 w-64 h-64 rounded-full opacity-10" style={{ background: `radial-gradient(circle, white, transparent)` }} />
        </div>
        <div className="relative px-4 py-6 sm:px-8 sm:py-7">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'rgba(212,162,76,0.85)' }}>
            <Sparkles size={12} />{t('events.welcome', { name: user?.firstName || '' })}
          </p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('events.title')}
            </h1>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Filter size={14} />{t('events.filter_status')}
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl transition-colors"
                style={{ color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <ArrowUpDown size={14} />{t('events.sort_date')}
              </button>
              <button
                onClick={() => navigate('/events/new')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-sm"
                style={{ background: G, color: '#3D0F0F' }}
              >
                <Plus size={15} />{t('events.new_event')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 mx-auto max-w-[1200px] w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Calendar} label={t('events.stats.active')} value={events.length} sub={t('events.stats.live_now', { count: liveCount })}
            gradient={`linear-gradient(135deg, ${R} 0%, ${RD} 100%)`} />
          <StatCard icon={Users} label={t('events.stats.total_guests')} value={totalGuests.toLocaleString()} sub={t('events.stats.across_all')}
            gradient="linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" />
          <StatCard icon={Ticket} label={t('events.stats.tickets_sold')} value={totalTickets.toLocaleString()} sub={t('events.stats.across_all')} subColor="#10B981"
            gradient="linear-gradient(135deg, #EF9F27 0%, #D4A24C 100%)" />
          <StatCard icon={MessageSquare} label={t('events.stats.open_comms')} value={totalComms} sub={t('events.stats.pending_msgs')}
            gradient="linear-gradient(135deg, #EC4899 0%, #F472B6 100%)" />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: R }} />
            <p className="text-sm text-slate-400">{t('events.loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-14 text-center shadow-sm">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: `radial-gradient(${R} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }} />
            <div className="relative">
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
              >
                <Calendar size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{t('events.empty.title')}</h2>
              <p className="text-sm text-slate-500 mb-7 max-w-xs mx-auto">{t('events.empty.subtitle')}</p>
              <button
                onClick={() => navigate('/events/new')}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-sm"
                style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
              >
                <Plus size={15} />{t('events.empty.action')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(event => (
              <EventCard key={event._id} event={event} onClick={() => navigate(`/events/${event._id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
