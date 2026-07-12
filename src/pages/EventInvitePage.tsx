import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useFloorPlan } from '../hooks/useFloorPlans';
import { useTickets } from '../hooks/useTickets';
import { useCreateGuest } from '../hooks/useGuests';
import { Calendar, MapPin, Ticket, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Ticket as TicketType } from '../types';
import Logo from '../components/Logo';

export default function EventInvitePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading: isLoadingEvent } = useFloorPlan(id!);
  const { data: tickets = [], isLoading: isLoadingTickets } = useTickets(id!);
  const createGuest = useCreateGuest();

  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [submitted, setSubmitted] = useState(false);

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

  const activeTickets = tickets.filter(t => t.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !form.firstName || !form.lastName || !form.email) return;

    createGuest.mutate({
      eventId: id,
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      ticketId: selectedTicket._id,
      rsvpStatus: selectedTicket.price === 0 ? 'confirmed' : 'pending',
    }, {
      onSuccess: () => {
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-3xl p-10 text-center shadow-xl shadow-slate-200/50">
          <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('invite.welcome')}</h1>
          <p className="text-slate-500 mb-8">
            {selectedTicket?.price === 0 
              ? "Your RSVP has been confirmed. We've sent the details to your email."
              : "Your ticket request has been received. Please check your email for payment instructions."}
          </p>
          <button 
            onClick={() => { setSubmitted(false); setForm({ firstName: '', lastName: '', email: '' }); setSelectedTicket(null); }}
            className="text-[#7A1F1F] font-medium hover:underline"
          >
            {t('invite.register_another')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-4 px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-bold text-slate-900 tracking-tight">{t('invite.brand')}</span>
        </div>
        <Link to="/events" className="text-sm font-medium text-slate-500 flex items-center gap-1 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} />
          {t('common.back_to_events')}
        </Link>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-12 flex flex-col lg:flex-row gap-12">
        {/* Left Column: Event Details */}
        <div className="flex-1 pt-4">
          <span className="inline-block px-3 py-1 bg-[#FDF5EE] text-[#7A1F1F] text-xs font-bold rounded-full uppercase tracking-wider mb-4">
            {t('invite.youre_invited')}
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {event.name}
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-xl leading-relaxed">
            {event.description || t('invite.description_placeholder')}
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-slate-700">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                <Calendar size={20} />
              </div>
              <div>
                <p className="font-semibold">{t('invite.date_tba')}</p>
                <p className="text-sm text-slate-500">{t('invite.time_tba')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-slate-700">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-semibold">{t('invite.location_tba')}</p>
                <p className="text-sm text-slate-500">{t('invite.check_back')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Form */}
        <div className="w-full lg:w-[480px]">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 p-8 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Ticket className="text-[#7A1F1F]" size={20} />
              {t('invite.select_ticket')}
            </h2>

            {activeTickets.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-500 font-medium">{t('invite.closed')}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  {activeTickets.map(ticket => (
                    <label 
                      key={ticket._id}
                      className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        selectedTicket?._id === ticket._id 
                          ? 'border-[#7A1F1F] bg-[#FDF5EE]/50' 
                          : 'border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedTicket?._id === ticket._id ? 'border-[#7A1F1F]' : 'border-slate-300'
                          }`}>
                            {selectedTicket?._id === ticket._id && <div className="w-2.5 h-2.5 rounded-full bg-[#7A1F1F]" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{ticket.name}</p>
                            {ticket.description && (
                              <p className="text-xs text-slate-500 mt-1">{ticket.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`font-bold ${ticket.price === 0 ? 'text-[#10B981]' : 'text-slate-900'}`}>
                            {ticket.price === 0 ? 'Free' : `$${ticket.price}`}
                          </span>
                        </div>
                      </div>
                      <input 
                        type="radio" 
                        name="ticket" 
                        value={ticket._id} 
                        className="sr-only"
                        onChange={() => setSelectedTicket(ticket)}
                        checked={selectedTicket?._id === ticket._id}
                      />
                    </label>
                  ))}
                </div>

                {selectedTicket && (
                  <div className="pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="font-bold text-slate-900 mb-4">{t('invite.guest_details')}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{t('invite.first_name')}</label>
                        <input 
                          required
                          value={form.firstName}
                          onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" 
                          placeholder="Jane" 
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{t('invite.last_name')}</label>
                        <input 
                          required
                          value={form.lastName}
                          onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" 
                          placeholder="Doe" 
                        />
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{t('invite.email')}</label>
                      <input 
                        required
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm" 
                        placeholder="jane@example.com" 
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={createGuest.isPending}
                      className="w-full py-4 px-6 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
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
