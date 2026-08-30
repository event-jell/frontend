import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  User,
  Users,
  Ticket,
  MapPin,
  Utensils,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { CheckInValidateResponse } from '../../types';
import { useLocale } from '../../hooks/useLocale';
import { formatLocalTime } from '../../utils/formatters';

interface CheckInFeedbackModalProps {
  data: CheckInValidateResponse;
  onConfirm: () => void;
  onDismiss: () => void;
  isConfirming?: boolean;
  autoConfirm?: boolean;
}

export default function CheckInFeedbackModal({
  data,
  onConfirm,
  onDismiss,
  isConfirming,
  autoConfirm = false,
}: CheckInFeedbackModalProps) {
  const { timezone, locale } = useLocale();
  const [countdown, setCountdown] = useState<number>(autoConfirm ? 2 : 0);

  const isSuccess = data.isValid && data.scanResult === 'VALID';
  const isAlreadyCheckedIn = data.scanResult === 'ALREADY_CHECKED_IN';
  const isWrongEvent = data.scanResult === 'WRONG_EVENT';
  const isCancelled = data.scanResult === 'CANCELLED';

  // Auto confirm timer if autoConfirm mode is active
  useEffect(() => {
    if (!autoConfirm || !isSuccess) return;

    if (countdown <= 0) {
      onConfirm();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(c => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoConfirm, isSuccess, countdown, onConfirm]);

  const guest = data.guest;
  const isVip =
    guest?.ticketName?.toLowerCase().includes('vip') ||
    guest?.ticketName?.toLowerCase().includes('gold');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* ── State 1: VALID GUEST (Green Card) ────────────────────────────────── */}
        {isSuccess && (
          <div className="flex flex-col">
            {/* Success Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                    Verified Pass
                  </span>
                  <h2 className="text-lg font-black text-white leading-tight">
                    Valid Guest
                  </h2>
                </div>
              </div>

              {isVip && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-md">
                  ★ VIP
                </span>
              )}
            </div>

            {/* Guest Info Body */}
            <div className="p-6 space-y-4">
              {/* Photo & Name Row */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                {guest?.photoUrl ? (
                  <img
                    src={guest.photoUrl}
                    alt={guest.name}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                    <User size={32} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3
                    className="text-xl font-extrabold text-slate-900 leading-snug truncate"
                    style={{ fontFamily: 'Playfair Display, serif' }}
                  >
                    {guest?.name || 'Guest'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                      <Ticket size={12} /> {guest?.ticketName || 'Regular RSVP'}
                    </span>
                    {guest?.group && (
                      <span className="text-xs text-slate-400 truncate">
                        • {guest.group}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta details grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {guest?.tableAssignment && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Table / Seat
                    </span>
                    <span className="text-sm font-black text-slate-800 mt-0.5 block truncate">
                      {guest.tableAssignment}
                    </span>
                  </div>
                )}

                {guest?.plusOnes ? (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Plus Ones
                    </span>
                    <span className="text-sm font-black text-slate-800 mt-0.5 block flex items-center gap-1">
                      <Users size={14} className="text-emerald-600" /> +{guest.plusOnes} Guest(s)
                    </span>
                  </div>
                ) : null}

                {guest?.dietaryReqs && (
                  <div className="col-span-2 p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1">
                      <Utensils size={12} /> Dietary Notes
                    </span>
                    <span className="text-xs font-semibold text-amber-900 mt-0.5 block">
                      {guest.dietaryReqs}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={onDismiss}
                  className="flex-1 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isConfirming}
                  className="flex-[2] py-3 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <ShieldCheck size={16} />
                  <span>
                    {isConfirming
                      ? 'Checking in...'
                      : autoConfirm
                      ? `Confirming (${countdown}s)...`
                      : 'Confirm Check-In'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── State 2: ALREADY CHECKED IN (Amber Warning) ──────────────────────── */}
        {isAlreadyCheckedIn && (
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <AlertTriangle size={28} className="text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-100">
                    Duplicate Scan
                  </span>
                  <h2 className="text-lg font-black text-white leading-tight">
                    Already Checked In
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-slate-800 space-y-2">
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  This pass for <strong>{guest?.name}</strong> has already been scanned.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Time
                    </span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block">
                      {data.checkedInAt
                        ? formatLocalTime(data.checkedInAt, { timezone, locale })
                        : 'Earlier'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Staff
                    </span>
                    <span className="font-extrabold text-slate-900 mt-0.5 block truncate">
                      {data.checkedInBy || 'Event Staff'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onDismiss}
                  className="w-full py-3 text-xs font-black text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Scan Next Guest</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── State 3: INVALID / WRONG EVENT / CANCELLED (Red Error) ───────────── */}
        {!isSuccess && !isAlreadyCheckedIn && (
          <div className="flex flex-col">
            <div className="bg-gradient-to-r from-red-600 to-rose-700 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <XCircle size={28} className="text-white" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-200">
                    {isWrongEvent ? 'Event Mismatch' : isCancelled ? 'Reservation Inactive' : 'Verification Failed'}
                  </span>
                  <h2 className="text-lg font-black text-white leading-tight">
                    {isWrongEvent ? 'Wrong Event Pass' : isCancelled ? 'Reservation Cancelled' : 'Invalid Pass'}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-slate-800">
                <p className="text-xs text-red-800 font-medium leading-relaxed">
                  {data.message || 'The QR pass could not be authenticated for this event.'}
                </p>
                {data.expectedEvent && (
                  <p className="text-xs text-red-700 mt-2 font-bold">
                    Target Event: {data.expectedEvent}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={onDismiss}
                  className="w-full py-3 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-2xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Scan Next Guest</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
