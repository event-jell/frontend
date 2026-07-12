import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePreferences } from '../contexts/PreferencesContext';
import { X, Globe, DollarSign, Clock } from 'lucide-react';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const { t } = useTranslation();
  const { preferences, updatePreferences, isLoading } = usePreferences();
  
  const [lang, setLang] = useState(preferences.language);
  const [curr, setCurr] = useState(preferences.currency);
  const [tz, setTz] = useState(preferences.timezone);

  if (!isOpen) return null;

  const handleSave = async () => {
    await updatePreferences({ language: lang, currency: curr, timezone: tz });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-800">{t('common.settings', 'Settings')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Language */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Globe size={16} />
              {t('common.language', 'Language')}
            </label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="ar">العربية</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <DollarSign size={16} />
              {t('common.currency', 'Currency')}
            </label>
            <select
              value={curr}
              onChange={(e) => setCurr(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="NGN">NGN (₦)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Clock size={16} />
              {t('common.timezone', 'Timezone')}
            </label>
            <select
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Africa/Lagos">Africa/Lagos</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isLoading ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  );
}
