import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useEvent } from '../hooks/useEvents';
import { useGuests } from '../hooks/useGuests';
import { useTickets } from '../hooks/useTickets';
import { useVendors } from '../hooks/useVendors';
import {
  Layout, Users, Ticket, Store, MessageSquare,
  BarChart2, Settings, Loader2, ArrowUpRight,
  TrendingUp, Calendar, DollarSign, UserCheck,
  Video, MapPin, ExternalLink,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

const SUITE_ITEMS = [
  {
    icon: Layout,
    label: 'Floor Planner',
    desc: 'Design your stage & layout',
    path: 'planner',
    gradient: 'from-emerald-500 to-teal-600',
    light: '#ECFDF5',
    accent: '#059669',
  },
  {
    icon: Users,
    label: 'Guest List',
    desc: 'Manage RSVPs and seating',
    path: 'guests',
    gradient: 'from-blue-500 to-indigo-600',
    light: '#EFF6FF',
    accent: '#3B82F6',
  },
  {
    icon: Ticket,
    label: 'Ticketing',
    desc: 'Sell and track tickets',
    path: 'ticketing',
    gradient: 'from-violet-500 to-purple-600',
    light: '#F5F3FF',
    accent: '#7C3AED',
  },
  {
    icon: Store,
    label: 'Vendors',
    desc: 'Coordinate with suppliers',
    path: 'vendors',
    gradient: 'from-amber-400 to-orange-500',
    light: '#FFFBEB',
    accent: '#D97706',
  },
  {
    icon: MessageSquare,
    label: 'Event Com',
    desc: 'Communicate with attendees',
    path: 'event-com',
    gradient: 'from-green-400 to-emerald-600',
    light: '#F0FDF4',
    accent: '#16A34A',
  },
  {
    icon: BarChart2,
    label: 'Reports',
    desc: 'Analytics and insights',
    path: 'reports',
    gradient: 'from-indigo-500 to-blue-600',
    light: '#EEF2FF',
    accent: '#4F46E5',
  },
  {
    icon: Settings,
    label: 'Settings',
    desc: 'Event configuration',
    path: 'settings',
    gradient: 'from-slate-400 to-slate-600',
    light: '#F8FAFC',
    accent: '#64748B',
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 text-white rounded-xl px-3 py-2 shadow-xl text-xs">
        {label && <p className="font-semibold mb-1 text-slate-300">{label}</p>}
        {payload.map((p: any) => (
          <p key={p.name} className="font-medium flex items-center justify-between gap-3">
            <span style={{ color: p.fill || p.color || '#fff' }}>{p.name}:</span>
            <span className="font-bold">{p.value}{p.unit || ''}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function EventDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading: isLoadingEvent } = useEvent(id!);
  const { data: guests = [] } = useGuests(id!);
  const { data: tickets = [] } = useTickets(id!);
  const { data: vendors = [] } = useVendors(id!);

  const [activeChartTab, setActiveChartTab] = useState<'tickets' | 'rsvps' | 'progress'>('tickets');

  if (isLoadingEvent) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC] animate-pulse">
        {/* Banner Skeleton */}
        <div className="relative px-8 pt-12 pb-10 bg-slate-200">
          <div className="max-w-5xl mx-auto space-y-3.5">
            <div className="h-3 w-24 bg-slate-300 rounded-full" />
            <div className="h-8 w-64 bg-slate-300 rounded-xl" />
            <div className="flex gap-2.5 pt-1">
              <div className="h-5 w-32 bg-slate-300 rounded-full" />
              <div className="h-5 w-24 bg-slate-300 rounded-full" />
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
          {/* KPI Cards Row Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="h-3.5 w-20 bg-slate-200 rounded-full" />
                <div className="h-7 w-12 bg-slate-200 rounded-lg" />
                <div className="h-3 w-16 bg-slate-200 rounded-full" />
              </div>
            ))}
          </div>

          {/* Analytics Card Skeleton */}
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="h-4.5 w-36 bg-slate-200 rounded-full" />
                <div className="h-3 w-48 bg-slate-200 rounded-full" />
              </div>
              <div className="h-8 w-48 bg-slate-150 rounded-xl" />
            </div>
            <div className="h-64 bg-slate-100 rounded-2xl" />
          </div>

          {/* Module Grid Skeleton */}
          <div>
            <div className="h-4.5 w-28 bg-slate-200 rounded-full mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-slate-200" />
                    <div className="w-4 h-4 rounded-md bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-3.5 w-24 bg-slate-200 rounded-full" />
                    <div className="h-3 w-36 bg-slate-200 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center gap-3">
        <p className="text-slate-500 text-sm">Event not found</p>
        <button
          onClick={() => navigate('/events')}
          className="text-sm text-[#7A1F1F] hover:underline font-medium"
        >
          Back to Events
        </button>
      </div>
    );
  }

  // Data calculations
  const totalRevenue = tickets.reduce((s, t) => s + t.sold * t.price, 0);
  const confirmedGuests = guests.filter(g => g.rsvpStatus === 'confirmed').length;

  // Chart 1: Ticket Sales Data
  const ticketBarData = tickets.map(t => ({
    name: t.name.length > 14 ? t.name.slice(0, 14) + '…' : t.name,
    Sold: t.sold,
    Remaining: Math.max(0, t.total - t.sold),
  }));

  // Chart 2: RSVP Status Data
  const rsvpBarData = [
    { name: 'Confirmed', Guests: guests.filter(g => g.rsvpStatus === 'confirmed').length, fill: '#10B981' },
    { name: 'Pending',   Guests: guests.filter(g => g.rsvpStatus === 'pending').length,   fill: '#F59E0B' },
    { name: 'Declined',  Guests: guests.filter(g => g.rsvpStatus === 'declined').length,  fill: '#EF4444' },
    { name: 'Maybe',     Guests: guests.filter(g => g.rsvpStatus === 'maybe').length,     fill: '#8B5CF6' },
  ];

  // Chart 3: Progress Data (%)
  const rsvpPct = event.guestCount > 0 ? Math.round((event.guestRsvp / event.guestCount) * 100) : 0;
  const ticketPct = event.ticketsTotal > 0 ? Math.round((event.ticketsSold / event.ticketsTotal) * 100) : 0;
  const seatPct = event.seatedTotal > 0 ? Math.round((event.seatedCount / event.seatedTotal) * 100) : 0;
  const vendorPct = vendors.length > 0 ? Math.round((vendors.filter(v => v.status === 'confirmed').length / vendors.length) * 100) : 0;

  const progressBarData = [
    { name: 'Guest RSVPs', Progress: rsvpPct, fill: '#7A1F1F' },
    { name: 'Tickets Sold', Progress: ticketPct, fill: '#D4A24C' },
    { name: 'Seated', Progress: seatPct, fill: '#3B82F6' },
    { name: 'Vendors', Progress: vendorPct, fill: '#10B981' },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <SEO title={event?.name ? `${event.name} Dashboard` : 'Event Dashboard'} />

      {/* Banner */}
      <div
        className="relative px-4 py-8 sm:px-8 sm:pt-12 sm:pb-10 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url(${event.coverImage || '/default-banner.jpg'})` }}
      >
        {/* Semi-transparent dark overlay scrim for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />

        <div className="relative max-w-5xl mx-auto z-10 space-y-3.5">
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1.5">
              Event Dashboard
            </p>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              {event.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {event.isVirtual ? (
              <a
                href={event.virtualLink ? (event.virtualLink.startsWith('http') ? event.virtualLink : `https://${event.virtualLink}`) : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 px-3.5 py-1 rounded-full text-xs font-semibold transition-colors duration-150"
              >
                <Video size={13} /> Virtual Event <ExternalLink size={11} />
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 text-white/90 px-3.5 py-1 rounded-full text-xs font-semibold">
                <MapPin size={13} className="text-[#D4A24C]" /> {event.venue || 'No location set'}
              </span>
            )}
            
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 text-white/90 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
              Type: {event.type || 'Other'}
            </span>
          </div>

          {/* Date & Time display */}
          <div className="flex flex-wrap gap-2 pt-1">
            {event.dates && event.dates.length > 0 ? (
              event.dates.map((d, index) => (
                <span key={index} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/5 text-white/80 px-3 py-1 rounded-xl text-xs font-medium backdrop-blur-sm">
                  <Calendar size={13} className="text-[#D4A24C]" />
                  {d.date} {d.startTime && `(${d.startTime}${d.endTime ? ` - ${d.endTime}` : ''})`}
                </span>
              ))
            ) : (
              event.date && (
                <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/5 text-white/80 px-3 py-1 rounded-xl text-xs font-medium backdrop-blur-sm">
                  <Calendar size={13} className="text-[#D4A24C]" />
                  {event.date} {event.startTime && `(${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''})`}
                </span>
              )
            )}
          </div>

          {event.description && (
            <p className="text-white/80 text-sm font-medium mt-1 leading-relaxed max-w-2xl line-clamp-3">
              {event.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-8 sm:py-8 space-y-6 sm:space-y-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Users size={14} className="text-[#7A1F1F]" /> Total Guests
            </div>
            <div className="text-2xl font-black text-slate-900">{guests.length}</div>
            <p className="text-xs text-slate-400 mt-1 font-medium">{confirmedGuests} confirmed</p>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Ticket size={14} className="text-[#D4A24C]" /> Tickets Sold
            </div>
            <div className="text-2xl font-black text-slate-900">{event.ticketsSold || 0}</div>
            <p className="text-xs text-slate-400 mt-1 font-medium">of {event.ticketsTotal || 0} capacity</p>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <DollarSign size={14} className="text-emerald-600" /> Revenue
            </div>
            <div className="text-2xl font-black text-slate-900">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-600 mt-1 font-medium">gross tickets</p>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Store size={14} className="text-amber-600" /> Vendors
            </div>
            <div className="text-2xl font-black text-slate-900">{vendors.length}</div>
            <p className="text-xs text-slate-400 mt-1 font-medium">{vendors.filter(v => v.status === 'confirmed').length} confirmed</p>
          </div>
        </div>

        {/* Bar Chart Section */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Event Analytics</h2>
              <p className="text-xs text-slate-400 mt-0.5">Visual breakdown of event performance & statistics</p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setActiveChartTab('tickets')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeChartTab === 'tickets'
                    ? 'bg-white text-[#7A1F1F] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Ticket Sales
              </button>
              <button
                onClick={() => setActiveChartTab('rsvps')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeChartTab === 'rsvps'
                    ? 'bg-white text-[#7A1F1F] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Guest RSVPs
              </button>
              <button
                onClick={() => setActiveChartTab('progress')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeChartTab === 'progress'
                    ? 'bg-white text-[#7A1F1F] shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Completion %
              </button>
            </div>
          </div>

          {/* Render Active Bar Chart */}
          {activeChartTab === 'tickets' && (
            <div>
              {ticketBarData.length === 0 ? (
                <div className="py-14 text-center text-slate-400 text-sm">
                  <Ticket size={28} className="mx-auto mb-2 opacity-50" />
                  No ticket types created yet for this event.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ticketBarData} barSize={32} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', radius: 8 }} />
                    <Bar dataKey="Sold" stackId="a" fill="#7A1F1F" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Remaining" stackId="a" fill="#F0EAE0" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-[#7A1F1F]" /> Sold Tickets
                </div>
                <div className="flex items-center gap-2 font-medium text-slate-600">
                  <span className="w-3 h-3 rounded-sm bg-[#F0EAE0]" /> Remaining Capacity
                </div>
              </div>
            </div>
          )}

          {activeChartTab === 'rsvps' && (
            <div>
              {guests.length === 0 ? (
                <div className="py-14 text-center text-slate-400 text-sm">
                  <Users size={28} className="mx-auto mb-2 opacity-50" />
                  No guests added yet for this event.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={rsvpBarData} barSize={38} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', radius: 8 }} />
                    <Bar dataKey="Guests" radius={[6, 6, 0, 0]}>
                      {rsvpBarData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
                {rsvpBarData.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}: <span className="font-bold">{item.Guests}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeChartTab === 'progress' && (
            <div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={progressBarData} barSize={38} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', radius: 8 }} />
                  <Bar dataKey="Progress" unit="%" radius={[6, 6, 0, 0]}>
                    {progressBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs">
                {progressBarData.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5 font-medium text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    {item.name}: <span className="font-bold">{item.Progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Module grid */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Event Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SUITE_ITEMS.map(({ icon: Icon, label, desc, path, gradient, light }) => (
              <button
                key={path}
                onClick={() => navigate(`/events/${id}/${path}`)}
                className="group relative bg-white rounded-2xl border border-slate-150 p-5 text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Subtle gradient tint on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl"
                  style={{ background: `radial-gradient(circle at top left, ${light}, transparent 70%)` }}
                />

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm`}
                    >
                      <Icon size={18} />
                    </div>
                    <ArrowUpRight
                      size={15}
                      className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-150"
                    />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-0.5">{label}</h3>
                  <p className="text-xs text-slate-400 leading-snug">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

