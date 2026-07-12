import { format, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Use Intl.NumberFormat for currency formatting
export const formatCurrency = (amount: number, currencyCode: string, locale: string = 'en') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency', error);
    return `${currencyCode} ${amount}`;
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
