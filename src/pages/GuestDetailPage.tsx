import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, Phone, Users, UtensilsCrossed, StickyNote,
  CheckCircle2, Clock, XCircle, HelpCircle, UserCheck, Trash2, Edit2, Check, X,
} from 'lucide-react';
import { useGuest, useUpdateGuest, useDeleteGuest } from '../hooks/useGuests';
import type { Guest } from '../types';

const RSVP_OPTIONS: { value: Guest['rsvpStatus']; label: string; color: string; bg: string; icon: React.ElementType }[] = [
  { value: 'confirmed', label: 'Confirmed', color: '#10B981', bg: '#ECFDF5', icon: CheckCircle2 },
  { value: 'pending',   label: 'Pending',   color: '#F59E0B', bg: '#FFFBEB', icon: Clock },
  { value: 'declined',  label: 'Declined',  color: '#EF4444', bg: '#FEF2F2', icon: XCircle },
  { value: 'maybe',     label: 'Maybe',     color: '#7A1F1F', bg: '#FAF7F2', icon: HelpCircle },
];

function RsvpBadge({ status }: { status: Guest['rsvpStatus'] }) {
  const opt = RSVP_OPTIONS.find(o => o.value === status) ?? RSVP_OPTIONS[1];
  const Icon = opt.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: opt.bg, color: opt.color }}>
      <Icon size={13} />
      {opt.label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-slate-400" />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function GuestDetailPage() {
  const { id, guestId } = useParams<{ id: string; guestId: string }>();
  const navigate = useNavigate();

  const { data: guest, isLoading } = useGuest(guestId!);
  const updateGuest = useUpdateGuest();
  const deleteGuest = useDeleteGuest();

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (field: string, current: string) => {
    setEditingField(field);
    setEditValue(current);
  };

  const saveEdit = (field: string) => {
    updateGuest.mutate({ id: guestId!, data: { [field]: editValue } });
    setEditingField(null);
  };

  const cancelEdit = () => setEditingField(null);

  const handleDelete = () => {
    if (confirm('Remove this guest permanently?')) {
      deleteGuest.mutate(guestId!, {
        onSuccess: () => navigate(-1),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse" />
          <div className="w-40 h-5 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <div className="max-w-2xl mx-auto space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                <div className="w-1/3 h-4 bg-slate-100 rounded animate-pulse mb-3" />
                <div className="w-full h-3 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-slate-400">
        <p className="font-medium">Guest not found</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-sm text-[#7A1F1F] hover:underline">Go back</button>
      </div>
    );
  }

  const initials = guest.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Guest Profile</h1>
            <p className="text-sm text-slate-500 mt-0.5">View and manage guest details</p>
          </div>
        </div>
        <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors">
          <Trash2 size={14} />
          Remove guest
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 sm:p-8">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Identity card */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-[#F5E6D3] flex items-center justify-center text-[#7A1F1F] text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                {editingField === 'name' ? (
                  <div className="flex items-center gap-2">
                    <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                      className="flex-1 text-xl font-bold text-slate-900 border-b-2 border-indigo-400 focus:outline-none bg-transparent"
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit('name'); if (e.key === 'Escape') cancelEdit(); }}
                    />
                    <button onClick={() => saveEdit('name')} className="text-green-500 hover:text-green-600"><Check size={18} /></button>
                    <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="text-xl font-bold text-slate-900">{guest.name}</h2>
                    <button onClick={() => startEdit('name', guest.name)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 transition-all">
                      <Edit2 size={13} className="text-slate-400" />
                    </button>
                  </div>
                )}
                {guest.group && <p className="text-sm text-slate-400 mt-0.5">{guest.group}</p>}
                <div className="mt-3">
                  <RsvpBadge status={guest.rsvpStatus} />
                </div>
              </div>
            </div>
          </div>

          {/* RSVP status changer */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">RSVP Status</p>
            <div className="flex flex-wrap gap-2">
              {RSVP_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = guest.rsvpStatus === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateGuest.mutate({ id: guest._id, data: { rsvpStatus: opt.value } })}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${isActive ? 'border-transparent shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                    style={isActive ? { background: opt.bg, color: opt.color, borderColor: opt.color + '40' } : {}}
                  >
                    <Icon size={13} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Contact</p>
            <InfoRow icon={Mail} label="Email" value={guest.email} />
            <InfoRow icon={Phone} label="Phone" value={guest.phone} />
            <InfoRow icon={Users} label="Plus ones" value={guest.plusOnes > 0 ? `+${guest.plusOnes} guest${guest.plusOnes > 1 ? 's' : ''}` : undefined} />
            <InfoRow icon={UtensilsCrossed} label="Dietary requirements" value={guest.dietaryReqs} />
          </div>

          {/* Table & notes */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Seating & Notes</p>

            {/* Table assignment */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-1">Table Assignment</p>
              {editingField === 'tableAssignment' ? (
                <div className="flex items-center gap-2">
                  <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                    className="flex-1 text-sm px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none"
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit('tableAssignment'); if (e.key === 'Escape') cancelEdit(); }}
                    placeholder="e.g. Table 4, Seat 2"
                  />
                  <button onClick={() => saveEdit('tableAssignment')} className="text-green-500"><Check size={16} /></button>
                  <button onClick={cancelEdit} className="text-slate-400"><X size={16} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <p className="text-sm font-medium text-slate-800">{guest.tableAssignment || <span className="text-slate-400 font-normal">Not assigned</span>}</p>
                  <button onClick={() => startEdit('tableAssignment', guest.tableAssignment ?? '')} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100">
                    <Edit2 size={12} className="text-slate-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <p className="text-xs text-slate-400 mb-1">Notes</p>
              {editingField === 'notes' ? (
                <div className="space-y-2">
                  <textarea value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus rows={3}
                    className="w-full text-sm px-3 py-2 border border-indigo-300 rounded-lg focus:outline-none resize-none"
                    placeholder="Add notes about this guest…"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => saveEdit('notes')} className="px-3 py-1 text-xs text-white bg-[#FDF5EE]0 rounded-lg">Save</button>
                    <button onClick={cancelEdit} className="px-3 py-1 text-xs text-slate-500 border border-slate-200 rounded-lg">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 group">
                  <p className="text-sm text-slate-700 flex-1">{guest.notes || <span className="text-slate-400">No notes</span>}</p>
                  <button onClick={() => startEdit('notes', guest.notes ?? '')} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 flex-shrink-0 mt-0.5">
                    <StickyNote size={12} className="text-slate-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Check-in */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Check-in</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{guest.checkedIn ? 'Guest has checked in' : 'Not yet checked in'}</p>
                <p className="text-xs text-slate-400 mt-0.5">{guest.checkedIn ? 'Mark as not checked in to undo' : 'Mark as checked in when guest arrives'}</p>
              </div>
              <button
                onClick={() => updateGuest.mutate({ id: guest._id, data: { checkedIn: !guest.checkedIn } })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${guest.checkedIn ? 'bg-green-50 text-green-600 border border-green-200' : 'text-white shadow-sm'}`}
                style={guest.checkedIn ? {} : { backgroundColor: '#7A1F1F' }}
              >
                <UserCheck size={15} />
                {guest.checkedIn ? 'Checked in' : 'Check in'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
