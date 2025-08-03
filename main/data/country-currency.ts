export interface Currency {
  code: string;
  name: string;
  symbol: string;
  label: string;
  rate: number;
}

export interface Country {
  code: string;
  name: string;
  label: string;
}

export const currencies: Currency[] = [
  { code: "USD", name: "US Dollar", symbol: "$", label: "$ USD - US Dollar", rate: 1.0 },
  { code: "EUR", name: "Euro", symbol: "€", label: "€ EUR - Euro", rate: 0.92 },
  { code: "GBP", name: "British Pound", symbol: "£", label: "£ GBP - British Pound", rate: 0.79 },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", label: "CA$ CAD - Canadian Dollar", rate: 1.37 },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", label: "A$ AUD - Australian Dollar", rate: 1.51 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", label: "¥ JPY - Japanese Yen", rate: 157.43 },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", label: "CHF CHF - Swiss Franc", rate: 0.9 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", label: "¥ CNY - Chinese Yuan", rate: 7.25 },
  { code: "INR", name: "Indian Rupee", symbol: "₹", label: "₹ INR - Indian Rupee", rate: 83.54 },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", label: "R$ BRL - Brazilian Real", rate: 5.25 },
  { code: "ZAR", name: "South African Rand", symbol: "R", label: "R ZAR - South African Rand", rate: 18.78 },
  { code: "MXN", name: "Mexican Peso", symbol: "$", label: "$ MXN - Mexican Peso", rate: 17.02 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", label: "S$ SGD - Singapore Dollar", rate: 1.35 },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", label: "NZ$ NZD - New Zealand Dollar", rate: 1.63 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", label: "kr SEK - Swedish Krona", rate: 10.45 },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", label: "kr NOK - Norwegian Krone", rate: 10.59 },
  { code: "DKK", name: "Danish Krone", symbol: "kr", label: "kr DKK - Danish Krone", rate: 6.88 },
  { code: "PLN", name: "Polish Złoty", symbol: "zł", label: "zł PLN - Polish Złoty", rate: 3.96 },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", label: "Kč CZK - Czech Koruna", rate: 22.77 },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", label: "Ft HUF - Hungarian Forint", rate: 361.32 },
  { code: "RON", name: "Romanian Leu", symbol: "lei", label: "lei RON - Romanian Leu", rate: 4.58 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", label: "₦ NGN - Nigerian Naira", rate: 1478.57 },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", label: "E£ EGP - Egyptian Pound", rate: 47.65 },
  { code: "ARS", name: "Argentine Peso", symbol: "$", label: "$ ARS - Argentine Peso", rate: 897.5 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", label: "₩ KRW - South Korean Won", rate: 1377.53 },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", label: "GH₵ GHS - Ghanaian Cedi", rate: 14.95 },
];

export const countries: Country[] = [
  { code: "US", name: "United States", label: "United States" },
  { code: "CA", name: "Canada", label: "Canada" },
  { code: "GB", name: "United Kingdom", label: "United Kingdom" },
  { code: "DE", name: "Germany", label: "Germany" },
  { code: "FR", name: "France", label: "France" },
  { code: "IT", name: "Italy", label: "Italy" },
  { code: "ES", name: "Spain", label: "Spain" },
  { code: "NL", name: "Netherlands", label: "Netherlands" },
  { code: "BE", name: "Belgium", label: "Belgium" },
  { code: "CH", name: "Switzerland", label: "Switzerland" },
  { code: "AT", name: "Austria", label: "Austria" },
  { code: "SE", name: "Sweden", label: "Sweden" },
  { code: "NO", name: "Norway", label: "Norway" },
  { code: "DK", name: "Denmark", label: "Denmark" },
  { code: "FI", name: "Finland", label: "Finland" },
  { code: "PL", name: "Poland", label: "Poland" },
  { code: "CZ", name: "Czech Republic", label: "Czech Republic" },
  { code: "HU", name: "Hungary", label: "Hungary" },
  { code: "RO", name: "Romania", label: "Romania" },
  { code: "AU", name: "Australia", label: "Australia" },
  { code: "NZ", name: "New Zealand", label: "New Zealand" },
  { code: "JP", name: "Japan", label: "Japan" },
  { code: "KR", name: "South Korea", label: "South Korea" },
  { code: "CN", name: "China", label: "China" },
  { code: "IN", name: "India", label: "India" },
  { code: "BR", name: "Brazil", label: "Brazil" },
  { code: "MX", name: "Mexico", label: "Mexico" },
  { code: "AR", name: "Argentina", label: "Argentina" },
  { code: "CL", name: "Chile", label: "Chile" },
  { code: "CO", name: "Colombia", label: "Colombia" },
  { code: "ZA", name: "South Africa", label: "South Africa" },
  { code: "NG", name: "Nigeria", label: "Nigeria" },
  { code: "EG", name: "Egypt", label: "Egypt" },
  { code: "GH", name: "Ghana", label: "Ghana" },
];

// Country to Currency mapping
export const countryToCurrency: Record<string, string> = {
  "US": "USD",
  "CA": "CAD",
  "GB": "GBP",
  "DE": "EUR",
  "FR": "EUR",
  "IT": "EUR",
  "ES": "EUR",
  "NL": "EUR",
  "BE": "EUR",
  "CH": "CHF",
  "AT": "EUR",
  "SE": "SEK",
  "NO": "NOK",
  "DK": "DKK",
  "FI": "EUR",
  "PL": "PLN",
  "CZ": "CZK",
  "HU": "HUF",
  "RO": "RON",
  "AU": "AUD",
  "NZ": "NZD",
  "JP": "JPY",
  "KR": "KRW",
  "CN": "CNY",
  "IN": "INR",
  "BR": "BRL",
  "MX": "MXN",
  "AR": "ARS",
  "CL": "USD",
  "CO": "USD",
  "ZA": "ZAR",
  "NG": "NGN",
  "EG": "EGP",
  "GH": "GHS",
};

// Helper functions
export const getCurrencyByCountry = (countryCode: string): Currency | undefined => {
  const currencyCode = countryToCurrency[countryCode];
  return currencies.find(currency => currency.code === currencyCode);
};

export const getCountryByCode = (countryCode: string): Country | undefined => {
  return countries.find(country => country.code === countryCode);
};

export const getCurrencyByCode = (currencyCode: string): Currency | undefined => {
  return currencies.find(currency => currency.code === currencyCode);
};

// Function to get user's location based on IP
export const getUserLocationAndCurrency = async (): Promise<{ country: Country | null, currency: Currency | null }> => {
  try {
    // Using ipapi.co for IP geolocation
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const countryCode = data.country_code;
    const country = getCountryByCode(countryCode) || null;
    const currency = getCurrencyByCountry(countryCode) || null;
    
    return { country, currency };
  } catch (error) {
    console.error('Error getting user location:', error);
    // Default to US and USD if geolocation fails
    return {
      country: getCountryByCode('US') || null,
      currency: getCurrencyByCode('USD') || null
    };
  }
};