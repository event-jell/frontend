import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Lock, Eye, EyeOff, MapPin, CheckCircle, ArrowRight, Zap, Search } from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia',
  'Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (DRC)','Congo (Republic)',
  'Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador',
  'Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France','Gabon',
  'Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau','Guyana','Haiti','Honduras',
  'Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan',
  'Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein',
  'Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania',
  'Mauritius','Mexico','Micronesia','Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar',
  'Namibia','Nauru','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia',
  'Norway','Oman','Pakistan','Palau','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal',
  'Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines',
  'Samoa','San Marino','Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia',
  'Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname',
  'Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga',
  'Trinidad and Tobago','Tunisia','Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates',
  'United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen',
  'Zambia','Zimbabwe',
];

const PERKS = [
  { icon: '🗺️', text: 'Beautiful drag-and-drop floor plans' },
  { icon: '🎟️', text: 'Sell tickets with QR codes built in' },
  { icon: '👥', text: 'Guest lists, RSVPs & seating made easy' },
  { icon: '📊', text: 'Real-time reports & revenue tracking' },
];

const R = '#7A1F1F';
const RD = '#3D0F0F';
const G = '#D4A24C';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special char', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < score ? colors[score - 1] : 'rgba(0,0,0,0.08)' }} />
        ))}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {checks.map(c => (
          <span key={c.label} className="flex items-center gap-1 text-[11px]"
            style={{ color: c.ok ? '#22c55e' : '#94a3b8' }}>
            <CheckCircle size={10} className={c.ok ? 'opacity-100' : 'opacity-30'} />
            {c.label}
          </span>
        ))}
        {score > 0 && <span className="text-[11px] font-semibold ml-auto" style={{ color: colors[score - 1] }}>{labels[score - 1]}</span>}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
        setCountrySearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(c => 
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      login(data.user, data.token);
      navigate('/events', { replace: true });
    },
  });

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setValidationError('Please fill in all fields.');
      return;
    }
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }
    mutation.mutate({ firstName, lastName, email, password, country });
  };

  const errorMessage = validationError || (
    mutation.error instanceof Error
      ? (mutation.error as any).response?.data?.message ?? mutation.error.message
      : null
  );

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: `linear-gradient(145deg, ${RD} 0%, ${R} 60%, #9c3030 100%)` }}>

        {/* Decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
            style={{ background: `radial-gradient(circle, ${G}, transparent)` }} />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full opacity-15"
            style={{ background: `radial-gradient(circle, ${G}, transparent)` }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-5"
            style={{ background: `radial-gradient(circle, white, transparent)` }} />
          {/* Grid dots */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Top */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <Logo size={36} />
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>EventJelly</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(212,162,76,0.15)', color: G, border: `1px solid rgba(212,162,76,0.3)` }}>
            <Zap size={11} />
            Free forever, no credit card required
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Create events<br />
            <span style={{
              background: `linear-gradient(90deg, ${G}, #F5D78E, ${G})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundSize: '200% auto',
            }}>
              worth remembering
            </span>
          </h1>

          <p className="text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Join 50,000+ event planners who use EventJelly to design, manage, and execute flawless events.
          </p>
        </div>

        {/* Perks */}
        <div className="relative z-10 space-y-4">
          {PERKS.map((p) => (
            <div key={p.text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {p.icon}
              </div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>{p.text}</p>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <div className="flex -space-x-2 mb-3">
            {[R, G, '#6366F1', '#22c55e'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-[9px] font-bold"
                style={{ backgroundColor: c, borderColor: RD }}>
                {['AM', 'JK', 'SR', 'OT'][i]}
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>4.9★</span> rated by thousands of event planners worldwide
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:py-8 overflow-y-auto"
        style={{ background: '#F8F7F5' }}>

        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <Logo size={32} />
          <span className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Playfair Display, serif' }}>EventJelly</span>
        </div>

        <div className="w-full max-w-md">

          {/* Progress dots */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all"
                style={{ background: step >= 1 ? `linear-gradient(135deg, ${R}, #9c3030)` : '#e2e8f0' }}>
                {step > 1 ? <CheckCircle size={14} /> : '1'}
              </div>
              <span className="text-xs font-medium" style={{ color: step >= 1 ? R : '#94a3b8' }}>Your info</span>
            </div>
            <div className="flex-1 h-px" style={{ background: step >= 2 ? `linear-gradient(90deg, ${R}, #9c3030)` : '#e2e8f0' }} />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{ background: step >= 2 ? `linear-gradient(135deg, ${R}, #9c3030)` : '#e2e8f0', color: step >= 2 ? 'white' : '#94a3b8' }}>
                2
              </div>
              <span className="text-xs font-medium" style={{ color: step >= 2 ? R : '#94a3b8' }}>Security</span>
            </div>
          </div>

          {/* Card */}
          <div>
            <div className="px-8 pt-8 pb-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {step === 1 ? 'Create your account' : 'Secure your account'}
              </h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                {step === 1 ? 'Tell us a bit about yourself to get started.' : 'Choose a strong password to protect your account.'}
              </p>
            </div>

            {errorMessage && (
              <div className="mx-8 mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-[9px] font-bold">!</span>
                </div>
                <p className="text-red-600 text-sm">{errorMessage}</p>
              </div>
            )}

            <div className="px-8 pb-8 pt-6">
              {/* ── STEP 1 ── */}
              {step === 1 && (
                <form onSubmit={handleStep1} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">First name</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                        <input
                          type="text" required autoFocus
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                          placeholder="Jane"
                          className="w-full h-11 pl-10 pr-4 rounded-xl border text-sm text-slate-800 placeholder:text-slate-300 transition-all outline-none"
                          style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                          onFocus={e => (e.target.style.borderColor = R)}
                          onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Last name</label>
                      <input
                        type="text" required
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Smith"
                        className="w-full h-11 px-4 rounded-xl border text-sm text-slate-800 placeholder:text-slate-300 transition-all outline-none"
                        style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                        onFocus={e => (e.target.style.borderColor = R)}
                        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Email address</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                      <input
                        type="email" required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full h-11 pl-10 pr-4 rounded-xl border text-sm text-slate-800 placeholder:text-slate-300 transition-all outline-none"
                        style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                        onFocus={e => (e.target.style.borderColor = R)}
                        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Country</label>
                    <div className="relative" ref={countryRef}>
                      <div 
                        className="relative w-full h-11 pl-10 pr-4 rounded-xl border text-sm cursor-pointer transition-all flex items-center gap-2 outline-none"
                        style={{ 
                          borderColor: isCountryOpen ? R : '#e2e8f0', 
                          background: '#f8fafc', 
                          color: country ? '#1e293b' : '#94a3b8' 
                        }}
                        onClick={() => setIsCountryOpen(!isCountryOpen)}
                      >
                        <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                        <span className="flex-1 truncate">{country || 'Select your country'}</span>
                        <svg className="transition-transform duration-200" style={{ transform: isCountryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>

                      {isCountryOpen && (
                        <div className="absolute z-50 w-full mt-2 rounded-xl border bg-white shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                          style={{ borderColor: '#e2e8f0' }}>
                          <div className="p-2 border-b bg-slate-50">
                            <div className="relative">
                              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
                              <input 
                                type="text"
                                placeholder="Search countries..."
                                value={countrySearch}
                                onChange={e => setCountrySearch(e.target.value)}
                                autoFocus
                                className="w-full h-9 pl-9 pr-4 rounded-lg border text-xs outline-none transition-all"
                                style={{ borderColor: '#e2e8f0', background: 'white' }}
                                onFocus={e => (e.target.style.borderColor = R)}
                                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                              />
                            </div>
                          </div>
                          <div 
                            className="overflow-y-auto custom-scrollbar" 
                            style={{ maxHeight: 'var(--country-list-height, 320px)' }}
                          >
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map(c => (
                                <div 
                                  key={c} 
                                  className="px-4 py-2.5 text-sm cursor-pointer transition-all hover:bg-slate-50 flex items-center justify-between"
                                  style={{ 
                                    color: '#475569', 
                                    backgroundColor: country === c ? 'rgba(122,31,31,0.08)' : 'transparent',
                                    fontWeight: country === c ? '600' : '400'
                                  }}
                                  onClick={() => {
                                    setCountry(c);
                                    setIsCountryOpen(false);
                                    setCountrySearch('');
                                  }}
                                >
                                  {c}
                                  {country === c && <CheckCircle size={14} style={{ color: R }} />}
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-4 text-xs text-center text-slate-400 italic">
                                No countries found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 mt-2"
                    style={{ background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)`, boxShadow: `0 4px 16px rgba(122,31,31,0.35)` }}
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                </form>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required autoFocus
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full h-11 pl-10 pr-11 rounded-xl border text-sm text-slate-800 placeholder:text-slate-300 transition-all outline-none"
                        style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                        onFocus={e => (e.target.style.borderColor = R)}
                        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#94a3b8' }}>
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Confirm password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className="w-full h-11 pl-10 pr-11 rounded-xl border text-sm placeholder:text-slate-300 transition-all outline-none"
                        style={{
                          borderColor: confirmPassword ? (confirmPassword === password ? '#22c55e' : '#ef4444') : '#e2e8f0',
                          background: '#f8fafc',
                          color: '#1e293b',
                        }}
                        onFocus={e => { if (!confirmPassword) e.target.style.borderColor = R; }}
                        onBlur={e => { if (!confirmPassword) e.target.style.borderColor = '#e2e8f0'; }}
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: '#94a3b8' }}>
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      {confirmPassword && confirmPassword === password && (
                        <CheckCircle size={14} className="absolute right-10 top-1/2 -translate-y-1/2 text-green-500" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    By creating an account you agree to our{' '}
                    <span className="underline cursor-pointer" style={{ color: R }}>Terms of Service</span>{' '}
                    and{' '}
                    <span className="underline cursor-pointer" style={{ color: R }}>Privacy Policy</span>.
                  </p>

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setValidationError(''); }}
                      className="h-12 px-5 rounded-xl text-sm font-semibold border transition-all hover:bg-slate-50"
                      style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="flex-1 h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                      style={{ background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)`, boxShadow: `0 4px 16px rgba(122,31,31,0.35)` }}
                    >
                      {mutation.isPending ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
                      ) : (
                        <><CheckCircle size={15} /> Create account</>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: R }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
