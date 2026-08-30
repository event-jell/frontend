import React, { useState } from 'react';
import {
  X,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  CreditCard,
  Plus,
  Loader2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useWithdraw } from '../../hooks/useWallet';
import { useAuth } from '../../contexts/AuthContext';
import type { Wallet, PayoutAccount } from '../../types';
import { formatCurrency, getCurrencyForCountry, getCurrencySymbol } from '../../utils/formatters';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  onOpenPinSetup: () => void;
  onOpenAddAccount: () => void;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  wallet,
  onOpenPinSetup,
  onOpenAddAccount,
}: WithdrawModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    wallet.payout_accounts.find((a) => a.is_default)?.id ||
      wallet.payout_accounts[0]?.id ||
      '',
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const withdrawMutation = useWithdraw();

  if (!isOpen) return null;

  // Use user's local currency from Settings country
  const userCountry = user?.country || 'Nigeria';
  const localCurrency = getCurrencyForCountry(userCountry);
  const localSymbol = getCurrencySymbol(localCurrency);

  const selectedAccount = wallet.payout_accounts.find(
    (a) => a.id === selectedAccountId,
  );

  const handleMax = () => {
    setAmount(wallet.available_balance);
  };

  const handlePercentage = (pct: number) => {
    const calculated = Math.floor((wallet.available_balance * pct) / 100);
    setAmount(calculated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid withdrawal amount');
      return;
    }

    if (numAmount > wallet.available_balance) {
      setError('Amount exceeds your available balance');
      return;
    }

    if (!selectedAccount) {
      setError('Please select a payout account');
      return;
    }

    if (!pin || pin.length < 4) {
      setError('Please enter your 4-digit withdrawal PIN');
      return;
    }

    try {
      await withdrawMutation.mutateAsync({
        amount: numAmount,
        pin,
        payout_method: selectedAccount.type,
        payout_details: {
          bank_name: selectedAccount.bank_name,
          account_number: selectedAccount.account_number,
          account_name: selectedAccount.account_name,
          bank_code: selectedAccount.bank_code,
          paypal_email: selectedAccount.paypal_email,
        },
        currency: localCurrency,
      });

      setAmount('');
      setPin('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Withdrawal failed');
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
              <ArrowUpRight size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Withdraw Funds</h2>
              <p className="text-xs text-slate-500">
                Transfer your earnings to your bank or PayPal
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

        {/* Available Balance Box */}
        <div className="bg-[#FAF7F2] border border-amber-200/60 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Available Balance
            </span>
            <span className="text-2xl font-black text-slate-900">
              {formatCurrency(wallet.available_balance, localCurrency)}
            </span>
          </div>
          <button
            type="button"
            onClick={handleMax}
            className="text-xs font-bold text-[#7A1F1F] bg-[#FAF0E8] hover:bg-[#ebd3c0] px-3 py-1.5 rounded-xl border border-[#7A1F1F]/20 transition-colors"
          >
            Withdraw All
          </button>
        </div>

        {/* Pin Not Set Notice */}
        {!wallet.pin_set && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <KeyRound size={16} />
              <span>Withdrawal PIN Required</span>
            </div>
            <p>
              You must configure a 4-digit PIN before making your first withdrawal.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPinSetup();
              }}
              className="text-xs font-bold text-[#7A1F1F] underline block"
            >
              Set PIN now &rarr;
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Withdrawal Amount ({localCurrency}) *
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={wallet.available_balance}
                step="any"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-lg font-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                placeholder="0.00"
                required
              />
            </div>

            {/* Quick % Buttons */}
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handlePercentage(pct)}
                  className="flex-1 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Payout Account */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Payout Destination *
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddAccount();
                }}
                className="text-xs font-bold text-[#7A1F1F] hover:underline flex items-center gap-1"
              >
                <Plus size={12} />
                <span>Add Account</span>
              </button>
            </div>

            {wallet.payout_accounts.length === 0 ? (
              <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-2">
                  No payout accounts added yet.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddAccount();
                  }}
                  className="text-xs font-bold text-[#7A1F1F] underline"
                >
                  + Add Bank or PayPal Account
                </button>
              </div>
            ) : (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 focus:border-[#7A1F1F]/60 transition-all"
                required
              >
                {wallet.payout_accounts.map((acc: PayoutAccount) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.type === 'paypal'
                      ? `PayPal: ${acc.paypal_email}`
                      : `${acc.bank_name} •••• ${acc.account_number?.slice(-4)} (${acc.account_name})`}
                    {acc.is_default ? ' [Default]' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 4-Digit PIN */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Enter 4-Digit Withdrawal PIN *
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
              disabled={
                withdrawMutation.isPending ||
                !amount ||
                Number(amount) <= 0 ||
                Number(amount) > wallet.available_balance ||
                !selectedAccountId ||
                !pin
              }
              className="flex-1 py-3 px-4 rounded-xl bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold shadow-md shadow-[#7A1F1F]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
            >
              {withdrawMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ArrowUpRight size={16} />
                  <span>Withdraw {formatCurrency(Number(amount) || 0, localCurrency)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
