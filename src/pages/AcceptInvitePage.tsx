import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  LayoutGrid,
  Users,
  Radio,
} from 'lucide-react';
import { invitationsApi, type InvitationDetails } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link.');
      setLoading(false);
      return;
    }

    invitationsApi
      .getDetails(token)
      .then((data) => {
        setInvitation(data);
        setLoading(false);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || 'Could not find this invitation.';
        setError(msg);
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token || !invitation) return;

    // If not authenticated, redirect to register with token
    if (!authToken || !user) {
      navigate(`/register?email=${encodeURIComponent(invitation.email)}&inviteToken=${token}`);
      return;
    }

    // Check if current user email matches invitation email
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      toast.error(
        `This invitation was sent to ${invitation.email}. You are currently logged in as ${user.email}.`,
      );
      return;
    }

    setIsAccepting(true);
    try {
      await invitationsApi.accept(token);
      toast.success(`You joined "${invitation.eventName}" as a ${invitation.role}!`);
      navigate(`/events/${invitation.eventId}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to accept invitation';
      toast.error(msg);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to decline this invitation?')) return;

    setIsDeclining(true);
    try {
      await invitationsApi.decline(token);
      toast.info('Invitation declined.');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to decline invitation';
      toast.error(msg);
    } finally {
      setIsDeclining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4 animate-pulse">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-stone-200/80 shadow-xl shadow-stone-900/5 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-stone-200 mx-auto" />
          <div className="space-y-2">
            <div className="h-4 w-28 bg-stone-200 rounded-full mx-auto" />
            <div className="h-6 w-48 bg-stone-300 rounded-xl mx-auto" />
            <div className="h-3.5 w-64 max-w-full bg-stone-200 rounded mx-auto" />
          </div>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-2">
            <div className="h-3 w-32 bg-stone-200 rounded mx-auto" />
            <div className="h-3 w-40 bg-stone-200 rounded mx-auto" />
          </div>
          <div className="flex gap-3 pt-2">
            <div className="h-11 flex-1 bg-stone-200 rounded-xl" />
            <div className="h-11 flex-1 bg-[#7A1F1F]/20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border border-stone-200/80 shadow-xl shadow-stone-900/5">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Invitation Unavailable</h2>
          <p className="text-sm text-stone-600 mb-6 leading-relaxed">
            {error || 'This invitation may have expired or been revoked.'}
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#7A1F1F] text-white font-semibold text-sm rounded-xl hover:bg-[#631818] transition-colors w-full"
          >
            Go to EventJell Home
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = invitation.status === 'expired';
  const isAccepted = invitation.status === 'accepted';
  const isDeclined = invitation.status === 'declined';
  const isPending = invitation.status === 'pending';
  const isMatchingUser = user && user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <>
      <Helmet>
        <title>Invitation to {invitation.eventName} &bull; EventJell</title>
      </Helmet>

      <div className="min-h-screen bg-[#FAF7F2] flex flex-col justify-between">
        {/* Top brand header */}
        <header className="px-6 py-6 flex items-center justify-between max-w-5xl w-full mx-auto">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7A1F1F] to-[#501212] flex items-center justify-center text-[#D4A24C] font-black text-sm tracking-wider shadow-md shadow-[#7A1F1F]/20 group-hover:scale-105 transition-transform">
              EJ
            </div>
            <span className="font-bold text-lg text-stone-900 tracking-tight">EventJell</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-3 text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full">
              <span>Signed in as <strong className="text-stone-900">{user.email}</strong></span>
            </div>
          ) : (
            <Link
              to={`/login?email=${encodeURIComponent(invitation.email)}&inviteToken=${token}`}
              className="text-xs font-bold text-[#7A1F1F] hover:underline"
            >
              Already have an account? Sign in
            </Link>
          )}
        </header>

        {/* Main invitation content */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-2xl shadow-stone-900/5 max-w-lg w-full overflow-hidden">
            
            {/* Card Hero Header */}
            <div className="bg-gradient-to-br from-[#3D0F0F] via-[#7A1F1F] to-[#9C3030] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#D4A24C] text-xs font-bold uppercase tracking-wider mb-4">
                <Sparkles size={13} />
                Collaboration Invite
              </div>

              <p className="text-stone-200 text-sm font-medium">
                <strong className="text-white font-bold">{invitation.inviterName}</strong> invited you to collaborate
              </p>
              
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1.5 tracking-tight leading-snug">
                {invitation.eventName}
              </h1>
            </div>

            {/* Card Body */}
            <div className="p-6 sm:p-8 space-y-6">

              {/* Status alerts if not pending */}
              {isExpired && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800">
                  <Clock className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold">Invitation Expired</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      This invitation has expired. Ask {invitation.inviterName} to send a new invite link.
                    </p>
                  </div>
                </div>
              )}

              {isAccepted && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-800">
                  <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold">Invitation Already Accepted</h4>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      This invitation has already been accepted. You can view the event in your dashboard.
                    </p>
                  </div>
                </div>
              )}

              {isDeclined && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 flex items-start gap-3 text-stone-800">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold">Invitation Declined</h4>
                    <p className="text-xs text-stone-600 mt-0.5">
                      This invitation was declined previously.
                    </p>
                  </div>
                </div>
              )}

              {/* Role and Event Information Box */}
              <div className="bg-[#FAF7F2] border border-[#E8DBCA] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Your Role</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-[#7A1F1F] border border-stone-200 shadow-sm">
                    <ShieldCheck size={14} className="text-[#D4A24C]" />
                    {invitation.role === 'editor' ? 'Editor (Full Access)' : 'Viewer (View Only)'}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-3 border-b border-stone-200/60">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Invited Email</span>
                  <span className="text-xs font-semibold text-stone-800 font-mono bg-white px-2.5 py-1 rounded-lg border border-stone-200">
                    {invitation.email}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Invited By</span>
                  <span className="text-xs font-bold text-stone-800">
                    {invitation.inviterName}
                  </span>
                </div>
              </div>

              {/* What is EventJell perks for unregistered users */}
              {!user && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                    What you can do together
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
                      <LayoutGrid size={18} className="text-[#7A1F1F] mx-auto mb-1.5" />
                      <p className="text-[11px] font-bold text-stone-800">Floor Plans</p>
                      <p className="text-[10px] text-stone-500">Live Seating</p>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
                      <Users size={18} className="text-[#7A1F1F] mx-auto mb-1.5" />
                      <p className="text-[11px] font-bold text-stone-800">Guest Lists</p>
                      <p className="text-[10px] text-stone-500">RSVP tracking</p>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
                      <Radio size={18} className="text-[#7A1F1F] mx-auto mb-1.5" />
                      <p className="text-[11px] font-bold text-stone-800">Real-Time</p>
                      <p className="text-[10px] text-stone-500">Instant sync</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {isPending && (
                <div className="space-y-3 pt-2">
                  {user ? (
                    isMatchingUser ? (
                      <button
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#7A1F1F] to-[#9C3030] text-white font-bold text-sm shadow-lg shadow-[#7A1F1F]/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isAccepting ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            Accepting...
                          </>
                        ) : (
                          <>
                            Accept Invitation & Open Workspace
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
                          You are logged in as <strong>{user.email}</strong>, but this invite was sent to <strong>{invitation.email}</strong>.
                        </div>
                        <Link
                          to={`/login?email=${encodeURIComponent(invitation.email)}&inviteToken=${token}`}
                          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#7A1F1F] text-white font-bold text-sm hover:bg-[#631818] transition-colors"
                        >
                          <LogIn size={16} />
                          Sign in as {invitation.email}
                        </Link>
                      </div>
                    )
                  ) : (
                    <div className="space-y-2.5">
                      <Link
                        to={`/register?email=${encodeURIComponent(invitation.email)}&inviteToken=${token}`}
                        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#7A1F1F] to-[#9C3030] text-white font-bold text-sm shadow-lg shadow-[#7A1F1F]/20 hover:brightness-110 active:scale-[0.99] transition-all"
                      >
                        <UserPlus size={16} />
                        Create Free Account & Accept
                        <ArrowRight size={16} />
                      </Link>

                      <Link
                        to={`/login?email=${encodeURIComponent(invitation.email)}&inviteToken=${token}`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 font-semibold text-xs transition-colors"
                      >
                        <LogIn size={14} />
                        Already have an account? Sign In
                      </Link>
                    </div>
                  )}

                  <div className="pt-2 text-center">
                    <button
                      onClick={handleDecline}
                      disabled={isDeclining}
                      className="text-xs text-stone-400 hover:text-stone-600 font-medium underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      {isDeclining ? 'Declining...' : 'Decline invitation'}
                    </button>
                  </div>
                </div>
              )}

              {isAccepted && (
                <Link
                  to={`/events/${invitation.eventId}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#7A1F1F] text-white font-bold text-sm hover:bg-[#631818] transition-colors"
                >
                  <Calendar size={16} />
                  Go to Event Dashboard
                </Link>
              )}

            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-xs text-stone-400">
          &copy; {new Date().getFullYear()} EventJell Inc. All rights reserved.
        </footer>
      </div>
    </>
  );
}
