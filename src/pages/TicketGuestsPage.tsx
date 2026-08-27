import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Ticket, CheckCircle2, Clock, XCircle, HelpCircle,
  UserCheck, Plus, Link as LinkIcon, Edit2, Trash2, Download,
  Mail, ChevronLeft, ChevronRight, BarChart2, Info
} from 'lucide-react';
import { useTickets, useTicket, useUpdateTicket, useDeleteTicket } from '../hooks/useTickets';
import { useGuests, useUpdateGuest, useCreateGuest } from '../hooks/useGuests';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ticketsApi } from '../lib/api';
import type { Guest, Ticket as TicketType } from '../types';
import SEO from '../components/SEO';

function EditTicketModal({
  ticket,
  onClose,
  onSave,
  isPending
}: {
  ticket: TicketType;
  onClose: () => void;
  onSave: (data: Partial<TicketType>) => void;
  isPending?: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: ticket.name || '',
    description: ticket.description || '',
    price: ticket.price || 0,
    total: ticket.total || 100,
    saleStart: ticket.saleStart ? ticket.saleStart.split('T')[0] : '',
    saleEnd: ticket.saleEnd ? ticket.saleEnd.split('T')[0] : ''
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-5">{t('ticket_guests.edit_ticket_title')}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-650 mb-1 block">{t('ticketing.name')}</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
              placeholder="e.g. General Admission, VIP"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-650 mb-1 block">{t('ticketing.description')}</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 resize-none"
              rows={2}
              placeholder="What's included…"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-650 mb-1 block">{t('ticketing.price')}</label>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-650 mb-1 block">{t('ticketing.capacity')}</label>
              <input
                type="number"
                min={1}
                value={form.total}
                onChange={e => setForm(f => ({ ...f, total: Number(e.target.value) }))}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-650 mb-1 block">{t('ticketing.sale_start')}</label>
              <input
                type="date"
                value={form.saleStart}
                onChange={e => setForm(f => ({ ...f, saleStart: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-650 mb-1 block">{t('ticketing.sale_end')}</label>
              <input
                type="date"
                value={form.saleEnd}
                onChange={e => setForm(f => ({ ...f, saleEnd: e.target.value }))}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">{t('common.cancel')}</button>
          <button
            disabled={isPending}
            onClick={() => { if (form.name) { onSave(form); } }}
            className="px-5 py-2 text-sm text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            {isPending ? t('common.processing') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddGuestModal({
  onClose,
  onSave
}: {
  onClose: () => void;
  onSave: (data: Partial<Guest>) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', rsvpStatus: 'pending' as Guest['rsvpStatus'] });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-5">{t('ticket_guests.add_applicant_title')}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-650 mb-1 block">{t('common.name')}</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
              placeholder={t('guests.modal.name_placeholder')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-650 mb-1 block">{t('guests.modal.email')}</label>
            <input
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
              placeholder={t('guests.modal.email_placeholder')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-650 mb-1 block">{t('guests.modal.phone')}</label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
              placeholder={t('guests.modal.phone_placeholder')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-650 mb-1 block">{t('guests.modal.rsvp_status')}</label>
            <select
              value={form.rsvpStatus}
              onChange={e => setForm(f => ({ ...f, rsvpStatus: e.target.value as Guest['rsvpStatus'] }))}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 bg-white"
            >
              <option value="pending">{t('guests.status.pending')}</option>
              <option value="confirmed">{t('guests.status.confirmed')}</option>
              <option value="declined">{t('guests.status.declined')}</option>
              <option value="maybe">{t('guests.status.maybe')}</option>
            </select>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">{t('common.cancel')}</button>
          <button
            onClick={() => { if (form.name) { onSave(form); onClose(); } }}
            className="px-5 py-2 text-sm text-white font-semibold rounded-xl hover:opacity-90"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            {t('ticket_guests.add_applicant_title')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ExportModal({
  ticket,
  guests,
  onClose
}: {
  ticket: TicketType;
  guests: Guest[];
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const generateCsvContent = () => {
    const headers = ['Applicant Name', 'Email', 'Phone', 'RSVP Status', 'Checked In'];
    const rows = guests.map(g => [
      `"${g.name.replace(/"/g, '""')}"`,
      `"${(g.email || '').replace(/"/g, '""')}"`,
      `"${(g.phone || '').replace(/"/g, '""')}"`,
      `"${g.rsvpStatus}"`,
      g.checkedIn ? 'Yes' : 'No'
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleDownload = () => {
    const csvContent = generateCsvContent();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${ticket.name.replace(/\s+/g, '_')}_applicants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      const csvContent = generateCsvContent();
      await ticketsApi.exportEmail(ticket._id, {
        email,
        csvContent,
        ticketName: ticket.name
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4 relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7A1F1F] to-[#D4A24C]" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Download size={18} className="text-[#7A1F1F]" />
            Export Applicant List
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle size={18} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-3 animate-in fade-in duration-300">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={24} />
            </div>
            <p className="font-bold text-slate-800 text-sm">Email Sent Successfully!</p>
            <p className="text-xs text-slate-400">CSV file is on its way to {email}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              Export and extract guest registration data for the ticket <strong>{ticket.name}</strong>. Choose to download directly or email.
            </p>

            {/* Option 1: Direct Download */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-700">Download CSV File</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Download directly to your computer</p>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-[#7A1F1F] rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
              >
                <Download size={14} />
                Download CSV
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100" />
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">OR</span>
              <span className="flex-grow border-t border-slate-100" />
            </div>

            {/* Option 2: Email CSV */}
            <form onSubmit={handleEmail} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Send file to Email</label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="planner@example.com"
                      className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !email.trim()}
                    className="px-4 py-2 bg-[#7A1F1F] text-white text-xs font-bold rounded-xl hover:opacity-95 shadow-sm transition-opacity disabled:opacity-40"
                  >
                    {sending ? 'Sending...' : 'Email CSV'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const RSVP_CONFIG = {
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' },
  pending: { label: 'Pending', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
  declined: { label: 'Declined', icon: XCircle, color: '#EF4444', bg: '#FEF2F2' },
  maybe: { label: 'Maybe', icon: HelpCircle, color: '#7A1F1F', bg: '#FAF7F2' },
};

function RsvpBadge({ status }: { status: Guest['rsvpStatus'] }) {
  const cfg = RSVP_CONFIG[status] ?? RSVP_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

export default function TicketGuestsPage() {
  const { id, ticketId } = useParams<{ id: string; ticketId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // If URL is /events/:id/ticketing/new, redirect to /events/:id/ticketing?new=true
  useEffect(() => {
    if (ticketId === 'new') {
      navigate(`/events/${id}/ticketing?new=true`, { replace: true });
    }
  }, [ticketId, id, navigate]);

  const { data: tickets = [], isLoading: isLoadingTickets } = useTickets(id);
  const { data: singleTicket, isLoading: isLoadingSingle } = useTicket(ticketId);
  const ticket = tickets.find(t => t._id === ticketId) || singleTicket;

  const { data: guests = [], isLoading: isLoadingGuests } = useGuests(id);
  const updateGuest = useUpdateGuest();
  const createGuest = useCreateGuest();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const ticketGuests = useMemo(() => {
    return guests.filter(g => g.ticketId === ticketId);
  }, [guests, ticketId]);

  // Analytics helper calculations
  const analyticsData = useMemo(() => {
    const checkedIn = ticketGuests.filter(g => g.checkedIn).length;
    const notCheckedIn = ticketGuests.length - checkedIn;
    return [
      { name: 'Checked In', value: checkedIn, color: '#10B981' },
      { name: 'Remaining', value: notCheckedIn, color: '#E2E8F0' }
    ];
  }, [ticketGuests]);

  const totalPages = Math.ceil(ticketGuests.length / itemsPerPage);

  const paginatedGuests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return ticketGuests.slice(start, start + itemsPerPage);
  }, [ticketGuests, currentPage, itemsPerPage]);

  const isTicketLoading = (isLoadingTickets || isLoadingSingle) && !ticket;

  if (isTicketLoading || isLoadingGuests) {
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        {/* Skeleton Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-4 sm:px-8 sm:py-5 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-slate-150 animate-pulse" />
            <div className="space-y-2">
              <div className="w-32 h-5 bg-slate-200 rounded animate-pulse" />
              <div className="w-48 h-3 bg-slate-150 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-9 bg-slate-150 rounded-xl animate-pulse" />
            <div className="w-28 h-9 bg-slate-150 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Skeleton Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Cards row skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-6 h-40 space-y-4">
                <div className="w-24 h-4 bg-slate-150 rounded animate-pulse" />
                <div className="w-36 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="w-full border-t border-slate-100 pt-3 flex justify-between">
                  <div className="w-12 h-4 bg-slate-150 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-slate-150 rounded animate-pulse" />
                </div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 h-40 space-y-4">
                <div className="w-24 h-4 bg-slate-150 rounded animate-pulse" />
                <div className="w-full h-3 bg-slate-100 rounded animate-pulse" />
                <div className="w-full border-t border-slate-100 pt-3 flex justify-between">
                  <div className="w-20 h-4 bg-slate-150 rounded animate-pulse" />
                  <div className="w-20 h-4 bg-slate-150 rounded animate-pulse" />
                </div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 h-40 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="w-20 h-4 bg-slate-150 rounded animate-pulse" />
                  <div className="w-16 h-3 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-slate-150 animate-pulse" />
              </div>
            </div>

            {/* Table skeleton */}
            <div className="space-y-4">
              <div className="w-32 h-5 bg-slate-200 rounded animate-pulse" />
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="h-12 bg-slate-50 border-b border-slate-100 px-6 flex items-center justify-between">
                  <div className="w-24 h-3 bg-slate-200 rounded animate-pulse" />
                  <div className="w-32 h-3 bg-slate-200 rounded animate-pulse" />
                  <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" />
                  <div className="w-16 h-3 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="divide-y divide-slate-100">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 w-1/4">
                        <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                        <div className="w-24 h-4 bg-slate-100 rounded animate-pulse" />
                      </div>
                      <div className="w-1/4 space-y-1">
                        <div className="w-32 h-4 bg-slate-100 rounded animate-pulse" />
                        <div className="w-20 h-3 bg-slate-100 rounded animate-pulse" />
                      </div>
                      <div className="w-1/4">
                        <div className="w-16 h-5 rounded-full bg-slate-100 animate-pulse" />
                      </div>
                      <div className="w-1/4 flex justify-end">
                        <div className="w-20 h-6 bg-slate-100 rounded animate-pulse" />
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

  if (!ticket) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center">
        <h2 className="text-xl font-bold text-slate-700">{t('ticket_guests.not_found')}</h2>
        <button onClick={() => navigate(`/events/${id}/ticketing`)} className="mt-4 text-[#7A1F1F] hover:underline">
          {t('common.back_to_events')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {showAdd && (
        <AddGuestModal
          onClose={() => setShowAdd(false)}
          onSave={data => createGuest.mutate({ ...data, eventId: id, ticketId })}
        />
      )}
      
      {showEdit && (
        <EditTicketModal
          ticket={ticket}
          onClose={() => setShowEdit(false)}
          onSave={data => updateTicket.mutate({ id: ticket._id, data }, { onSuccess: () => setShowEdit(false) })}
          isPending={updateTicket.isPending}
        />
      )}

      {showExport && (
        <ExportModal
          ticket={ticket}
          guests={ticketGuests}
          onClose={() => setShowExport(false)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/events/${id}/ticketing`)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Ticket size={18} className="text-[#7A1F1F]" />
              <h1 className="text-xl font-bold text-slate-900">{ticket.name}</h1>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{ticket.price === 0 ? 'Free Ticket' : `$${ticket.price}`} • {ticket.sold} / {ticket.total} Sold</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
            <button
              onClick={() => setShowEdit(true)}
              className="p-2 text-slate-400 hover:text-[#7A1F1F] hover:bg-[#FDF5EE] rounded-xl transition-colors"
              title="Edit Ticket"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this ticket? This cannot be undone.')) {
                  deleteTicket.mutate(ticket._id, {
                    onSuccess: () => navigate(`/events/${id}/ticketing`)
                  });
                }
              }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Delete Ticket"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Export Action */}
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download size={15} />
            Export
          </button>

          <button
            onClick={() => {
              const url = `${window.location.origin}/events/${id}/invite?ticket=${ticketId}`;
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            {copied ? <CheckCircle2 size={15} className="text-green-500" /> : <LinkIcon size={15} />}
            {copied ? t('common.processing') : t('ticketing.copy_link')}
          </button>
          
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            <Plus size={15} />
            {t('guests.add_guest')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-5xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Ticket Info Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#FDF5EE] text-[#7A1F1F] rounded-xl">
                    <Ticket size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800">{t('ticket_guests.ticket_details')}</h3>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('ticketing.description')}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">{ticket.description || 'No description provided.'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('ticketing.price_label')}</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{ticket.price === 0 ? t('ticketing.free') : `$${ticket.price}`}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">{t('common.status')}</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      ticket.status === 'active' ? 'bg-[#FAF7F2] text-[#7A1F1F]' :
                      ticket.status === 'sold_out' ? 'bg-red-50 text-red-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Progress Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">{t('ticket_guests.sales_progress')}</h3>
                  <span className="text-xs font-bold text-[#7A1F1F] bg-[#FDF5EE] px-2 py-0.5 rounded-lg border border-[#7A1F1F]/10">
                    {Math.round((ticket.sold / (ticket.total || 1)) * 100)}% Sold
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-500">{t('ticket_guests.tickets_sold', { count: ticket.sold })}</span>
                  <span className="text-slate-400">{t('ticket_guests.total_tickets', { count: ticket.total })}</span>
                </div>
                
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#7A1F1F] to-[#D4A24C] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((ticket.sold / (ticket.total || 1)) * 100))}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12}/> {t('ticketing.sale_start')}
                  </p>
                  <p className="text-xs text-slate-700 font-bold mt-1">
                    {ticket.saleStart ? new Date(ticket.saleStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : t('common.processing')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={12}/> {t('ticketing.sale_end')}
                  </p>
                  <p className="text-xs text-slate-700 font-bold mt-1">
                    {ticket.saleEnd ? new Date(ticket.saleEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : t('common.processing')}
                  </p>
                </div>
              </div>
            </div>

            {/* Check-in & RSVP Analytics Chart Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2">
                <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <BarChart2 size={16} className="text-[#7A1F1F]" />
                  Check-in Stats
                </h3>
                {ticketGuests.length > 0 && (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {Math.round((ticketGuests.filter(g => g.checkedIn).length / ticketGuests.length) * 100)}% Checked-in
                  </span>
                )}
              </div>

              {ticketGuests.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-slate-400">
                  <BarChart2 size={24} className="opacity-20 mb-1" />
                  <p className="text-[11px] font-semibold">No data available yet</p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 flex-1">
                  {/* Pie Chart */}
                  <div className="w-24 h-24 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analyticsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={38}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {analyticsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: '10px', borderRadius: '8px' }}
                          itemStyle={{ padding: '0px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legends */}
                  <div className="space-y-1.5 text-xs flex-grow pl-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
                        Checked In
                      </span>
                      <span className="font-bold text-slate-800">{ticketGuests.filter(g => g.checkedIn).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-400 font-bold">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
                        Remaining
                      </span>
                      <span className="font-bold text-slate-800">{ticketGuests.filter(g => !g.checkedIn).length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-850 mb-4">{t('ticket_guests.applicants_title', { count: ticketGuests.length })}</h2>

          <div className="overflow-x-auto">
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('ticket_guests.applicant_name')}</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('ticket_guests.contact')}</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('ticket_guests.status')}</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('ticket_guests.check_in')}</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketGuests.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <p className="text-slate-400 font-semibold">{t('ticket_guests.no_applicants')}</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedGuests.map(guest => (
                      <tr key={guest._id}
                        onClick={() => navigate(`/events/${id}/guests/${guest._id}`)}
                        className="border-b border-slate-50 hover:bg-[#FDF5EE]/30 transition-colors cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#7A1F1F]/10 flex items-center justify-center text-[#7A1F1F] text-xs font-black flex-shrink-0">
                              {guest.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <p className="font-bold text-slate-800 text-sm">{guest.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          <p>{guest.email || '—'}</p>
                          {guest.phone && <p className="text-xs text-slate-400 mt-0.5">{guest.phone}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <RsvpBadge status={guest.rsvpStatus} />
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => updateGuest.mutate({ id: guest._id, data: { checkedIn: !guest.checkedIn } })}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${guest.checkedIn ? 'bg-green-50 text-green-600 border border-green-200/50' : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border border-slate-200'}`}
                          >
                            <UserCheck size={14} />
                            {guest.checkedIn ? t('guests.table.checked_in') : t('guests.table.check_in_action')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination Controls Footer */}
              {ticketGuests.length > itemsPerPage && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/30">
                  <span className="text-xs text-slate-500 font-semibold">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({ticketGuests.length} total applicants)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
