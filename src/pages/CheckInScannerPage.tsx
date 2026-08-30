import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  QrCode,
  Search,
  History,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Volume2,
  VolumeX,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ChevronRight,
  User,
  Ticket,
} from 'lucide-react';
import { useEvent } from '../hooks/useEvents';
import {
  useCheckInStats,
  useValidateScan,
  useConfirmCheckIn,
  useManualLookup,
  useUndoCheckIn,
} from '../hooks/useCheckIn';
import QrScannerView from '../components/checkin/QrScannerView';
import CheckInFeedbackModal from '../components/checkin/CheckInFeedbackModal';
import {
  playSuccessChime,
  playWarningBuzzer,
  playErrorTone,
} from '../utils/audioFeedback';
import SEO from '../components/SEO';
import { useLocale } from '../hooks/useLocale';
import { formatLocalTime } from '../utils/formatters';
import type { CheckInValidateResponse, CheckInGuest } from '../types';
import { toast } from 'sonner';

export default function CheckInScannerPage() {
  const { timezone, locale } = useLocale();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id || '';

  const { data: event } = useEvent(eventId);
  const { data: stats } = useCheckInStats(eventId);

  const validateScan = useValidateScan();
  const confirmCheckIn = useConfirmCheckIn();
  const manualLookup = useManualLookup();
  const undoCheckIn = useUndoCheckIn();

  const [activeTab, setActiveTab] = useState<'camera' | 'search' | 'history'>('camera');
  const [activeModalData, setActiveModalData] = useState<CheckInValidateResponse | null>(null);
  const [autoConfirmMode, setAutoConfirmMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CheckInGuest[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // ── Handle Camera Scan Event ──────────────────────────────────────────────

  const handleScan = useCallback(
    async (decodedToken: string) => {
      if (validateScan.isPending || confirmCheckIn.isPending || activeModalData) return;

      try {
        const res = await validateScan.mutateAsync({
          eventId,
          token: decodedToken,
          method: 'qr',
        });

        if (res.isValid && res.scanResult === 'VALID') {
          if (soundEnabled) playSuccessChime();
        } else if (res.scanResult === 'ALREADY_CHECKED_IN') {
          if (soundEnabled) playWarningBuzzer();
        } else {
          if (soundEnabled) playErrorTone();
        }

        setActiveModalData(res);
      } catch (err: any) {
        if (soundEnabled) playErrorTone();
        setActiveModalData({
          isValid: false,
          scanResult: 'INVALID_TOKEN',
          message: err?.response?.data?.message || err?.message || 'Invalid or unreadable pass token',
        });
      }
    },
    [validateScan, confirmCheckIn, activeModalData, eventId, soundEnabled],
  );

  // ── Confirm Check-In Action ───────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!activeModalData?.guest?.id) return;
    try {
      await confirmCheckIn.mutateAsync({
        eventId,
        guestId: activeModalData.guest.id,
        method: 'qr',
      });
      toast.success(`${activeModalData.guest.name} checked in!`);
      setActiveModalData(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Check-in failed');
    }
  };

  // ── Manual Search Action ──────────────────────────────────────────────────

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await manualLookup.mutateAsync({
        eventId,
        query: searchQuery.trim(),
      });
      setSearchResults(results);
    } catch {
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualCheckIn = async (guest: CheckInGuest) => {
    try {
      await confirmCheckIn.mutateAsync({
        eventId,
        guestId: guest.id,
        method: 'manual',
      });
      if (soundEnabled) playSuccessChime();
      toast.success(`${guest.name} checked in successfully!`);
      // Update local search results state
      setSearchResults(prev =>
        prev.map(g => (g.id === guest.id ? { ...g, checkedIn: true, checkedInAt: new Date().toISOString() } : g)),
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Check-in failed');
    }
  };

  const handleUndo = async (guestId: string, guestName: string) => {
    try {
      await undoCheckIn.mutateAsync({ eventId, guestId });
      toast.success(`Check-in for ${guestName} undone.`);
      setSearchResults(prev =>
        prev.map(g => (g.id === guestId ? { ...g, checkedIn: false, checkedInAt: undefined } : g)),
      );
    } catch {
      toast.error('Failed to undo check-in');
    }
  };

  return (
    <>
      <SEO title={`Scanner | ${event?.name || 'Event Check-In'}`} />

      <div className="h-screen w-screen flex flex-col bg-slate-950 text-white overflow-hidden select-none">
        {/* ── Top Bar / Live Counter Header ────────────────────────────────────── */}
        <header className="h-16 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-3.5 sm:px-6 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(`/events/${eventId}`)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h1 className="text-xs sm:text-sm font-extrabold text-white truncate">
                  {event?.name || 'Event Check-In'}
                </h1>
              </div>
              <p className="text-[10px] sm:text-[11px] text-white/50 truncate font-medium">
                Live Entrance Scanner
              </p>
            </div>
          </div>

          {/* Quick Counter Badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-white/5 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-[#D4A24C] uppercase tracking-wider">
                Arrivals
              </span>
              <span className="text-xs font-black text-white">
                {stats?.checkedInCount || 0} / {stats?.totalExpected || 0} ({stats?.checkInPercentage || 0}%)
              </span>
            </div>

            {/* Fast Auto-Confirm Toggle */}
            <button
              onClick={() => setAutoConfirmMode(v => !v)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1 transition-all ${
                autoConfirmMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-sm'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}
              title="Auto-Confirm Mode"
            >
              <Zap size={14} className={autoConfirmMode ? 'text-emerald-400 fill-emerald-400' : ''} />
              <span className="hidden sm:inline">
                {autoConfirmMode ? 'Auto-CheckIn' : 'Manual Confirm'}
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(s => !s)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </header>

        {/* ── Main Content Area ───────────────────────────────────────────────── */}
        <main className="flex-1 relative overflow-hidden flex flex-col">
          {/* TAB 1: Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="w-full h-full relative">
              <QrScannerView onScan={handleScan} paused={Boolean(activeModalData)} />

              {/* Bottom Quick Stats Float on Camera View */}
              <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between gap-2 max-w-md mx-auto pointer-events-none">
                <div className="bg-black/70 backdrop-blur-xl border border-white/15 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-2xl pointer-events-auto">
                  <UserCheck size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    {stats?.checkedInCount || 0} Checked In
                  </span>
                </div>

                <div className="bg-black/70 backdrop-blur-xl border border-white/15 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-2xl pointer-events-auto">
                  <Sparkles size={14} className="text-[#D4A24C] shrink-0" />
                  <span className="text-xs font-bold text-white">
                    {stats?.remainingCount || 0} Remaining
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Manual Search */}
          {activeTab === 'search' && (
            <div className="flex-1 bg-slate-900 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
              <form onSubmit={handleSearchSubmit} className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search guest name, email, phone or ticket code…"
                  className="w-full pl-11 pr-24 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/40 focus:border-[#7A1F1F]"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-2 top-2 px-4 py-1.5 bg-[#7A1F1F] hover:bg-[#9c3030] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Search Results */}
              <div className="space-y-3">
                {searchResults.map(g => (
                  <div
                    key={g.id}
                    className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3 transition-all hover:border-slate-600"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
                        {g.name[0]?.toUpperCase() || <User size={18} />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-white truncate">{g.name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-bold">
                            {g.ticketName || 'Regular'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {g.email || g.phone || (g.tableAssignment ? `Table: ${g.tableAssignment}` : 'No contact info')}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {g.checkedIn ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Checked In
                          </span>
                          <button
                            onClick={() => handleUndo(g.id, g.name)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                            title="Undo Check-in"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleManualCheckIn(g)}
                          disabled={confirmCheckIn.isPending}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <ShieldCheck size={14} />
                          <span>Check In</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Search above to look up guests manually when QR codes are damaged or unavailable.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Recent Check-in History */}
          {activeTab === 'history' && (
            <div className="flex-1 bg-slate-900 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <History size={16} className="text-[#D4A24C]" />
                  Recent Check-Ins ({stats?.recentCheckIns?.length || 0})
                </h3>
              </div>

              <div className="space-y-2.5">
                {(stats?.recentCheckIns || []).map((item, idx) => (
                  <div
                    key={item.guestId || idx}
                    className="p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
                            {item.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-[#D4A24C] text-[10px] font-bold">
                            {item.ticketName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.checkedInAt
                            ? formatLocalTime(item.checkedInAt, { timezone, locale, second: '2-digit' })
                            : 'Recently'}{' '}
                          • via {item.method.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUndo(item.guestId, item.name)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Undo check-in"
                    >
                      <RotateCcw size={12} />
                      <span className="hidden sm:inline">Undo</span>
                    </button>
                  </div>
                ))}

                {(stats?.recentCheckIns || []).length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    No check-ins recorded yet. Scanned guests will appear here live.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ── Bottom Navigation Tabs Bar ──────────────────────────────────────── */}
        <nav className="h-16 bg-slate-900 border-t border-white/10 px-4 flex items-center justify-around z-30 shrink-0">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'camera'
                ? 'text-[#D4A24C] font-black'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <QrCode size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">QR Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'search'
                ? 'text-[#D4A24C] font-black'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Search size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Manual Search</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'history'
                ? 'text-[#D4A24C] font-black'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <History size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Recent Scans</span>
          </button>
        </nav>

        {/* ── Scan Result Feedback Overlay Modal ───────────────────────────────── */}
        {activeModalData && (
          <CheckInFeedbackModal
            data={activeModalData}
            onConfirm={handleConfirm}
            onDismiss={() => setActiveModalData(null)}
            isConfirming={confirmCheckIn.isPending}
            autoConfirm={autoConfirmMode}
          />
        )}
      </div>
    </>
  );
}
