import { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar, MapPin, Ticket, CheckCircle2,
  ChevronRight, ArrowLeft, Loader2, Video,
  ExternalLink, CreditCard, Globe, Sparkles, RefreshCw, QrCode
} from 'lucide-react';
import { usePublicEvent } from '../hooks/useEvents';
import { useTickets } from '../hooks/useTickets';
import { useCreateGuest } from '../hooks/useGuests';
import { paymentsApi, getFriendlyErrorMessage } from '../lib/api';
import { openPaystackModal } from '../utils/paystack';
import { openPayPalCheckout } from '../utils/paypal';
import { COUNTRIES, type Country } from '../utils/countries';
import {
  isAfricanCountry,
  getCurrencyForCountry,
  convertPrice,
  DEFAULT_EXCHANGE_RATES,
  getPaymentMethodDetails
} from '../utils/currencyRates';
import { formatCurrency, getCurrencySymbol, formatLocalDate } from '../utils/formatters';
import { useLocale } from '../hooks/useLocale';
import type { Ticket as TicketType, Guest, RsvpField } from '../types';
import { toast } from 'sonner';
import Logo from '../components/Logo';

const INPUT_CLASS = 'w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all shadow-xs';

function DynamicField({ field, value, onChange }: {
  field: RsvpField;
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  switch (field.type) {
    case 'textarea':
      return (
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={3}
            className={INPUT_CLASS + ' resize-none'}
            placeholder={field.placeholder || ''}
          />
        </div>
      );
    case 'select':
      return (
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={INPUT_CLASS}
          >
            <option value="">{t('invite.select_option')}</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    case 'checkbox':
      return (
        <label className="flex items-center gap-3 cursor-pointer select-none py-1">
          <input
            type="checkbox"
            required={field.required}
            checked={value === 'true'}
            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 rounded border-slate-300 text-[#7A1F1F] focus:ring-[#7A1F1F]/30"
          />
          <span className="text-sm font-semibold text-slate-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </span>
        </label>
      );
    default:
      return (
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={field.type === 'number' ? 'number' : field.type === 'phone' ? 'tel' : 'text'}
            required={field.required}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={INPUT_CLASS}
            placeholder={field.placeholder || ''}
          />
        </div>
      );
  }
}

export default function EventInvitePage() {
  const { t } = useTranslation();
  const { localCurrency, timezone, locale } = useLocale();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedTicketId = searchParams.get('ticket');

  const { data: event, isLoading: isLoadingEvent } = usePublicEvent(id!);
  const { data: tickets = [], isLoading: isLoadingTickets } = useTickets(id!);
  const createGuest = useCreateGuest();

  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });
  const [payingCountry, setPayingCountry] = useState<string>('Nigeria');
  const [selectedGateway, setSelectedGateway] = useState<'paystack' | 'paypal'>('paystack');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [createdGuest, setCreatedGuest] = useState<Guest | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Auto-select ticket from URL param
  const activeTickets = tickets.filter(t => t.status === 'active');
  const rsvpFields: RsvpField[] = event?.rsvpFields ?? [];

  useEffect(() => {
    if (preselectedTicketId && tickets.length > 0) {
      const match = tickets.find(t => t._id === preselectedTicketId && t.status === 'active');
      if (match) setSelectedTicket(match);
    } else if (activeTickets.length === 1 && !selectedTicket) {
      setSelectedTicket(activeTickets[0]);
    }
  }, [preselectedTicketId, tickets]);

  // Payment method & exchange rate computation
  const baseCurrency = selectedTicket?.currency || event?.currency || localCurrency;
  const paymentDetails = useMemo(() => {
    if (!selectedTicket || selectedTicket.price === 0) {
      return {
        gateway: 'paystack' as const,
        isAfrica: true,
        targetCurrency: baseCurrency,
        convertedAmount: 0,
        isDifferentCurrency: false,
        rateDescription: null,
      };
    }
    return getPaymentMethodDetails({
      country: payingCountry,
      amount: selectedTicket.price,
      eventCurrency: baseCurrency,
    });
  }, [selectedTicket, payingCountry, baseCurrency]);

  // Auto-update gateway when country changes
  useEffect(() => {
    setSelectedGateway(paymentDetails.gateway);
  }, [paymentDetails.gateway]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !form.firstName || !form.lastName || !form.email) return;

    if (!form.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (selectedTicket.price > 0) {
      setIsProcessingPayment(true);
      createGuest.mutate({
        eventId: id,
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email.trim().toLowerCase(),
        ticketId: selectedTicket._id,
        group: selectedTicket.name,
        rsvpStatus: 'pending',
        customFields: Object.keys(customValues).length > 0 ? customValues : undefined,
      }, {
        onSuccess: async (guestData: any) => {
          setCreatedGuest(guestData as unknown as Guest);
          
          if (selectedGateway === 'paystack') {
            // Paystack Checkout (for African currencies / cards)
            try {
              const chargeCurrency = paymentDetails.targetCurrency.toUpperCase();
              const chargeAmount = paymentDetails.convertedAmount;

              const initRes = await paymentsApi.initialize({
                email: form.email.trim().toLowerCase(),
                amount: chargeAmount,
                currency: chargeCurrency,
                payment_type: 'ticket_purchase',
                event_id: id,
                ticket_id: selectedTicket._id,
                guest_id: guestData._id,
                customer_name: `${form.firstName} ${form.lastName}`.trim(),
                callback_url: window.location.href,
                metadata: {
                  paying_country: payingCountry,
                  original_price: selectedTicket.price,
                  original_currency: baseCurrency,
                },
              });

              await openPaystackModal({
                email: form.email.trim().toLowerCase(),
                amount: chargeAmount,
                currency: chargeCurrency,
                reference: initRes.reference,
                customerName: `${form.firstName} ${form.lastName}`.trim(),
                onSuccess: async (res) => {
                  toast.loading('Confirming your ticket...', { id: 'pay-verify' });
                  try {
                    const verifyRes = await paymentsApi.verify(res.reference);
                    if (verifyRes.success) {
                      toast.success('Payment confirmed! Welcome to the event.', { id: 'pay-verify' });
                      setCreatedGuest({
                        ...(guestData as unknown as Guest),
                        rsvpStatus: 'confirmed',
                      });
                      setSubmitted(true);
                    } else {
                      toast.error('Payment verification failed. Please contact support.', { id: 'pay-verify' });
                    }
                  } catch {
                    setCreatedGuest({
                      ...(guestData as unknown as Guest),
                      rsvpStatus: 'confirmed',
                    });
                    setSubmitted(true);
                    toast.success('Payment completed! Ticket ready.', { id: 'pay-verify' });
                  } finally {
                    setIsProcessingPayment(false);
                  }
                },
                onClose: () => {
                  setIsProcessingPayment(false);
                  toast('Payment cancelled', { icon: 'ℹ️' });
                },
                onError: (err) => {
                  setIsProcessingPayment(false);
                  toast.error(err.message || 'Payment failed');
                },
              });
            } catch (err: any) {
              setIsProcessingPayment(false);
              toast.error(getFriendlyErrorMessage(err, 'Failed to initialize Paystack payment'));
            }
          } else {
            // PayPal Checkout (for International outside Africa)
            try {
              const chargeCurrency = paymentDetails.targetCurrency.toUpperCase();
              const chargeAmount = paymentDetails.convertedAmount;

              await openPayPalCheckout({
                email: form.email.trim().toLowerCase(),
                amount: chargeAmount,
                currency: chargeCurrency,
                customerName: `${form.firstName} ${form.lastName}`.trim(),
                metadata: {
                  paying_country: payingCountry,
                  original_price: selectedTicket.price,
                  original_currency: baseCurrency,
                },
                onSuccess: async (ppRes) => {
                  toast.loading('Capturing PayPal payment...', { id: 'pp-verify' });
                  try {
                    await paymentsApi.capturePayPal({
                      orderId: ppRes.orderId,
                      reference: ppRes.reference,
                      amount: chargeAmount,
                      currency: chargeCurrency,
                      payment_type: 'ticket_purchase',
                      event_id: id,
                      ticket_id: selectedTicket._id,
                      guest_id: guestData._id,
                      customer_email: form.email.trim().toLowerCase(),
                      customer_name: `${form.firstName} ${form.lastName}`.trim(),
                      metadata: {
                        paying_country: payingCountry,
                      },
                    });

                    toast.success('PayPal payment confirmed! Ticket ready.', { id: 'pp-verify' });
                    setCreatedGuest({
                      ...(guestData as unknown as Guest),
                      rsvpStatus: 'confirmed',
                    });
                    setSubmitted(true);
                  } catch (err: any) {
                    toast.error(getFriendlyErrorMessage(err, 'Could not verify PayPal payment'), { id: 'pp-verify' });
                  } finally {
                    setIsProcessingPayment(false);
                  }
                },
                onClose: () => {
                  setIsProcessingPayment(false);
                  toast('PayPal checkout closed', { icon: 'ℹ️' });
                },
                onError: (err) => {
                  setIsProcessingPayment(false);
                  toast.error(err.message || 'PayPal payment failed');
                },
              });
            } catch (err: any) {
              setIsProcessingPayment(false);
              toast.error(getFriendlyErrorMessage(err, 'Failed to launch PayPal checkout'));
            }
          }
        },
        onError: (err: any) => {
          setIsProcessingPayment(false);
          toast.error(getFriendlyErrorMessage(err, 'Could not initiate registration. Please try again.'));
        },
      });
    } else {
      // Free RSVP
      createGuest.mutate({
        eventId: id,
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email.trim().toLowerCase(),
        ticketId: selectedTicket._id,
        group: selectedTicket.name,
        rsvpStatus: 'confirmed',
        customFields: Object.keys(customValues).length > 0 ? customValues : undefined,
      }, {
        onSuccess: (guestData: any) => {
          setCreatedGuest(guestData as unknown as Guest);
          setSubmitted(true);
        },
        onError: (err: any) => {
          toast.error(getFriendlyErrorMessage(err, 'Could not complete registration.'));
        },
      });
    }
  };

  const handleDownloadWalletPass = async () => {
    if (!event || !createdGuest) return;
    try {
      toast.loading('Generating Apple Wallet Pass...', { id: 'wallet-pass' });
      const passUrl = `/api/events/${event.slug || id}/guests/${createdGuest._id}/apple-wallet`;
      const link = document.createElement('a');
      link.href = passUrl;
      link.setAttribute('download', `${event.name.replace(/\s+/g, '_')}_pass.pkpass`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Apple Wallet pass downloaded!', { id: 'wallet-pass' });
    } catch {
      toast.error('Could not download pass. Please try again.', { id: 'wallet-pass' });
    }
  };

  if (isLoadingEvent || isLoadingTickets) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] p-4 sm:p-8 flex items-center justify-center animate-pulse">
        <div className="bg-white max-w-xl w-full rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xl space-y-6">
          <div className="h-48 bg-slate-100 rounded-2xl w-full" />
          <div className="space-y-3">
            <div className="h-4 w-28 bg-[#FAF0E8] rounded-full" />
            <div className="h-7 w-3/4 bg-slate-200 rounded-xl" />
            <div className="h-4 w-1/2 bg-slate-100 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-16 bg-slate-50 rounded-2xl border border-slate-100" />
            <div className="h-16 bg-slate-50 rounded-2xl border border-slate-100" />
          </div>
          <div className="h-12 bg-slate-200 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-2xl p-8 text-center shadow-lg border border-slate-100 space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <MapPin size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">{t('invite.not_found_title')}</h1>
          <p className="text-slate-500 text-sm">{t('invite.not_found_desc')}</p>
          <Link to="/events" className="inline-block mt-4 px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 transition-colors">
            {t('common.browse_events')}
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = event.date
    ? formatLocalDate(event.date, {
        timezone,
        locale,
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
    const isAttending = selectedTicket?.price === 0 || createdGuest?.rsvpStatus === 'confirmed';
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-[#FAF8F5] to-[#F3ECE0] flex items-center justify-center p-6 animate-in fade-in duration-350">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden space-y-5">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] to-[#D4A24C]" />
          
          <div className="w-14 h-14 bg-green-100 text-green-650 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={30} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              {isAttending ? 'RSVP Confirmed!' : 'Request Received!'}
            </h1>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
              {isAttending
                ? `You're all set for ${event.name}! Present your check-in pass below at the entrance.`
                : 'Your ticket request has been received. Please check your email for confirmation details.'}
            </p>
          </div>

          {/* Attendee Pass Card */}
          <div className="bg-[#FAF7F2] border border-slate-200/80 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendee</span>
                <span className="font-bold text-slate-800 text-sm">{form.firstName} {form.lastName}</span>
              </div>
              <span className="text-xs font-bold text-[#7A1F1F] bg-[#FAF0E8] px-2.5 py-1 rounded-full border border-[#7A1F1F]/20">
                {selectedTicket?.name || 'General Admission'}
              </span>
            </div>

            {/* Check-in QR barcode */}
            {isAttending && (
              <div className="flex flex-col items-center justify-center pt-2">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200">
                  <img
                    src={`/api/events/${event.slug || id}/qr-code${selectedTicket ? `?ticketId=${selectedTicket._id}` : ''}`}
                    alt="Admission QR Code"
                    className="w-28 h-28 object-contain"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">
                  Official Admission Barcode
                </span>
              </div>
            )}

            <div className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200/60">
              {formattedDate && <div>📅 {formattedDate} {timeString && `• ${timeString}`}</div>}
              {event.venue && <div>📍 {event.venue}</div>}
            </div>
          </div>

          {/* Digital QR Event Pass & Apple Wallet Buttons */}
          {isAttending && createdGuest?._id && (
            <div className="space-y-2.5">
              <Link
                to={`/events/${event.slug || id}/pass/${createdGuest._id}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#7A1F1F] hover:bg-[#681919] text-white text-xs font-black rounded-xl shadow-md shadow-[#7A1F1F]/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <QrCode size={16} className="text-[#D4A24C]" />
                <span>Open Official Digital QR Pass</span>
                <ExternalLink size={13} className="opacity-70" />
              </Link>

              <button
                onClick={handleDownloadWalletPass}
                className="w-full flex items-center justify-center gap-2 py-3 bg-black hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.36c.64-.78 1.08-1.86.96-2.95-1 .04-2.17.67-2.85 1.46-.58.67-1.1 1.77-.96 2.83 1.12.09 2.21-.57 2.85-1.34z" />
                </svg>
                Add to Apple Wallet
              </button>
            </div>
          )}

          <div>
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({ firstName: '', lastName: '', email: '' });
                setCustomValues({});
                setSelectedTicket(null);
                setCreatedGuest(null);
              }}
              className="text-[#7A1F1F] font-bold text-xs hover:underline"
            >
              {t('invite.register_another')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] via-[#FAF8F5] to-[#F3ECE0] flex flex-col">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10">
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
        
        {/* Left Column: Event details */}
        <div className="flex-1 space-y-6 pt-4 w-full">
          {/* Event Cover Image */}
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
              {event.description || t('invite.default_desc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/70 shadow-sm space-y-4 max-w-xl">
            {event.date && (
              <div className="flex items-center gap-4 text-slate-700">
                <div className="w-10 h-10 bg-[#FAF7F2] border border-slate-200 rounded-xl flex items-center justify-center text-[#7A1F1F] shrink-0">
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
                <div className="w-10 h-10 bg-[#FAF7F2] border border-slate-200 rounded-xl flex items-center justify-center text-[#7A1F1F] shrink-0">
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
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 p-7 sm:p-8 border border-slate-200 relative overflow-hidden">
            
            {/* Crimson & Gold Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] to-[#D4A24C]" />

            <h2 className="text-lg font-black text-slate-850 mb-5 flex items-center gap-2.5">
              <Ticket className="text-[#7A1F1F]" size={20} />
              {t('invite.select_ticket')}
            </h2>

            {activeTickets.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                <Ticket className="text-slate-300 mx-auto mb-3" size={32} />
                <p className="text-slate-500 font-bold text-sm">{t('invite.closed')}</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">This event is currently not accepting new registrations.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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
                        <div className="flex items-start justify-between gap-3">
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
                              {ticketIsPaid ? formatCurrency(ticket.price, ticket.currency || event?.currency || localCurrency) : 'Free'}
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
                  <div className="pt-5 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-4">
                    
                    {/* Guest input fields */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-850 text-sm">{t('invite.guest_details')}</h3>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
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
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
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
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">
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
                    </div>

                    {/* Paying Country & Exchange Rate (Only for Paid Tickets) */}
                    {selectedTicket.price > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-3.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-650 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Globe size={12} className="text-[#7A1F1F]" />
                              Paying From / Country <span className="text-red-500">*</span>
                            </span>
                            <span className="text-[9px] font-extrabold text-[#7A1F1F] bg-[#FAF0E8] px-2 py-0.5 rounded-md">
                              {paymentDetails.isAfrica ? 'Africa (Paystack)' : 'International (PayPal)'}
                            </span>
                          </label>
                          <select
                            value={payingCountry}
                            onChange={e => setPayingCountry(e.target.value)}
                            className={INPUT_CLASS}
                          >
                            <optgroup label="Popular African Countries">
                              <option value="Nigeria">🇳🇬 Nigeria (NGN)</option>
                              <option value="Ghana">🇬🇭 Ghana (GHS)</option>
                              <option value="Kenya">🇰🇪 Kenya (KES)</option>
                              <option value="South Africa">🇿🇦 South Africa (ZAR)</option>
                              <option value="Egypt">🇪🇬 Egypt (EGP)</option>
                              <option value="Rwanda">🇷🇼 Rwanda (RWF)</option>
                            </optgroup>
                            <optgroup label="Popular International Countries">
                              <option value="United States">🇺🇸 United States (USD)</option>
                              <option value="United Kingdom">🇬🇧 United Kingdom (GBP)</option>
                              <option value="Canada">🇨🇦 Canada (CAD)</option>
                              <option value="Australia">🇦🇺 Australia (AUD)</option>
                              <option value="Germany">🇩🇪 Germany (EUR)</option>
                              <option value="France">🇫🇷 France (EUR)</option>
                            </optgroup>
                            <optgroup label="All Countries">
                              {COUNTRIES.map(c => (
                                <option key={c.code} value={c.name}>
                                  {c.flag} {c.name}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </div>

                        {/* Exchange Rate Conversion Info Box */}
                        <div className="bg-[#FAF7F2] border border-amber-200/60 rounded-2xl p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">Amount to Pay:</span>
                            <div className="text-right">
                              <span className="text-base font-black text-slate-900">
                                {formatCurrency(paymentDetails.convertedAmount, paymentDetails.targetCurrency)}
                              </span>
                              {paymentDetails.isDifferentCurrency && (
                                <span className="text-[11px] text-slate-400 block font-semibold">
                                  ≈ {formatCurrency(selectedTicket.price, baseCurrency)}
                                </span>
                              )}
                            </div>
                          </div>

                          {paymentDetails.rateDescription && (
                            <div className="text-[11px] text-[#7A1F1F] font-bold flex items-center gap-1.5 pt-1 border-t border-amber-200/50">
                              <RefreshCw size={11} className="shrink-0" />
                              <span>Paystack Exchange Rate: {paymentDetails.rateDescription}</span>
                            </div>
                          )}
                        </div>

                        {/* Country-Based Payment Method Display */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Payment Method
                          </label>

                          {paymentDetails.isAfrica ? (
                            <div className="p-3.5 rounded-2xl border border-[#7A1F1F]/30 bg-[#FAF0E8]/50 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#7A1F1F] text-white flex items-center justify-center font-bold">
                                  <CreditCard size={16} />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block">Paystack Payment</span>
                                  <span className="text-[10px] text-slate-500">Cards, Bank Transfer, USSD & Apple Pay</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-[#7A1F1F] bg-white border border-[#7A1F1F]/20 px-2 py-0.5 rounded-md">
                                African Region
                              </span>
                            </div>
                          ) : (
                            <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#003087] text-white flex items-center justify-center font-bold">
                                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.305-.59 3.82-3.13 5.768-6.947 5.768H9.68l-1.58 10.03c-.082.52-.53.901-1.054.901v.003l.03-.477z"/></svg>
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-900 block">PayPal Global Checkout</span>
                                  <span className="text-[10px] text-slate-500">Credit/Debit Cards & PayPal Account</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-blue-800 bg-white border border-blue-200 px-2 py-0.5 rounded-md">
                                International
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dynamic custom form fields */}
                    {rsvpFields.length > 0 && (
                      <div className="space-y-4 pt-3 border-t border-slate-100">
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

                    {/* Submit RSVP / Pay details */}
                    <button
                      type="submit"
                      disabled={createGuest.isPending || isProcessingPayment}
                      className={`w-full py-4 px-6 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 ${
                        selectedGateway === 'paypal' && selectedTicket.price > 0
                          ? 'bg-[#003087] hover:bg-[#002466] shadow-blue-900/20'
                          : 'bg-[#7A1F1F] hover:bg-[#681919] shadow-[#7A1F1F]/20'
                      }`}
                    >
                      {createGuest.isPending || isProcessingPayment ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          <span>{isProcessingPayment ? `Connecting to ${selectedGateway === 'paypal' ? 'PayPal' : 'Paystack'}...` : t('common.processing')}</span>
                        </>
                      ) : selectedTicket.price === 0 ? (
                        <>
                          <span>{t('invite.complete_rsvp')}</span>
                          <ChevronRight size={18} />
                        </>
                      ) : selectedGateway === 'paypal' ? (
                        <>
                          <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.305-.59 3.82-3.13 5.768-6.947 5.768H9.68l-1.58 10.03c-.082.52-.53.901-1.054.901v.003l.03-.477z"/></svg>
                          <span>Pay with PayPal ({formatCurrency(paymentDetails.convertedAmount, paymentDetails.targetCurrency)})</span>
                          <ChevronRight size={18} />
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} />
                          <span>Pay with Paystack ({formatCurrency(paymentDetails.convertedAmount, paymentDetails.targetCurrency)})</span>
                          <ChevronRight size={18} />
                        </>
                      )}
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
