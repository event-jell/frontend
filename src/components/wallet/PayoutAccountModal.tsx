import React, { useState } from 'react';
import { X, Building2, CreditCard, Loader2, Check } from 'lucide-react';
import { useSavePayoutAccount } from '../../hooks/useWallet';

interface PayoutAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PayoutAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: PayoutAccountModalProps) {
  const [type, setType] = useState<'bank_transfer' | 'paypal'>('bank_transfer');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [isDefault, setIsDefault] = useState(true);

  const saveAccount = useSavePayoutAccount();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await saveAccount.mutateAsync({
      type,
      bank_name: type === 'bank_transfer' ? bankName : undefined,
      account_number: type === 'bank_transfer' ? accountNumber : undefined,
      account_name: type === 'bank_transfer' ? accountName : undefined,
      paypal_email: type === 'paypal' ? paypalEmail : undefined,
      is_default: isDefault,
    });

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden space-y-5">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Payout Account</h2>
              <p className="text-xs text-slate-500">
                Where should we send your withdrawals?
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

        {/* Method Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setType('bank_transfer')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              type === 'bank_transfer'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={14} />
            <span>Bank Account</span>
          </button>
          <button
            type="button"
            onClick={() => setType('paypal')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              type === 'paypal'
                ? 'bg-white text-blue-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard size={14} />
            <span>PayPal</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'bank_transfer' ? (
            <>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                  placeholder="e.g. Chase, Zenith Bank, TD Bank, Barclays"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Account Number / IBAN *
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                  placeholder="e.g. 0123456789"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                  placeholder="Legal name on the account"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                PayPal Email Address *
              </label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
                placeholder="your-paypal-email@example.com"
                required
              />
            </div>
          )}

          <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded text-[#7A1F1F] focus:ring-[#7A1F1F]/20"
            />
            <span className="text-xs font-semibold text-slate-700">
              Set as primary payout account
            </span>
          </label>

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
              disabled={saveAccount.isPending}
              className="flex-1 py-3 px-4 rounded-xl bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold shadow-md shadow-[#7A1F1F]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98"
            >
              {saveAccount.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Save Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
