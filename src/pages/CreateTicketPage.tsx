import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Sparkles, Calendar, Users, DollarSign, Info, Minus, Plus } from 'lucide-react';
import { useCreateTicket } from '../hooks/useTickets';
import { useEvent } from '../hooks/useEvents';
import SEO from '../components/SEO';
import DatePicker from '../components/DatePicker';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_CURRENCIES, getCurrencySymbol, formatCurrency, getCurrencyForCountry } from '../utils/formatters';

const R = '#7A1F1F';
const RD = '#5C1414';

export default function CreateTicketPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createTicket = useCreateTicket();
  const { data: event } = useEvent(id!);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    currency: getCurrencyForCountry(user?.country),
    total: 100,
    saleStart: '',
    saleEnd: '',
  });

  useEffect(() => {
    if (event?.currency) {
      setForm(f => ({ ...f, currency: event.currency || getCurrencyForCountry(user?.country) }));
    }
  }, [event?.currency, user?.country]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    createTicket.mutate(
      { ...form, eventId: id },
      {
        onSuccess: () => {
          navigate(`/events/${id}/ticketing`);
        },
      }
    );
  };

  const isPaid = form.price > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
      <SEO title="Create Ticket Type" />
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/events/${id}/ticketing`)}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Tickets
        </button>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Create Ticket Type</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Add new ticket pricing levels, details, and access options for your guests.</p>
        </div>

        {/* Form and Preview Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form (7/12 width) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
            <div className="space-y-4">
              {/* Ticket Name */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Ticket Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-[#7A1F1F] focus:ring-4 focus:ring-[#7A1F1F]/5 transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="e.g. VIP Access, General Admission"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-bold text-slate-700 mb-1.5 block">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-[#7A1F1F] focus:ring-4 focus:ring-[#7A1F1F]/5 transition-all placeholder:text-slate-400 placeholder:font-normal resize-none"
                  placeholder="Tell guests what's included in this ticket type (e.g., drinks, reserved seats, meals)..."
                />
              </div>

              {/* Price, Currency & Capacity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Price (4 cols) */}
                <div className="sm:col-span-4">
                  <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <DollarSign size={16} className="text-slate-400" />
                    Price ({getCurrencySymbol(form.currency)})
                  </label>
                  <div className="flex items-center bg-slate-50/50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-[#7A1F1F] focus-within:ring-4 focus-within:ring-[#7A1F1F]/5 transition-all overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, price: Math.max(0, f.price - (form.currency === 'NGN' ? 500 : 5)) }))}
                      className="px-2.5 py-3 text-slate-400 hover:text-slate-750 hover:bg-slate-100/80 active:bg-slate-200/50 transition-colors border-r border-slate-200 select-none font-bold text-base shrink-0"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: Math.max(0, Number(e.target.value)) }))}
                      className="w-full bg-transparent px-2 py-2 text-center text-slate-800 text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, price: f.price + (form.currency === 'NGN' ? 500 : 5) }))}
                      className="px-2.5 py-3 text-slate-400 hover:text-slate-750 hover:bg-slate-100/80 active:bg-slate-200/50 transition-colors border-l border-slate-200 select-none font-bold text-base shrink-0"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Set to 0 for free.</p>
                </div>

                {/* Currency selector (4 cols) */}
                <div className="sm:col-span-4">
                  <label className="text-sm font-bold text-slate-700 mb-1.5 block">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full px-3 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:outline-none focus:bg-white focus:border-[#7A1F1F] focus:ring-4 focus:ring-[#7A1F1F]/5 transition-all"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.symbol})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">{SUPPORTED_CURRENCIES.find(c => c.code === form.currency)?.country || 'Event currency'}</p>
                </div>

                {/* Total Capacity (4 cols) */}
                <div className="sm:col-span-4">
                  <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Users size={16} className="text-slate-400" />
                    Total Capacity
                  </label>
                  <div className="flex items-center bg-slate-50/50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-[#7A1F1F] focus-within:ring-4 focus-within:ring-[#7A1F1F]/5 transition-all overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, total: Math.max(1, f.total - 10) }))}
                      className="px-2.5 py-3 text-slate-400 hover:text-slate-750 hover:bg-slate-100/80 active:bg-slate-200/50 transition-colors border-r border-slate-200 select-none font-bold text-base shrink-0"
                    >
                      <Minus size={13} />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={form.total}
                      onChange={e => setForm(f => ({ ...f, total: Math.max(1, Number(e.target.value)) }))}
                      className="w-full bg-transparent px-2 py-2 text-center text-slate-800 text-sm font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, total: f.total + 10 }))}
                      className="px-2.5 py-3 text-slate-400 hover:text-slate-750 hover:bg-slate-100/80 active:bg-slate-200/50 transition-colors border-l border-slate-200 select-none font-bold text-base shrink-0"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Available tickets.</p>
                </div>
              </div>

              {/* Sale Dates Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={16} className="text-slate-400" />
                    Sale Start Date
                  </label>
                  <DatePicker
                    value={form.saleStart}
                    onChange={val => setForm(f => ({ ...f, saleStart: val }))}
                    placeholder="Select start date"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar size={16} className="text-slate-400" />
                    Sale End Date
                  </label>
                  <DatePicker
                    value={form.saleEnd}
                    onChange={val => setForm(f => ({ ...f, saleEnd: val }))}
                    placeholder="Select end date"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate(`/events/${id}/ticketing`)}
                className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.name.trim() || createTicket.isPending}
                className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-900/10 hover:shadow-[#7A1F1F]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: `linear-gradient(135deg, ${R} 0%, ${RD} 100%)` }}
              >
                {createTicket.isPending ? 'Creating…' : 'Create Ticket Type'}
                <Sparkles size={14} />
              </button>
            </div>
          </form>

          {/* Right Column: Ticket Preview (5/12 width) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">Live Ticket Preview</h3>

            {/* Stunning physical luxury ticket stub design */}
            <div className="relative bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/40 overflow-hidden select-none">
              
              {/* Event Cover Image / Default placeholder banner preview */}
              <div className="h-28 w-full overflow-hidden relative border-b border-slate-100">
                <img
                  src={event?.coverImage || '/default-banner.jpg'}
                  alt={event?.name || 'Event Cover'}
                  className="w-full h-full object-cover"
                />
                {/* Visual Accent gradient bar overlay at the very top of the image */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#A62F2F] to-[#D4A24C]" />
              </div>

              <div className="p-6 pb-4 space-y-4 relative">
                {/* EventJelly Branding */}
                <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-3">
                  <span className="text-xs font-black tracking-widest text-[#7A1F1F] uppercase">EventJelly Pass</span>
                  <span className="text-[10px] text-slate-400 font-bold tracking-wider">ADMIT ONE</span>
                </div>

                {/* Ticket Details */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ticket Tier</span>
                  <h4 className="text-xl font-extrabold text-slate-800 break-words leading-tight">
                    {form.name || 'Your Ticket Name'}
                  </h4>
                </div>

                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Access Status</span>
                    <span
                      className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm"
                      style={{
                        background: isPaid ? '#FEF3C7' : '#ECFDF5',
                        color: isPaid ? '#B45309' : '#059669',
                        borderColor: isPaid ? '#FDE68A' : '#A7F3D0',
                      }}
                    >
                      {isPaid ? 'PAID ACCESS' : 'FREE RSVP'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price</span>
                    <span className="text-2xl font-black text-slate-800">
                      {form.price === 0 ? 'Free' : formatCurrency(form.price, form.currency)}
                    </span>
                  </div>
                </div>

                {/* Description Box */}
                <div className="bg-[#FAF7F2] rounded-xl p-3 border border-slate-200 text-xs text-slate-600 leading-relaxed min-h-[50px] break-words">
                  {form.description || 'Description will appear here. Detail inclusions like complimentary food, seating, etc.'}
                </div>
              </div>

              {/* Decorative ticket notch cutout line */}
              <div className="relative flex items-center justify-between px-1 my-2">
                <div className="w-4 h-8 bg-[#F8FAFC] border-r border-t border-b border-slate-200 rounded-r-full -ml-[1px]" />
                <div className="flex-1 border-t border-dashed border-slate-200 mx-2" />
                <div className="w-4 h-8 bg-[#F8FAFC] border-l border-t border-b border-slate-200 rounded-l-full -mr-[1px]" />
              </div>

              {/* Ticket Footer / Barcode Stub */}
              <div className="p-6 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Available</span>
                    <p className="font-bold text-slate-700 mt-0.5">{form.total} passes</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sales Timeline</span>
                    <p className="font-bold text-slate-700 mt-0.5 truncate">
                      {form.saleStart ? form.saleStart : 'Starts now'}
                    </p>
                  </div>
                </div>

                {/* Mock Barcode */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <div className="w-full h-12 bg-slate-900 rounded flex items-center justify-between px-4 opacity-80 overflow-hidden relative">
                    {/* Generates realistic lines */}
                    <div className="absolute inset-y-0 inset-x-4 flex justify-between">
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-full bg-white"
                          style={{
                            width: `${[1, 2, 3, 4, 1, 2][i % 6]}px`,
                            opacity: i % 3 === 0 ? 0.3 : 1,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-1.5">
                    * {form.name ? form.name.substring(0, 8).replace(/\s+/g, '') : 'EJPASS'}001 *
                  </span>
                </div>
              </div>
            </div>

            {/* Note box */}
            <div className="bg-[#E0F2FE]/40 border border-[#BAE6FD] rounded-2xl p-4 flex items-start gap-3">
              <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
              <p className="text-xs text-sky-800 leading-relaxed">
                This preview shows how this ticket tier will appear to guests scanning your events page or receiving confirmation emails.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
