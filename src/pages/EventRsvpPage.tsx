import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicEvent } from '../hooks/useEvents';
import { useCreateGuest } from '../hooks/useGuests';
import { getEventTypeConfig } from '../lib/eventTypes';
import SEO from '../components/SEO';
import Logo from '../components/Logo';
import { 
  Calendar, MapPin, Users, CheckCircle2, AlertTriangle, ArrowLeft,
  ChevronRight, Smartphone, Download, Share2, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';

const INPUT_CLASS =
  'w-full px-3.5 py-2.5 text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:bg-white focus:border-[#7A1F1F] transition-all';

export default function EventRsvpPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, error } = usePublicEvent(id!);
  const createGuest = useCreateGuest();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    rsvpStatus: 'confirmed' as 'confirmed' | 'declined' | 'maybe',
    plusOnes: 0,
    notes: '',
  });

  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [submittedGuest, setSubmittedGuest] = useState<any>(null);
  const [isUpdateFlow, setIsUpdateFlow] = useState(false);

  // Auto-fill form values if guest is updating RSVP (simulated or via link)
  useEffect(() => {
    if (event?.rsvp_disabled) {
      toast.error('RSVP submissions are closed for this event.');
    }
  }, [event]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6">
        <LoaderSpinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle size={28} className="text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Event Invitation Not Found</h2>
        <p className="text-xs text-slate-500 mb-6 max-w-[280px]">The invitation link may have expired or is incorrect.</p>
        <Link to="/" className="px-5 py-2.5 bg-slate-850 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors">
          Go to Homepage
        </Link>
      </div>
    );
  }

  const typeConfig = getEventTypeConfig(event.type);
  const theme = typeConfig.theme;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Please fill in your Name and Email address.');
      return;
    }

    createGuest.mutate({
      eventId: event._id,
      name: form.name.trim(),
      email: form.email.toLowerCase().trim(),
      phone: form.phone.trim(),
      rsvpStatus: form.rsvpStatus,
      plusOnes: form.rsvpStatus === 'confirmed' ? form.plusOnes : 0,
      notes: form.notes.trim(),
      customFields: customAnswers,
    }, {
      onSuccess: (res: any) => {
        setSubmittedGuest(res);
        toast.success(res.updated ? 'Your RSVP has been updated successfully!' : 'Your RSVP has been received!');
      },
    });
  };

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const timeString = event.start_time
    ? event.end_time
      ? `${event.start_time} - ${event.end_time}`
      : event.start_time
    : null;

  if (submittedGuest) {
    const guestRsvpStatus = submittedGuest.rsvpStatus || submittedGuest.rsvp_status || 'confirmed';
    const isAttending = guestRsvpStatus === 'confirmed';

    const handleDownloadWalletPass = async () => {
      const toastId = toast.loading('Preparing Apple Wallet Pass...');
      try {
        const passUrl = `/api/events/${event._id || id}/wallet-pass?guestId=${submittedGuest._id}`;
        const response = await fetch(passUrl);
        if (!response.ok) throw new Error('Failed to download wallet pass');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `${event.slug || event._id}_pass.pkpass`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
        toast.dismiss(toastId);
        toast.success('Apple Wallet pass downloaded!');
      } catch (err) {
        toast.dismiss(toastId);
        toast.error('Failed to download wallet pass. Please try again.');
      }
    };

    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between py-6 px-4 sm:px-6 relative overflow-x-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <SEO title={`${event.name} RSVP Confirmed`} />

        <div className="max-w-md mx-auto w-full space-y-6 flex-1 flex flex-col justify-center py-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative">
            <div className="h-1.5 w-full" style={{ backgroundColor: theme.primary }} />
            
            <div className="p-5 sm:p-8 text-center space-y-5">
              <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-100">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-850">RSVP Confirmed</h1>
                <p className="text-xs text-slate-400 mt-0.5">We've saved your details for the host.</p>
              </div>

              {/* Pass Ticket Preview */}
              <div className="border border-slate-150 rounded-2xl p-4 text-left relative overflow-hidden bg-slate-50/50 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white/90" style={{ backgroundColor: theme.primary }}>
                      {typeConfig.label}
                    </span>
                    <h3 className="font-extrabold text-slate-850 text-base mt-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {event.name}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: theme.bg, color: theme.primary }}>
                    <typeConfig.icon size={18} />
                  </div>
                </div>

                <div className="h-px bg-dashed bg-slate-200" />

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Date</p>
                    <p className="font-bold text-slate-700 mt-0.5">{formattedDate || 'Date TBD'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Time</p>
                    <p className="font-bold text-slate-700 mt-0.5">{timeString || 'Time TBD'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Venue</p>
                    <p className="font-bold text-slate-750 mt-0.5 truncate">{event.venue || 'Venue TBD'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Guest</p>
                    <p className="font-bold text-slate-750 mt-0.5 truncate">{submittedGuest.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Status</p>
                    <p className="font-bold capitalize mt-0.5" style={{ color: isAttending ? '#10B981' : '#F59E0B' }}>
                      {guestRsvpStatus}
                    </p>
                  </div>
                </div>

                {isAttending && (
                  <>
                    <div className="h-px bg-dashed bg-slate-200" />
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      {/* Simulated Barcode QR Code */}
                      <div className="bg-white p-2.5 border border-slate-150 rounded-xl">
                        <img 
                          src={`/api/events/${event._id || id}/qr-code`} 
                          alt="Admission Barcode" 
                          className="w-24 h-24"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Pass Check-In Barcode</p>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleDownloadWalletPass}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-black text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  <Smartphone size={15} /> Add to Apple Wallet
                </button>
                <button
                  onClick={() => setSubmittedGuest(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-150 text-slate-600 rounded-xl text-xs font-bold transition-colors"
                >
                  Update My RSVP
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="text-center py-4 text-[10px] text-slate-400">
          Powered by <span className="font-bold text-[#7A1F1F]">EventJelly</span> pass management
        </footer>
      </div>
    );
  }

  const rsvpFields = event.rsvp_fields?.length > 0 ? event.rsvp_fields : typeConfig.defaultRsvpFields;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between py-6 px-4 sm:px-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEO title={`Join ${event.name} - Invitation`} />

      <div className="max-w-md mx-auto w-full space-y-6 flex-1 flex flex-col justify-center py-4">
        {/* Logo / Brand Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Logo size={24} />
          <span className="font-bold text-sm text-[#7A1F1F] tracking-tight">EventJelly Invite</span>
        </div>

        {/* Dynamic Styled Invite Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {event.cover_image ? (
            <div className="relative aspect-[16/7] bg-slate-900">
              <img src={event.cover_image} alt="Event Cover" className="w-full h-full object-cover opacity-85" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white/90 w-fit" style={{ backgroundColor: theme.primary }}>
                  {typeConfig.label}
                </span>
                <h1 className="text-white font-extrabold text-lg sm:text-xl mt-1.5 leading-snug" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {event.name}
                </h1>
              </div>
            </div>
          ) : (
            <div className="p-6 pb-2 text-center" style={{ backgroundColor: theme.bg }}>
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: '#white', color: theme.primary }}>
                <typeConfig.icon size={22} />
              </div>
              <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full" style={{ backgroundColor: '#white', color: theme.primary, border: `1px solid ${theme.primary}20` }}>
                {typeConfig.label}
              </span>
              <h1 className="font-black text-xl text-slate-850 mt-2 mb-1" style={{ color: theme.primary, fontFamily: 'Playfair Display, serif' }}>
                {event.name}
              </h1>
            </div>
          )}

          {/* Details Row */}
          <div className="p-5 border-b border-slate-100 space-y-3 text-xs text-slate-600 bg-slate-50/50">
            {event.description && (
              <p className="text-slate-500 font-medium leading-relaxed italic mb-1.5">"{event.description}"</p>
            )}
            
            <div className="flex items-center gap-2.5">
              <Calendar size={14} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-800">{formattedDate || 'Date TBD'}</p>
                {timeString && <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{timeString}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <MapPin size={14} className="text-slate-400 flex-shrink-0" />
              <div>
                <p className="font-bold text-slate-800">{event.venue || 'Venue details pending'}</p>
                {event.is_virtual && event.virtual_link && (
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">Online join link provided on RSVP</p>
                )}
              </div>
            </div>
          </div>

          {/* RSVP Form */}
          {event.rsvp_disabled ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-bold text-slate-850 text-sm">RSVP Submissions Closed</h3>
              <p className="text-xs text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                The organizer has closed RSVP submissions for this event. Please reach out to them directly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <h3 className="text-xs font-extrabold text-slate-450 uppercase tracking-widest mb-3">RSVP Questionnaire</h3>
              </div>

              {/* Status Selector */}
              <div className="grid grid-cols-3 gap-2">
                {(['confirmed', 'maybe', 'declined'] as const).map(st => {
                  const isSelected = form.rsvpStatus === st;
                  const labelMap = { confirmed: 'Attending', maybe: 'Maybe', declined: 'Declined' };
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, rsvpStatus: st }))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-[#7A1F1F] text-white border-[#7A1F1F] shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {labelMap[st]}
                    </button>
                  );
                })}
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </div>

              {/* Plus Ones / Guests count */}
              {form.rsvpStatus === 'confirmed' && (
                <div>
                  <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    How many additional guests are you bringing?
                  </label>
                  <select
                    value={form.plusOnes}
                    onChange={e => setForm(f => ({ ...f, plusOnes: parseInt(e.target.value, 10) }))}
                    className={INPUT_CLASS}
                  >
                    {[0, 1, 2, 3, 4, 5].map(cnt => (
                      <option key={cnt} value={cnt}>{cnt === 0 ? 'No additional guests' : `+ ${cnt} guests`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom RSVP Questions */}
              {form.rsvpStatus === 'confirmed' && rsvpFields.map(field => (
                <div key={field.id}>
                  <DynamicField
                    field={field}
                    value={customAnswers[field.id] || ''}
                    onChange={val => setCustomAnswers(prev => ({ ...prev, [field.id]: val }))}
                  />
                </div>
              ))}

              {/* Notes */}
              <div>
                <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes / Special Requests
                </label>
                <textarea
                  placeholder="e.g. wheelchair access, allergy info..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className={`${INPUT_CLASS} resize-none`}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={createGuest.isPending}
                className="w-full mt-2 py-3 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#7A1F1F' }}
              >
                {createGuest.isPending ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </form>
          )}
        </div>
      </div>

      <footer className="text-center py-4 text-[10px] text-slate-400">
        EventJelly © 2026 · Premium Event RSVPs & Invites
      </footer>
    </div>
  );
}

function LoaderSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-[#7A1F1F]/20 border-t-[#7A1F1F] rounded-full animate-spin" />
      <p className="text-xs text-slate-400 font-bold tracking-wider uppercase">Loading Invitation...</p>
    </div>
  );
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: any;
  value: string;
  onChange: (val: string) => void;
}) {
  const label = (
    <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
      {field.label} {field.required && <span className="text-red-500">*</span>}
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
            rows={2}
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
            <option value="">— Select Option —</option>
            {(field.options ?? []).map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-center gap-2.5 py-1.5">
          <input
            type="checkbox"
            id={`field-${field.id}`}
            checked={value === 'true'}
            onChange={e => onChange(e.target.checked ? 'true' : 'false')}
            className="w-4 h-4 accent-[#7A1F1F] rounded border-slate-350"
          />
          <label htmlFor={`field-${field.id}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
            {field.label}
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
            placeholder={field.placeholder || '0'}
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
