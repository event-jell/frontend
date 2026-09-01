import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Mail,
  MapPin,
  Calendar,
  Ticket,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  LogOut,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import Logo from '../components/Logo';
import SEO from '../components/SEO';
import { guestPortalApi, type GuestPass } from '../lib/api';
import { formatDate } from '../utils/formatters';

const R = '#7A1F1F';
const G = '#D4A24C';
const CREAM = '#FAF7F2';

type View = 'loading' | 'form' | 'sent' | 'dashboard';

export default function GuestPassesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<View>('loading');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passes, setPasses] = useState<GuestPass[]>([]);
  const [accountEmail, setAccountEmail] = useState('');

  const loadPasses = useCallback(async () => {
    try {
      const data = await guestPortalApi.getPasses();
      setPasses(data.passes);
      setAccountEmail(data.email);
      setView('dashboard');
    } catch {
      guestPortalApi.clearToken();
      setView('form');
    }
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Verify the emailed magic link, then drop it from the URL.
      guestPortalApi
        .verify(token)
        .then((res) => {
          guestPortalApi.setToken(res.token);
          searchParams.delete('token');
          setSearchParams(searchParams, { replace: true });
          return loadPasses();
        })
        .catch(() => {
          toast.error('That sign-in link is invalid or has expired. Please request a new one.');
          searchParams.delete('token');
          setSearchParams(searchParams, { replace: true });
          setView('form');
        });
      return;
    }
    if (guestPortalApi.getToken()) {
      loadPasses();
    } else {
      setView('form');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await guestPortalApi.requestLink(email.trim());
      setView('sent');
    } catch {
      // Endpoint never reveals account existence; treat as sent regardless.
      setView('sent');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    guestPortalApi.clearToken();
    setPasses([]);
    setEmail('');
    setView('form');
  };

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <SEO title="My Passes" noindex />

      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo size={30} showText={false} />
            <span
              className="text-lg font-extrabold tracking-tight text-slate-900"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              EventJell
            </span>
          </Link>
          {view === 'dashboard' && (
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#7A1F1F] transition-colors"
            >
              <LogOut size={14} /> Sign out
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        {view === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 size={32} className="animate-spin mb-3" style={{ color: R }} />
            <p className="text-sm font-medium">Signing you in…</p>
          </div>
        )}

        {(view === 'form' || view === 'sent') && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
                style={{ background: R }}
              >
                <Ticket size={26} className="text-white" />
              </div>
              <h1
                className="text-2xl font-extrabold text-slate-900"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                Your event passes
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Access every QR code from events you've RSVP'd to — no password needed.
              </p>
            </div>

            {view === 'form' ? (
              <form
                onSubmit={handleRequestLink}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-6 space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 focus:bg-white focus:border-[#7A1F1F] focus:ring-2 focus:ring-[#7A1F1F]/15 outline-none transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-extrabold shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ background: R }}
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Email me a sign-in link <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <ShieldCheck size={13} /> Secure magic-link sign-in
                </p>
              </form>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: '#ECFDF5' }}
                >
                  <Inbox size={24} style={{ color: '#059669' }} />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">Check your inbox</h2>
                <p className="text-sm text-slate-500 mt-1.5">
                  If <strong className="text-slate-700">{email}</strong> has any event passes, we've
                  sent a secure sign-in link. It expires in 20 minutes.
                </p>
                <button
                  onClick={() => setView('form')}
                  className="mt-4 text-xs font-bold text-[#7A1F1F] hover:underline"
                >
                  Use a different email
                </button>
              </div>
            )}
          </div>
        )}

        {view === 'dashboard' && (
          <div>
            <div className="mb-6">
              <h1
                className="text-2xl sm:text-3xl font-extrabold text-slate-900"
                style={{ fontFamily: 'Playfair Display, serif' }}
              >
                My passes
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Signed in as <strong className="text-slate-700">{accountEmail}</strong>
              </p>
            </div>

            {passes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center">
                <Ticket size={30} className="mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No passes yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Once you RSVP to an event, your QR pass will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {passes.map((pass) => (
                  <div
                    key={pass.guestId}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col"
                  >
                    <div className="p-4 sm:p-5 flex gap-4">
                      {/* Mini QR */}
                      <div className="shrink-0">
                        <div className="p-2 bg-white rounded-xl border border-slate-200">
                          <QRCodeSVG value={pass.token} size={84} level="M" fgColor="#1e293b" />
                        </div>
                        {pass.checkedIn && (
                          <div className="flex items-center justify-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-600">
                            <CheckCircle2 size={11} /> Checked in
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-extrabold text-slate-900 text-sm leading-snug truncate"
                          style={{ fontFamily: 'Playfair Display, serif' }}
                        >
                          {pass.eventName}
                        </h3>
                        {pass.ticketName && (
                          <span
                            className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: '#FAF0E8', color: R }}
                          >
                            <Ticket size={10} /> {pass.ticketName}
                          </span>
                        )}
                        <div className="mt-2 space-y-1">
                          {pass.date && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Calendar size={12} style={{ color: G }} />
                              <span className="truncate">{formatDate(pass.date)}</span>
                            </div>
                          )}
                          {pass.venue && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                              <MapPin size={12} style={{ color: G }} />
                              <span className="truncate">{pass.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      to={pass.passUrl}
                      className="mt-auto flex items-center justify-center gap-1.5 py-2.5 text-xs font-extrabold text-white transition-opacity hover:opacity-95"
                      style={{ background: R }}
                    >
                      Open full pass <ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
