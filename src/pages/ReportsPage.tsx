import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Users, Ticket, Store, MessageSquare, TrendingUp,
  Calendar, DollarSign, UserCheck, ArrowUpRight,
} from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useGuests } from '../hooks/useGuests';
import { useTickets } from '../hooks/useTickets';
import { useVendors } from '../hooks/useVendors';
import { useComms } from '../hooks/useComms';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-900 text-white rounded-xl px-3 py-2 shadow-xl text-xs">
        {label && <p className="font-medium mb-1 text-slate-300">{label}</p>}
        {payload.map((p: any) => (
          <p key={p.name} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
}

function GaugeChart({ pct, checked, total }: { pct: number; checked: number; total: number }) {
  const r = 56, cx = 80, cy = 75;
  const circ = Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="flex flex-col items-center py-2">
      <svg width={160} height={96} viewBox="0 0 160 96">
        <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke="#F0EAE0" strokeWidth={12} strokeLinecap="round" />
        <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4A24C" />
            <stop offset="100%" stopColor="#7A1F1F" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-8 text-center">
        <p className="text-3xl font-bold text-slate-900">{checked}</p>
        <p className="text-xs text-slate-400 mt-0.5">of {total} · <span className="font-semibold text-[#7A1F1F]">{pct}%</span></p>
      </div>
    </div>
  );
}

function Ring({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={7} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

const RSVP_COLORS = { confirmed: '#10B981', pending: '#F59E0B', declined: '#EF4444', maybe: '#8B5CF6' };
const STATUS_COLORS = { live: '#10B981', confirmed: '#7A1F1F', planning: '#F59E0B', draft: '#CBD5E1' };

export default function ReportsPage() {
  const { data: events = [] } = useEvents();
  const { data: guests = [] } = useGuests();
  const { data: tickets = [] } = useTickets();
  const { data: vendors = [] } = useVendors();
  const { data: comms = [] } = useComms();

  const totalRevenue        = tickets.reduce((s, t) => s + t.sold * t.price, 0);
  const totalTicketsSold    = tickets.reduce((s, t) => s + t.sold, 0);
  const totalTicketsCap     = tickets.reduce((s, t) => s + t.total, 0);
  const confirmedGuests     = guests.filter(g => g.rsvpStatus === 'confirmed').length;
  const checkedIn           = guests.filter(g => g.checkedIn).length;
  const confirmedVendors    = vendors.filter(v => v.status === 'confirmed').length;
  const totalContractValue  = vendors.reduce((s, v) => s + v.contractValue, 0);
  const paidVendors         = vendors.filter(v => v.paid).length;
  const sentComms           = comms.filter(c => c.status === 'sent').length;
  const scheduledComms      = comms.filter(c => c.status === 'scheduled').length;
  const checkInPct          = guests.length > 0 ? Math.round(checkedIn / guests.length * 100) : 0;
  const ticketPct           = totalTicketsCap > 0 ? Math.round(totalTicketsSold / totalTicketsCap * 100) : 0;
  const confirmPct          = guests.length > 0 ? Math.round(confirmedGuests / guests.length * 100) : 0;
  const liveEvents          = events.filter(e => e.status === 'live').length;

  const rsvpSlices = [
    { name: 'Confirmed', value: confirmedGuests, color: '#10B981' },
    { name: 'Pending',   value: guests.filter(g => g.rsvpStatus === 'pending').length,  color: '#F59E0B' },
    { name: 'Declined',  value: guests.filter(g => g.rsvpStatus === 'declined').length, color: '#EF4444' },
    { name: 'Maybe',     value: guests.filter(g => g.rsvpStatus === 'maybe').length,    color: '#8B5CF6' },
  ].filter(d => d.value > 0);

  const ticketBarData = tickets.map(t => ({
    name: t.name.length > 12 ? t.name.slice(0, 12) + '…' : t.name,
    Sold: t.sold,
    Available: Math.max(0, t.total - t.sold),
  }));

  const kpis = [
    {
      icon: Calendar, label: 'Total Events', value: events.length,
      sub: `${liveEvents} live now`, accent: '#7A1F1F', light: '#FAF7F2',
      badge: liveEvents > 0 ? `${liveEvents} Live` : undefined, badgeColor: '#10B981',
    },
    {
      icon: Users, label: 'Total Guests', value: guests.length,
      sub: `${confirmedGuests} confirmed`, accent: '#10B981', light: '#ECFDF5',
      badge: guests.length > 0 ? `${confirmPct}%` : undefined, badgeColor: '#10B981',
    },
    {
      icon: Ticket, label: 'Tickets Sold', value: totalTicketsSold.toLocaleString(),
      sub: `of ${totalTicketsCap.toLocaleString()} capacity`, accent: '#F59E0B', light: '#FFFBEB',
      badge: totalTicketsCap > 0 ? `${ticketPct}% sold` : undefined, badgeColor: '#F59E0B',
    },
    {
      icon: TrendingUp, label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`,
      sub: 'gross ticket revenue', accent: '#7A1F1F', light: '#FAF7F2',
      badge: undefined, badgeColor: '',
    },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Overview & analytics</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live data
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
        <div className="max-w-6xl mx-auto w-full px-0 space-y-5">

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(({ icon: Icon, label, value, sub, accent, light, badge, badgeColor }) => (
              <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: light }}>
                    <Icon size={17} style={{ color: accent }} />
                  </div>
                  {badge && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: badgeColor + '15', color: badgeColor }}>
                      <ArrowUpRight size={10} />{badge}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* RSVP donut */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">RSVP Breakdown</h3>
                <span className="text-xs text-slate-400 font-medium">{guests.length} total</span>
              </div>
              {guests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                  <Users size={32} className="mb-2" />
                  <p className="text-sm">No guests yet</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={rsvpSlices} cx="50%" cy="50%" innerRadius={55} outerRadius={78}
                          paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                          {rsvpSlices.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-2xl font-bold text-slate-900">{confirmPct}%</p>
                      <p className="text-xs text-slate-400">confirmed</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {rsvpSlices.map(({ name, value, color }) => (
                      <div key={name} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg" style={{ background: color + '10' }}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-slate-500">{name}</span>
                        </div>
                        <span className="font-bold" style={{ color }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Ticket bar */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Ticket Sales</h3>
                <span className="text-xs text-slate-400 font-medium">{ticketPct}% sold</span>
              </div>
              {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                  <Ticket size={32} className="mb-2" />
                  <p className="text-sm">No tickets yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ticketBarData} barSize={22} barCategoryGap="35%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', radius: 8 }} />
                    <Bar dataKey="Sold"      stackId="a" fill="#7A1F1F" />
                    <Bar dataKey="Available" stackId="a" fill="#F0EAE0" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />Sold</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm bg-[#F5E6D3]" />Available</div>
              </div>
            </div>

            {/* Event status */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800">Event Status</h3>
                <span className="text-xs text-slate-400 font-medium">{events.length} events</span>
              </div>
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                  <Calendar size={32} className="mb-2" />
                  <p className="text-sm">No events yet</p>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  {([
                    { label: 'Live',      count: events.filter(e => e.status === 'live').length,      color: STATUS_COLORS.live },
                    { label: 'Confirmed', count: events.filter(e => e.status === 'confirmed').length, color: STATUS_COLORS.confirmed },
                    { label: 'Planning',  count: events.filter(e => e.status === 'planning').length,  color: STATUS_COLORS.planning },
                    { label: 'Draft',     count: events.filter(e => e.status === 'draft').length,     color: STATUS_COLORS.draft },
                  ]).map(({ label, count, color }) => {
                    const pct = events.length > 0 ? Math.round(count / events.length * 100) : 0;
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-slate-600 font-medium">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{count}</span>
                            <span className="text-slate-300 w-8 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Check-in gauge */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#FDF5EE] flex items-center justify-center">
                  <UserCheck size={14} className="text-[#7A1F1F]" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">Check-ins</h3>
              </div>
              <GaugeChart pct={checkInPct} checked={checkedIn} total={guests.length} />
            </div>

            {/* Vendor status */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#FAF7F2] flex items-center justify-center">
                  <Store size={14} className="text-[#3FA65B]" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">Vendors</h3>
              </div>
              {vendors.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No vendors yet</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <Ring pct={vendors.length > 0 ? Math.round(confirmedVendors / vendors.length * 100) : 0} color="#10B981" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-900">{confirmedVendors}</span>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    {[
                      { label: 'Confirmed', count: confirmedVendors, color: '#10B981' },
                      { label: 'Pending',   count: vendors.filter(v => v.status === 'pending').length,   color: '#F59E0B' },
                      { label: 'Cancelled', count: vendors.filter(v => v.status === 'cancelled').length, color: '#EF4444' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                          {label}
                        </div>
                        <span className="font-bold text-slate-700">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contracts */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <DollarSign size={14} className="text-amber-500" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">Contracts</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-0.5">${totalContractValue.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mb-4">{paidVendors} of {vendors.length} paid</p>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-[#FAF7F2]0 transition-all duration-700"
                  style={{ width: vendors.length > 0 ? `${Math.round(paidVendors / vendors.length * 100)}%` : '0%' }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mt-1.5">
                <span>{vendors.length > 0 ? Math.round(paidVendors / vendors.length * 100) : 0}% paid</span>
                <span>{vendors.length - paidVendors} outstanding</span>
              </div>
            </div>

            {/* Comms */}
            <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-[#FDF5EE] flex items-center justify-center">
                  <MessageSquare size={14} className="text-[#7A1F1F]" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">Communications</h3>
              </div>
              <p className="text-2xl font-bold text-slate-900 mb-0.5">{comms.length}</p>
              <p className="text-xs text-slate-400 mb-4">{sentComms} sent · {scheduledComms} scheduled</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Sent',      count: sentComms,      total: comms.length, color: '#7A1F1F' },
                  { label: 'Scheduled', count: scheduledComms, total: comms.length, color: '#F59E0B' },
                  { label: 'Draft',     count: comms.filter(c => c.status === 'draft').length, total: comms.length, color: '#CBD5E1' },
                ].map(({ label, count, total, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-700">{count}</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: total > 0 ? `${Math.round(count / total * 100)}%` : '0%', backgroundColor: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
