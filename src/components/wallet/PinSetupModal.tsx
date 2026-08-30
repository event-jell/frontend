import React, { useState } from 'react';
import { X, KeyRound, Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useSetWalletPin } from '../../hooks/useWallet';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPinAlreadySet: boolean;
  onSuccess?: () => void;
}

export default function PinSetupModal({
  isOpen,
  onClose,
  isPinAlreadySet,
  onSuccess,
}: PinSetupModalProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const setPinMutation = useSetWalletPin();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      setError('PIN must be 4 to 6 numeric digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('New PIN and confirmation PIN do not match');
      return;
    }

    try {
      await setPinMutation.mutateAsync({
        pin,
        current_pin: currentPin || undefined,
        password: password || undefined,
      });
      setPin('');
      setConfirmPin('');
      setCurrentPin('');
      setPassword('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update PIN');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden space-y-5">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center font-bold">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isPinAlreadySet ? 'Change Withdrawal PIN' : 'Set Withdrawal PIN'}
              </h2>
              <p className="text-xs text-slate-500">
                Secure your payouts and wallet operations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
          <ShieldCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <span>
            Your PIN is required whenever you withdraw funds. Never share this code with anyone.
          </span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isPinAlreadySet && (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Current PIN or Account Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={currentPin || password}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      setCurrentPin(e.target.value);
                      setPassword('');
                    } else {
                      setPassword(e.target.value);
                      setCurrentPin('');
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold tracking-widest focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                  placeholder="Enter current PIN or password"
                  required
                />
                <Lock size={15} className="absolute right-3.5 top-3.5 text-slate-400" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              {isPinAlreadySet ? 'New 4-Digit PIN' : 'Choose 4-Digit PIN'} *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) setPin(e.target.value);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-base font-bold tracking-widest text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
              placeholder="••••"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Confirm New PIN *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) setConfirmPin(e.target.value);
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-base font-bold tracking-widest text-center focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
              placeholder="••••"
              required
            />
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={setPinMutation.isPending || !pin || !confirmPin}
              className="flex-1 py-3 px-4 rounded-xl bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold shadow-md shadow-[#7A1F1F]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              {setPinMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save PIN</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
