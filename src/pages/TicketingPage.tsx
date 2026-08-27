import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Ticket, TrendingUp, DollarSign, Users, MoreHorizontal, Link as LinkIcon, CheckCircle2, X, BarChart2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../hooks/useTickets';
import { useGuests } from '../hooks/useGuests';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Ticket as TicketType } from '../types';

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10B981', bg: '#ECFDF5' },
  sold_out: { label: 'Sold out', color: '#EF4444', bg: '#FEF2F2' },
  paused: { label: 'Paused', color: '#94A3B8', bg: '#F1F5F9' },
};



/** Modal to display and copy a per-ticket RSVP link */
function RsvpLinkModal({ ticket, eventId, onClose }: { ticket: TicketType; eventId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const rsvpUrl = `${window.location.origin}/events/${eventId}/invite?ticket=${ticket._id}`;
  const isPaid = ticket.price > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(rsvpUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-100/80 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7A1F1F]/10 to-[#FDF5EE]/50 px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#7A1F1F] border border-slate-100">
              <Ticket size={20} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800">RSVP Invite Link</h2>
              <p className="text-xs text-slate-500 font-medium">Share link or scan QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Ticket Information Card */}
          <div className="bg-[#FAF7F2] border border-slate-150 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Ticket Type</p>
              <h3 className="font-bold text-slate-800 text-base">{ticket.name}</h3>
            </div>
            <div className="text-right">
              <span
                className="inline-block text-xs font-bold px-3 py-1 rounded-full border shadow-sm"
                style={{
                  background: isPaid ? '#FEF3C7' : '#ECFDF5',
                  color: isPaid ? '#B45309' : '#059669',
                  borderColor: isPaid ? '#FDE68A' : '#A7F3D0',
                }}
              >
                {isPaid ? `$${ticket.price}` : 'Free RSVP'}
              </span>
            </div>
          </div>

          {/* Styled Copy Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Invite URL</label>
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:bg-white focus-within:border-[#7A1F1F] focus-within:ring-4 focus-within:ring-[#7A1F1F]/5 transition-all">
              <input
                readOnly
                value={rsvpUrl}
                className="w-full bg-transparent px-3 py-1.5 text-xs text-slate-600 font-mono focus:outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-xs font-bold text-white rounded-lg transition-all shrink-0 hover:opacity-95"
                style={{ backgroundColor: copied ? '#10B981' : '#7A1F1F' }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 border border-slate-150 rounded-2xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Scan to RSVP</span>
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(rsvpUrl)}`}
                alt="RSVP QR Code"
                className="w-28 h-28"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-center text-center">
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            Send this invite URL or let guests scan the QR code to direct them to the RSVP registration page.
          </p>
        </div>
      </div>
    </div>
  );
}

interface TicketOptionsModalProps {
  ticket: TicketType;
  eventId: string;
  onClose: () => void;
  onShowRsvp: (ticket: TicketType) => void;
  onPause: (ticket: TicketType) => void;
  onResume: (ticket: TicketType) => void;
  onDelete: (ticketId: string) => void;
}

function TicketOptionsModal({
  ticket,
  eventId,
  onClose,
  onShowRsvp,
  onPause,
  onResume,
  onDelete,
}: TicketOptionsModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-slate-100/80 animate-in zoom-in-95 duration-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-[#7A1F1F] uppercase tracking-wider">Ticket Options</span>
            <h3 className="font-extrabold text-slate-800 text-base mt-0.5">{ticket.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-1.5">
          <button
            onClick={() => {
              onShowRsvp(ticket);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#7A1F1F] transition-all text-left"
          >
            <LinkIcon size={16} className="text-slate-400 shrink-0" />
            Copy RSVP Link
          </button>

          <button
            onClick={() => {
              navigate(`/events/${eventId}/ticketing/${ticket._id}`);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
          >
            <Users size={16} className="text-slate-400 shrink-0" />
            View Registered Guests
          </button>

          {ticket.status !== 'paused' ? (
            <button
              onClick={() => {
                onPause(ticket);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
            >
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause Ticket Sales
            </button>
          ) : (
            <button
              onClick={() => {
                onResume(ticket);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
            >
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resume Ticket Sales
            </button>
          )}

          <div className="border-t border-slate-100 my-2" />

          <button
            onClick={() => {
              if (confirm('Delete this ticket type?')) {
                onDelete(ticket._id);
                onClose();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all text-left"
          >
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Ticket Type
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function TicketingPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tickets = [], isLoading } = useTickets(id!);
  const { data: guests = [], isLoading: isLoadingGuests } = useGuests(id!);
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const salesTimelineData = useMemo(() => {
    const soldTickets = guests.filter(g => g.ticketId && g.createdAt);
    if (soldTickets.length === 0) {
      return [
        { date: '5 days ago', sales: 0 },
        { date: '4 days ago', sales: 0 },
        { date: '3 days ago', sales: 0 },
        { date: '2 days ago', sales: 0 },
        { date: 'Yesterday', sales: 0 },
        { date: 'Today', sales: 0 }
      ];
    }

    const dayCounts: Record<string, number> = {};
    soldTickets.forEach(g => {
      const d = new Date(g.createdAt || Date.now());
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
    });

    const sortedDates = Object.keys(dayCounts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulative = 0;
    return sortedDates.map(date => {
      cumulative += dayCounts[date];
      return { date, sales: cumulative };
    });
  }, [guests]);

  const [activeOptionTicket, setActiveOptionTicket] = useState<TicketType | null>(null);
  const [rsvpTicket, setRsvpTicket] = useState<TicketType | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('new') === 'true') {
      navigate(`/events/${id}/ticketing/new`, { replace: true });
    }
  }, [location.search, id, navigate]);

  const totalSold = tickets.reduce((s, t) => s + t.sold, 0);
  const totalCapacity = tickets.reduce((s, t) => s + t.total, 0);
  const totalRevenue = tickets.reduce((s, t) => s + t.sold * t.price, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC] animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-32 bg-slate-200 rounded-full" />
            <div className="h-6 w-48 bg-slate-200 rounded-xl" />
          </div>
          <div className="h-9 w-36 bg-slate-200 rounded-xl" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 max-w-[1200px] mx-auto w-full space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="h-3 w-16 bg-slate-200 rounded-full" />
                <div className="h-6 w-8 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Timeline Card */}
          <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm h-64 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-slate-200 rounded-full" />
              <div className="h-3 w-56 bg-slate-200 rounded-full" />
            </div>
            <div className="h-40 bg-slate-100 rounded-xl" />
          </div>

          {/* Tickets Cards Skeleton Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-4.5 w-32 bg-slate-200 rounded-full" />
                    <div className="h-3 w-48 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-5 w-5 bg-slate-150 rounded-lg" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <div className="h-3 w-12 bg-slate-200 rounded-full" />
                    <div className="h-4 w-8 bg-slate-200 rounded-full" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-12 bg-slate-200 rounded-full" />
                    <div className="h-4 w-8 bg-slate-200 rounded-full" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-12 bg-slate-200 rounded-full" />
                    <div className="h-4 w-8 bg-slate-200 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-3 w-16 bg-slate-200 rounded-full" />
                  <div className="h-2 w-full bg-slate-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SEO title="Ticketing" />

      {rsvpTicket && (
        <RsvpLinkModal
          ticket={rsvpTicket}
          eventId={id!}
          onClose={() => setRsvpTicket(null)}
        />
      )}

      {activeOptionTicket && (
        <TicketOptionsModal
          ticket={activeOptionTicket}
          eventId={id!}
          onClose={() => setActiveOptionTicket(null)}
          onShowRsvp={(ticket) => setRsvpTicket(ticket)}
          onPause={(ticket) => updateTicket.mutate({ id: ticket._id, data: { status: 'paused' } })}
          onResume={(ticket) => updateTicket.mutate({ id: ticket._id, data: { status: 'active' } })}
          onDelete={(ticketId) => deleteTicket.mutate(ticketId)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <p className="text-sm text-slate-500 mb-0.5">{t('ticketing.subtitle')}</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{t('ticketing.title')}</h1>
          <button
            onClick={() => navigate(`/events/${id}/ticketing/new`)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            <Plus size={15} />
            {t('ticketing.new_ticket_type')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 max-w-[1200px] mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {[
            { icon: Ticket, label: t('ticketing.total_sold'), value: totalSold.toLocaleString(), sub: `of ${totalCapacity.toLocaleString()}`, color: '#7A1F1F' },
            { icon: DollarSign, label: t('ticketing.revenue_label'), value: `$${totalRevenue.toLocaleString()}`, sub: 'gross', color: '#10B981' },
            { icon: TrendingUp, label: t('ticketing.sell_through'), value: totalCapacity > 0 ? `${Math.round(totalSold / totalCapacity * 100)}%` : '0%', sub: 'rate', color: '#F59E0B' },
            { icon: Users, label: t('ticketing.ticket_types'), value: tickets.length, sub: 'active types', color: '#7A1F1F' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Icon size={15} />{label}</div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <p className="text-xs text-slate-400 mt-0.5" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Ticket Sales Over Time Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Ticket Sales Over Time</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Timeline of cumulative ticket sales across this event</p>
            </div>
            <span className="text-[10px] bg-green-50 border border-green-200/50 text-green-600 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Live Sales Tracker
            </span>
          </div>

          <div className="h-60 w-full">
            {guests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart2 size={32} className="opacity-20 mb-2" />
                <p className="text-xs font-semibold">No tickets sold yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94A3B8', fontWeight: 650 }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94A3B8', fontWeight: 650 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Tickets Sold"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ticket cards */}
        {tickets.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Ticket size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium mb-1">{t('ticketing.empty_title')}</p>
            <p className="text-sm text-slate-400 mb-4">{t('ticketing.empty_subtitle')}</p>
            <button onClick={() => navigate(`/events/${id}/ticketing/new`)} className="px-4 py-2 text-sm text-white font-semibold rounded-xl" style={{ backgroundColor: '#7A1F1F' }}>
              {t('ticketing.create_title')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tickets.map(ticket => {
              const pct = ticket.total > 0 ? Math.round(ticket.sold / ticket.total * 100) : 0;
              const status = STATUS_CONFIG[ticket.status];
              const revenue = ticket.sold * ticket.price;
              const isPaid = ticket.price > 0;
              return (
                <div
                  key={ticket._id}
                  onClick={() => navigate(`/events/${id}/ticketing/${ticket._id}`)}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm cursor-pointer hover:border-[#7A1F1F]/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{ticket.name}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                        {/* Paid / Free badge */}
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: isPaid ? '#FEF3C7' : '#ECFDF5', color: isPaid ? '#B45309' : '#059669' }}
                        >
                          {isPaid ? 'Paid' : 'Free'}
                        </span>
                      </div>
                      {ticket.description && <p className="text-xs text-slate-400">{ticket.description}</p>}
                    </div>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveOptionTicket(ticket);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-100"
                      >
                        <MoreHorizontal size={16} className="text-slate-400 group-hover:text-slate-600" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">{t('ticketing.price_label')}</p>
                      <p className="font-semibold text-slate-800">{ticket.price === 0 ? t('ticketing.free') : `$${ticket.price}`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">{t('ticketing.sold_label')}</p>
                      <p className="font-semibold text-slate-800">{ticket.sold} / {ticket.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">{t('ticketing.revenue_label')}</p>
                      <p className="font-semibold text-slate-800">${revenue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>{t('ticketing.progress')}</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <ProgressBar value={ticket.sold} max={ticket.total} color={pct >= 80 ? '#EF4444' : '#7A1F1F'} />
                  </div>

                  {(ticket.saleStart || ticket.saleEnd) && (
                    <p className="text-xs text-slate-400 mt-3">
                      {ticket.saleStart && `From ${ticket.saleStart}`}
                      {ticket.saleStart && ticket.saleEnd && ' · '}
                      {ticket.saleEnd && `Until ${ticket.saleEnd}`}
                    </p>
                  )}

                   {/* Card footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/events/${id}/ticketing/${ticket._id}`); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#7A1F1F] hover:text-[#5C1414] transition-colors"
                    >
                      <Users size={13} />
                      {t('ticketing.view_guests')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
