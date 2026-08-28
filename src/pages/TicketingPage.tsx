import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, Ticket, TrendingUp, DollarSign, Users, MoreHorizontal,
  Link as LinkIcon, CheckCircle2, X, BarChart2, QrCode, Download,
  Share2, Eye, EyeOff, Search, ChevronDown, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../hooks/useTickets';
import { useGuests } from '../hooks/useGuests';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Ticket as TicketType, Guest } from '../types';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10B981', bg: '#ECFDF5' },
  sold_out: { label: 'Sold out', color: '#EF4444', bg: '#FEF2F2' },
  paused: { label: 'Paused', color: '#94A3B8', bg: '#F1F5F9' },
};

/** Modal to display and download a per-ticket RSVP QR Code & invite link */
function RsvpLinkModal({ ticket, eventId, onClose }: { ticket: TicketType; eventId: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const rsvpUrl = `${window.location.origin}/events/${eventId}/invite?ticket=${ticket._id}`;
  const qrPngUrl = `/api/events/${eventId}/qr-code?ticketId=${ticket._id}&format=png`;
  const qrSvgUrl = `/api/events/${eventId}/qr-code?ticketId=${ticket._id}&format=svg`;
  const isPaid = ticket.price > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(rsvpUrl);
    setCopied(true);
    toast.success('RSVP link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `RSVP for ${ticket.name}`,
          text: `Join us! Reserve your ${ticket.name} ticket here:`,
          url: rsvpUrl,
        });
        toast.success('Link shared!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleDownloadQR = async (format: 'png' | 'svg') => {
    try {
      const url = format === 'svg' ? qrSvgUrl : qrPngUrl;
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${ticket.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-qr.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success(`QR Code downloaded as ${format.toUpperCase()}!`);
    } catch {
      toast.error('Failed to download QR code');
    }
  };

  const handleDownloadWalletPass = async () => {
    try {
      toast.loading('Generating pass...', { id: 'wallet' });
      const res = await fetch(`/api/events/${eventId}/wallet-pass?ticketId=${ticket._id}`);
      if (!res.ok) throw new Error('Pass generation failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ticket.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pkpass`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Apple Wallet pass downloaded!', { id: 'wallet' });
    } catch {
      toast.error('Failed to generate wallet pass', { id: 'wallet' });
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FAF0E8] via-[#FDF5EE] to-white px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#7A1F1F] border border-[#7A1F1F]/10 shrink-0">
              <QrCode size={18} className="sm:hidden" />
              <QrCode size={20} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">RSVP & QR Pass</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">{ticket.name} Ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-5 overflow-y-auto flex-1">
          {/* Ticket Info Card */}
          <div className="bg-gradient-to-r from-[#FAF0E8]/90 via-[#FDF5EE]/70 to-[#FAF0E8]/90 border border-[#7A1F1F]/15 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ticket Tier</span>
              <span
                className="inline-flex items-center text-[10px] sm:text-xs font-extrabold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border whitespace-nowrap shrink-0 shadow-2xs"
                style={{
                  background: isPaid ? '#FEF3C7' : '#ECFDF5',
                  color: isPaid ? '#B45309' : '#059669',
                  borderColor: isPaid ? '#FDE68A' : '#A7F3D0',
                }}
              >
                {isPaid ? `$${ticket.price}` : 'Free RSVP'}
              </span>
            </div>
            
            <div className="flex items-baseline justify-between gap-2 pt-0.5">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug break-words flex-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                {ticket.name}
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-600 bg-white/90 border border-slate-200/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
                <QrCode size={10} className="text-[#D4A24C] shrink-0" /> {ticket.qrScans || 0} scans
              </span>
            </div>
          </div>

          {/* QR Code Showcase Section */}
          <div className="flex flex-col items-center justify-center p-3.5 sm:p-5 bg-slate-50/60 border border-slate-200/70 rounded-xl sm:rounded-2xl shadow-xs">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">
              Direct Registration QR
            </span>
            <div className="p-2.5 sm:p-3.5 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden group">
              <img
                src={qrPngUrl}
                alt={`${ticket.name} QR Code`}
                className="w-28 h-28 sm:w-36 sm:h-36 object-contain transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 mt-2 sm:mt-3 font-medium text-center">
              Scans open the <strong className="text-slate-700">{ticket.name}</strong> signup flow
            </span>
          </div>

          {/* Styled Copy Input */}
          <div className="space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Invite URL</label>
            <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1 focus-within:bg-white focus-within:border-[#7A1F1F] focus-within:ring-2 focus-within:ring-[#7A1F1F]/15 transition-all">
              <input
                readOnly
                value={rsvpUrl}
                className="w-full bg-transparent px-2.5 py-1 text-[11px] sm:text-xs text-slate-600 font-mono focus:outline-none select-all truncate"
              />
              <button
                onClick={handleCopy}
                className="px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-extrabold text-white rounded-lg transition-all shrink-0 hover:opacity-95 shadow-xs flex items-center gap-1"
                style={{ backgroundColor: copied ? '#10B981' : '#7A1F1F' }}
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={12} /> Copied!
                  </>
                ) : (
                  'Copy'
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <button
              onClick={handleShareLink}
              className="flex items-center justify-center gap-1 py-2 sm:py-2.5 bg-[#7A1F1F] hover:bg-[#631818] text-white text-[11px] sm:text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
            >
              <Share2 size={12} /> Share Link
            </button>
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="w-full flex items-center justify-center gap-1 py-2 sm:py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] sm:text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98]"
              >
                <Download size={12} /> Export QR <ChevronDown size={11} />
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 bottom-full mb-1.5 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 min-w-[130px] z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <button
                    onClick={() => { handleDownloadQR('png'); setExportMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    As PNG Image
                  </button>
                  <button
                    onClick={() => { handleDownloadQR('svg'); setExportMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    As Vector SVG
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Apple Wallet Button */}
          <button
            onClick={handleDownloadWalletPass}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 bg-black hover:bg-slate-900 text-white text-[11px] sm:text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-[0.99] border border-white/10"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.64-.78 1.08-1.86.96-2.95-1 .04-2.17.67-2.85 1.46-.58.67-1.1 1.77-.96 2.83 1.12.09 2.21-.57 2.85-1.34z" />
            </svg>
            Add to Apple Wallet
          </button>
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
  onToggleRsvp: (ticket: TicketType) => void;
  onExportCsv: (ticket: TicketType) => void;
  onDelete: (ticketId: string) => void;
}

function TicketOptionsModal({
  ticket,
  eventId,
  onClose,
  onShowRsvp,
  onPause,
  onResume,
  onToggleRsvp,
  onExportCsv,
  onDelete,
}: TicketOptionsModalProps) {
  const navigate = useNavigate();
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
        <div className="space-y-1">
          <button
            onClick={() => {
              onShowRsvp(ticket);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#7A1F1F] transition-all text-left"
          >
            <QrCode size={16} className="text-[#7A1F1F] shrink-0" />
            RSVP Link & QR Pass
          </button>

          <button
            onClick={() => {
              navigate(`/events/${eventId}/ticketing/${ticket._id}`);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
          >
            <Users size={16} className="text-slate-400 shrink-0" />
            View Registered Guests
          </button>

          <button
            onClick={() => {
              onToggleRsvp(ticket);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
          >
            {ticket.rsvpDisabled ? (
              <>
                <Eye size={16} className="text-emerald-500 shrink-0" />
                Resume RSVP Submissions
              </>
            ) : (
              <>
                <EyeOff size={16} className="text-amber-500 shrink-0" />
                Freeze RSVP Submissions
              </>
            )}
          </button>

          <button
            onClick={() => {
              onExportCsv(ticket);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
          >
            <Download size={16} className="text-slate-400 shrink-0" />
            Export Guest List (CSV)
          </button>

          {ticket.status !== 'paused' ? (
            <button
              onClick={() => {
                onPause(ticket);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
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
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all text-left"
            >
              <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resume Ticket Sales
            </button>
          )}

          <div className="border-t border-slate-100 my-1.5" />

          <button
            onClick={() => {
              if (confirm('Delete this ticket type?')) {
                onDelete(ticket._id);
                onClose();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all text-left"
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
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function TicketingPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: tickets = [], isLoading } = useTickets(id!);
  const { data: guests = [] } = useGuests(id!);
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const [activeOptionTicket, setActiveOptionTicket] = useState<TicketType | null>(null);
  const [rsvpTicket, setRsvpTicket] = useState<TicketType | null>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedTicketFilter, setSelectedTicketFilter] = useState<string>('all');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('new') === 'true') {
      navigate(`/events/${id}/ticketing/new`, { replace: true });
    }
  }, [location.search, id, navigate]);

  const totalSold = tickets.reduce((s, t) => s + t.sold, 0);
  const totalCapacity = tickets.reduce((s, t) => s + t.total, 0);
  const totalRevenue = tickets.reduce((s, t) => s + t.sold * t.price, 0);
  const totalScans = tickets.reduce((s, t) => s + (t.qrScans || 0), 0);

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

  // Filtered guests for the live registrations table
  const filteredGuests = useMemo(() => {
    return guests.filter(g => {
      const matchesSearch =
        !guestSearch ||
        g.name?.toLowerCase().includes(guestSearch.toLowerCase()) ||
        g.email?.toLowerCase().includes(guestSearch.toLowerCase());
      const matchesTicket =
        selectedTicketFilter === 'all' || g.ticketId === selectedTicketFilter;
      return matchesSearch && matchesTicket;
    });
  }, [guests, guestSearch, selectedTicketFilter]);

  const handleCreateDefaultFreeRsvp = () => {
    createTicket.mutate({
      eventId: id,
      name: 'General Admission (Free RSVP)',
      description: 'Standard free RSVP guest registration pass',
      price: 0,
      total: 200,
      status: 'active',
    }, {
      onSuccess: () => toast.success('Created default Free RSVP ticket!'),
    });
  };

  const handleExportCsv = (ticket?: TicketType) => {
    const targetGuests = ticket
      ? guests.filter(g => g.ticketId === ticket._id)
      : guests;

    if (targetGuests.length === 0) {
      toast.error('No guests to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Ticket', 'Status', 'Checked In', 'Registered Date'];
    const rows = targetGuests.map(g => {
      const ticketName = tickets.find(t => t._id === g.ticketId)?.name || 'General';
      return [
        `"${g.name || ''}"`,
        `"${g.email || ''}"`,
        `"${g.phone || ''}"`,
        `"${ticketName}"`,
        `"${g.rsvpStatus || 'confirmed'}"`,
        `"${g.checkedIn ? 'Yes' : 'No'}"`,
        `"${g.createdAt ? new Date(g.createdAt).toLocaleDateString() : ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${ticket ? ticket.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'all-guests'}-registrations.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Exported CSV!');
  };

  const handleToggleTicketRsvp = (ticket: TicketType) => {
    const nextState = !ticket.rsvpDisabled;
    updateTicket.mutate({
      id: ticket._id,
      data: { rsvpDisabled: nextState },
    }, {
      onSuccess: () => {
        toast.success(nextState ? `Frozen RSVPs for ${ticket.name}` : `Resumed RSVPs for ${ticket.name}`);
      },
    });
  };

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="h-3 w-16 bg-slate-200 rounded-full" />
                <div className="h-6 w-8 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SEO title="Ticketing & RSVP Manager" />

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
          onToggleRsvp={handleToggleTicketRsvp}
          onExportCsv={handleExportCsv}
          onDelete={(ticketId) => deleteTicket.mutate(ticketId)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-3.5 py-3 sm:px-8 sm:py-5 flex-shrink-0">
        <p className="text-xs text-slate-400 mb-0.5">Tickets, QR Codes, and RSVP Passes</p>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              Ticketing & QR Passes
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0">
            <button
              onClick={() => navigate(`/events/${id}/ticketing/new`)}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-white text-xs sm:text-sm font-extrabold rounded-xl hover:opacity-90 shadow-2xs transition-opacity"
              style={{ backgroundColor: '#7A1F1F' }}
            >
              <Plus size={14} />
              {t('ticketing.new_ticket_type')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 max-w-[1200px] mx-auto w-full space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          {[
            { icon: Ticket, label: 'Tickets Claimed', value: totalSold.toLocaleString(), sub: `of ${totalCapacity.toLocaleString()} total`, color: '#7A1F1F' },
            { icon: DollarSign, label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'gross sales', color: '#10B981' },
            { icon: QrCode, label: 'Total QR Scans', value: totalScans.toLocaleString(), sub: 'across all passes', color: '#D4A24C' },
            { icon: Users, label: 'Ticket Tiers', value: tickets.length, sub: 'active tiers', color: '#7A1F1F' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-2xs space-y-0.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] sm:text-xs font-bold leading-tight truncate">
                <Icon size={13} className="shrink-0 text-slate-400" />
                <span className="truncate">{label}</span>
              </div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight py-0.5">{value}</div>
              <p className="text-[10px] sm:text-xs font-semibold truncate" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Ticket Sales Over Time Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight truncate">Registrations & Sales Timeline</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">Cumulative guest registrations and ticket sales</p>
            </div>
            <span className="text-[9px] sm:text-[10px] bg-emerald-50 border border-emerald-200/60 text-emerald-600 font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg uppercase tracking-wider whitespace-nowrap shrink-0">
              Live Tracker
            </span>
          </div>

          <div className="h-56 w-full">
            {guests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart2 size={32} className="opacity-20 mb-2" />
                <p className="text-xs font-semibold">No registrations or ticket sales yet</p>
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

        {/* Section Header: Ticket Tiers & QR Passes */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Ticket Tiers & QR Passes
            </h2>
            <p className="text-xs text-slate-400">Each ticket tier has its own dedicated QR code, invite link, and Apple Wallet pass.</p>
          </div>
        </div>

        {/* Ticket cards */}
        {tickets.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center mx-auto mb-4">
              <Ticket size={28} />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No ticket tiers created yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
              Create a free RSVP tier or paid tickets. Each tier automatically receives a unique QR code, direct registration link, and Apple Wallet pass.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleCreateDefaultFreeRsvp}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF0E8] text-[#7A1F1F] border border-[#7A1F1F]/20 text-xs font-bold rounded-xl hover:bg-[#FDF5EE] transition-colors"
              >
                <Sparkles size={14} /> Quick Start: Free RSVP
              </button>
              <button
                onClick={() => navigate(`/events/${id}/ticketing/new`)}
                className="flex items-center gap-2 px-4 py-2.5 text-xs text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#7A1F1F' }}
              >
                <Plus size={14} /> Custom Ticket Tier
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tickets.map(ticket => {
              const pct = ticket.total > 0 ? Math.round(ticket.sold / ticket.total * 100) : 0;
              const status = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;
              const revenue = ticket.sold * ticket.price;
              const isPaid = ticket.price > 0;
              return (
                <div
                  key={ticket._id}
                  className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-2xs hover:border-[#7A1F1F]/30 hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  {ticket.rsvpDisabled && (
                    <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-[9px] sm:text-[10px] font-extrabold text-center py-0.5 tracking-wider uppercase">
                      RSVPs Frozen
                    </div>
                  )}

                  <div>
                    <div className="flex items-start justify-between mb-2 mt-0.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight truncate">{ticket.name}</h3>
                          <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: status.bg, color: status.color }}>
                            {status.label}
                          </span>
                          <span
                            className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                            style={{ background: isPaid ? '#FEF3C7' : '#ECFDF5', color: isPaid ? '#B45309' : '#059669' }}
                          >
                            {isPaid ? `$${ticket.price}` : 'Free'}
                          </span>
                        </div>
                        {ticket.description && <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1">{ticket.description}</p>}
                      </div>
                      <div className="relative shrink-0 ml-1">
                        <button
                          onClick={() => setActiveOptionTicket(ticket)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 my-2.5 p-2.5 bg-slate-50/80 rounded-xl">
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Price</p>
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">{ticket.price === 0 ? 'Free' : `$${ticket.price}`}</p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Claimed</p>
                        <p className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5">{ticket.sold} / {ticket.total}</p>
                      </div>
                      <div>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">QR Scans</p>
                        <p className="font-extrabold text-[#D4A24C] text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                          <QrCode size={12} className="shrink-0" /> {ticket.qrScans || 0}
                        </p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                        <span>Capacity Claimed</span>
                        <span className="font-bold text-slate-700">{pct}%</span>
                      </div>
                      <ProgressBar value={ticket.sold} max={ticket.total} color={pct >= 80 ? '#EF4444' : '#7A1F1F'} />
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setRsvpTicket(ticket)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF0E8] text-[#7A1F1F] hover:bg-[#F5E6DA] text-[11px] sm:text-xs font-extrabold rounded-xl transition-colors shrink-0"
                    >
                      <QrCode size={12} />
                      RSVP QR & Link
                    </button>
                    <button
                      onClick={() => navigate(`/events/${id}/ticketing/${ticket._id}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 text-[11px] sm:text-xs font-bold rounded-xl transition-colors shrink-0"
                    >
                      <Users size={12} />
                      Guests ({guests.filter(g => g.ticketId === ticket._id).length})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live Guest Registrations & Responses Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base" style={{ fontFamily: 'Playfair Display, serif' }}>
                Live Guest Registrations
              </h3>
              <p className="text-xs text-slate-400">All attendees who have registered or RSVP'd across your ticket tiers.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportCsv()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200"
              >
                <Download size={13} /> Export All CSV
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
            <div className="relative flex-1 w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered guests by name or email..."
                value={guestSearch}
                onChange={e => setGuestSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedTicketFilter}
                onChange={e => setSelectedTicketFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Ticket Tiers ({guests.length})</option>
                {tickets.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({guests.filter(g => g.ticketId === t._id).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredGuests.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No registered guests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Attendee</th>
                    <th className="py-3 px-4">Ticket Tier</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Check-in</th>
                    <th className="py-3 px-4">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredGuests.map(guest => {
                    const ticket = tickets.find(t => t._id === guest.ticketId);
                    return (
                      <tr key={guest._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{guest.name}</div>
                          {guest.email && <div className="text-[11px] text-slate-400">{guest.email}</div>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Ticket size={11} className="text-[#7A1F1F]" />
                            {ticket?.name || 'General Admission'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            guest.rsvpStatus === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : guest.rsvpStatus === 'declined'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {guest.rsvpStatus ? guest.rsvpStatus.toUpperCase() : 'CONFIRMED'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {guest.checkedIn ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                              <CheckCircle2 size={13} /> Checked In
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {guest.createdAt ? new Date(guest.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
