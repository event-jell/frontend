import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  QrCode,
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { useEvent } from '../hooks/useEvents';
import { useCheckInStats, useCheckInLogs } from '../hooks/useCheckIn';
import { useLocale } from '../hooks/useLocale';
import SEO from '../components/SEO';
import { formatCurrency, formatLocalTime } from '../utils/formatters';

const R = '#7A1F1F';
const G = '#D4A24C';

export default function CheckInDashboardPage() {
  const { timezone, locale } = useLocale();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const eventId = id || '';

  const { data: event, isLoading: loadingEvent } = useEvent(eventId);
  const { data: stats, isLoading: loadingStats, refetch } = useCheckInStats(eventId);
  const [logFilter, setLogFilter] = useState<string>('all');
  const { data: logsData } = useCheckInLogs(eventId, { result: logFilter, limit: 30 });

  return (
    <>
      <SEO title={`Check-In Dashboard | ${event?.name || 'EventJell'}`} />

      <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
        {/* Header Banner */}
        <div className="bg-white border-b border-slate-200/80 px-4 py-5 sm:px-8 sm:py-6 shrink-0">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF0E8] text-[#7A1F1F] font-black text-[11px] uppercase tracking-wider border border-[#7A1F1F]/15">
                  <QrCode size={12} /> Live Check-In Operations
                </span>
                {event?.name && (
                  <span className="text-xs text-slate-400 font-semibold">• {event.name}</span>
                )}
              </div>
              <h1
                className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Entrance & Scanning Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Real-time attendee arrivals, ticket validation statistics, and security logs.
              </p>
            </div>

            {/* Launch Scanner CTA */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => refetch()}
                className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                title="Refresh stats"
              >
                <RefreshCw size={16} />
              </button>

              <button
                onClick={() => navigate(`/events/${eventId}/checkin`)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-black text-xs sm:text-sm shadow-xl hover:opacity-95 active:scale-95 transition-all"
                style={{ background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)` }}
              >
                <QrCode size={18} />
                <span>Launch QR Scanner</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 w-full">
          {/* Key Metric Overview Cards */}
          {loadingStats && !stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-24 bg-slate-200 rounded" />
                    <div className="w-9 h-9 rounded-2xl bg-slate-100" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                    <div className="h-3 w-32 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Expected */}
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Total Expected
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users size={18} />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900 block">
                    {stats?.totalExpected || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                    Confirmed RSVPs & Tickets
                  </span>
                </div>
              </div>

              {/* Checked In Count */}
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Checked In
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <UserCheck size={18} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">
                      {stats?.checkedInCount || 0}
                    </span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {stats?.checkInPercentage || 0}% Arrived
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                    Processed at entrance
                  </span>
                </div>
              </div>

              {/* Remaining */}
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Remaining
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={18} />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900 block">
                    {stats?.remainingCount || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                    Expected to arrive
                  </span>
                </div>
              </div>

              {/* Security Alerts */}
              <div className="p-5 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Security Alerts
                  </span>
                  <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-black text-slate-900 block">
                    {stats?.recentAlerts?.length || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5 block">
                    Duplicate or invalid scans
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tier Arrival Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs">
            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#7A1F1F]" />
              Check-In by Ticket Tier
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(stats?.tierStats || []).map(tier => {
                const pct = tier.total > 0 ? Math.round((tier.checkedIn / tier.total) * 100) : 0;
                return (
                  <div
                    key={tier.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-extrabold text-sm text-slate-800 truncate">
                          {tier.name}
                        </span>
                        {tier.isVip && (
                          <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shrink-0">
                            VIP
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {tier.checkedIn} / {tier.total} ({pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tier.isVip
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                            : 'bg-gradient-to-r from-[#7A1F1F] to-[#D4A24C]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Recent Check-Ins & Security Alerts Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Arrivals Feed */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs flex flex-col">
              <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Live Arrivals Feed ({stats?.recentCheckIns?.length || 0})
              </h3>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-96">
                {(stats?.recentCheckIns || []).map((item, idx) => (
                  <div
                    key={item.guestId || idx}
                    className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 font-extrabold flex items-center justify-center shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 block truncate">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {item.ticketName} {item.tableAssignment ? `• Table ${item.tableAssignment}` : ''}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-slate-500 shrink-0">
                      {item.checkedInAt
                        ? formatLocalTime(item.checkedInAt, { timezone, locale })
                        : 'Just now'}
                    </span>
                  </div>
                ))}

                {(stats?.recentCheckIns || []).length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No guests checked in yet. Open the scanner to start checking in attendees.
                  </div>
                )}
              </div>
            </div>

            {/* Audit & Security Log */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-500" />
                  Security & Scan Log
                </h3>

                <select
                  value={logFilter}
                  onChange={e => setLogFilter(e.target.value)}
                  className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1 focus:outline-none"
                >
                  <option value="all">All Scans</option>
                  <option value="VALID">Valid Only</option>
                  <option value="ALREADY_CHECKED_IN">Duplicates Only</option>
                  <option value="INVALID_TOKEN">Invalid Only</option>
                  <option value="WRONG_EVENT">Wrong Event</option>
                </select>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-96">
                {(logsData?.logs || []).map(log => {
                  const isValid = log.scan_result === 'VALID';
                  const isDuplicate = log.scan_result === 'ALREADY_CHECKED_IN';
                  return (
                    <div
                      key={log._id}
                      className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isValid
                              ? 'bg-emerald-500'
                              : isDuplicate
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-800 block truncate">
                            {log.guest_name || 'Unrecognized Scan'}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {log.scan_result.replace(/_/g, ' ')}{' '}
                            {log.failure_reason ? `(${log.failure_reason})` : ''}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-400 shrink-0">
                        {formatLocalTime(log.timestamp, { timezone, locale, second: '2-digit' })}
                      </span>
                    </div>
                  );
                })}

                {(logsData?.logs || []).length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No log entries for selected filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
