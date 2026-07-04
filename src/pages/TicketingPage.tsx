import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Ticket, TrendingUp, DollarSign, Users, MoreHorizontal, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { useTickets, useCreateTicket, useUpdateTicket, useDeleteTicket } from '../hooks/useTickets';
import type { Ticket as TicketType } from '../types';

const STATUS_CONFIG = {
  active: { label: 'Active', color: '#10B981', bg: '#ECFDF5' },
  sold_out: { label: 'Sold out', color: '#EF4444', bg: '#FEF2F2' },
  paused: { label: 'Paused', color: '#94A3B8', bg: '#F1F5F9' },
};

interface AddTicketModalProps {
  onClose: () => void;
  onSave: (data: Partial<TicketType>) => void;
  isPending?: boolean;
}

function AddTicketModal({ onClose, onSave, isPending }: AddTicketModalProps) {
  const [form, setForm] = useState({ name: '', description: '', price: 0, total: 100, saleStart: '', saleEnd: '' });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-5">Create Ticket Type</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Ticket Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="e.g. General Admission, VIP" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 resize-none" rows={2} placeholder="What's included…" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Price ($)</label>
              <input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Total Capacity</label>
              <input type="number" min={1} value={form.total} onChange={e => setForm(f => ({ ...f, total: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Sale Start</label>
              <input type="date" value={form.saleStart} onChange={e => setForm(f => ({ ...f, saleStart: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Sale End</label>
              <input type="date" value={form.saleEnd} onChange={e => setForm(f => ({ ...f, saleEnd: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
          <button
            disabled={isPending}
            onClick={() => { if (form.name) { onSave(form); } }}
            className="px-4 py-2 text-sm text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            {isPending ? 'Creating...' : 'Create Ticket'}
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useTickets();
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const deleteTicket = useDeleteTicket();

  const [showAdd, setShowAdd] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/events/${id}/invite`);
    setShowCopied(true);
    setOpenMenu(null);
    setTimeout(() => setShowCopied(false), 3000);
  };

  const totalSold = tickets.reduce((s, t) => s + t.sold, 0);
  const totalCapacity = tickets.reduce((s, t) => s + t.total, 0);
  const totalRevenue = tickets.reduce((s, t) => s + t.sold * t.price, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {showAdd && (
        <AddTicketModal
          onClose={() => setShowAdd(false)}
          onSave={data => {
            createTicket.mutate({ ...data, eventId: id }, {
              onSuccess: () => setShowAdd(false)
            });
          }}
          isPending={createTicket.isPending}
        />
      )}

      {showCopied && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 size={18} className="text-[#3FA65B]" />
          <span className="font-medium text-sm">Link copied to clipboard!</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <p className="text-sm text-slate-500 mb-0.5">Manage ticket types and sales</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Ticketing</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-50 shadow-sm"
            >
              <LinkIcon size={15} />
              Copy Invite Link
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#7A1F1F' }}
            >
              <Plus size={15} />
              New Ticket Type
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 max-w-[1200px] mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Ticket, label: 'Total Sold', value: totalSold.toLocaleString(), sub: `of ${totalCapacity.toLocaleString()}`, color: '#7A1F1F' },
            { icon: DollarSign, label: 'Revenue', value: `$${totalRevenue.toLocaleString()}`, sub: 'gross', color: '#10B981' },
            { icon: TrendingUp, label: 'Sell-through', value: totalCapacity > 0 ? `${Math.round(totalSold / totalCapacity * 100)}%` : '0%', sub: 'rate', color: '#F59E0B' },
            { icon: Users, label: 'Ticket Types', value: tickets.length, sub: 'active types', color: '#7A1F1F' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Icon size={15} />{label}</div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <p className="text-xs text-slate-400 mt-0.5" style={{ color }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Ticket cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Ticket size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium mb-1">No ticket types yet</p>
            <p className="text-sm text-slate-400 mb-4">Create your first ticket type to start selling</p>
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 text-sm text-white font-semibold rounded-xl" style={{ backgroundColor: '#7A1F1F' }}>
              Create Ticket Type
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tickets.map(ticket => {
              const pct = ticket.total > 0 ? Math.round(ticket.sold / ticket.total * 100) : 0;
              const status = STATUS_CONFIG[ticket.status];
              const revenue = ticket.sold * ticket.price;
              return (
                <div
                  key={ticket._id}
                  onClick={() => navigate(`/events/${id}/ticketing/${ticket._id}`)}
                  className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm cursor-pointer hover:border-[#7A1F1F]/30 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{ticket.name}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: status.bg, color: status.color }}>{status.label}</span>
                      </div>
                      {ticket.description && <p className="text-xs text-slate-400">{ticket.description}</p>}
                    </div>
                    <div className="relative">
                      <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === ticket._id ? null : ticket._id); }} className="p-1 rounded-lg hover:bg-slate-100">
                        <MoreHorizontal size={16} className="text-slate-400 group-hover:text-slate-600" />
                      </button>
                      {openMenu === ticket._id && (
                        <div className="absolute right-0 top-8 bg-white border border-slate-100 rounded-xl shadow-lg z-10 py-1 w-36">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/events/${id}/ticketing/${ticket._id}`); setOpenMenu(null); }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">View Guests</button>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            handleCopyLink();
                          }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Copy Direct Link</button>
                          {ticket.status !== 'paused' && (
                            <button onClick={(e) => { e.stopPropagation(); updateTicket.mutate({ id: ticket._id, data: { status: 'paused' } }); setOpenMenu(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Pause sales</button>
                          )}
                          {ticket.status === 'paused' && (
                            <button onClick={(e) => { e.stopPropagation(); updateTicket.mutate({ id: ticket._id, data: { status: 'active' } }); setOpenMenu(null); }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Resume sales</button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this ticket type?')) { deleteTicket.mutate(ticket._id); setOpenMenu(null); } }}
                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-slate-50">Delete</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Price</p>
                      <p className="font-semibold text-slate-800">{ticket.price === 0 ? 'Free' : `$${ticket.price}`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Sold</p>
                      <p className="font-semibold text-slate-800">{ticket.sold} / {ticket.total}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Revenue</p>
                      <p className="font-semibold text-slate-800">${revenue.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Sales progress</span>
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

                  <div className="mt-4 pt-3 border-t border-slate-50">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/events/${id}/ticketing/${ticket._id}`); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#7A1F1F] hover:text-[#5C1414] transition-colors"
                    >
                      <Users size={13} />
                      View Guests
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
