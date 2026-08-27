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
    <div className="group bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-w-0">
      <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-3">
        <div
          className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
          style={{ background: gradient }}
        >
          <Icon size={14} className="text-white sm:w-4 sm:h-4" />
        </div>
        <span className="text-xs sm:text-sm font-semibold text-slate-500 truncate">{label}</span>
      </div>
      <div className="text-xl sm:text-3xl font-extrabold text-slate-900 tabular-nums leading-none mb-1">{value}</div>
      {sub && <div className="text-[10px] sm:text-xs font-medium truncate" style={{ color: subColor || '#94a3b8' }}>{sub}</div>}
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
      className={`group bg-white border rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${isActive ? 'border-2 border-[#7A1F1F]' : 'border-slate-200'}`}
    >
      {/* Event banner cover image at the top of the card */}
      <div className="relative h-28 sm:h-36 w-full overflow-hidden">
        <img
          src={event.coverImage || '/default-banner.jpg'}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2.5 right-2.5">
          {event.status === 'live' ? (
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ECFDF5]/90 backdrop-blur-sm text-[#10B981] shadow-sm uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              {t('events.status.live')}
            </span>
          ) : (
            <span
              className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm uppercase tracking-wide"
              style={{ color: status.text }}
            >
              {t(`events.status.${event.status}`)}
            </span>
          )}
        </div>
      </div>

      <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4">
        {/* Title Details */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">{event.name}</h3>
            {(event.date || event.venue) && (
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-bold mt-0.5 truncate uppercase tracking-wider">
                {[event.venue, event.date].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          {(event.commCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-bold shrink-0 shadow-sm border border-rose-100">
              <MessageCircle size={10} />{event.commCount}
            </span>
          )}
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: t('events.card.guests_rsvp'), value: `${guestPct}%`, sub: `${event.guestRsvp}/${event.guestCount}`, color: R },
            { label: t('events.card.tickets'), value: `${ticketPct}%`, sub: `${event.ticketsSold}/${event.ticketsTotal}`, color: '#F59E0B' },
            { label: t('events.card.floor_plan'), value: `${seatPct}%`, sub: t('events.card.seated'), color: R },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="space-y-1 min-w-0">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
              <p className="text-xs font-black text-slate-800 truncate">{value} <span className="text-[9px] sm:text-[10px] font-medium text-slate-400">{sub}</span></p>
              <ProgressBar value={parseInt(value)} color={color} />
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100/80">
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            🏪 {t('events.card.vendors', { count: event.vendorCount ?? 0 })}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-bold transition-all group-hover:gap-1.5 ${isActive ? 'text-[#7A1F1F]' : 'text-slate-600'}`}
          >
            {isActive ? t('events.card.currently_open') : t('events.card.open')}
            <ChevronRight size={12} className="shrink-0" />
          </span>
        </div>
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
        <div className="relative px-4 py-4 sm:px-8 sm:py-7">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1.5" style={{ color: 'rgba(212,162,76,0.85)' }}>
            <Sparkles size={12} />{t('events.welcome', { name: user?.firstName || '' })}
          </p>
          <div className="flex items-center justify-between flex-wrap gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
              {t('events.title')}
            </h1>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full pb-0.5 sm:pb-0 scrollbar-none">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
                style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Filter size={13} className="shrink-0" />
                <span>{t('events.filter_status')}</span>
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
                style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <ArrowUpDown size={13} className="shrink-0" />
                <span>{t('events.sort_date')}</span>
              </button>
              <button
                onClick={() => navigate('/events/new')}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-sm whitespace-nowrap shrink-0"
                style={{ background: G, color: '#3D0F0F' }}
              >
                <Plus size={14} className="shrink-0" />
                <span>{t('events.new_event')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-4 sm:px-8 mx-auto max-w-[1200px] w-full">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-5">
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
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={26} className="animate-spin" style={{ color: R }} />
            <p className="text-xs text-slate-400">{t('events.loading')}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="relative overflow-hidden bg-white border border-slate-100 rounded-3xl p-10 sm:p-14 text-center shadow-sm">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
              backgroundImage: `radial-gradient(${R} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }} />
            <div className="relative">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
              >
                <Calendar size={28} className="text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-2">{t('events.empty.title')}</h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-xs mx-auto">{t('events.empty.subtitle')}</p>
              <button
                onClick={() => navigate('/events/new')}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-sm"
                style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
              >
                <Plus size={14} />{t('events.empty.action')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map(event => (
              <EventCard key={event._id} event={event} onClick={() => navigate(`/events/${event.slug || event._id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
