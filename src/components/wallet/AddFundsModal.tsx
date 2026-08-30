import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useDeposit } from '../../hooks/useWallet';
import { useAuth } from '../../contexts/AuthContext';
import { paymentsApi } from '../../lib/api';
import { openPaystackModal } from '../../utils/paystack';
import { openPayPalCheckout } from '../../utils/paypal';
import { formatCurrency, getCurrencyForCountry, getCurrencySymbol } from '../../utils/formatters';
import { isAfricanCountry } from '../../utils/currencyRates';
import type { Wallet } from '../../types';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  userEmail?: string;
}

export default function AddFundsModal({
  isOpen,
  onClose,
  wallet,
  userEmail,
}: AddFundsModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number | ''>(50);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const depositMutation = useDeposit();

  if (!isOpen) return null;

  // Determine gateway and local currency from user's account country (Settings)
  const userCountry = user?.country || 'Nigeria';
  const isAfrica = isAfricanCountry(userCountry);
  const gateway = isAfrica ? 'paystack' : 'paypal';
  const localCurrency = getCurrencyForCountry(userCountry);
  const localSymbol = getCurrencySymbol(localCurrency);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid deposit amount');
      return;
    }

    setIsProcessing(true);

    try {
      if (gateway === 'paystack') {
        const initRes = await paymentsApi.initialize({
          email: userEmail || user?.email || 'user@eventjelly.com',
          amount: numAmount,
          currency: localCurrency,
          payment_type: 'platform_subscription',
          metadata: {
            is_wallet_deposit: true,
            user_country: userCountry,
          },
        });

        await openPaystackModal({
          email: userEmail || user?.email || 'user@eventjelly.com',
          amount: numAmount,
          currency: localCurrency,
          reference: initRes.reference,
          onSuccess: async (res) => {
            await depositMutation.mutateAsync({
              amount: numAmount,
              currency: localCurrency,
              reference: res.reference,
              payment_method: 'paystack',
            });
            setIsProcessing(false);
            onClose();
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
      } else {
        // PayPal Flow (for non-African countries)
        await openPayPalCheckout({
          email: userEmail || user?.email || 'user@eventjelly.com',
          amount: numAmount,
          currency: localCurrency,
          onSuccess: async (res) => {
            await depositMutation.mutateAsync({
              amount: numAmount,
              currency: localCurrency,
              reference: res.reference || res.orderId,
              payment_method: 'paypal',
            });
            setIsProcessing(false);
            onClose();
          },
          onError: (err: Error) => {
            setError(err.message || 'PayPal transaction failed');
            setIsProcessing(false);
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to initialize payment');
      setIsProcessing(false);
    }
  };

  // Presets in local currency
  const presets = isAfrica && localCurrency === 'NGN'
    ? [1000, 2000, 5000, 10000, 50000]
    : isAfrica && localCurrency === 'GHS'
    ? [50, 100, 200, 500, 1000]
    : isAfrica && localCurrency === 'KES'
    ? [500, 1000, 2000, 5000, 10000]
    : isAfrica && localCurrency === 'ZAR'
    ? [50, 100, 250, 500, 1000]
    : [20, 50, 100, 250, 500];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative overflow-hidden space-y-5">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#7A1F1F] via-[#D4A24C] to-[#7A1F1F]" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center font-bold">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Add Funds to Wallet</h2>
              <p className="text-xs text-slate-500">
                Top up your balance instantly via {isAfrica ? 'Paystack' : 'PayPal'}
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

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleDeposit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Deposit Amount ({localCurrency}) *
            </label>
            <input
              type="number"
              min={1}
              step="any"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value ? Number(e.target.value) : '')
              }
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xl font-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
              placeholder="0.00"
              required
            />

            {/* Quick Presets */}
            <div className="flex gap-2 mt-2">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                    amount === preset
                      ? 'bg-[#FAF0E8] border-[#7A1F1F] text-[#7A1F1F]'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {localSymbol}{preset.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Card based strictly on user country */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Payment Method
            </label>
            {isAfrica ? (
              <div className="p-3.5 rounded-2xl border border-[#7A1F1F]/30 bg-[#FAF0E8]/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#7A1F1F] text-white flex items-center justify-center font-bold">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Paystack Direct Checkout
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Debit/Credit Cards, Bank Accounts & USSD
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase bg-white text-[#7A1F1F] border border-[#7A1F1F]/20 px-2 py-0.5 rounded-md">
                  African Region
                </span>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#003087] text-white flex items-center justify-center font-bold">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.305-.59 3.82-3.13 5.768-6.947 5.768H9.68l-1.58 10.03c-.082.52-.53.901-1.054.901v.003l.03-.477z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      PayPal Global Checkout
                    </span>
                    <span className="text-[10px] text-slate-500">
                      International Cards & PayPal Balance
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase bg-white text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                  International
                </span>
              </div>
            )}
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
              disabled={isProcessing || !amount || Number(amount) <= 0}
              className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-98 ${
                isAfrica
                  ? 'bg-[#7A1F1F] hover:bg-[#661919] shadow-[#7A1F1F]/20'
                  : 'bg-[#003087] hover:bg-[#002466] shadow-blue-900/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : isAfrica ? (
                <>
                  <CreditCard size={16} />
                  <span>Deposit via Paystack ({formatCurrency(Number(amount) || 0, localCurrency)})</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.305-.59 3.82-3.13 5.768-6.947 5.768H9.68l-1.58 10.03c-.082.52-.53.901-1.054.901v.003l.03-.477z" />
                  </svg>
                  <span>Deposit via PayPal ({formatCurrency(Number(amount) || 0, localCurrency)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
