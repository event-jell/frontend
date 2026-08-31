import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet as WalletIcon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Store,
  Calendar,
  Users,
  QrCode,
  Sparkles,
  ChevronRight,
  Eye,
  MessageSquare,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboardSummary } from '../hooks/useDashboard';
import { useWallet } from '../hooks/useWallet';
import { useLocale } from '../hooks/useLocale';
import WithdrawModal from '../components/wallet/WithdrawModal';
import AddFundsModal from '../components/wallet/AddFundsModal';
import PinSetupModal from '../components/wallet/PinSetupModal';
import PayoutAccountModal from '../components/wallet/PayoutAccountModal';
import SEO from '../components/SEO';
import { formatCurrency, formatLocalDate, formatLocalTime } from '../utils/formatters';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { localCurrency, timezone, locale } = useLocale();
  const { data: summary, isLoading } = useDashboardSummary();
  const { data: wallet } = useWallet();

  // Modals state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showPayoutAccountModal, setShowPayoutAccountModal] = useState(false);

  const activeWallet = wallet || summary?.wallet;
  const metrics = summary?.metrics;

  return (
    <>
      <SEO title="Dashboard — EventJell" description="Overview of your events, vendor services, and wallet" />

      {/* Modals */}
      {activeWallet && (
        <>
          <WithdrawModal
            isOpen={showWithdrawModal}
            onClose={() => setShowWithdrawModal(false)}
            wallet={activeWallet}
            onOpenPinSetup={() => setShowPinSetupModal(true)}
            onOpenAddAccount={() => setShowPayoutAccountModal(true)}
          />

          <AddFundsModal
            isOpen={showAddFundsModal}
            onClose={() => setShowAddFundsModal(false)}
            wallet={activeWallet}
            userEmail={user?.email}
          />

          <PinSetupModal
            isOpen={showPinSetupModal}
            onClose={() => setShowPinSetupModal(false)}
            isPinAlreadySet={!!activeWallet.pin_set}
          />

          <PayoutAccountModal
            isOpen={showPayoutAccountModal}
            onClose={() => setShowPayoutAccountModal(false)}
          />
        </>
      )}

      <div className="min-h-full bg-gradient-to-br from-slate-50 via-white to-amber-50/20 p-3 sm:p-8 space-y-3.5 sm:space-y-6 max-w-7xl mx-auto pb-28 sm:pb-20">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#7A1F1F] text-[10px] sm:text-[11px] font-bold tracking-wide">
                OVERVIEW
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400">
                {formatLocalDate(new Date(), { timezone, locale, weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 leading-snug" style={{ fontFamily: 'Playfair Display, serif' }}>
              Welcome back, {user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.email?.split('@')[0] || 'Partner')} 👋
            </h1>
            <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 sm:mt-1 leading-relaxed">
              Here is what is happening across your events, vendor services, and wallet today.
            </p>
          </div>

          {/* Quick Action Buttons (Horizontal on Mobile) */}
          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            <button
              onClick={() => navigate('/vendor/listings/new')}
              className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all active:scale-98"
            >
              <Store size={14} className="text-[#7A1F1F]" />
              <span>Create Listing</span>
            </button>

            <button
              onClick={() => navigate('/events/new')}
              className="flex-1 sm:flex-none justify-center flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#7A1F1F] hover:bg-[#661919] text-white text-xs font-bold rounded-xl shadow-md shadow-[#7A1F1F]/20 transition-all active:scale-98"
            >
              <Plus size={14} />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* 3 Main Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
          {/* 1. Wallet & Financial Balance Card */}
          <div className="bg-gradient-to-br from-[#7A1F1F] via-[#661919] to-[#4A1212] text-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl shadow-[#7A1F1F]/20 relative overflow-hidden flex flex-col justify-between space-y-3.5 sm:space-y-4">
            <div className="absolute top-0 right-0 w-36 h-36 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10" />

            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-200/90 uppercase tracking-wider flex items-center gap-1.5">
                  <WalletIcon size={13} />
                  <span>Wallet Balance</span>
                </span>
                <button
                  onClick={() => navigate('/wallet')}
                  className="text-[10px] sm:text-[11px] font-bold text-white/80 hover:text-white flex items-center gap-0.5 hover:underline"
                >
                  <span>View Wallet</span>
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="text-2xl sm:text-4xl font-black tracking-tight">
                {formatCurrency(metrics?.available_balance || 0, localCurrency)}
              </div>

              <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-[11px] sm:text-xs text-white/80">
                <div>
                  <span className="text-white/50 block text-[9.5px] sm:text-[10px]">Total Earned</span>
                  <span className="font-bold">{formatCurrency(metrics?.total_earned || 0, localCurrency)}</span>
                </div>
                <div className="border-l border-white/20 pl-3 sm:pl-4">
                  <span className="text-white/50 block text-[9.5px] sm:text-[10px]">Withdrawn</span>
                  <span className="font-bold">{formatCurrency(metrics?.total_withdrawn || 0, localCurrency)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15">
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="py-1.5 sm:py-2 px-2.5 rounded-xl bg-white text-[#7A1F1F] text-xs font-bold hover:bg-amber-50 flex items-center justify-center gap-1 shadow-sm transition-all active:scale-98"
              >
                <ArrowUpRight size={13} />
                <span>Withdraw</span>
              </button>

              <button
                onClick={() => setShowAddFundsModal(true)}
                className="py-1.5 sm:py-2 px-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-98"
              >
                <Plus size={13} />
                <span>Add Funds</span>
              </button>
            </div>
          </div>

          {/* 2. Vendor Hub Summary Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-3.5 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Store size={13} className="text-[#7A1F1F]" />
                  <span>Vendor Listings</span>
                </span>
                <button
                  onClick={() => navigate('/vendor/listings')}
                  className="text-[10px] sm:text-[11px] font-bold text-[#7A1F1F] hover:underline flex items-center gap-0.5"
                >
                  <span>Manage Listings</span>
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {metrics?.vendor_listings_count || 0}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                  {metrics?.vendor_published_count || 0} published
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2.5 sm:mt-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-3">
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] sm:text-[11px] font-semibold mb-0.5">
                    <Eye size={12} />
                    <span>Total Views</span>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {metrics?.vendor_views_count?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-3">
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] sm:text-[11px] font-semibold mb-0.5">
                    <MessageSquare size={12} />
                    <span>Inquiries</span>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {metrics?.vendor_inquiries_count?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/vendor/listings/new')}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-[#FAF0E8] hover:bg-[#f3dfce] text-[#7A1F1F] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#7A1F1F]/20 transition-colors"
            >
              <Plus size={13} />
              <span>Add New Service Listing</span>
            </button>
          </div>

          {/* 3. Event Operations Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col justify-between space-y-3.5 sm:space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={13} className="text-[#D4A24C]" />
                  <span>Events & Guests</span>
                </span>
                <button
                  onClick={() => navigate('/events')}
                  className="text-[10px] sm:text-[11px] font-bold text-[#7A1F1F] hover:underline flex items-center gap-0.5"
                >
                  <span>All Events</span>
                  <ChevronRight size={12} />
                </button>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {metrics?.total_events || 0}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 font-semibold">
                  {metrics?.active_events || 0} active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-2.5 sm:mt-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-3">
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] sm:text-[11px] font-semibold mb-0.5">
                    <Users size={12} />
                    <span>Total Guests</span>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {metrics?.total_guests?.toLocaleString() || 0}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl p-2 sm:p-3">
                  <div className="flex items-center gap-1 text-slate-500 text-[10px] sm:text-[11px] font-semibold mb-0.5">
                    <CheckCircle2 size={12} className="text-green-600" />
                    <span>Checked In</span>
                  </div>
                  <span className="text-base sm:text-lg font-bold text-green-700">
                    {metrics?.total_checked_in?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/events')}
              className="w-full py-2 sm:py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Manage Events & Seating</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Middle Section: Vendor Listings & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-6">
          {/* Active Vendor Listings Showcase */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Your Vendor Listings</h2>
                <p className="text-[10px] sm:text-xs text-slate-500">Services currently discoverable by event planners</p>
              </div>
              <button
                onClick={() => navigate('/vendor/listings')}
                className="text-xs font-bold text-[#7A1F1F] hover:underline"
              >
                View all &rarr;
              </button>
            </div>

            {(!summary?.vendor_listings || summary.vendor_listings.length === 0) ? (
              <div className="bg-[#FAF7F2] border border-dashed border-amber-200 rounded-xl sm:rounded-2xl p-5 sm:p-8 text-center space-y-2.5 sm:space-y-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center mx-auto">
                  <Store size={20} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">No vendor listings yet</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                    Start offering DJ, Catering, Equipment, Photography, or Venue services to event organizers worldwide.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/vendor/listings/new')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#7A1F1F] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#661919] transition-all"
                >
                  <Plus size={13} />
                  <span>Create Your First Listing</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
                {summary.vendor_listings.map((l) => (
                  <div
                    key={l._id}
                    onClick={() => navigate('/vendor/listings')}
                    className="group p-3 sm:p-4 bg-slate-50 hover:bg-amber-50/40 border border-slate-200/80 rounded-xl sm:rounded-2xl cursor-pointer transition-all hover:shadow-xs space-y-2 sm:space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0E8] text-[#7A1F1F] border border-[#7A1F1F]/20">
                        {l.category.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          l.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : l.status === 'paused'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {l.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#7A1F1F] transition-colors line-clamp-1">
                        {l.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {l.tagline || l.description || 'No description provided'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-200/60">
                      <span className="text-slate-900 font-bold text-xs">
                        {formatCurrency(l.base_price, l.currency)}{' '}
                        <span className="text-[9.5px] font-normal text-slate-500">
                          / {l.pricing_type.replace('_', ' ')}
                        </span>
                      </span>
                      <span className="text-slate-400 text-[10px] flex items-center gap-1">
                        <Eye size={11} />
                        {l.views_count || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Financial Ledger */}
          <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Transactions</h2>
                <p className="text-[10px] sm:text-xs text-slate-500">Inflows and disbursements</p>
              </div>
              <button
                onClick={() => navigate('/wallet')}
                className="text-xs font-bold text-[#7A1F1F] hover:underline"
              >
                View all
              </button>
            </div>

            {(!summary?.recent_transactions || summary.recent_transactions.length === 0) ? (
              <div className="p-5 sm:p-8 bg-slate-50 rounded-xl sm:rounded-2xl text-center">
                <p className="text-xs text-slate-400">No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {summary.recent_transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="p-2.5 bg-slate-50 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2.5 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                          tx.direction === 'credit'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {tx.direction === 'credit' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-800 block truncate">
                          {tx.description}
                        </span>
                        <span className="text-[9.5px] text-slate-400">
                          {formatLocalDate(tx.createdAt, { timezone, locale })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-black block ${
                          tx.direction === 'credit' ? 'text-green-700' : 'text-slate-900'
                        }`}
                      >
                        {tx.direction === 'credit' ? '+' : '-'}
                        {formatCurrency(tx.amount, tx.currency)}
                      </span>
                      <span className="text-[8.5px] font-bold uppercase text-slate-400">
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        {summary?.recent_activities && summary.recent_activities.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3 sm:space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Recent Activity Timeline</h2>
            <div className="divide-y divide-slate-100">
              {summary.recent_activities.map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                      <Clock size={13} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-800 block truncate">{act.title}</span>
                      <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">{act.subtitle}</span>
                    </div>
                  </div>
                  <span className="text-[9.5px] text-slate-400 shrink-0">
                    {formatLocalTime(act.time, { timezone, locale })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
