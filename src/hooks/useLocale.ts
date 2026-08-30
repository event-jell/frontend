import { useAuth } from '../contexts/AuthContext';
import { getCurrencyForCountry, getLocaleForLanguage, getBrowserTimezone } from '../utils/formatters';

/**
 * Convenience hook that derives locale settings from the user's profile.
 * Returns the user's local currency, timezone, and BCP 47 locale string.
 * Falls back to browser defaults when user data is unavailable.
 */
export function useLocale() {
  const { user } = useAuth();

  const userCountry = user?.country || '';
  const localCurrency = getCurrencyForCountry(userCountry);
  const timezone = getBrowserTimezone();
  const locale = getLocaleForLanguage('en');

  return {
    localCurrency,
    timezone,
    locale,
    userCountry,
  };
}
