import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Printer,
  ShieldCheck,
  Sparkles,
  Ticket,
  MapPin,
} from 'lucide-react';
import { useGuestPass } from '../../hooks/useCheckIn';
import { toast } from 'sonner';

interface EventPassModalProps {
  eventId: string;
  guestId: string;
  onClose: () => void;
}

export default function EventPassModal({ eventId, guestId, onClose }: EventPassModalProps) {
  const { data: passData, isLoading } = useGuestPass(eventId, guestId);
  const [copied, setCopied] = useState(false);

  const passUrl = `${window.location.origin}/events/${eventId}/pass/${guestId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(passUrl);
    setCopied(true);
    toast.success('Pass link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FAF0E8] to-[#FDF5EE] p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-white text-[#7A1F1F] shadow-2xs border border-[#7A1F1F]/10">
              <Ticket size={16} />
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                Guest Event Pass
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {passData?.guest.name || 'Attendee Pass'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-[#7A1F1F] border-t-transparent animate-spin mb-2" />
              <p className="text-xs text-slate-400">Loading pass QR…</p>
            </div>
          ) : passData ? (
            <>
              <div className="space-y-0.5">
                <h4
                  className="text-xl font-black text-slate-900"
                  style={{ fontFamily: 'Playfair Display, serif' }}
                >
                  {passData.guest.name}
                </h4>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#7A1F1F] bg-[#FAF0E8] px-2.5 py-0.5 rounded-full border border-[#7A1F1F]/15">
                  {passData.ticket?.name || 'General Pass'}
                </span>
              </div>

              {/* QR Code */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-2xs">
                <QRCodeSVG
                  value={passData.qrToken}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Pass URL Copy */}
              <div className="w-full space-y-1">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <input
                    readOnly
                    value={passUrl}
                    className="w-full bg-transparent px-2.5 py-1 text-[11px] text-slate-600 font-mono focus:outline-none truncate select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors shrink-0"
                    title="Copy Link"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full flex items-center gap-2 pt-1">
                <a
                  href={passUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#7A1F1F] hover:bg-[#9c3030] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#7A1F1F]/20 transition-all active:scale-95"
                >
                  <ExternalLink size={13} />
                  <span>Open Full Pass</span>
                </a>
              </div>
            </>
          ) : (
            <p className="text-xs text-red-500">Failed to load pass details.</p>
          )}
        </div>
      </div>
    </div>
  );
}
