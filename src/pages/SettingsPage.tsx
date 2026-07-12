import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { User, Shield, Bell, Globe, DollarSign, Clock, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { preferences, updatePreferences, isLoading } = usePreferences();

  const [lang, setLang] = useState(preferences.language);
  const [curr, setCurr] = useState(preferences.currency);
  const [tz, setTz] = useState(preferences.timezone);
  const [saved, setSaved] = useState(false);

  const handleSaveLocalization = async () => {
    await updatePreferences({ language: lang, currency: curr, timezone: tz });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-4 py-4 sm:px-8 sm:py-5 flex-shrink-0">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Profile Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <User size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Profile Information</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-6 mb-8">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #7A1F1F 0%, #9c3030 100%)' }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                  <p className="text-sm text-slate-500">Event Planner</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                  <input type="text" disabled value={user?.firstName || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                  <input type="text" disabled value={user?.lastName || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <input type="email" disabled value={user?.email || ''} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Localization Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Globe size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Localization</h2>
              <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">i18n</span>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Language */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Globe size={14} className="text-slate-400" /> Language
                  </label>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
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
                    <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">RTL layout will be applied automatically.</p>
                  )}
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <DollarSign size={14} className="text-slate-400" /> Currency
                  </label>
                  <select
                    value={curr}
                    onChange={(e) => setCurr(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
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
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <Clock size={14} className="text-slate-400" /> Timezone
                  </label>
                  <select
                    value={tz}
                    onChange={(e) => setTz(e.target.value)}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
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
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Live Preview</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Date</p>
                    <p className="font-medium text-slate-700">
                      {new Intl.DateTimeFormat(lang, { dateStyle: 'long', timeZone: tz }).format(new Date())}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Currency</p>
                    <p className="font-medium text-slate-700">
                      {new Intl.NumberFormat(lang, { style: 'currency', currency: curr }).format(2499.99)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Number</p>
                    <p className="font-medium text-slate-700">
                      {new Intl.NumberFormat(lang).format(1234567.89)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveLocalization}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #7A1F1F, #9c3030)' }}
                >
                  {saved ? <><CheckCircle size={14} /> Saved!</> : isLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden opacity-75">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Bell size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Notifications</h2>
            </div>
            <div className="p-6 text-center text-slate-500 text-sm">Notification settings coming soon.</div>
          </div>

          {/* Security Placeholder */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden opacity-75">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Shield size={18} className="text-slate-400" />
              <h2 className="font-semibold text-slate-800">Security</h2>
            </div>
            <div className="p-6 text-center text-slate-500 text-sm">Security settings coming soon.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
