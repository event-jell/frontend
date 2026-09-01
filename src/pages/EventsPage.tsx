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
    <div className="group bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl p-2 sm:p-5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-w-0">
      <div className="flex items-center gap-1.5 sm:gap-3 mb-0.5 sm:mb-3">
        <div
          className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105"
          style={{ background: gradient }}
        >
          <Icon size={11} className="text-white sm:w-4 sm:h-4" />
        </div>
        <span className="text-[9.5px] sm:text-sm font-semibold text-slate-500 truncate">{label}</span>
      </div>
      <div className="text-base sm:text-3xl font-black text-slate-900 tabular-nums leading-none mb-0.5">{value}</div>
      {sub && <div className="text-[8.5px] sm:text-xs font-medium truncate" style={{ color: subColor || '#94a3b8' }}>{sub}</div>}
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
      className={`group bg-white border rounded-xl sm:rounded-3xl overflow-hidden shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${isActive ? 'border-2 border-[#7A1F1F]' : 'border-slate-200'}`}
    >
      {/* Event banner cover image at the top of the card */}
      <div className="relative h-16 sm:h-36 w-full overflow-hidden">
        <img
          src={event.coverImage || '/default-banner.jpg'}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5">
          {event.status === 'live' ? (
            <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#ECFDF5]/90 backdrop-blur-sm text-[#10B981] shadow-xs uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              {t('events.status.live')}
            </span>
          ) : (
            <span
              className="text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/90 backdrop-blur-sm shadow-xs uppercase tracking-wide"
              style={{ color: status.text }}
            >
              {t(`events.status.${event.status}`)}
            </span>
          )}
        </div>
      </div>

      <div className="p-2.5 sm:p-5 space-y-2 sm:space-y-4">
        {/* Title Details */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 text-xs sm:text-base truncate">{event.name}</h3>
            {(event.date || event.venue) && (
              <p className="text-[9px] sm:text-[11px] text-slate-400 font-bold mt-0.5 truncate uppercase tracking-wider">
                {[event.venue, event.date].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          {(event.commCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[8.5px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full font-bold shrink-0 shadow-xs border border-rose-100">
              <MessageCircle size={8} />{event.commCount}
            </span>
          )}
        </div>

        {/* Progress Grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4">
          {[
            { label: 'Guests', value: `${guestPct}%`, sub: `${event.guestRsvp}/${event.guestCount}`, color: R },
            { label: 'Tickets', value: `${ticketPct}%`, sub: `${event.ticketsSold}/${event.ticketsTotal}`, color: '#F59E0B' },
            { label: 'Floor Plan', value: `${seatPct}%`, sub: t('events.card.seated'), color: R },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="space-y-0.5 min-w-0">
              <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
              <p className="text-[10.5px] sm:text-xs font-black text-slate-800 truncate">{value} <span className="text-[8px] sm:text-[10px] font-medium text-slate-400">{sub}</span></p>
              <ProgressBar value={parseInt(value)} color={color} />
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1.5 border-t border-slate-100/80">
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            🏪 {t('events.card.vendors', { count: event.vendorCount ?? 0 })}
          </span>
          <span
            className={`flex items-center gap-0.5 text-[10.5px] sm:text-xs font-bold transition-all group-hover:gap-1.5 ${isActive ? 'text-[#7A1F1F]' : 'text-slate-600'}`}
          >
            {isActive ? t('events.card.currently_open') : t('events.card.open')}
            <ChevronRight size={10} className="shrink-0" />
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
    <div className="flex flex-col h-full overflow-hidden pb-24 sm:pb-0" style={{ background: '#FAF9F7' }}>
      <SEO title="My Events" />

      {/* Header */}
      <div className="relative overflow-hidden flex-shrink-0" style={{ background: `linear-gradient(120deg, #3D0F0F 0%, ${R} 55%, ${RD} 100%)` }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-20" style={{ background: `radial-gradient(circle, ${G}, transparent)` }} />
          <div className="absolute -bottom-24 left-1/4 w-64 h-64 rounded-full opacity-10" style={{ background: `radial-gradient(circle, white, transparent)` }} />
        </div>
        <div className="relative px-3 py-2.5 sm:px-8 sm:py-7">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[9px] sm:text-xs font-semibold uppercase tracking-widest mb-0.5 flex items-center gap-1" style={{ color: 'rgba(212,162,76,0.85)' }}>
                <Sparkles size={10} />{t('events.welcome', { name: user?.firstName || '' })}
              </p>
              <h1 className="text-lg sm:text-3xl font-extrabold text-white leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                {t('events.title')}
              </h1>
            </div>

            <button
              onClick={() => navigate('/events/new')}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-bold rounded-lg sm:rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-xs whitespace-nowrap shrink-0"
              style={{ background: G, color: '#3D0F0F' }}
            >
              <Plus size={12} className="shrink-0" />
              <span>{t('events.new_event')}</span>
            </button>
          </div>

          {/* Filter Chips row (Horizontal scroll on mobile, never clipping) */}
          <div className="flex items-center gap-1.5 mt-2 sm:mt-3 overflow-x-auto max-w-full pb-0.5 sm:pb-0 no-scrollbar">
            <button className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-[10.5px] sm:text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <Filter size={11} className="shrink-0" />
              <span>{t('events.filter_status')}</span>
            </button>
            <button className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 text-[10.5px] sm:text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
              style={{ color: 'rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <ArrowUpDown size={11} className="shrink-0" />
              <span>{t('events.sort_date')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 py-2.5 sm:px-8 sm:py-4 mx-auto max-w-[1200px] w-full no-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-4 mb-2.5 sm:mb-5">
          <StatCard icon={Calendar} label={t('events.stats.active')} value={events.length} sub={t('events.stats.live_now', { count: liveCount })}
            gradient={`linear-gradient(135deg, ${R} 0%, ${RD} 100%)`} />
          <StatCard icon={Users} label={t('events.stats.total_guests')} value={totalGuests.toLocaleString()} sub={t('events.stats.across_all')}
            gradient="linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" />
          <StatCard icon={Ticket} label={t('events.stats.tickets_sold')} value={totalTickets.toLocaleString()} sub={t('events.stats.across_all')} subColor="#10B981"
            gradient="linear-gradient(135deg, #EF9F27 0%, #D4A24C 100%)" />
          <StatCard icon={MessageSquare} label={t('events.stats.open_comms')} value={totalComms} sub={t('events.stats.pending_msgs')}
            gradient="linear-gradient(135deg, #DB2777 0%, #F43F5E 100%)" />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-20 bg-slate-100 rounded-full" />
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="h-8 bg-slate-50 rounded-xl" />
                  <div className="h-8 bg-slate-50 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs max-w-2xl mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF0E8] flex items-center justify-center text-[#7A1F1F] mb-5 shadow-3xs">
              <Calendar size={26} strokeWidth={1.75} />
            </div>
            
            <h3 className="text-base sm:text-lg font-bold text-slate-900 text-center mb-1.5">
              {t('events.empty.title')}
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-500 text-center max-w-sm mb-6 leading-relaxed">
              {t('events.empty.subtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-md mb-8">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-lg mb-1">🎟️</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Ticketing</span>
                <span className="text-[9.5px] text-slate-400 mt-0.5">Sell tickets with QR codes</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-lg mb-1">🗺️</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Floor Plans</span>
                <span className="text-[9.5px] text-slate-400 mt-0.5">Design seatings drag-n-drop</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
                <span className="text-lg mb-1">🤝</span>
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Vendors</span>
                <span className="text-[9.5px] text-slate-400 mt-0.5">Coordinate & Chat live</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/events/new')}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-md shadow-[#7A1F1F]/15 hover:bg-[#661919] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer"
              style={{ background: R }}
            >
              <Plus size={14} strokeWidth={2.5} />
              {t('events.empty.action')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
            {filtered.map(event => (
              <EventCard key={event._id} event={event} onClick={() => navigate(`/events/${event._id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
