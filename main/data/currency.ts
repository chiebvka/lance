export interface Currency {
  code: string
  name: string
  symbol: string
  label: string
  rate: number
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
  { code: "RUB", name: "Russian Ruble", symbol: "₽", label: "₽ RUB - Russian Ruble", rate: 90.12 },
  { code: "ZAR", name: "South African Rand", symbol: "R", label: "R ZAR - South African Rand", rate: 18.78 },
  { code: "MXN", name: "Mexican Peso", symbol: "$", label: "$ MXN - Mexican Peso", rate: 17.02 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", label: "S$ SGD - Singapore Dollar", rate: 1.35 },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", label: "HK$ HKD - Hong Kong Dollar", rate: 7.81 },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", label: "NZ$ NZD - New Zealand Dollar", rate: 1.63 },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", label: "kr SEK - Swedish Krona", rate: 10.45 },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", label: "kr NOK - Norwegian Krone", rate: 10.59 },
  { code: "DKK", name: "Danish Krone", symbol: "kr", label: "kr DKK - Danish Krone", rate: 6.88 },
  { code: "PLN", name: "Polish Złoty", symbol: "zł", label: "zł PLN - Polish Złoty", rate: 3.96 },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", label: "₺ TRY - Turkish Lira", rate: 32.27 },
  { code: "THB", name: "Thai Baht", symbol: "฿", label: "฿ THB - Thai Baht", rate: 36.65 },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", label: "Rp IDR - Indonesian Rupiah", rate: 16255.0 },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", label: "Ft HUF - Hungarian Forint", rate: 361.32 },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", label: "Kč CZK - Czech Koruna", rate: 22.77 },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪", label: "₪ ILS - Israeli New Shekel", rate: 3.73 },
  { code: "CLP", name: "Chilean Peso", symbol: "CLP$", label: "CLP$ CLP - Chilean Peso", rate: 923.45 },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", label: "₱ PHP - Philippine Peso", rate: 58.75 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", label: "د.إ AED - UAE Dirham", rate: 3.67 },
  { code: "COP", name: "Colombian Peso", symbol: "COL$", label: "COL$ COP - Colombian Peso", rate: 3915.0 },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", label: "﷼ SAR - Saudi Riyal", rate: 3.75 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", label: "RM MYR - Malaysian Ringgit", rate: 4.71 },
  { code: "RON", name: "Romanian Leu", symbol: "lei", label: "lei RON - Romanian Leu", rate: 4.58 },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", label: "₴ UAH - Ukrainian Hryvnia", rate: 40.52 },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", label: "₫ VND - Vietnamese Dong", rate: 25450.0 },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦", label: "₦ NGN - Nigerian Naira", rate: 1478.57 },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", label: "E£ EGP - Egyptian Pound", rate: 47.65 },
  { code: "ARS", name: "Argentine Peso", symbol: "$", label: "$ ARS - Argentine Peso", rate: 897.5 },
  { code: "KRW", name: "South Korean Won", symbol: "₩", label: "₩ KRW - South Korean Won", rate: 1377.53 },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "GH₵", label: "GH₵ GHS - Ghanaian Cedi", rate: 14.95 },
]
