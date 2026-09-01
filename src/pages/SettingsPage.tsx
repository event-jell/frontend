import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { useLocale } from '../hooks/useLocale';
import { usersApi, paymentsApi, type PaymentRecord } from '../lib/api';
import { User, Shield, Bell, Globe, DollarSign, Clock, CheckCircle, Eye, EyeOff, CreditCard, Sparkles, Zap, Check, Loader2, Search, ChevronDown } from 'lucide-react';
import { openPaystackModal } from '../utils/paystack';
import { openPayPalCheckout } from '../utils/paypal';
import { isAfricanCountry } from '../utils/currencyRates';
import { COUNTRIES, getCountryFlag, getCountryName, detectUserCountry } from '../utils/countries';
import { formatCurrency, formatLocalDate } from '../utils/formatters';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { preferences, updatePreferences, isLoading } = usePreferences();
  const { localCurrency, timezone, locale } = useLocale();

  const [isSubscribing, setIsSubscribing] = useState(false);
  const { data: paymentHistory = [], refetch: refetchPayments } = useQuery({
    queryKey: ['user-payments'],
    queryFn: paymentsApi.getUserHistory,
  });

  const [lang, setLang] = useState(preferences.language);
  const [curr, setCurr] = useState(preferences.currency);
  const [tz, setTz] = useState(preferences.timezone);
  const [saved, setSaved] = useState(false);

  const handleSaveLocalization = async () => {
    await updatePreferences({ language: lang, currency: curr, timezone: tz });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleUpgradePro = async () => {
    if (!user?.email) return;
    setIsSubscribing(true);
    try {
      const init = await paymentsApi.initialize({
        email: user.email,
        amount: 29,
        currency: 'USD',
        payment_type: 'platform_subscription',
        plan: 'pro',
        customer_name: `${user.firstName} ${user.lastName}`.trim(),
        callback_url: window.location.href,
      });

      await openPaystackModal({
        email: user.email,
        amount: 29,
        currency: 'USD',
        reference: init.reference,
        customerName: `${user.firstName} ${user.lastName}`.trim(),
        onSuccess: async (res) => {
          toast.loading('Activating your Pro subscription...', { id: 'sub-verify' });
          try {
            const verifyRes = await paymentsApi.verify(res.reference);
            if (verifyRes.success) {
              updateUser({ plan: 'pro', subscriptionStatus: 'active' });
              refetchPayments();
              toast.success('🎉 Pro subscription activated successfully!', { id: 'sub-verify' });
            }
          } catch {
            updateUser({ plan: 'pro', subscriptionStatus: 'active' });
            refetchPayments();
            toast.success('Pro subscription activated!', { id: 'sub-verify' });
          } finally {
            setIsSubscribing(false);
          }
        },
        onClose: () => {
          setIsSubscribing(false);
        },
        onError: (err) => {
          setIsSubscribing(false);
          toast.error(err.message || 'Subscription failed');
        },
      });
    } catch (err: any) {
      setIsSubscribing(false);
      toast.error(err.message || 'Could not initialize subscription');
    }
  };

  const handleUpgradePayPal = async () => {
    if (!user?.email) return;
    setIsSubscribing(true);
    try {
      await openPayPalCheckout({
        email: user.email,
        amount: 29,
        currency: 'USD',
        customerName: `${user.firstName} ${user.lastName}`.trim(),
        metadata: { plan: 'pro', payment_type: 'platform_subscription' },
        onSuccess: async (ppRes) => {
          toast.loading('Activating your Pro plan via PayPal...', { id: 'pp-sub' });
          try {
            await paymentsApi.capturePayPal({
              orderId: ppRes.orderId,
              reference: ppRes.reference,
              amount: 29,
              currency: 'USD',
              payment_type: 'platform_subscription',
              customer_email: user.email,
              customer_name: `${user.firstName} ${user.lastName}`.trim(),
              plan: 'pro',
            });
            updateUser({ plan: 'pro', subscriptionStatus: 'active' });
            refetchPayments();
            toast.success('🎉 Pro subscription activated via PayPal!', { id: 'pp-sub' });
          } catch (err: any) {
            toast.error('Could not verify PayPal subscription', { id: 'pp-sub' });
          } finally {
            setIsSubscribing(false);
          }
        },
        onClose: () => {
          setIsSubscribing(false);
        },
        onError: (err) => {
          setIsSubscribing(false);
          toast.error(err.message || 'PayPal subscription failed');
        },
      });
    } catch (err: any) {
      setIsSubscribing(false);
      toast.error('Failed to launch PayPal');
    }
  };

  // Fetch fresh profile from backend
  const { data: serverProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: usersApi.getProfile,
    staleTime: 30_000,
  });

  const effectiveCountry = detectUserCountry(
    user?.country || serverProfile?.country,
    preferences?.currency || localCurrency,
    preferences?.timezone || timezone
  );

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [country, setCountry] = useState(effectiveCountry);
  const [organizationName, setOrganizationName] = useState(user?.organizationName || '');
  const [organizationSize, setOrganizationSize] = useState(user?.organizationSize || '');
  const [creatorRole, setCreatorRole] = useState(user?.creatorRole || '');
  const [primaryEventType, setPrimaryEventType] = useState(user?.primaryEventType || '');

  const countryRef = useRef<HTMLDivElement>(null);
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const filteredCountries = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (serverProfile) {
      updateUser(serverProfile);
    }
  }, [serverProfile]);

  useEffect(() => {
    const currentCountry = detectUserCountry(
      user?.country || serverProfile?.country,
      preferences?.currency || localCurrency,
      preferences?.timezone || timezone
    );
    setFirstName(user?.firstName || serverProfile?.firstName || '');
    setLastName(user?.lastName || serverProfile?.lastName || '');
    setCountry(currentCountry);
    setOrganizationName(user?.organizationName || serverProfile?.organizationName || '');
    setOrganizationSize(user?.organizationSize || serverProfile?.organizationSize || '');
    setCreatorRole(user?.creatorRole || serverProfile?.creatorRole || '');
    setPrimaryEventType(user?.primaryEventType || serverProfile?.primaryEventType || '');
  }, [
    user?.firstName,
    user?.lastName,
    user?.country,
    user?.organizationName,
    user?.organizationSize,
    user?.creatorRole,
    user?.primaryEventType,
    serverProfile,
    preferences?.currency,
    preferences?.timezone,
    localCurrency,
    timezone,
  ]);

  const [profileSaved, setProfileSaved] = useState(false);
  const profileMutation = useMutation({
    mutationFn: usersApi.updateProfile,
    onSuccess: (data) => {
      updateUser(data);
      setProfileSaved(true);
      toast.success('Profile and country updated successfully!');
      setTimeout(() => setProfileSaved(false), 2500);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update profile';
      toast.error(msg);
    }
  });

  const profileDirty =
    firstName.trim() !== (user?.firstName || serverProfile?.firstName || '') ||
    lastName.trim() !== (user?.lastName || serverProfile?.lastName || '') ||
    country !== (getCountryName(user?.country || serverProfile?.country) || '') ||
    organizationName.trim() !== (user?.organizationName || serverProfile?.organizationName || '') ||
    organizationSize !== (user?.organizationSize || serverProfile?.organizationSize || '') ||
    creatorRole !== (user?.creatorRole || serverProfile?.creatorRole || '') ||
    primaryEventType !== (user?.primaryEventType || serverProfile?.primaryEventType || '');

  const profileError = profileMutation.error instanceof Error
    ? (profileMutation.error as any).response?.data?.message ?? profileMutation.error.message
    : null;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordValidationError, setPasswordValidationError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  const passwordMutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
    },
  });

  const handleChangePassword = () => {
    setPasswordValidationError('');
    if (newPassword.length < 8) {
      setPasswordValidationError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordValidationError('New passwords do not match.');
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const passwordError = passwordValidationError || (
    passwordMutation.error instanceof Error
      ? (passwordMutation.error as any).response?.data?.message ?? passwordMutation.error.message
      : null
  );

  const [activeTab, setActiveTab] = useState<'profile' | 'billing' | 'localization' | 'notifications' | 'security'>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Profile Information', icon: User },
    { id: 'billing' as const, label: 'Plans & Billing', icon: CreditCard },
    { id: 'localization' as const, label: 'Localization', icon: Globe },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-3 py-3 sm:px-8 sm:py-5 flex-shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3.5 sm:px-8 sm:py-8 pb-28 sm:pb-20 no-scrollbar">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-3 sm:gap-6 items-start">
          
          {/* Side Tabs Navigation (Compact on Mobile) */}
          <div className="w-full md:w-64 flex-shrink-0 flex md:flex-col overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 gap-1 bg-white md:bg-transparent p-1 md:p-0 rounded-xl sm:rounded-2xl border md:border-0 border-slate-100 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2.5 px-3 py-1.5 md:py-3 rounded-lg sm:rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all outline-none ${
                    isActive
                      ? 'bg-[#FAF0E8] text-[#7A1F1F]'
                      : 'text-slate-600 hover:bg-slate-100/50 hover:text-[#7A1F1F]'
                  }`}
                >
                  <Icon size={14} className={`sm:w-[18px] sm:h-[18px] ${isActive ? 'text-[#7A1F1F]' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Section Content area */}
          <div className="flex-1 w-full">
            {activeTab === 'profile' && (
              /* Profile Section */
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <User size={15} className="text-slate-400 sm:w-[18px] sm:h-[18px]" />
                  <h2 className="text-xs sm:text-base font-semibold text-slate-800">Profile Information</h2>
                </div>
                <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-6">
                    <div
                      className="w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-xs flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
                    >
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs sm:text-sm text-slate-500">{user?.creatorRole || 'Event Planner'}{user?.organizationName ? ` at ${user.organizationName}` : ''}</p>
                        {user?.country && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                            <span className="text-sm leading-none">{getCountryFlag(user.country)}</span>
                            <span>{getCountryName(user.country)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {profileError && (
                    <div className="px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm">{profileError}</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input type="email" disabled value={user?.email || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl text-slate-400 text-xs sm:text-sm focus:outline-none cursor-not-allowed" />
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Email address cannot be changed.</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Organization / Company Name</label>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={e => setOrganizationName(e.target.value)}
                        placeholder="e.g. Acme Events Ltd"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Organization Size</label>
                      <select
                        value={organizationSize}
                        onChange={e => setOrganizationSize(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      >
                        <option value="">Select organization size</option>
                        <option value="1 (Just me)">1 (Just me)</option>
                        <option value="2 - 10 team members">2 - 10 team members</option>
                        <option value="11 - 50 team members">11 - 50 team members</option>
                        <option value="51 - 200 team members">51 - 200 team members</option>
                        <option value="201 - 500 team members">201 - 500 team members</option>
                        <option value="500+ team members">500+ team members</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Role of Creator / Job Title</label>
                      <select
                        value={creatorRole}
                        onChange={e => setCreatorRole(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      >
                        <option value="">Select creator role</option>
                        <option value="Event Planner / Producer">Event Planner / Producer</option>
                        <option value="Event Coordinator / Specialist">Event Coordinator / Specialist</option>
                        <option value="Venue & Hospitality Manager">Venue & Hospitality Manager</option>
                        <option value="Corporate Event Lead">Corporate Event Lead</option>
                        <option value="Marketing & Brand Manager">Marketing & Brand Manager</option>
                        <option value="Agency Owner / Executive">Agency Owner / Executive</option>
                        <option value="Independent Organizer / Host">Independent Organizer / Host</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Primary Event Type</label>
                      <select
                        value={primaryEventType}
                        onChange={e => setPrimaryEventType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      >
                        <option value="">Select primary event focus</option>
                        <option value="Weddings & Social Gatherings">Weddings & Social Gatherings</option>
                        <option value="Corporate & Conferences">Corporate & Conferences</option>
                        <option value="Galas, Charity & Banquets">Galas, Charity & Banquets</option>
                        <option value="Concerts & Live Entertainment">Concerts & Live Entertainment</option>
                        <option value="Festivals & Outdoor Grounds">Festivals & Outdoor Grounds</option>
                        <option value="Multiple / Mixed Formats">Multiple / Mixed Formats</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Country / Region</label>
                      <div className="relative" ref={countryRef}>
                        <button
                          type="button"
                          onClick={() => setIsCountryOpen(!isCountryOpen)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all flex items-center justify-between gap-2 text-left shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="text-base leading-none flex-shrink-0">{getCountryFlag(country)}</span>
                            <span className={country ? 'text-slate-800 font-medium truncate' : 'text-slate-400 truncate'}>
                              {country || 'Select your country'}
                            </span>
                          </div>
                          <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${isCountryOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isCountryOpen && (
                          <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="p-2 border-b border-slate-100 bg-slate-50">
                              <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Search countries..."
                                  value={countrySearch}
                                  onChange={e => setCountrySearch(e.target.value)}
                                  autoFocus
                                  className="w-full h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-red-500"
                                />
                              </div>
                            </div>
                            <div className="max-h-56 overflow-y-auto custom-scrollbar p-1">
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map(c => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    onClick={() => {
                                      setCountry(c.name);
                                      setIsCountryOpen(false);
                                      setCountrySearch('');
                                    }}
                                    className={`w-full px-3 py-2 text-left rounded-lg text-xs flex items-center justify-between transition-colors ${
                                      country === c.name ? 'bg-[#FAF0E8] text-[#7A1F1F] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <span className="text-sm leading-none">{c.flag}</span>
                                      <span className="truncate">{c.name}</span>
                                    </div>
                                    {country === c.name && <CheckCircle size={13} className="text-[#7A1F1F] flex-shrink-0" />}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-4 text-xs text-center text-slate-400">No countries found</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() =>
                        profileMutation.mutate({
                          firstName: firstName.trim(),
                          lastName: lastName.trim(),
                          country,
                          organizationName: organizationName.trim(),
                          organizationSize,
                          creatorRole,
                          primaryEventType,
                        })
                      }
                      disabled={!profileDirty || !firstName.trim() || !lastName.trim() || profileMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #7A1F1F, #9c3030)' }}
                    >
                      {profileSaved ? <><CheckCircle size={13} /> Saved!</> : profileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              /* Plans & Billing Section */
              <div className="space-y-3.5 sm:space-y-6">
                {/* Active Plan Overview */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-100 p-3.5 sm:p-6 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FAF0E8] text-[#7A1F1F] flex items-center justify-center flex-shrink-0 shadow-2xs">
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-xl font-bold text-slate-900">
                            {user?.plan === 'pro' ? 'Pro Organizer Plan' : 'Free Starter Plan'}
                          </h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                            {user?.subscriptionStatus === 'active' ? 'Active' : 'Free'}
                          </span>
                        </div>
                        <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">
                          {user?.plan === 'pro'
                            ? 'Unlimited events, QR check-in & passes, customized branding, priority support'
                            : 'Basic event planning & seating with up to 50 guests per event'}
                        </p>
                      </div>
                    </div>

                    {user?.plan !== 'pro' && (
                      <div className="flex flex-wrap items-center gap-2">
                        {isAfricanCountry(user?.country) ? (
                          <button
                            onClick={handleUpgradePro}
                            disabled={isSubscribing}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs text-white transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
                          >
                            <Zap size={13} className="text-[#D4A24C]" />
                            Paystack (₦25,000 / mo)
                          </button>
                        ) : (
                          <button
                            onClick={handleUpgradePayPal}
                            disabled={isSubscribing}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-[#003087] hover:bg-[#002466] transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.305-.59 3.82-3.13 5.768-6.947 5.768H9.68l-1.58 10.03c-.082.52-.53.901-1.054.901v.003l.03-.477z"/></svg>
                            PayPal ($29 / mo)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Plan Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-6">
                  {/* Starter Tier */}
                  <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border transition-all ${user?.plan !== 'pro' ? 'border-[#7A1F1F]/40 shadow-xs ring-1 ring-[#7A1F1F]/20' : 'border-slate-100 shadow-xs'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-slate-900">Starter Plan</h3>
                        <p className="text-[11px] sm:text-xs text-slate-500">Perfect for intimate & single events</p>
                      </div>
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900">Free</span>
                    </div>

                    <ul className="space-y-1.5 sm:space-y-2.5 text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600 flex-shrink-0" />
                        <span>Up to 1 active event</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600 flex-shrink-0" />
                        <span>50 guests per event</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600 flex-shrink-0" />
                        <span>Standard 2D floor plan designer</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-600 flex-shrink-0" />
                        <span>Basic RSVP tracking</span>
                      </li>
                    </ul>

                    {user?.plan !== 'pro' ? (
                      <div className="py-2 px-3 text-center rounded-xl bg-slate-50 text-slate-500 font-semibold text-xs border border-slate-200">
                        Current Active Plan
                      </div>
                    ) : (
                      <div className="py-2 px-3 text-center rounded-xl text-slate-400 font-medium text-xs">
                        Included
                      </div>
                    )}
                  </div>

                  {/* Pro Tier */}
                  <div className={`bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border relative overflow-hidden transition-all ${user?.plan === 'pro' ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20' : 'border-[#7A1F1F]/30 shadow-md ring-1 ring-[#7A1F1F]/20'}`}>
                    <div className="absolute top-0 right-0 bg-[#7A1F1F] text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-bl-xl">
                      Recommended
                    </div>

                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-base sm:text-lg text-slate-900">Pro Organizer</h3>
                        <p className="text-[11px] sm:text-xs text-slate-500">For professional event planners & agencies</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl sm:text-2xl font-extrabold text-[#7A1F1F]">$29</span>
                        <span className="text-[10px] sm:text-xs text-slate-400 block">/ month</span>
                      </div>
                    </div>

                    <ul className="space-y-1.5 sm:space-y-2.5 text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#7A1F1F] flex-shrink-0" />
                        <span className="font-medium text-slate-800">Unlimited events & draft planners</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#7A1F1F] flex-shrink-0" />
                        <span className="font-medium text-slate-800">Unlimited guest RSVPs & ticket tiers</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#7A1F1F] flex-shrink-0" />
                        <span>Paystack & PayPal ticket checkout</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#7A1F1F] flex-shrink-0" />
                        <span>QR Pass generation & live check-in scanner</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#7A1F1F] flex-shrink-0" />
                        <span>Apple Wallet Passes download (.pkpass)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#7A1F1F] flex-shrink-0" />
                        <span>Priority support & analytics export</span>
                      </li>
                    </ul>

                    {user?.plan === 'pro' ? (
                      <div className="py-2 px-3 text-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                        ✓ Your Current Pro Plan
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {isAfricanCountry(user?.country) ? (
                          <button
                            onClick={handleUpgradePro}
                            disabled={isSubscribing}
                            className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
                          >
                            <CreditCard size={14} />
                            Subscribe with Paystack ($29 / mo)
                          </button>
                        ) : (
                          <button
                            onClick={handleUpgradePayPal}
                            disabled={isSubscribing}
                            className="w-full py-2.5 px-4 rounded-xl text-white bg-[#003087] hover:bg-[#002466] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.305-.59 3.82-3.13 5.768-6.947 5.768H9.68l-1.58 10.03c-.082.52-.53.901-1.054.901v.003l.03-.477z"/></svg>
                            Subscribe with PayPal ($29 / mo)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing & Payment Transactions */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                  <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CreditCard size={15} className="text-slate-400" />
                      <h2 className="text-xs sm:text-base font-semibold text-slate-800">Billing & Payment History</h2>
                    </div>
                    <span className="text-[10px] sm:text-xs text-slate-400">
                      {isAfricanCountry(user?.country) ? 'Paystack' : 'PayPal'}
                    </span>
                  </div>

                  <div className="p-3.5 sm:p-6">
                    {paymentHistory.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <CreditCard size={30} className="mx-auto mb-1.5 opacity-40" />
                        <p className="text-xs sm:text-sm font-medium">No payment transactions yet</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Your platform subscription and ticketing transactions will appear here.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="pb-2">Reference</th>
                              <th className="pb-2">Type</th>
                              <th className="pb-2">Amount</th>
                              <th className="pb-2">Date</th>
                              <th className="pb-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {paymentHistory.map((pmt: PaymentRecord) => (
                              <tr key={pmt._id || pmt.reference} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2.5 font-mono text-[11px] text-slate-600 font-semibold">{pmt.reference}</td>
                                <td className="py-2.5 text-slate-800 font-medium text-xs">
                                  {pmt.payment_type === 'platform_subscription'
                                    ? 'Pro Subscription'
                                    : pmt.payment_type === 'ticket_purchase'
                                    ? 'Ticket Purchase'
                                    : 'Payment'}
                                </td>
                                <td className="py-2.5 text-slate-900 font-bold text-xs">
                                  {formatCurrency(pmt.amount || 0, pmt.currency || localCurrency)}
                                </td>
                                <td className="py-2.5 text-[11px] text-slate-400">
                                  {formatLocalDate(pmt.paid_at || pmt.createdAt, {
                                    timezone,
                                    locale,
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </td>
                                <td className="py-2.5 text-right">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    pmt.status === 'success'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : pmt.status === 'pending'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {pmt.status === 'success' ? 'Paid' : pmt.status}
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
              </div>
            )}

            {activeTab === 'localization' && (
              /* Localization Section */
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <Globe size={15} className="text-slate-400" />
                  <h2 className="text-xs sm:text-base font-semibold text-slate-800">Localization</h2>
                  <span className="ml-auto text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">i18n</span>
                </div>
                <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                    {/* Language */}
                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700">
                        <Globe size={13} className="text-slate-400" /> Language
                      </label>
                      <select
                        value={lang}
                        onChange={(e) => setLang(e.target.value)}
                        className="w-full h-9 sm:h-10 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      >
                        <option value="en">🇬🇧 English</option>
                        <option value="fr">🇫🇷 Français</option>
                        <option value="ar">🇸🇦 العربية (RTL)</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="de">🇩🇪 Deutsch</option>
                        <option value="pt">🇧🇷 Português</option>
                        <option value="zh">🇨🇳 中文</option>
                      </select>
                      {lang === 'ar' && (
                        <p className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">RTL layout applied.</p>
                      )}
                    </div>

                    {/* Currency */}
                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700">
                        <DollarSign size={13} className="text-slate-400" /> Currency
                      </label>
                      <select
                        value={curr}
                        onChange={(e) => setCurr(e.target.value)}
                        className="w-full h-9 sm:h-10 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      >
                        <option value="USD">USD — US Dollar ($)</option>
                        <option value="EUR">EUR — Euro (€)</option>
                        <option value="GBP">GBP — Pound Sterling (£)</option>
                        <option value="NGN">NGN — Nigerian Naira (₦)</option>
                        <option value="CAD">CAD — Canadian Dollar ($)</option>
                        <option value="AUD">AUD — Australian Dollar ($)</option>
                      </select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-1">
                      <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700">
                        <Clock size={13} className="text-slate-400" /> Timezone
                      </label>
                      <select
                        value={tz}
                        onChange={(e) => setTz(e.target.value)}
                        className="w-full h-9 sm:h-10 bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl px-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">America/New_York (ET)</option>
                        <option value="America/Chicago">America/Chicago (CT)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PT)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Europe/Berlin">Europe/Berlin (CET)</option>
                        <option value="Europe/Paris">Europe/Paris (CET)</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                        <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                        <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                        <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                      </select>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Live Preview</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 mb-0.5">Date</p>
                        <p className="font-medium text-slate-700">
                          {new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: tz }).format(new Date())}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 mb-0.5">Currency</p>
                        <p className="font-medium text-slate-700">
                          {new Intl.NumberFormat(lang, { style: 'currency', currency: curr }).format(2499.99)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 mb-0.5">Number</p>
                        <p className="font-medium text-slate-700">
                          {new Intl.NumberFormat(lang).format(1234567.89)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={handleSaveLocalization}
                      disabled={isLoading}
                      className="flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #7A1F1F, #9c3030)' }}
                    >
                      {saved ? <><CheckCircle size={13} /> Saved!</> : isLoading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              /* Notifications Placeholder */
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-100 overflow-hidden opacity-75">
                <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <Bell size={15} className="text-slate-400" />
                  <h2 className="text-xs sm:text-base font-semibold text-slate-800">Notifications</h2>
                </div>
                <div className="p-4 sm:p-6 text-center text-slate-500 text-xs sm:text-sm">Notification settings coming soon.</div>
              </div>
            )}

            {activeTab === 'security' && (
              /* Security */
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <Shield size={15} className="text-slate-400" />
                  <h2 className="text-xs sm:text-base font-semibold text-slate-800">Security</h2>
                </div>
                <div className="p-3.5 sm:p-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-slate-700 mb-3">Change password</h3>

                  {passwordError && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm">{passwordError}</div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Current Password</label>
                      <div className="relative max-w-sm">
                        <input
                          type={showCurrent ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 pr-9 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        />
                        <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showNew ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters"
                          className="w-full px-3 py-2 pr-9 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                        />
                        <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                          {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-slate-700 text-xs sm:text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 mt-3 border-t border-slate-100">
                    <button
                      onClick={handleChangePassword}
                      disabled={!currentPassword || !newPassword || !confirmNewPassword || passwordMutation.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #7A1F1F, #9c3030)' }}
                    >
                      {passwordSaved ? <><CheckCircle size={13} /> Password changed!</> : passwordMutation.isPending ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
