// Currency and Exchange Rate helper for multi-gateway routing (Paystack for Africa, PayPal for outside Africa)

export interface ExchangeRates {
  [currency: string]: number;
}

// Standard Paystack & international benchmark exchange rates (USD Base)
export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USD: 1.0,
  NGN: 1550.0, // Paystack benchmark rate
  GHS: 15.5,
  KES: 130.0,
  ZAR: 18.2,
  EGP: 48.5,
  RWF: 1380.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
};

export const AFRICAN_COUNTRY_CODES = new Set([
  'NG', 'GH', 'KE', 'ZA', 'EG', 'RW', 'UG', 'TZ', 'SN', 'CM', 'CI', 'DZ',
  'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CF', 'TD', 'KM', 'CD', 'CG', 'DJ',
  'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GN', 'GW', 'LS', 'LR', 'LY', 'MG',
  'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'ST', 'SC', 'SL', 'SO',
  'SS', 'SD', 'TG', 'TN', 'ZM', 'ZW'
]);

export const AFRICAN_COUNTRY_NAMES = new Set([
  'nigeria', 'ghana', 'kenya', 'south africa', 'egypt', 'rwanda', 'uganda',
  'tanzania', 'senegal', 'cameroon', 'ivory coast', 'cote d\'ivoire', 'ethiopia',
  'zambia', 'zimbabwe', 'algeria', 'angola', 'benin', 'botswana', 'burkina faso',
  'burundi', 'cabo verde', 'central african republic', 'chad', 'comoros',
  'congo (drc)', 'congo (republic)', 'djibouti', 'equatorial guinea', 'eritrea',
  'eswatini', 'gabon', 'gambia', 'guinea', 'guinea-bissau', 'lesotho', 'liberia',
  'libya', 'madagascar', 'malawi', 'mali', 'mauritania', 'mauritius', 'morocco',
  'mozambique', 'namibia', 'niger', 'sao tome and principe', 'seychelles',
  'sierra leone', 'somalia', 'south sudan', 'sudan', 'togo', 'tunisia'
]);

export function isAfricanCountry(countryNameOrCode?: string): boolean {
  if (!countryNameOrCode) return false;
  const clean = countryNameOrCode.trim().toLowerCase();
  const upper = countryNameOrCode.trim().toUpperCase();
  return AFRICAN_COUNTRY_CODES.has(upper) || AFRICAN_COUNTRY_NAMES.has(clean);
}

export function getCurrencyForCountry(countryNameOrCode?: string): string {
  if (!countryNameOrCode) return 'USD';
  const clean = countryNameOrCode.trim().toLowerCase();
  const code = countryNameOrCode.trim().toUpperCase();

  if (code === 'NG' || clean === 'nigeria') return 'NGN';
  if (code === 'GH' || clean === 'ghana') return 'GHS';
  if (code === 'KE' || clean === 'kenya') return 'KES';
  if (code === 'ZA' || clean === 'south africa') return 'ZAR';
  if (code === 'EG' || clean === 'egypt') return 'EGP';
  if (code === 'RW' || clean === 'rwanda') return 'RWF';
  if (code === 'GB' || clean === 'united kingdom') return 'GBP';
  if (code === 'CA' || clean === 'canada') return 'CAD';
  if (code === 'AU' || clean === 'australia') return 'AUD';
  if (['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'PT', 'FI', 'GR'].includes(code) ||
      ['france', 'germany', 'italy', 'spain', 'netherlands', 'belgium', 'austria', 'ireland', 'portugal'].includes(clean)) {
    return 'EUR';
  }
  if (code === 'US' || clean === 'united states') return 'USD';

  // Default to NGN for African countries that use NGN/Paystack, or USD for international
  return isAfricanCountry(countryNameOrCode) ? 'NGN' : 'USD';
}

export function convertPrice(
  amount: number,
  fromCurrency = 'USD',
  toCurrency = 'USD',
  rates: ExchangeRates = DEFAULT_EXCHANGE_RATES
): number {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) return amount;

  const fromRate = rates[fromCurrency.toUpperCase()] || 1.0;
  const toRate = rates[toCurrency.toUpperCase()] || 1.0;

  // Convert to USD base first, then to target currency
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;

  // For NGN, KES, RWF round to whole numbers; for others 2 decimals
  if (['NGN', 'KES', 'RWF', 'UGX', 'TZS'].includes(toCurrency.toUpperCase())) {
    return Math.round(converted);
  }
  return Math.round(converted * 100) / 100;
}

export function getPaymentMethodDetails({
  country,
  amount,
  eventCurrency = 'USD',
}: {
  country?: string;
  amount: number;
  eventCurrency?: string;
}) {
  const isAfrica = isAfricanCountry(country);
  const targetCurrency = getCurrencyForCountry(country);
  const convertedAmount = convertPrice(amount, eventCurrency, targetCurrency);
  const isDifferentCurrency = targetCurrency.toUpperCase() !== eventCurrency.toUpperCase();

  const exchangeRate = DEFAULT_EXCHANGE_RATES[targetCurrency.toUpperCase()] || 1.0;
  const rateDescription = isDifferentCurrency
    ? `1 ${eventCurrency.toUpperCase()} ≈ ${exchangeRate.toLocaleString()} ${targetCurrency.toUpperCase()}`
    : null;

  return {
    gateway: (isAfrica ? 'paystack' : 'paypal') as 'paystack' | 'paypal',
    isAfrica,
    targetCurrency,
    convertedAmount,
    isDifferentCurrency,
    rateDescription,
  };
}
