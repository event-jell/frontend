import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Ticket, MessageSquare, Filter, ArrowUpDown, Plus, ChevronRight, MessageCircle } from 'lucide-react';
import { useEvents, useCreateEvent } from '../hooks/useEvents';
import type { Event } from '../types';

const STATUS_CONFIG = {
  live: { label: 'Live', dot: '#10B981', text: '#10B981', bg: '#ECFDF5' },
  planning: { label: 'Planning', dot: '#F59E0B', text: '#D97706', bg: '#FFFBEB' },
  confirmed: { label: 'Confirmed', dot: '#7A1F1F', text: '#7A1F1F', bg: '#FAF7F2' },
  draft: { label: 'Draft', dot: '#94A3B8', text: '#64748B', bg: '#F8FAFC' },
};

function StatCard({ icon: Icon, label, value, sub, subColor }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; subColor?: string;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Icon size={15} />{label}</div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs mt-1 font-medium" style={{ color: subColor || '#64748b' }}>{sub}</div>}
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
    <div className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer ${isActive ? 'border-[#7A1F1F] ring-1 ring-[#7A1F1F]/20' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: isActive ? '#7A1F1F' : '#7A1F1F' }}>
            {event.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm">{event.name}</h3>
              {event.status === 'live' && (
                <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#10B981]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />{t('events.status.live')}
                </span>
              )}
              {event.status !== 'live' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.text }}>
                  {t(`events.status.${event.status}`)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{event.venue} · {event.date}</p>
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
          { label: t('events.card.guests_rsvp'), value: `${guestPct}%`, sub: `${event.guestRsvp}/${event.guestCount}`, color: '#7A1F1F' },
          { label: t('events.card.tickets'), value: `${ticketPct}%`, sub: `${event.ticketsSold}/${event.ticketsTotal}`, color: '#EF9F27' },
          { label: t('events.card.floor_plan'), value: `${seatPct}%`, sub: t('events.card.seated'), color: '#7A1F1F' },
        ].map(({ label, value, sub, color }) => (
          <div key={label}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800">{value} <span className="text-xs font-normal text-slate-500">{sub}</span></p>
            <ProgressBar value={parseInt(value)} color={color} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>🏪 {t('events.card.vendors', { count: event.vendorCount ?? 0 })}</span>
        <button onClick={onClick}
          className={`flex items-center gap-1 font-semibold transition-colors ${isActive ? 'text-[#7A1F1F] hover:text-[#7A1F1F]' : 'text-slate-600 hover:text-slate-900'}`}>
          {isActive ? t('events.card.currently_open') : t('events.card.open')}<ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

interface CreateEventModalProps {
  onClose: () => void;
  onSave: (data: Partial<Event>) => void;
}

function CreateEventModal({ onClose, onSave }: CreateEventModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', venue: '', date: '', status: 'draft' as Event['status'] });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-5">{t('events.modal.title')}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{t('events.modal.name')}</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder={t('events.modal.name_placeholder')} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{t('events.modal.venue')}</label>
            <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder={t('events.modal.venue_placeholder')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('events.modal.date')}</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('events.modal.status')}</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Event['status'] }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 bg-white">
                <option value="draft">{t('events.status.draft')}</option>
                <option value="planning">{t('events.status.planning')}</option>
                <option value="confirmed">{t('events.status.confirmed')}</option>
                <option value="live">{t('events.status.live')}</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">{t('common.cancel')}</button>
          <button
            onClick={() => { if (form.name) { onSave(form); onClose(); } }}
            className="px-4 py-2 text-sm text-white font-semibold rounded-xl hover:opacity-90"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            {t('events.modal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useEvents();
  const createEvent = useCreateEvent();

  const [search] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = events.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const liveCount = events.filter(e => e.status === 'live').length;
  const totalGuests = events.reduce((s, e) => s + (e.guestCount ?? 0), 0);
  const totalTickets = events.reduce((s, e) => s + (e.ticketsSold ?? 0), 0);
  const totalComms = events.reduce((s, e) => s + (e.commCount ?? 0), 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onSave={data => createEvent.mutate(data)}
        />
      )}

      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <p className="text-sm text-slate-500 mb-0.5">{t('events.welcome', { name: 'Amara' })}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{t('events.title')}</h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <Filter size={14} />{t('events.filter_status')}
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowUpDown size={14} />{t('events.sort_date')}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              style={{ backgroundColor: '#7A1F1F' }}
            >
              <Plus size={15} />{t('events.new_event')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 mx-auto max-w-[1200px]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Calendar} label={t('events.stats.active')} value={events.length} sub={t('events.stats.live_now', { count: liveCount })} />
          <StatCard icon={Users} label={t('events.stats.total_guests')} value={totalGuests.toLocaleString()} sub={t('events.stats.across_all')} />
          <StatCard icon={Ticket} label={t('events.stats.tickets_sold')} value={totalTickets.toLocaleString()} sub={t('events.stats.across_all')} subColor="#10B981" />
          <StatCard icon={MessageSquare} label={t('events.stats.open_comms')} value={totalComms} sub={t('events.stats.pending_msgs')} />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">{t('events.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">{t('events.empty.title')}</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">{t('events.empty.subtitle')}</p>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm text-white font-semibold rounded-xl" style={{ backgroundColor: '#7A1F1F' }}>
              {t('events.empty.action')}
            </button>
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
