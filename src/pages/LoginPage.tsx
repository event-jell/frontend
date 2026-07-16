import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO';
import { useMutation } from '@tanstack/react-query';
import { Mail, Lock, Eye, EyeOff, Star } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const R  = '#7A1F1F';
const RD = '#3D0F0F';
const G  = '#D4A24C';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate('/events', { replace: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ email, password });
  };

  const errorMessage = mutation.error instanceof Error
    ? (mutation.error as any).response?.data?.message ?? mutation.error.message
    : null;

  return (
    <div className="min-h-screen flex" style={{ background: '#FAF7F2' }}>
      <SEO title="Sign In" />
      {/* Left panel — brand */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: `linear-gradient(160deg,${RD} 0%,${R} 55%,#4a1010 100%)` }}>

        {/* Gold dot grid */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(${G} 1px,transparent 1px)`, backgroundSize: '28px 28px' }} />

        {/* Gold flare */}
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 70% 10%,rgba(212,162,76,0.15),transparent 60%)`, filter: 'blur(30px)' }} />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-12">
            <Logo size={36} />
            <span className="text-lg font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>EventJelly</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(212,162,76,0.12)', color: G, border: `1px solid rgba(212,162,76,0.25)` }}>
            <Star size={10} />Premium event management
          </div>

          <h2 className="text-4xl font-extrabold text-white leading-tight mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Create events<br />
            <span style={{ color: G }}>people remember</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Floor plans, guest lists, ticketing, vendors, communications — all in one place.
          </p>
        </div>

        {/* Testimonial */}
        <div className="relative rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={G} style={{ color: G }} />)}
          </div>
          <p className="text-sm text-white/75 italic leading-relaxed mb-3">
            "EventJelly transformed how we run our annual gala. The floor planner alone saved us 20 hours of back-and-forth."
          </p>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: G }}>
              AO
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Amara Okafor</p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>Wedding Planner, Lagos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <Logo size={32} />
            <span className="text-base font-bold" style={{ color: '#2A2A2A', fontFamily: 'Playfair Display, serif' }}>EventJelly</span>
          </div>

          <h1 className="text-2xl font-extrabold mb-1" style={{ color: '#2A2A2A', fontFamily: 'Playfair Display, serif' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: '#8A8A8A' }}>Sign in to your EventJelly account</p>

          {resetSuccess && (
            <div className="mb-5 px-4 py-3 rounded-xl border text-sm"
              style={{ background: 'rgba(63,166,91,0.06)', borderColor: 'rgba(63,166,91,0.2)', color: '#3FA65B' }}>
              Password reset successfully. Please sign in.
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 px-4 py-3 rounded-xl border text-sm"
              style={{ background: 'rgba(122,31,31,0.05)', borderColor: 'rgba(122,31,31,0.15)', color: R }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2A2A2A' }}>Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#8A8A8A' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border transition-all outline-none"
                  style={{
                    borderColor: '#E8E0D8',
                    background: 'white',
                    color: '#2A2A2A',
                  }}
                  onFocus={e => { e.target.style.borderColor = R; e.target.style.boxShadow = `0 0 0 3px rgba(122,31,31,0.08)`; }}
                  onBlur={e => { e.target.style.borderColor = '#E8E0D8'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#2A2A2A' }}>Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#8A8A8A' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm rounded-xl border transition-all outline-none"
                  style={{ borderColor: '#E8E0D8', background: 'white', color: '#2A2A2A' }}
                  onFocus={e => { e.target.style.borderColor = R; e.target.style.boxShadow = `0 0 0 3px rgba(122,31,31,0.08)`; }}
                  onBlur={e => { e.target.style.borderColor = '#E8E0D8'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#8A8A8A' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#8A8A8A' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-gray-300"
                  style={{ accentColor: R }}
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: R }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              style={{ background: `linear-gradient(135deg,${R},#9c3030)`, boxShadow: `0 4px 14px rgba(122,31,31,0.3)` }}>
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: '#E8E0D8' }} />
            <span className="text-xs" style={{ color: '#8A8A8A' }}>or</span>
            <div className="flex-1 h-px" style={{ background: '#E8E0D8' }} />
          </div>

          <p className="text-center text-sm" style={{ color: '#8A8A8A' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors hover:opacity-80" style={{ color: R }}>
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
