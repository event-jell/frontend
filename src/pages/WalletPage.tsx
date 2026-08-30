import { useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Building2,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocale } from '../hooks/useLocale';
import { useWallet, useWalletTransactions, useDeletePayoutAccount } from '../hooks/useWallet';
import WithdrawModal from '../components/wallet/WithdrawModal';
import AddFundsModal from '../components/wallet/AddFundsModal';
import PinSetupModal from '../components/wallet/PinSetupModal';
import PayoutAccountModal from '../components/wallet/PayoutAccountModal';
import TransactionDetailsModal from '../components/wallet/TransactionDetailsModal';
import SEO from '../components/SEO';
import { formatCurrency, getCurrencyForCountry, formatLocalDate } from '../utils/formatters';
import type { WalletTransaction } from '../types';

export default function WalletPage() {
  const { user } = useAuth();
  const { timezone, locale } = useLocale();
  const { data: wallet, isLoading: isWalletLoading } = useWallet();

  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showPayoutAccountModal, setShowPayoutAccountModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [showTxDetailsModal, setShowTxDetailsModal] = useState(false);

  const { data: txData, isLoading: isTxLoading } = useWalletTransactions({
    direction: activeTab === 'all' ? undefined : activeTab,
  });

  const deleteAccountMutation = useDeletePayoutAccount();

  const transactions = txData?.transactions || [];
  const localCurrency = getCurrencyForCountry(user?.country);

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchTerm) return true;
    return (
      tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <>
      <SEO title="Wallet & Payouts — EventJelly" description="Manage your event earnings, withdrawals, and payout methods" />

      {wallet && (
        <>
          <WithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            wallet={wallet}
            onOpenPinSetup={() => setShowPinSetupModal(true)}
            onOpenAddAccount={() => setShowPayoutAccountModal(true)}
          />

          <AddFundsModal
            isOpen={showAddFundsModal}
            onClose={() => setShowAddFundsModal(false)}
            wallet={wallet}
            userEmail={user?.email}
          />

          <PinSetupModal
            isOpen={showPinSetupModal}
            onClose={() => setShowPinSetupModal(false)}
            isPinAlreadySet={!!wallet.pin_set}
          />

          <PayoutAccountModal
            isOpen={showPayoutAccountModal}
            onClose={() => setShowPayoutAccountModal(false)}
          />

          <TransactionDetailsModal
            isOpen={showTxDetailsModal}
            onClose={() => {
              setShowTxDetailsModal(false);
              setSelectedTx(null);
            }}
            transaction={selectedTx}
            timezone={timezone}
            locale={locale}
          />
        </>
      )}

      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#7A1F1F] text-[11px] font-bold tracking-wide">
                FINANCIAL HUB
              </span>
              <span className="text-xs text-slate-400">Instant Settlements</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Wallet & Payouts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manage incoming event ticket sales, vendor earnings, and secure bank withdrawals.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowPinSetupModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all"
            >
              <KeyRound size={15} className="text-[#7A1F1F]" />
              <span>{wallet?.pin_set ? 'Change PIN' : 'Set Withdrawal PIN'}</span>
            </button>

            <button
              onClick={() => setShowAddFundsModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all"
            >
              <Plus size={15} />
              <span>Add Funds</span>
            </button>

            <button
              onClick={() => setShowWithdrawModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 transition-all active:scale-98"
            >
              <ArrowUpRight size={15} />
              <span>Withdraw Funds</span>
            </button>
          </div>
        </div>

        {/* Hero Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Available Balance */}
          <div className="bg-gradient-to-br from-[#7A1F1F] to-[#551414] text-white rounded-3xl p-6 shadow-lg shadow-[#7A1F1F]/20 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-200/90 text-xs font-bold uppercase tracking-wider mb-3">
              <span>Available to Withdraw</span>
              <WalletIcon size={16} />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight">
                {formatCurrency(wallet?.available_balance || 0, localCurrency)}
              </div>
              <p className="text-[11px] text-white/70 mt-1">Ready for instant bank transfer</p>
            </div>
          </div>

          {/* Total Earned */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
              <span>Total Lifetime Earned</span>
              <ArrowDownLeft size={16} className="text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(wallet?.total_earned || 0, localCurrency)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Gross revenue across all events</p>
            </div>
          </div>

          {/* Total Withdrawn */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
              <span>Total Withdrawn</span>
              <ArrowUpRight size={16} className="text-[#7A1F1F]" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(wallet?.total_withdrawn || 0, localCurrency)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Disbursed to bank & PayPal</p>
            </div>
          </div>

          {/* Pending Clearing */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
              <span>Pending Inflow</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(wallet?.pending_balance || 0, localCurrency)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Card payments processing</p>
            </div>
          </div>
        </div>

        {/* Security Alert Banner if PIN is not set */}
        {wallet && !wallet.pin_set && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold">Protect your payouts with a 4-Digit PIN</h4>
                <p className="text-xs text-amber-700">
                  Set a dedicated withdrawal PIN to prevent unauthorized withdrawals from your account.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPinSetupModal(true)}
              className="px-4 py-2 bg-[#7A1F1F] text-white text-xs font-bold rounded-xl hover:bg-[#661919] shrink-0"
            >
              Set PIN Now
            </button>
          </div>
        )}

        {/* Payout Accounts Section */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Saved Payout Methods</h2>
              <p className="text-xs text-slate-500">Bank accounts and PayPal addresses for withdrawals</p>
            </div>
            <button
              onClick={() => setShowPayoutAccountModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#7A1F1F] hover:underline"
            >
              <Plus size={14} />
              <span>Add Payout Account</span>
            </button>
          </div>

          {(!wallet?.payout_accounts || wallet.payout_accounts.length === 0) ? (
            <div className="p-8 bg-[#FAF7F2] border border-dashed border-amber-200 rounded-2xl text-center space-y-2">
              <Building2 size={24} className="mx-auto text-[#7A1F1F]" />
              <p className="text-xs text-slate-600 font-semibold">No payout accounts connected yet.</p>
              <button
                onClick={() => setShowPayoutAccountModal(true)}
                className="text-xs font-bold text-[#7A1F1F] underline"
              >
                + Connect bank account or PayPal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {wallet.payout_accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 relative group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                      {acc.type === 'paypal' ? <CreditCard size={18} className="text-blue-600" /> : <Building2 size={18} className="text-[#7A1F1F]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {acc.type === 'paypal' ? 'PayPal' : acc.bank_name}
                        </span>
                        {acc.is_default && (
                          <span className="text-[9px] font-bold uppercase bg-[#FAF0E8] text-[#7A1F1F] px-1.5 py-0.5 rounded-md">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {acc.type === 'paypal' ? acc.paypal_email : `•••• ${acc.account_number?.slice(-4)} (${acc.account_name})`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAccountMutation.mutate(acc.id)}
                    className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition-colors"
                    title="Remove Account"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Transaction History Ledger */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
              <p className="text-xs text-slate-500">Complete audit trail of all inflows, ticket sales, and payouts</p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reference or description..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20 w-48 sm:w-56"
                />
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab('credit')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'credit' ? 'bg-white text-green-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Inflows
                </button>
                <button
                  onClick={() => setActiveTab('debit')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'debit' ? 'bg-white text-[#7A1F1F] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Withdrawals
                </button>
              </div>
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl">
              <p className="text-xs text-slate-400">No transactions found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-2">Type</th>
                    <th className="pb-3 px-2">Description</th>
                    <th className="pb-3 px-2">Reference</th>
                    <th className="pb-3 px-2">Date</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx._id}
                      onClick={() => {
                        setSelectedTx(tx);
                        setShowTxDetailsModal(true);
                      }}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            tx.direction === 'credit'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {tx.direction === 'credit' ? (
                            <ArrowDownLeft size={11} />
                          ) : (
                            <ArrowUpRight size={11} />
                          )}
                          <span>{tx.type.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-800">
                        {tx.description}
                      </td>
                      <td className="py-3 px-2 font-mono text-[11px] text-slate-400">
                        {tx.reference}
                      </td>
                      <td className="py-3 px-2 text-slate-500 whitespace-nowrap">
                        {formatLocalDate(tx.createdAt, {
                          timezone,
                          locale,
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-2">
                        <span className="capitalize font-bold text-slate-600 flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-green-600" />
                          <span>{tx.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span
                          className={`font-black text-sm ${
                            tx.direction === 'credit' ? 'text-green-700' : 'text-slate-900'
                          }`}
                        >
                          {tx.direction === 'credit' ? '+' : '-'}
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
