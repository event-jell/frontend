import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import i18n from '../i18n';
import axios from 'axios';

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
      // Assuming user object from AuthContext might contain these, or we fetch them
      // In this app, we'll try to fetch from /preferences if possible
      const fetchPrefs = async () => {
        try {
          // If the backend has a GET /users/me or GET /preferences/me we'd use it.
          // Since we might not have a GET endpoint explicitly for just preferences,
          // we could rely on the user object returned from login/auth check
          // For now, if user object has them:
          if ((user as any).preferredLanguage) {
            setPreferences({
              language: (user as any).preferredLanguage || 'en',
              currency: (user as any).preferredCurrency || 'USD',
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
        const token = localStorage.getItem('ej_token');
        await axios.patch('/api/preferences', newPrefs, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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
