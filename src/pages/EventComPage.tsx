import { useState } from 'react';
import {
  MessageSquare, Plus, Send, Clock, CheckCheck, FileText,
  Mail, Smartphone, Users, Zap, ChevronRight, X,
} from 'lucide-react';
import { useComms, useCreateComm, useDeleteComm } from '../hooks/useComms';
import type { Comm } from '../types';

const STATUS_CONFIG = {
  sent:      { label: 'Sent',      icon: CheckCheck, color: '#10B981', bg: '#ECFDF5', glow: '#10B98120' },
  scheduled: { label: 'Scheduled', icon: Clock,      color: '#F59E0B', bg: '#FFFBEB', glow: '#F59E0B20' },
  draft:     { label: 'Draft',     icon: FileText,   color: '#94A3B8', bg: '#F1F5F9', glow: '#94A3B820' },
};

const AUDIENCE_OPTIONS = [
  { value: 'all',       label: 'All guests',    icon: Users },
  { value: 'confirmed', label: 'Confirmed only', icon: CheckCheck },
  { value: 'pending',   label: 'Pending RSVP',  icon: Clock },
  { value: 'vip',       label: 'VIP group',     icon: Zap },
];

interface ComposeModalProps {
  onClose: () => void;
  onSave: (data: Partial<Comm>) => void;
}

function ComposeModal({ onClose, onSave }: ComposeModalProps) {
  const [form, setForm] = useState({
    subject: '', body: '', channel: 'email' as Comm['channel'],
    audience: 'all', scheduledAt: '',
  });
  const [step, setStep] = useState<'compose' | 'preview'>('compose');

  const wordCount = form.body.trim().split(/\s+/).filter(Boolean).length;
  const charCount = form.body.length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#FDF5EE] flex items-center justify-center">
              <MessageSquare size={16} className="text-[#7A1F1F]" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Compose Message</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Channel toggle */}
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl">
            {([
              { value: 'email', label: 'Email', icon: Mail },
              { value: 'sms',   label: 'SMS',   icon: Smartphone },
            ] as const).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setForm(f => ({ ...f, channel: value }))}
                className={`flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  form.channel === value
                    ? 'bg-white text-[#7A1F1F] shadow-sm border border-indigo-100'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Subject</label>
            <input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 focus:border-transparent placeholder:text-slate-300 transition-all"
              placeholder="e.g. You're invited to our Annual Gala"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Message</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 focus:border-transparent resize-none placeholder:text-slate-300 transition-all leading-relaxed"
              rows={5}
              placeholder="Write your message here…"
            />
            <p className="text-xs text-slate-300 text-right mt-1">{wordCount} words · {charCount} chars</p>
          </div>

          {/* Audience + Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Audience</label>
              <select
                value={form.audience}
                onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 bg-white text-slate-700 appearance-none cursor-pointer transition-all"
              >
                {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Schedule (optional)</label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 text-slate-700 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (form.subject) {
                  onSave({ ...form, status: form.scheduledAt ? 'scheduled' : 'draft' });
                  onClose();
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 font-medium transition-all"
            >
              <FileText size={14} />
              Save draft
            </button>
            <button
              onClick={() => {
                if (form.subject) {
                  onSave({ ...form, status: 'sent', sentAt: new Date().toISOString() });
                  onClose();
                }
              }}
              disabled={!form.subject}
              className="flex items-center gap-2 px-5 py-2.5 text-sm text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 transition-all"
              style={{ backgroundColor: '#7A1F1F' }}
            >
              <Send size={14} />
              Send now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommCard({ comm, onDelete }: { comm: Comm; onDelete: () => void }) {
  const status = STATUS_CONFIG[comm.status];
  const StatusIcon = status.icon;
  const audience = AUDIENCE_OPTIONS.find(o => o.value === comm.audience);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">
      <div className="flex items-start gap-4">
        {/* Channel icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${comm.channel === 'email' ? 'bg-[#FDF5EE]' : 'bg-[#FAF7F2]'}`}>
          {comm.channel === 'email'
            ? <Mail size={17} className="text-[#7A1F1F]" />
            : <Smartphone size={17} className="text-emerald-500" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-slate-900 truncate">{comm.subject}</h3>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                  style={{ background: status.bg, color: status.color }}
                >
                  <StatusIcon size={10} />
                  {status.label}
                </span>
              </div>
              {comm.body && (
                <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{comm.body}</p>
              )}
            </div>
            <button
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {audience && (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <audience.icon size={11} />
                {audience.label}
              </span>
            )}
            {comm.recipientCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Users size={11} />
                {comm.recipientCount} recipients
              </span>
            )}
            {comm.sentAt && (
              <span className="text-xs text-slate-300">
                Sent {new Date(comm.sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
            {comm.scheduledAt && comm.status === 'scheduled' && (
              <span className="text-xs text-amber-400 font-medium">
                Scheduled {new Date(comm.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventComPage() {
  const { data: comms = [], isLoading } = useComms();
  const createComm = useCreateComm();
  const deleteComm = useDeleteComm();

  const [showCompose, setShowCompose] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'scheduled' | 'draft'>('all');

  const filtered = filterStatus === 'all' ? comms : comms.filter(c => c.status === filterStatus);

  const sent      = comms.filter(c => c.status === 'sent').length;
  const scheduled = comms.filter(c => c.status === 'scheduled').length;
  const drafts    = comms.filter(c => c.status === 'draft').length;
  const totalReach = comms.filter(c => c.status === 'sent').reduce((s, c) => s + c.recipientCount, 0);

  const STATS = [
    { icon: CheckCheck, label: 'Sent',        value: sent,                    color: '#10B981', bg: '#ECFDF5' },
    { icon: Clock,      label: 'Scheduled',   value: scheduled,               color: '#F59E0B', bg: '#FFFBEB' },
    { icon: FileText,   label: 'Drafts',      value: drafts,                  color: '#94A3B8', bg: '#F8FAFC' },
    { icon: Users,      label: 'Total Reach', value: totalReach.toLocaleString(), color: '#7A1F1F', bg: '#FAF7F2' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSave={data => createComm.mutate(data)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-0.5">Communications</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Event Com</h1>
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-2xl hover:opacity-90 shadow-lg shadow-indigo-200 transition-all"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            <Plus size={16} />
            Compose
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
        <div className="max-w-4xl mx-auto">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {STATS.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: bg }}>
                    <Icon size={13} style={{ color }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{label}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1 w-fit mb-5 shadow-sm">
            {(['all', 'sent', 'scheduled', 'draft'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl capitalize transition-all ${
                  filterStatus === s
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== 'all' && (
                  <span className={`ml-1.5 text-xs ${filterStatus === s ? 'text-white/60' : 'text-slate-300'}`}>
                    {s === 'sent' ? sent : s === 'scheduled' ? scheduled : drafts}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Messages */}
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-1/3 h-4 bg-slate-100 rounded" />
                      <div className="w-2/3 h-3 bg-slate-100 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FDF5EE] flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="text-indigo-400" />
              </div>
              <p className="text-slate-700 font-semibold mb-1">No messages yet</p>
              <p className="text-sm text-slate-400 mb-6">Compose your first message to keep guests informed</p>
              <button
                onClick={() => setShowCompose(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:opacity-90 transition-all"
                style={{ backgroundColor: '#7A1F1F' }}
              >
                <Plus size={15} />
                Compose message
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(comm => (
                <CommCard
                  key={comm._id}
                  comm={comm}
                  onDelete={() => { if (confirm('Delete this message?')) deleteComm.mutate(comm._id); }}
                />
              ))}
            </div>
          )}

          {/* Quick tip */}
          {comms.length > 0 && (
            <div className="mt-6 flex items-center gap-3 bg-[#FDF5EE] border border-indigo-100 rounded-2xl px-5 py-4">
              <Zap size={16} className="text-indigo-400 flex-shrink-0" />
              <p className="text-sm text-[#7A1F1F] font-medium flex-1">Schedule messages in advance to automate your event communications.</p>
              <button onClick={() => setShowCompose(true)} className="flex items-center gap-1 text-xs font-semibold text-[#7A1F1F] hover:text-[#7A1F1F] transition-colors flex-shrink-0">
                Schedule one <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
