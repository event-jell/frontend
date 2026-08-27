import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { usePublicEvent } from '../hooks/useEvents';
import { useTickets } from '../hooks/useTickets';
import { useCreateGuest } from '../hooks/useGuests';
import { Calendar, MapPin, Ticket, CheckCircle2, ChevronRight, ArrowLeft, Video, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Ticket as TicketType, RsvpField } from '../types';
import Logo from '../components/Logo';

const INPUT_CLASS =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/15 focus:bg-white focus:border-[#7A1F1F]/60 transition-all text-sm font-medium text-slate-850';

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: RsvpField;
  value: string;
  onChange: (val: string) => void;
}) {
  const label = (
    <label className="text-xs font-bold text-slate-600 mb-1.5 block">
      {field.label}
      {field.required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  switch (field.type) {
    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`${INPUT_CLASS} resize-none`}
          />
        </div>
      );
    case 'select':
      return (
        <div>
          {label}
          <select
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">— Select —</option>
            {(field.options ?? []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`field-${field.id}`}
            checked={value === 'true'}
            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 accent-[#7A1F1F] rounded"
          />
          <label htmlFor={`field-${field.id}`} className="text-sm font-bold text-slate-700 cursor-pointer">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        </div>
      );
    case 'number':
      return (
        <div>
          {label}
          <input
            type="number"
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={INPUT_CLASS}
          />
        </div>
      );
    case 'phone':
      return (
        <div>
          {label}
          <input
            type="tel"
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder ?? '+1 (555) 000-0000'}
            className={INPUT_CLASS}
          />
        </div>
      );
    case 'email':
      return (
        <div>
          {label}
          <input
            type="email"
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder ?? 'you@example.com'}
            className={INPUT_CLASS}
          />
        </div>
      );
    default:
      return (
        <div>
          {label}
          <input
            type="text"
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={INPUT_CLASS}
          />
        </div>
      );
  }
}

export default function EventInvitePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedTicketId = searchParams.get('ticket');

  const { data: event, isLoading: isLoadingEvent } = usePublicEvent(id!);
  const { data: tickets = [], isLoading: isLoadingTickets } = useTickets(id!);
  const createGuest = useCreateGuest();

  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  // Auto-select ticket from URL param
  const activeTickets = tickets.filter(t => t.status === 'active');
  const rsvpFields: RsvpField[] = event?.rsvpFields ?? [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !form.firstName || !form.lastName || !form.email) return;

    createGuest.mutate({
      eventId: id,
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      ticketId: selectedTicket._id,
      rsvpStatus: selectedTicket.price === 0 ? 'confirmed' : 'pending',
      customFields: Object.keys(customValues).length > 0 ? customValues : undefined,
    }, {
      onSuccess: () => setSubmitted(true),
    });
  };

  if (isLoadingEvent || isLoadingTickets) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">{t('invite.loading')}</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400">{t('invite.not_found')}</div>
      </div>
    );
  }

  // Pre-select if URL ticket parameter matches
  if (!selectedTicket && preselectedTicketId && activeTickets.length > 0) {
    const found = activeTickets.find(t => t._id === preselectedTicketId);
    if (found) setSelectedTicket(found);
  }

  // Formatting values
  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  const timeString = event.startTime
    ? event.endTime
      ? `${event.startTime} - ${event.endTime}`
      : event.startTime
    : null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-[#FAF8F5] to-[#F3ECE0] flex items-center justify-center p-6 animate-in fade-in duration-350">
        <div className="bg-white max-w-md w-full rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] to-[#D4A24C]" />
          <div className="w-16 h-16 bg-green-100 text-green-650 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{t('invite.welcome')}</h1>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">
            {selectedTicket?.price === 0
              ? "Your RSVP has been confirmed. We've sent the details to your email."
              : "Your ticket request has been received. Please check your email for payment instructions."}
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setForm({ firstName: '', lastName: '', email: '' });
              setCustomValues({});
              setSelectedTicket(null);
            }}
            className="text-[#7A1F1F] font-bold hover:underline"
          >
            {t('invite.register_another')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-[#FAF8F5] to-[#F3ECE0] flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-150/60 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-bold text-[#7A1F1F] tracking-tight">{t('invite.brand')}</span>
        </div>
        <Link to="/events" className="text-xs font-bold text-slate-500 flex items-center gap-1.5 hover:text-slate-800 transition-colors uppercase tracking-wider">
          <ArrowLeft size={14} />
          {t('common.back_to_events')}
        </Link>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 flex flex-col lg:flex-row gap-12 items-start justify-center">
        
        {/* Left Column: Event details (gorgeous and structured) */}
        <div className="flex-1 space-y-6 pt-4 w-full">
          {/* Event Cover Image / Beautiful styled placeholder */}
          <img
            src={event.coverImage || '/default-banner.jpg'}
            alt={event.name}
            className="w-full h-64 object-cover rounded-3xl shadow-md border border-slate-200/45"
          />

          <div className="space-y-3">
            <span className="inline-block px-3 py-1 bg-[#FDF5EE] text-[#7A1F1F] text-[10px] font-black rounded-full uppercase tracking-widest border border-[#7A1F1F]/10">
              {t('invite.youre_invited')}
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
              {event.name}
            </h1>
            <p className="text-slate-600 leading-relaxed text-sm md:text-base whitespace-pre-line max-w-xl">
              {event.description || t('invite.description_placeholder')}
            </p>
          </div>

          {/* Event specs card details */}
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-6 shadow-sm max-w-xl space-y-4">
            {event.dates && event.dates.length > 0 ? (
              <div className="space-y-4">
                {event.dates.map((d, index) => (
                  <div key={index} className="flex items-center gap-4 text-slate-700">
                    <div className="w-10 h-10 bg-[#FAF7F2] border border-slate-150 rounded-xl flex items-center justify-center text-[#7A1F1F] shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">
                        Date {index + 1}: {d.date}
                      </p>
                      {d.startTime && (
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {d.startTime}{d.endTime ? ` - ${d.endTime}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 bg-[#FAF7F2] border border-slate-150 rounded-xl flex items-center justify-center text-[#7A1F1F] shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {formattedDate || t('invite.date_tba')}
                  </p>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {timeString || t('invite.time_tba')}
                  </p>
                </div>
              </div>
            )}

            {event.isVirtual ? (
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-650 shrink-0">
                  <Video size={18} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Virtual Event</p>
                  {event.virtualLink ? (
                    <a
                      href={event.virtualLink.startsWith('http') ? event.virtualLink : `https://${event.virtualLink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-650 hover:underline font-semibold mt-0.5 flex items-center gap-0.5"
                    >
                      Join Link <ExternalLink size={10} />
                    </a>
                  ) : (
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Link will be shared on confirmation</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 bg-[#FAF7F2] border border-slate-150 rounded-xl flex items-center justify-center text-[#7A1F1F] shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {event.venue || t('invite.location_tba')}
                  </p>
                  {!event.venue && <p className="text-xs text-slate-500 font-semibold mt-0.5">{t('invite.check_back')}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: RSVP / Checkout Box */}
        <div className="w-full lg:w-[460px] shrink-0">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 p-8 border border-slate-150 relative overflow-hidden">
            
            {/* Crimson & Gold Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] to-[#D4A24C]" />

            <h2 className="text-lg font-black text-slate-850 mb-6 flex items-center gap-2.5">
              <Ticket className="text-[#7A1F1F]" size={20} />
              {t('invite.select_ticket')}
            </h2>

            {activeTickets.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-150">
                <Ticket className="text-slate-300 mx-auto mb-3" size={32} />
                <p className="text-slate-500 font-bold text-sm">{t('invite.closed')}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">This event is currently not accepting new registrations.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ticket selector list */}
                <div className="space-y-3">
                  {activeTickets.map(ticket => {
                    const selected = selectedTicket?._id === ticket._id;
                    const ticketIsPaid = ticket.price > 0;
                    return (
                      <label
                        key={ticket._id}
                        className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
                          selected
                            ? 'border-[#7A1F1F] bg-[#FAF7F2]/40 shadow-sm shadow-[#7A1F1F]/5'
                            : 'border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              selected ? 'border-[#7A1F1F]' : 'border-slate-300 bg-white'
                            }`}>
                              {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#7A1F1F]" />}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-850 text-sm">{ticket.name}</p>
                              {ticket.description && (
                                <p className="text-xs text-slate-550 mt-1 line-clamp-2 leading-relaxed">{ticket.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-sm font-black uppercase tracking-wider ${ticketIsPaid ? 'text-slate-800' : 'text-green-600'}`}>
                              {ticketIsPaid ? `$${ticket.price}` : 'Free'}
                            </span>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="ticket"
                          value={ticket._id}
                          className="sr-only"
                          onChange={() => {
                            setSelectedTicket(ticket);
                            setCustomValues({});
                          }}
                          checked={selected}
                        />
                      </label>
                    );
                  })}
                </div>

                {selectedTicket && (
                  <div className="pt-6 border-t border-slate-150 animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-4">
                    <h3 className="font-bold text-slate-850 text-sm mb-1">{t('invite.guest_details')}</h3>

                    {/* Guest input fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                          {t('invite.first_name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          value={form.firstName}
                          onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                          className={INPUT_CLASS}
                          placeholder="Jane"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                          {t('invite.last_name')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          required
                          value={form.lastName}
                          onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                          className={INPUT_CLASS}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                        {t('invite.email')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className={INPUT_CLASS}
                        placeholder="jane@example.com"
                      />
                    </div>

                    {/* Dynamic custom form fields */}
                    {rsvpFields.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        {rsvpFields.map(field => (
                          <DynamicField
                            key={field.id}
                            field={field}
                            value={customValues[field.id] ?? ''}
                            onChange={val => setCustomValues(prev => ({ ...prev, [field.id]: val }))}
                          />
                        ))}
                      </div>
                    )}

                    {/* Submit RSVP details */}
                    <button
                      type="submit"
                      disabled={createGuest.isPending}
                      className="w-full py-4 px-6 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md shadow-indigo-900/10 hover:shadow-[#7A1F1F]/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                      style={{ backgroundColor: '#7A1F1F' }}
                    >
                      {createGuest.isPending
                        ? t('common.processing')
                        : selectedTicket.price === 0
                          ? t('invite.complete_rsvp')
                          : t('invite.pay_register', { price: selectedTicket.price })}
                      {!createGuest.isPending && <ChevronRight size={18} />}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
