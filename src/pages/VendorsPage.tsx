import { useState } from 'react';
import { Plus, Search, Store, DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react';
import SEO from '../components/SEO';
import { useVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '../hooks/useVendors';
import type { Vendor } from '../types';

const CATEGORIES = ['catering', 'av', 'decor', 'photography', 'music', 'security', 'other'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  catering: 'Catering', av: 'A/V & Tech', decor: 'Decor', photography: 'Photography',
  music: 'Music & Entertainment', security: 'Security', other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  catering: '#F59E0B', av: '#7A1F1F', decor: '#EC4899', photography: '#0EA5E9',
  music: '#8B5CF6', security: '#EF4444', other: '#94A3B8',
};

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: '#10B981', bg: '#ECFDF5' },
  pending: { label: 'Pending', icon: Clock, color: '#F59E0B', bg: '#FFFBEB' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: '#EF4444', bg: '#FEF2F2' },
};

interface AddVendorModalProps {
  onClose: () => void;
  onSave: (data: Partial<Vendor>) => void;
}

function AddVendorModal({ onClose, onSave }: AddVendorModalProps) {
  const [form, setForm] = useState({ name: '', category: 'catering', contactName: '', email: '', phone: '', contractValue: 0, notes: '' });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 mx-4">
        <h2 className="text-lg font-bold text-slate-800 mb-5">Add Vendor</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Vendor Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="Company or individual name" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 bg-white">
              {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Contact Name</label>
              <input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="Full name" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Contract Value ($)</label>
              <input type="number" min={0} value={form.contractValue} onChange={e => setForm(f => ({ ...f, contractValue: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="vendor@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30 resize-none" rows={2} placeholder="Any additional notes…" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => { if (form.name) { onSave(form); onClose(); } }}
            className="px-4 py-2 text-sm text-white font-semibold rounded-xl hover:opacity-90"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            Add Vendor
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorsPage() {
  const { data: vendors = [], isLoading } = useVendors();
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = vendors.filter(v => {
    const matchSearch = v.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || v.category === filterCat;
    return matchSearch && matchCat;
  });

  const totalContract = vendors.reduce((s, v) => s + v.contractValue, 0);
  const confirmedCount = vendors.filter(v => v.status === 'confirmed').length;
  const paidCount = vendors.filter(v => v.paid).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SEO title="Vendors" />
      {showAdd && (
        <AddVendorModal
          onClose={() => setShowAdd(false)}
          onSave={data => createVendor.mutate(data)}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <p className="text-sm text-slate-500 mb-0.5">Manage event vendors & suppliers</p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 shadow-sm"
            style={{ backgroundColor: '#7A1F1F' }}
          >
            <Plus size={15} />
            Add Vendor
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6 max-w-[1200px] mx-auto w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Store, label: 'Total Vendors', value: vendors.length, color: '#7A1F1F' },
            { icon: CheckCircle2, label: 'Confirmed', value: confirmedCount, color: '#10B981' },
            { icon: DollarSign, label: 'Total Contracts', value: `$${totalContract.toLocaleString()}`, color: '#F59E0B' },
            { icon: CheckCircle2, label: 'Paid', value: `${paidCount} / ${vendors.length}`, color: '#7A1F1F' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500 text-sm mb-2"><Icon size={15} />{label}</div>
              <div className="text-2xl font-bold text-slate-900" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm w-full sm:w-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/30" />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 flex-wrap">
            {['all', ...CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${filterCat === cat ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vendor cards */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">Loading vendors…</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Store size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No vendors found</p>
            <p className="text-sm text-slate-400 mt-1">Add your first vendor to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(vendor => {
              const status = STATUS_CONFIG[vendor.status];
              const StatusIcon = status.icon;
              const catColor = CATEGORY_COLORS[vendor.category] ?? '#94A3B8';
              return (
                <div key={vendor._id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: catColor }}>
                        {vendor.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{vendor.name}</h3>
                        <p className="text-xs text-slate-400">{CATEGORY_LABELS[vendor.category] ?? vendor.category}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: status.bg, color: status.color }}>
                      <StatusIcon size={10} />
                      {status.label}
                    </span>
                  </div>

                  {(vendor.contactName || vendor.email || vendor.phone) && (
                    <div className="text-xs text-slate-500 space-y-0.5 mb-3">
                      {vendor.contactName && <p>👤 {vendor.contactName}</p>}
                      {vendor.email && <p>✉️ {vendor.email}</p>}
                      {vendor.phone && <p>📞 {vendor.phone}</p>}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div>
                      <p className="text-xs text-slate-400">Contract</p>
                      <p className="font-semibold text-slate-800">${vendor.contractValue.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateVendor.mutate({ id: vendor._id, data: { paid: !vendor.paid } })}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${vendor.paid ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {vendor.paid ? 'Paid' : 'Mark paid'}
                      </button>
                      {vendor.status !== 'confirmed' && (
                        <button onClick={() => updateVendor.mutate({ id: vendor._id, data: { status: 'confirmed' } })}
                          className="text-xs px-3 py-1.5 rounded-lg font-medium bg-[#FDF5EE] text-[#7A1F1F] hover:bg-[#F5E6D3] transition-all">
                          Confirm
                        </button>
                      )}
                      <button onClick={() => { if (confirm('Remove vendor?')) deleteVendor.mutate(vendor._id); }}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors px-1">
                        Remove
                      </button>
                    </div>
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
