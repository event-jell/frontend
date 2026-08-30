import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import i18n from '../i18n';
import { http } from '../lib/api';
import { getCurrencyForCountry } from '../utils/formatters';

interface Preferences {
  language: string;
  currency: string;
  timezone: string;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreferences: (newPrefs: Partial<Preferences>) => Promise<void>;
  isLoading: boolean;
}

const defaultPreferences: Preferences = {
  language: 'en',
  currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const saved = localStorage.getItem('preferences');
    return saved ? JSON.parse(saved) : defaultPreferences;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync preferences from user profile when auth state changes
  useEffect(() => {
    if (user) {
      const userCountryCurrency = getCurrencyForCountry(user.country);
      setPreferences(prev => ({
        ...prev,
        currency: (user as any).preferredCurrency || prev.currency || userCountryCurrency,
      }));

      const fetchPrefs = async () => {
        try {
          if ((user as any).preferredLanguage) {
            setPreferences({
              language: (user as any).preferredLanguage || 'en',
              currency: (user as any).preferredCurrency || userCountryCurrency,
              timezone: (user as any).preferredTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            });
          }
        } catch (e) {
          console.error('Failed to fetch user preferences', e);
        }
      };
      fetchPrefs();
    }
  }, [user]);

  // Apply language to i18n when it changes
  useEffect(() => {
    if (i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language);
    }
    localStorage.setItem('preferences', JSON.stringify(preferences));
  }, [preferences.language, preferences]);

  const updatePreferences = async (newPrefs: Partial<Preferences>) => {
    setIsLoading(true);
    try {
      const updated = { ...preferences, ...newPrefs };
      setPreferences(updated);

      // If user is logged in, sync with backend
      if (user) {
        await http.patch('/preferences', newPrefs);
      }
    } catch (e) {
      console.error('Failed to update preferences', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreferences, isLoading }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};
