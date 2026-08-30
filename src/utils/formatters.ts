import { format, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  country: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', country: 'United States' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬', country: 'Nigeria' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦', country: 'Canada' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', country: 'Eurozone' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭', country: 'Ghana' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪', country: 'Kenya' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦', country: 'South Africa' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', country: 'Australia' },
];

export const getCurrencyForCountry = (countryOrCode?: string): string => {
  if (!countryOrCode) {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('Lagos') || tz.includes('Nigeria')) return 'NGN';
      if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal') || tz.includes('Edmonton') || tz.includes('Winnipeg') || tz.includes('Halifax')) return 'CAD';
      if (tz.includes('London')) return 'GBP';
      if (tz.includes('Accra')) return 'GHS';
      if (tz.includes('Nairobi')) return 'KES';
      if (tz.includes('Johannesburg')) return 'ZAR';
      if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane') || tz.includes('Perth')) return 'AUD';
      if (tz.startsWith('Europe/')) return 'EUR';
    } catch {}
    return 'USD';
  }

  const normalized = countryOrCode.trim().toLowerCase();
  if (['ng', 'nga', 'nigeria', '234', '+234', 'lagos', 'abuja'].includes(normalized)) return 'NGN';
  if (['ca', 'can', 'canada', '1', '+1'].includes(normalized)) return 'CAD';
  if (['gb', 'gbr', 'uk', 'united kingdom', 'england', 'scotland', 'wales', 'britain', 'great britain', '44', '+44'].includes(normalized)) return 'GBP';
  if (['us', 'usa', 'united states', 'united states of america', 'america'].includes(normalized)) return 'USD';
  if (['gh', 'gha', 'ghana', '233', '+233'].includes(normalized)) return 'GHS';
  if (['ke', 'ken', 'kenya', '254', '+254'].includes(normalized)) return 'KES';
  if (['za', 'zaf', 'south africa', '27', '+27'].includes(normalized)) return 'ZAR';
  if (['au', 'aus', 'australia', '61', '+61'].includes(normalized)) return 'AUD';
  if (['de', 'fr', 'es', 'it', 'nl', 'ie', 'pt', 'be', 'at', 'fi', 'gr', 'germany', 'france', 'spain', 'italy', 'netherlands', 'ireland', 'portugal', 'belgium', 'austria', 'finland', 'greece', 'europe'].includes(normalized)) return 'EUR';

  const match = SUPPORTED_CURRENCIES.find(c => c.code.toLowerCase() === normalized);
  if (match) return match.code;

  return 'USD';
};

export const getCurrencySymbol = (currencyCode?: string): string => {
  if (!currencyCode) return '$';
  const found = SUPPORTED_CURRENCIES.find(c => c.code.toUpperCase() === currencyCode.toUpperCase());
  if (found) return found.symbol;
  try {
    const formatted = new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode }).format(0);
    return formatted.replace(/[\d.,\s]/g, '') || currencyCode;
  } catch {
    return currencyCode;
  }
};

// Use Intl.NumberFormat for currency formatting
export const formatCurrency = (amount: number = 0, currencyCode: string = 'USD', locale: string = 'en') => {
  try {
    const code = (currencyCode || 'USD').toUpperCase();
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString()}`;
  }
};

// Format large numbers (e.g., 50000 -> 50K or 50,000)
export const formatNumber = (num: number, locale: string = 'en', notation: 'standard' | 'compact' = 'standard') => {
  try {
    return new Intl.NumberFormat(locale, { notation }).format(num);
  } catch (error) {
    return num.toString();
  }
};

// Localized Date Formatting using date-fns-tz
export const formatDate = (
  dateString: string | Date,
  formatStr: string = 'PP',
  timezone: string = 'UTC',
  localeObj?: any // Date-fns locale object (e.g., from date-fns/locale)
) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Convert to timezone and format
    if (localeObj) {
      return formatInTimeZone(date, timezone, formatStr, { locale: localeObj });
    }
    return formatInTimeZone(date, timezone, formatStr);
  } catch (error) {
    console.error('Error formatting date', error);
    return dateString.toString();
  }
};

export const formatRelativeTime = (dateString: string | Date, localeObj?: any) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return formatDistanceToNow(date, { addSuffix: true, locale: localeObj });
  } catch (error) {
    return '';
  }
};

// Map language codes to BCP 47 locale tags
export const getLocaleForLanguage = (lang?: string): string => {
  if (!lang) return 'en-US';
  const map: Record<string, string> = {
    en: 'en-US', fr: 'fr-FR', es: 'es-ES', de: 'de-DE',
    pt: 'pt-BR', ar: 'ar-SA', zh: 'zh-CN', ja: 'ja-JP',
    ko: 'ko-KR', it: 'it-IT', nl: 'nl-NL', ru: 'ru-RU',
    hi: 'hi-IN', sw: 'sw-KE', yo: 'yo-NG', ha: 'ha-NG',
    ig: 'ig-NG',
  };
  return map[lang.toLowerCase()] || lang;
};

// Get user's browser timezone as fallback
export const getBrowserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

// Format date using Intl.DateTimeFormat with timezone support
export const formatLocalDate = (
  dateInput: string | Date,
  options?: {
    timezone?: string;
    locale?: string;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    month?: 'long' | 'short' | 'narrow' | 'numeric' | '2-digit';
    day?: 'numeric' | '2-digit';
    year?: 'numeric' | '2-digit';
    weekday?: 'long' | 'short' | 'narrow';
  },
): string => {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const tz = options?.timezone || getBrowserTimezone();
    const locale = options?.locale || 'en-US';

    // If dateStyle is provided, use it (can't mix with individual fields)
    if (options?.dateStyle) {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: options.dateStyle,
        timeZone: tz,
      }).format(date);
    }

    return new Intl.DateTimeFormat(locale, {
      month: options?.month || 'short',
      day: options?.day || 'numeric',
      year: options?.year,
      weekday: options?.weekday,
      timeZone: tz,
    }).format(date);
  } catch {
    return new Date(dateInput).toLocaleDateString();
  }
};

// Format time using Intl.DateTimeFormat with timezone support
export const formatLocalTime = (
  dateInput: string | Date,
  options?: {
    timezone?: string;
    locale?: string;
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    hour12?: boolean;
  },
): string => {
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    const tz = options?.timezone || getBrowserTimezone();
    const locale = options?.locale || 'en-US';

    return new Intl.DateTimeFormat(locale, {
      hour: options?.hour || '2-digit',
      minute: options?.minute || '2-digit',
      second: options?.second,
      hour12: options?.hour12,
      timeZone: tz,
    }).format(date);
  } catch {
    return new Date(dateInput).toLocaleTimeString();
  }
};
