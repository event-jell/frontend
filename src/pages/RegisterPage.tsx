import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { useMutation } from '@tanstack/react-query';
import {
  User, Mail, Lock, Eye, EyeOff, MapPin, CheckCircle, ArrowRight, Zap, Search,
  Globe, Users, LayoutGrid, Presentation, Ticket, MessageSquare, Wallet, BarChart3,
  Contact2, Sparkles, UserPlus, X, Loader2,
} from 'lucide-react';
import { authApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCreateEvent, useAddCollaborator } from '../hooks/useEvents';
import Logo from '../components/Logo';

const MODULES = [
  { key: 'guests', label: 'Guest Management', icon: Users },
  { key: 'floor_plan', label: 'Floor Plan', icon: LayoutGrid },
  { key: 'stage_plan', label: 'Stage Plan', icon: Presentation },
  { key: 'ticketing', label: 'Ticketing', icon: Ticket },
  { key: 'event_com', label: 'Event Com', icon: MessageSquare },
  { key: 'budget_finance', label: 'Budget & Finance', icon: Wallet },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'crm', label: 'CRM', icon: Contact2 },
  { key: 'ai_assistant', label: 'AI Assistant', icon: Sparkles },
] as const;

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

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
  const { login, user } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [otp, setOtp] = useState('');
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

  // ── Workspace onboarding (steps 4-6) ──
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>(
    () => Object.fromEntries(MODULES.map(m => [m.key, true]))
  );
  const [teammates, setTeammates] = useState<{ email: string; role: 'editor' | 'viewer'; error: string }[]>([
    { email: '', role: 'editor', error: '' },
  ]);
  const createEvent = useCreateEvent();
  const addCollaborator = useAddCollaborator();

  useEffect(() => {
    if (!workspaceSlug) return;
    setSlugChecking(true);
    const t = setTimeout(() => setSlugChecking(false), 500);
    return () => clearTimeout(t);
  }, [workspaceSlug]);

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
    onSuccess: () => {
      setValidationError('');
      setStep(3);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (data) => {
      login(data.user, data.token);
      setValidationError('');
      setStep(4);
    },
  });

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!otp.trim()) {
      setValidationError('Please enter the code we emailed you.');
      return;
    }
    verifyMutation.mutate({ email, otp: otp.trim() });
  };

  const handleWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    if (!workspaceName.trim()) {
      setValidationError('Please name your workspace.');
      return;
    }
    createEvent.mutate({ name: workspaceName.trim() }, {
      onSuccess: (created) => {
        setCreatedEventId(created._id);
        setStep(5);
      },
    });
  };

  const toggleModule = (key: string) => {
    setSelectedModules(m => ({ ...m, [key]: !m[key] }));
  };

  const handleModulesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      const enabled = Object.entries(selectedModules).filter(([, on]) => on).map(([key]) => key);
      localStorage.setItem(`ej_workspace_modules_${user.id}`, JSON.stringify(enabled));
    }
    setStep(6);
  };

  const updateTeammate = (i: number, patch: Partial<{ email: string; role: 'editor' | 'viewer' }>) => {
    setTeammates(rows => rows.map((r, idx) => idx === i ? { ...r, ...patch, error: '' } : r));
  };

  const addTeammateRow = () => {
    setTeammates(rows => rows.length >= 5 ? rows : [...rows, { email: '', role: 'editor', error: '' }]);
  };

  const removeTeammateRow = (i: number) => {
    setTeammates(rows => rows.filter((_, idx) => idx !== i));
  };

  const finishOnboarding = () => {
    navigate(createdEventId ? `/events/${createdEventId}` : '/events', { replace: true });
  };

  const handleSendInvites = async () => {
    const pending = teammates
      .map((t, i) => ({ ...t, i }))
      .filter(t => t.email.trim());

    if (!createdEventId || pending.length === 0) {
      finishOnboarding();
      return;
    }

    const next = [...teammates];
    await Promise.all(pending.map(async t => {
      try {
        await addCollaborator.mutateAsync({ eventId: createdEventId, email: t.email.trim(), role: t.role });
        next[t.i] = { ...next[t.i], error: '' };
      } catch (err) {
        const message = err instanceof Error ? (err as any).response?.data?.message ?? err.message : 'Could not invite this person.';
        next[t.i] = { ...next[t.i], error: message };
      }
    }));
    setTeammates(next);

    if (next.every(t => !t.email.trim() || !t.error)) {
      finishOnboarding();
    }
  };

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

  const activeError = mutation.error ?? verifyMutation.error ?? createEvent.error;
  const errorMessage = validationError || (
    activeError instanceof Error
      ? (activeError as any).response?.data?.message ?? activeError.message
      : null
  );

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SEO title="Create an Account" />

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
          <div className="flex items-center gap-1.5 mb-6">
            {([1, 2, 3, 4, 5, 6] as const).map(n => (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0"
                  style={{
                    background: step >= n ? `linear-gradient(135deg, ${R}, #9c3030)` : '#e2e8f0',
                    color: step >= n ? 'white' : '#94a3b8',
                  }}>
                  {step > n ? <CheckCircle size={12} /> : n}
                </div>
                {n < 6 && (
                  <div className="flex-1 h-px mx-1" style={{ background: step > n ? `linear-gradient(90deg, ${R}, #9c3030)` : '#e2e8f0' }} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold text-center mb-6 -mt-2" style={{ color: R }}>
            {['Your info', 'Security', 'Verify', 'Workspace', 'Modules', 'Team'][step - 1]}
          </p>

          {/* Card */}
          <div>
            <div className="px-8 pt-8 pb-2">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                {{
                  1: 'Create your account',
                  2: 'Secure your account',
                  3: 'Check your email',
                  4: 'Name your workspace',
                  5: 'Select your tools & modules',
                  6: 'Add your teammates',
                }[step]}
              </h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                {{
                  1: 'Tell us a bit about yourself to get started.',
                  2: 'Choose a strong password to protect your account.',
                  3: `Enter the 6-digit code we sent to ${email}.`,
                  4: "This is where all your events will live. You can change this later.",
                  5: 'Pick what you need — you can turn these on or off anytime.',
                  6: 'Invite people to help you plan. You can always do this later.',
                }[step]}
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

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <form onSubmit={handleVerify} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Verification code</label>
                    <input
                      type="text" inputMode="numeric" required autoFocus
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      className="w-full h-12 px-4 rounded-xl border text-center text-lg tracking-[0.5em] text-slate-800 placeholder:text-slate-300 placeholder:tracking-[0.5em] transition-all outline-none"
                      style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                      onFocus={e => (e.target.style.borderColor = R)}
                      onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifyMutation.isPending}
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    style={{ background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)`, boxShadow: `0 4px 16px rgba(122,31,31,0.35)` }}
                  >
                    {verifyMutation.isPending ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
                    ) : (
                      <><CheckCircle size={15} /> Verify & continue</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => mutation.mutate({ firstName, lastName, email, password, country })}
                    disabled={mutation.isPending}
                    className="w-full text-xs font-medium text-center transition-colors disabled:opacity-50"
                    style={{ color: R }}
                  >
                    {mutation.isPending ? 'Resending…' : "Didn't get a code? Resend"}
                  </button>
                </form>
              )}

              {/* ── STEP 4: Name your workspace ── */}
              {step === 4 && (
                <form onSubmit={handleWorkspaceSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Workspace name</label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                      <input
                        type="text" required autoFocus
                        value={workspaceName}
                        onChange={e => {
                          setWorkspaceName(e.target.value);
                          if (!slugEdited) setWorkspaceSlug(slugify(e.target.value));
                        }}
                        placeholder="Luxe Wedding Planning"
                        className="w-full h-11 pl-10 pr-4 rounded-xl border text-sm text-slate-800 placeholder:text-slate-300 transition-all outline-none"
                        style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                        onFocus={e => (e.target.style.borderColor = R)}
                        onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Workspace URL</label>
                    <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
                      <input
                        type="text"
                        value={workspaceSlug}
                        onChange={e => { setSlugEdited(true); setWorkspaceSlug(slugify(e.target.value)); }}
                        placeholder="luxe-wedding"
                        className="flex-1 h-11 pl-4 pr-2 bg-transparent text-sm text-slate-800 placeholder:text-slate-300 outline-none min-w-0"
                      />
                      <span className="text-sm text-slate-400 pr-2 whitespace-nowrap">.eventdesk.com</span>
                      <div className="pr-3.5 flex-shrink-0">
                        {workspaceSlug && (slugChecking
                          ? <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin block" />
                          : <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={createEvent.isPending}
                    className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                    style={{ background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)`, boxShadow: `0 4px 16px rgba(122,31,31,0.35)` }}
                  >
                    {createEvent.isPending ? (
                      <><Loader2 size={15} className="animate-spin" /> Creating workspace…</>
                    ) : (
                      <>Continue <ArrowRight size={15} /></>
                    )}
                  </button>
                </form>
              )}

              {/* ── STEP 5: Select tools & modules ── */}
              {step === 5 && (
                <form onSubmit={handleModulesSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {MODULES.map(({ key, label, icon: Icon }) => {
                      const on = !!selectedModules[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleModule(key)}
                          className="flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all"
                          style={{
                            borderColor: on ? R : '#e2e8f0',
                            background: on ? 'rgba(122,31,31,0.04)' : '#f8fafc',
                          }}
                        >
                          <Icon size={16} style={{ color: on ? R : '#94a3b8' }} className="flex-shrink-0" />
                          <span className="text-xs font-semibold flex-1" style={{ color: on ? '#1e293b' : '#64748b' }}>{label}</span>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: on ? '#22c55e' : '#e2e8f0' }}>
                            {on && <CheckCircle size={12} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
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

              {/* ── STEP 6: Add teammates ── */}
              {step === 6 && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {teammates.map((t, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#cbd5e1' }} />
                            <input
                              type="email"
                              value={t.email}
                              onChange={e => updateTeammate(i, { email: e.target.value })}
                              placeholder="teammate@company.com"
                              className="w-full h-11 pl-10 pr-4 rounded-xl border text-sm text-slate-800 placeholder:text-slate-300 transition-all outline-none"
                              style={{ borderColor: t.error ? '#ef4444' : '#e2e8f0', background: '#f8fafc' }}
                              onFocus={e => { if (!t.error) e.target.style.borderColor = R; }}
                              onBlur={e => { if (!t.error) e.target.style.borderColor = '#e2e8f0'; }}
                            />
                          </div>
                          <select
                            value={t.role}
                            onChange={e => updateTeammate(i, { role: e.target.value as 'editor' | 'viewer' })}
                            className="h-11 px-3 rounded-xl border text-sm text-slate-600 outline-none cursor-pointer"
                            style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}
                          >
                            <option value="editor">Can edit</option>
                            <option value="viewer">Can view</option>
                          </select>
                          {teammates.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTeammateRow(i)}
                              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                        {t.error && <p className="text-xs text-red-600 mt-1 ml-1">{t.error}</p>}
                      </div>
                    ))}
                  </div>

                  {teammates.length < 5 && (
                    <button
                      type="button"
                      onClick={addTeammateRow}
                      className="text-xs font-semibold flex items-center gap-1.5"
                      style={{ color: R }}
                    >
                      <UserPlus size={13} /> Add another
                    </button>
                  )}

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={finishOnboarding}
                      className="h-12 px-5 rounded-xl text-sm font-semibold border transition-all hover:bg-slate-50"
                      style={{ borderColor: '#e2e8f0', color: '#64748b' }}
                    >
                      Skip for now
                    </button>
                    <button
                      type="button"
                      onClick={handleSendInvites}
                      disabled={addCollaborator.isPending}
                      className="flex-1 h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                      style={{ background: `linear-gradient(135deg, ${R} 0%, #9c3030 100%)`, boxShadow: `0 4px 16px rgba(122,31,31,0.35)` }}
                    >
                      {addCollaborator.isPending ? (
                        <><Loader2 size={15} className="animate-spin" /> Sending invites…</>
                      ) : (
                        <><CheckCircle size={15} /> Finish</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {step <= 3 && (
            <p className="text-center text-sm mt-6" style={{ color: '#94a3b8' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: R }}>
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
