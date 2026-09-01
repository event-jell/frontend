import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Users,
  Ticket,
  Sparkles,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useGuestPass } from '../hooks/useCheckIn';
import SEO from '../components/SEO';
import { formatDate } from '../utils/formatters';

const R = '#7A1F1F';
const G = '#D4A24C';

export default function GuestEventPassPage() {
  const { id, guestId } = useParams<{ id: string; guestId: string }>();
  const eventId = id || '';
  const gId = guestId || '';

  const { data: passData, isLoading, refetch } = useGuestPass(eventId, gId);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);

  // Dynamic token countdown timer
  useEffect(() => {
    if (!passData?.dynamicQrEnabled || !passData.expiresInSeconds) return;

    setSecondsRemaining(passData.expiresInSeconds);
    const interval = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          refetch();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [passData, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 animate-pulse">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex justify-between items-center">
            <div className="h-4 w-20 bg-slate-800 rounded-full" />
            <div className="h-4 w-12 bg-slate-800 rounded-md" />
          </div>
          <div className="w-48 h-48 bg-slate-800 rounded-2xl mx-auto" />
          <div className="space-y-2 text-center">
            <div className="h-6 w-40 bg-slate-800 rounded-xl mx-auto" />
            <div className="h-3.5 w-28 bg-slate-800 rounded mx-auto" />
          </div>
          <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
            <div className="h-10 bg-slate-800/60 rounded-xl" />
            <div className="h-10 bg-slate-800/60 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!passData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Event Pass Not Found</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          We couldn't load this event pass. Please verify your invitation link or contact the event organizer.
        </p>
      </div>
    );
  }

  const { guest, ticket, event, qrToken, dynamicQrEnabled } = passData;
  const isVip =
    ticket?.name?.toLowerCase().includes('vip') ||
    ticket?.name?.toLowerCase().includes('gold');

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <SEO title={`Event Pass | ${guest.name} - ${event.name}`} />

      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 print:p-0 print:bg-white text-slate-900">
        {/* Pass Card Container */}
        <div className="w-full max-w-sm sm:max-w-md bg-white rounded-3xl sm:rounded-[36px] overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col relative print:border-none print:shadow-none animate-in zoom-in-95 duration-300">
          {/* Top Luxe Accent Header */}
          <div
            className="p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[140px]"
            style={{
              background: `linear-gradient(135deg, ${R} 0%, #3D0F0F 100%)`,
            }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4A24C]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between z-10">
              <span className="text-[10px] font-black tracking-widest uppercase text-[#D4A24C]">
                Official Event Pass
              </span>
              {isVip ? (
                <span className="px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1">
                  <Sparkles size={12} /> VIP PASS
                </span>
              ) : (
                <span className="px-3 py-0.5 rounded-full bg-white/15 text-white font-extrabold text-xs backdrop-blur-md">
                  {ticket?.name || 'General Pass'}
                </span>
              )}
            </div>

            <div className="z-10 mt-4">
              <h1
                className="text-xl sm:text-2xl font-black text-white leading-tight"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {event.name}
              </h1>
              <p className="text-xs text-white/80 mt-1 flex items-center gap-1 font-medium">
                <MapPin size={12} className="text-[#D4A24C] shrink-0" />
                <span className="truncate">{event.venue || 'Venue to be announced'}</span>
              </p>
            </div>
          </div>

          {/* Notch / Perforated Ticket Divider */}
          <div className="relative flex items-center justify-between px-2 bg-white -my-2.5 z-20">
            <div className="w-5 h-5 rounded-full bg-slate-950 -ml-5 shadow-inner" />
            <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2" />
            <div className="w-5 h-5 rounded-full bg-slate-950 -mr-5 shadow-inner" />
          </div>

          {/* Pass Body Content */}
          <div className="p-6 space-y-6 flex-1 flex flex-col items-center text-center">
            {/* Guest Details */}
            <div className="w-full space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Ticket Holder
              </span>
              <h2
                className="text-2xl font-black text-slate-900 leading-snug"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                {guest.name}
              </h2>
              {guest.group && (
                <p className="text-xs text-slate-500 font-semibold">{guest.group}</p>
              )}
            </div>

            {/* Dynamic / High-Security QR Code Container */}
            <div className="relative p-4 sm:p-5 bg-slate-50 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center group">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                <QRCodeSVG
                  value={qrToken}
                  size={190}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>

              {/* Dynamic Rotation Badge */}
              {dynamicQrEnabled ? (
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  <RefreshCw size={11} className="animate-spin text-[#7A1F1F]" />
                  <span>
                    Refreshes in <strong className="text-slate-950">{secondsRemaining}s</strong> (Anti-Screenshot)
                  </span>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1 text-slate-400 text-[10px] font-bold">
                  <ShieldCheck size={12} className="text-emerald-600" /> Cryptographically Verified Pass
                </div>
              )}
            </div>

            {/* Event Timing & Seating Details Grid */}
            <div className="w-full grid grid-cols-2 gap-3 pt-2 text-left">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Date
                </span>
                <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">
                  {event.date ? formatDate(event.date) : 'TBD'}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Time
                </span>
                <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">
                  {event.startTime || 'Doors Open Early'}
                </span>
              </div>

              {guest.tableAssignment && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Table / Seat
                  </span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">
                    {guest.tableAssignment}
                  </span>
                </div>
              )}

              {guest.plusOnes > 0 && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Party Size
                  </span>
                  <span className="text-xs font-black text-slate-800 mt-0.5 block truncate flex items-center gap-1">
                    <Users size={12} className="text-emerald-600" /> 1 + {guest.plusOnes} Guests
                  </span>
                </div>
              )}
            </div>

            {/* Check-In Status */}
            {guest.checkedIn && (
              <div className="w-full p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center gap-2 text-xs font-bold">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Checked In on Arrival</span>
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs transition-all active:scale-95"
            >
              <Printer size={14} /> Print Pass
            </button>
          </div>
        </div>

        <p className="text-[11px] text-white/40 mt-4 text-center print:hidden">
          Present this digital QR pass on your mobile device at the entrance scanner.
        </p>
        <div className="mt-3 text-center print:hidden">
          <Link
            to="/my-passes"
            className="text-xs font-bold text-white/70 hover:text-white underline underline-offset-2 transition-colors"
          >
            View all my passes →
          </Link>
        </div>
      </div>
    </>
  );
}
