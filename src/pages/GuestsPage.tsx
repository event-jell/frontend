import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/SEO';
import {
  Search, Plus, Filter, Download, CheckCircle2, Clock, XCircle,
  HelpCircle, UserCheck, Link as LinkIcon, Upload, Trash2, ChevronDown, BarChart2, Ticket, QrCode
} from 'lucide-react';
import { useGuests, useCreateGuest, useUpdateGuest, useDeleteGuest, useBulkCreateGuests } from '../hooks/useGuests';
import { useTickets } from '../hooks/useTickets';
import { useLocale } from '../hooks/useLocale';
import { formatCurrency, formatLocalDate } from '../utils/formatters';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ImportGuestsModal from '../components/guests/ImportGuestsModal';
import EventPassModal from '../components/checkin/EventPassModal';
import type { Guest, Ticket as TicketType } from '../types';

const RSVP_CONFIG = {
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' },
  pending:   { label: 'Pending',   icon: Clock,        color: '#F59E0B', bg: '#FFFBEB' },
  declined:  { label: 'Declined',  icon: XCircle,      color: '#EF4444', bg: '#FEF2F2' },
  maybe:     { label: 'Maybe',     icon: HelpCircle,   color: '#7A1F1F', bg: '#FAF7F2' },
};

function RsvpBadge({ status }: { status: Guest['rsvpStatus'] }) {
  const { t } = useTranslation();
  const cfg = RSVP_CONFIG[status] ?? RSVP_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={10} /> {t(`guests.status.${status}`)}
    </span>
  );
}

function AddGuestModal({
  tickets = [],
  onClose,
  onSave,
}: {
  tickets?: TicketType[];
  onClose: () => void;
  onSave: (d: Partial<Guest>) => void;
}) {
  const { t } = useTranslation();
  const { localCurrency } = useLocale();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', group: '', ticketId: '',
    dietaryReqs: '', rsvpStatus: 'pending' as Guest['rsvpStatus'], plusOnes: 0,
  });
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  const handleTicketChange = (tId: string) => {
    const selected = tickets.find(t => t._id === tId);
    setForm(f => ({
      ...f,
      ticketId: tId,
      group: selected ? selected.name : f.group,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-5">{t('guests.modal.submit')}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{t('guests.modal.name')}</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="Full name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('guests.modal.email')}</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('guests.modal.phone')}</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="+1 555 000 0000" />
            </div>
          </div>
          {tickets.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Ticket Tier / Pass</label>
              <select
                value={form.ticketId}
                onChange={e => handleTicketChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 bg-white"
              >
                <option value="">— Select Ticket Tier (Optional) —</option>
                {tickets.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name} {t.price > 0 ? `(${formatCurrency(t.price, t.currency || localCurrency)})` : '(Free)'}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('guests.modal.group')} / Type</label>
              <input value={form.group} onChange={e => set('group', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="VIP, General Admission…" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">{t('guests.modal.plus_ones')}</label>
              <input type="number" min={0} max={10} value={form.plusOnes} onChange={e => set('plusOnes', Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{t('guests.modal.dietary')}</label>
            <input value={form.dietaryReqs} onChange={e => set('dietaryReqs', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="Vegan, Gluten-free…" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">{t('guests.modal.rsvp_status')}</label>
            <select value={form.rsvpStatus} onChange={e => set('rsvpStatus', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 bg-white">
              <option value="pending">{t('guests.status.pending')}</option>
              <option value="confirmed">{t('guests.status.confirmed')}</option>
              <option value="declined">{t('guests.status.declined')}</option>
              <option value="maybe">{t('guests.status.maybe')}</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">{t('common.cancel')}</button>
          <button onClick={() => { if (form.name) { onSave(form); onClose(); } }}
            disabled={!form.name}
            className="px-4 py-2 text-sm text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-40"
            style={{ backgroundColor: '#7A1F1F' }}>
            {t('guests.modal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GuestsPage() {
  const { localCurrency, timezone, locale } = useLocale();
  const { t } = useTranslation();
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketId = searchParams.get('ticketId');

  const { data: guests = [], isLoading } = useGuests(eventId);
  const { data: tickets = [] } = useTickets(eventId);
  const createGuest = useCreateGuest();
  const updateGuest = useUpdateGuest();
  const deleteGuest = useDeleteGuest();
  const bulkCreate = useBulkCreateGuests();

  const [search, setSearch] = useState('');
  const [filterRsvp, setFilterRsvp] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [selectedGuestPassId, setSelectedGuestPassId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close add dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/events/${eventId}/invite`);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 3000);
  };

  const handleExport = () => {
    const header = 'Name,Email,Phone,Group,Ticket Tier,RSVP Status,Dietary,+1s,Checked In,Table\n';
    const rows = guests.map(g => {
      const ticketName = tickets.find(t => t._id === g.ticketId)?.name || '';
      const groupOrTicket = g.group || ticketName;
      return [g.name, g.email, g.phone, groupOrTicket, ticketName, g.rsvpStatus, g.dietaryReqs, g.plusOnes, g.checkedIn ? 'Yes' : 'No', g.tableAssignment]
        .map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`)
        .join(',');
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'guests.csv';
    a.click();
  };

  const ticketFiltered = useMemo(() =>
    guests.filter(g => ticketId ? g.ticketId === ticketId : true),
    [guests, ticketId]);

  const filtered = useMemo(() => ticketFiltered.filter(g => {
    const s = search.toLowerCase();
    const ticketName = tickets.find(t => t._id === g.ticketId)?.name?.toLowerCase() ?? '';
    const groupName = g.group?.toLowerCase() ?? '';
    const matchSearch = !s ||
      g.name.toLowerCase().includes(s) ||
      (g.email?.toLowerCase().includes(s) ?? false) ||
      groupName.includes(s) ||
      ticketName.includes(s);
    const matchRsvp = filterRsvp === 'all' || g.rsvpStatus === filterRsvp;
    return matchSearch && matchRsvp;
  }), [ticketFiltered, search, filterRsvp, tickets]);

  const counts = {
    total:     ticketFiltered.length,
    confirmed: ticketFiltered.filter(g => g.rsvpStatus === 'confirmed').length,
    pending:   ticketFiltered.filter(g => g.rsvpStatus === 'pending').length,
    declined:  ticketFiltered.filter(g => g.rsvpStatus === 'declined').length,
    checkedIn: ticketFiltered.filter(g => g.checkedIn).length,
  };

  const timelineData = useMemo(() => {
    const validGuests = ticketFiltered.filter(g => g.createdAt);
    if (validGuests.length === 0) {
      return [
        { date: '5 days ago', total: 0 },
        { date: '4 days ago', total: 0 },
        { date: '3 days ago', total: 0 },
        { date: '2 days ago', total: 0 },
        { date: 'Yesterday', total: 0 },
        { date: 'Today', total: 0 }
      ];
    }

    const dayCounts: Record<string, number> = {};
    validGuests.forEach(g => {
      const d = new Date(g.createdAt || Date.now());
      const dateStr = formatLocalDate(d, { timezone, locale, month: 'short', day: 'numeric' });
      dayCounts[dateStr] = (dayCounts[dateStr] || 0) + 1;
    });

    const sortedDates = Object.keys(dayCounts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    let cumulative = 0;
    return sortedDates.map(date => {
      cumulative += dayCounts[date];
      return { date, total: cumulative };
    });
  }, [ticketFiltered, timezone, locale]);

  const allFilteredIds = filtered.map(g => g._id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(s => { const n = new Set(s); allFilteredIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelected(s => new Set([...s, ...allFilteredIds]));
    }
  };

  const toggleOne = (id: string) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const bulkUpdateRsvp = (status: Guest['rsvpStatus']) => {
    [...selected].forEach(id => updateGuest.mutate({ id, data: { rsvpStatus: status } }));
    setSelected(new Set());
    setBulkMenuOpen(false);
  };

  const bulkCheckIn = (checked: boolean) => {
    [...selected].forEach(id => updateGuest.mutate({ id, data: { checkedIn: checked } }));
    setSelected(new Set());
    setBulkMenuOpen(false);
  };

  const bulkDelete = () => {
    if (!confirm(`Delete ${selected.size} guest${selected.size > 1 ? 's' : ''}?`)) return;
    [...selected].forEach(id => deleteGuest.mutate(id));
    setSelected(new Set());
    setBulkMenuOpen(false);
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
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-slate-200 rounded-xl" />
            <div className="h-9 w-20 bg-slate-200 rounded-xl" />
            <div className="h-9 w-32 bg-slate-200 rounded-xl" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 max-w-[1200px] mx-auto w-full space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="h-3 w-16 bg-slate-200 rounded-full" />
                <div className="h-6 w-8 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Timeline Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-64 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-slate-200 rounded-full" />
              <div className="h-3 w-56 bg-slate-200 rounded-full" />
            </div>
            <div className="h-40 bg-slate-100 rounded-xl" />
          </div>

          {/* Search/Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
            <div className="h-10 w-full sm:w-64 bg-slate-200 rounded-xl" />
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-slate-200 rounded-full" />
              <div className="h-8 w-16 bg-slate-200 rounded-full" />
              <div className="h-8 w-16 bg-slate-200 rounded-full" />
            </div>
          </div>

          {/* Table Outline */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 bg-slate-200 rounded-full" />
                      <div className="h-2.5 w-16 bg-slate-200 rounded-full" />
                    </div>
                  </div>
                  <div className="h-3.5 w-36 bg-slate-200 rounded-full" />
                  <div className="h-6 w-20 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SEO title="Manage Guests" />
      {showAdd && (
        <AddGuestModal
          tickets={tickets}
          onClose={() => setShowAdd(false)}
          onSave={data => createGuest.mutate({ ...data, eventId })}
        />
      )}
      {showImport && (
        <ImportGuestsModal
          eventId={eventId!}
          onClose={() => setShowImport(false)}
          importing={bulkCreate.isPending}
          onImport={async (gs) => {
            await bulkCreate.mutateAsync({ eventId: eventId!, guests: gs });
          }}
        />
      )}

      {selectedGuestPassId && (
        <EventPassModal
          eventId={eventId || ''}
          guestId={selectedGuestPassId}
          onClose={() => setSelectedGuestPassId(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <p className="text-sm text-slate-500 mb-0.5">{t('guests.subtitle')}</p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('guests.title')}</h1>
            {ticketId && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs bg-[#F5E6D3] text-[#7A1F1F] px-2 py-0.5 rounded-full font-medium">{t('guests.filter_ticket')}</span>
                <button onClick={() => setSearchParams({})} className="text-xs text-slate-500 hover:text-slate-700 hover:underline">{t('guests.clear_filter')}</button>
              </div>
            )}
          </div>
          <div className="flex gap-2.5 flex-wrap items-center">
            <button
              onClick={() => navigate(`/events/${eventId}/checkin`)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#7A1F1F] hover:bg-[#9c3030] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <QrCode size={14} className="text-[#D4A24C]" />
              <span>Check-In Scanner</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3.5 py-2.5 text-slate-700 bg-white border border-slate-200 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all shadow-2xs"
            >
              <LinkIcon size={14} className="text-slate-500" />
              <span>{showCopied ? 'Link Copied!' : t('guests.share_rsvp')}</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3.5 py-2.5 text-slate-700 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-2xs bg-white"
            >
              <Download size={14} className="text-slate-500" />
              <span>{t('guests.export')}</span>
            </button>

            {/* Add guest split button */}
            <div className="relative inline-flex shadow-sm rounded-xl" ref={addMenuRef}>
              <button
                onClick={() => setShowAdd(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#7A1F1F] to-[#992626] text-white text-xs font-bold rounded-l-xl hover:brightness-110 active:scale-[0.99] transition-all"
              >
                <Plus size={15} />
                <span>{t('guests.add_guest')}</span>
              </button>
              <button
                onClick={() => setAddMenuOpen(o => !o)}
                className={`flex items-center justify-center px-2.5 py-2.5 bg-[#7A1F1F] hover:bg-[#601818] text-white rounded-r-xl border-l border-white/20 transition-all ${
                  addMenuOpen ? 'bg-[#601818]' : ''
                }`}
                title="More options"
              >
                <ChevronDown size={14} className={`transition-transform duration-200 ${addMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {addMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200/90 rounded-2xl shadow-xl shadow-slate-900/10 z-30 p-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setShowAdd(true);
                      setAddMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Plus size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{t('guests.add_single')}</div>
                      <div className="text-[11px] text-slate-400 font-normal">Add attendee manually</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowImport(true);
                      setAddMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Upload size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{t('guests.add_import')}</div>
                      <div className="text-[11px] text-slate-400 font-normal">Upload CSV or spreadsheet</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 max-w-[1200px] mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6">
          {([
            { label: t('guests.stats.total'), value: counts.total,     color: '#7A1F1F' },
            { label: t('guests.stats.confirmed'), value: counts.confirmed, color: '#10B981' },
            { label: t('guests.stats.pending'),   value: counts.pending,   color: '#F59E0B' },
            { label: t('guests.stats.declined'),  value: counts.declined,  color: '#EF4444' },
            { label: t('guests.stats.checked_in'), value: counts.checkedIn, color: '#7A1F1F' },
          ] as const).map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xs">
              <p className="text-[11px] sm:text-xs text-slate-500 mb-0.5 truncate font-bold">{label}</p>
              <p className="text-lg sm:text-2xl font-black tracking-tight" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Registration Timeline Chart */}
        <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Guest Registrations Over Time</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Timeline of cumulative RSVPs received for this event</p>
            </div>
            <span className="text-[10px] bg-[#FDF5EE] border border-[#7A1F1F]/10 text-[#7A1F1F] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">
              Live RSVP Tracker
            </span>
          </div>

          <div className="h-60 w-full">
            {guests.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <BarChart2 size={32} className="opacity-20 mb-2" />
                <p className="text-xs font-semibold">No registrations logged yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7A1F1F" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#7A1F1F" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94A3B8', fontWeight: 650 }} />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: '10px', fill: '#94A3B8', fontWeight: 650 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Guests"
                    stroke="#7A1F1F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Filters + bulk bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('guests.search_placeholder')}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 shadow-2xs"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            {(['all', 'confirmed', 'pending', 'declined', 'maybe'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterRsvp(s)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  filterRsvp === s
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {s === 'all' ? 'All' : t(`guests.status.${s}`, s)}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 bg-white shadow-2xs">
            <Filter size={14} /> {t('guests.filters')}
          </button>
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center gap-3 mb-3 px-4 py-2.5 bg-[#7A1F1F]/5 border border-[#7A1F1F]/20 rounded-xl">
            <span className="text-sm font-semibold text-[#7A1F1F]">{t('guests.bulk.selected', { count: selected.size })}</span>
            <div className="relative">
              <button onClick={() => setBulkMenuOpen(o => !o)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">
                {t('guests.bulk.set_rsvp')} <ChevronDown size={12} />
              </button>
              {bulkMenuOpen && (
                <div className="absolute left-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-1">
                  {(['confirmed', 'pending', 'declined', 'maybe'] as const).map(s => (
                    <button key={s} onClick={() => bulkUpdateRsvp(s)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 capitalize">
                      {t(`guests.status.${s}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => bulkCheckIn(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">
              <UserCheck size={13} /> {t('guests.bulk.check_in_all')}
            </button>
            <button onClick={() => bulkCheckIn(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm">
              {t('guests.bulk.undo_check_in')}
            </button>
            <button onClick={bulkDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-50 border border-red-100 text-red-600 rounded-lg hover:bg-red-100 ml-auto">
              <Trash2 size={13} /> {t('guests.bulk.delete')}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="rounded border-slate-300 accent-[#7A1F1F]" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('guests.table.name')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">{t('guests.table.contact')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">{t('guests.table.group')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('guests.table.rsvp')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">{t('guests.table.table')}</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('guests.table.check_in')}</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="text-slate-400">
                        <p className="font-medium">{t('guests.empty.title')}</p>
                        <p className="text-xs mt-1">{t('guests.empty.subtitle')}</p>
                        <button onClick={() => setShowImport(true)}
                          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90"
                          style={{ backgroundColor: '#7A1F1F' }}>
                          <Upload size={14} /> {t('guests.empty.action')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(guest => (
                  <tr key={guest._id}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${selected.has(guest._id) ? 'bg-[#7A1F1F]/5' : ''}`}
                    onClick={() => navigate(`/events/${eventId}/guests/${guest._id}`)}
                  >
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleOne(guest._id); }}>
                      <input type="checkbox" checked={selected.has(guest._id)} onChange={() => toggleOne(guest._id)}
                        className="rounded border-slate-300 accent-[#7A1F1F]" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F5E6D3] flex items-center justify-center text-[#7A1F1F] text-xs font-bold flex-shrink-0">
                          {guest.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 text-sm sm:text-base leading-tight">{guest.name}</p>
                          <div className="sm:hidden mt-0.5 text-xs text-slate-400 max-w-[140px] truncate">
                            {guest.email || guest.phone || 'No contact'}
                          </div>
                          {(guest.plusOnes ?? 0) > 0 && <p className="text-xs text-slate-400">+{guest.plusOnes}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                      <p>{guest.email || '—'}</p>
                      {guest.phone && <p className="text-xs text-slate-400">{guest.phone}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {(() => {
                        const displayGroup = guest.group || tickets.find(t => t._id === guest.ticketId)?.name;
                        return displayGroup ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#FAF0E8] text-[#7A1F1F] text-xs font-semibold rounded-full border border-[#7A1F1F]/20 shadow-2xs">
                            <Ticket size={11} className="text-[#7A1F1F] opacity-75" />
                            {displayGroup}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3"><RsvpBadge status={guest.rsvpStatus} /></td>
                    <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{guest.tableAssignment || '—'}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedGuestPassId(guest._id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-[#7A1F1F] border border-slate-200 shadow-2xs transition-colors"
                          title="View Guest Event Pass"
                        >
                          <QrCode size={13} />
                        </button>
                        <button
                          onClick={() => updateGuest.mutate({ id: guest._id, data: { checkedIn: !guest.checkedIn } })}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            guest.checkedIn ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}>
                          <UserCheck size={12} />
                          {guest.checkedIn ? t('guests.table.checked_in') : t('guests.table.check_in_action')}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { if (confirm('Remove this guest?')) deleteGuest.mutate(guest._id); }}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                        {t('guests.table.remove')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
              <span>{t('guests.footer', { count: filtered.length, total: ticketFiltered.length })}</span>
              {someSelected && <span className="text-[#7A1F1F] font-medium">{selected.size} selected</span>}
            </div>
          )}
        </div>
      </div>

      {showCopied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50">
          <CheckCircle2 size={18} className="text-green-400" />
          <span className="font-medium text-sm">{t('guests.toast')}</span>
        </div>
      )}
    </div>
  );
}
