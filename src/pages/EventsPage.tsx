import { useState } from 'react';
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />Live
                </span>
              )}
              {event.status !== 'live' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.text }}>
                  {status.label}
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
          { label: 'Guests · RSVP', value: `${guestPct}%`, sub: `${event.guestRsvp}/${event.guestCount}`, color: '#7A1F1F' },
          { label: 'Tickets', value: `${ticketPct}%`, sub: `${event.ticketsSold}/${event.ticketsTotal}`, color: '#EF9F27' },
          { label: 'Floor plan', value: `${seatPct}%`, sub: 'seated', color: '#7A1F1F' },
        ].map(({ label, value, sub, color }) => (
          <div key={label}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-sm font-bold text-slate-800">{value} <span className="text-xs font-normal text-slate-500">{sub}</span></p>
            <ProgressBar value={parseInt(value)} color={color} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>🏪 {event.vendorCount ?? 0} vendors</span>
        <button onClick={onClick}
          className={`flex items-center gap-1 font-semibold transition-colors ${isActive ? 'text-[#7A1F1F] hover:text-[#7A1F1F]' : 'text-slate-600 hover:text-slate-900'}`}>
          {isActive ? 'Currently open' : 'Open'}<ChevronRight size={13} />
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
  const [form, setForm] = useState({ name: '', venue: '', date: '', status: 'draft' as Event['status'] });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-5">Create Event</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Event Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="e.g. Annual Gala 2026" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Venue</label>
            <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="Venue name or address" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Event['status'] }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 bg-white">
                <option value="draft">Draft</option>
                <option value="planning">Planning</option>
                <option value="confirmed">Confirmed</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => { if (form.name) { onSave(form); onClose(); } }}
            className="px-4 py-2 text-sm text-white font-semibold rounded-xl hover:opacity-90"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
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
        <p className="text-sm text-slate-500 mb-0.5">Welcome back, Amara</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Events</h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <Filter size={14} />All statuses
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <ArrowUpDown size={14} />Sort: Date
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              style={{ backgroundColor: '#7A1F1F' }}
            >
              <Plus size={15} />New event
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 mx-auto max-w-[1200px]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Calendar} label="Active events" value={events.length} sub={`${liveCount} live now`} />
          <StatCard icon={Users} label="Total guests" value={totalGuests.toLocaleString()} sub="across all events" />
          <StatCard icon={Ticket} label="Tickets sold" value={totalTickets.toLocaleString()} sub="across all events" subColor="#10B981" />
          <StatCard icon={MessageSquare} label="Open comms" value={totalComms} sub="pending messages" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">Loading events…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Calendar size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No events yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Create your first event to get started</p>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm text-white font-semibold rounded-xl" style={{ backgroundColor: '#7A1F1F' }}>
              Create Event
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
