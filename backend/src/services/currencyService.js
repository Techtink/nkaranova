import axios from 'axios';
import ExchangeRate from '../models/ExchangeRate.js';

// Supported currencies with their symbols
export const SUPPORTED_CURRENCIES = {
  USD: { name: 'US Dollar', symbol: '$', locale: 'en-US' },
  EUR: { name: 'Euro', symbol: '\u20AC', locale: 'de-DE' },
  GBP: { name: 'British Pound', symbol: '\u00A3', locale: 'en-GB' },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  NGN: { name: 'Nigerian Naira', symbol: '\u20A6', locale: 'en-NG' },
  GHS: { name: 'Ghanaian Cedi', symbol: 'GH\u20B5', locale: 'en-GH' },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE' },
  ZAR: { name: 'South African Rand', symbol: 'R', locale: 'en-ZA' },
  INR: { name: 'Indian Rupee', symbol: '\u20B9', locale: 'en-IN' },
  JPY: { name: 'Japanese Yen', symbol: '\u00A5', locale: 'ja-JP' },
  CNY: { name: 'Chinese Yuan', symbol: '\u00A5', locale: 'zh-CN' },
  BRL: { name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR' },
  MXN: { name: 'Mexican Peso', symbol: 'MX$', locale: 'es-MX' },
  AED: { name: 'UAE Dirham', symbol: 'AED', locale: 'ar-AE' }
};

class CurrencyService {
  constructor() {
    this.cacheTimeout = 6 * 60 * 60 * 1000; // 6 hours in ms
    this.lastFetch = null;
  }

  /**
   * Fetch exchange rates from API
   * Using exchangerate-api.com free tier (1500 requests/month)
   */
  async fetchRates() {
    try {
      // Check if rates were recently updated (within cache timeout)
      const existingRates = await ExchangeRate.findOne({ baseCurrency: 'USD' })
        .sort({ lastUpdated: -1 });

      if (existingRates) {
        const timeSinceUpdate = Date.now() - existingRates.lastUpdated.getTime();
        if (timeSinceUpdate < this.cacheTimeout) {
          return existingRates;
        }
      }

      // Fetch new rates
      const apiKey = process.env.EXCHANGE_RATE_API_KEY;
      let response;

      if (apiKey) {
        // Use paid API with key
        response = await axios.get(
          `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
        );
      } else {
        // Use free open API (less reliable but no key needed)
        response = await axios.get(
          'https://open.er-api.com/v6/latest/USD'
        );
      }

      if (response.data && response.data.rates) {
        // Filter only supported currencies
        const filteredRates = {};
        Object.keys(SUPPORTED_CURRENCIES).forEach(currency => {
          if (response.data.rates[currency]) {
            filteredRates[currency] = response.data.rates[currency];
          }
        });

        // Save to database
        const exchangeRate = new ExchangeRate({
          baseCurrency: 'USD',
          rates: filteredRates,
          lastUpdated: new Date()
        });
        await exchangeRate.save();

        this.lastFetch = Date.now();
        return exchangeRate;
      }

      return existingRates; // Return cached if API fails
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error.message);

      // Return cached rates if available
      const cachedRates = await ExchangeRate.findOne({ baseCurrency: 'USD' })
        .sort({ lastUpdated: -1 });

      return cachedRates;
    }
  }

  /**
   * Get current exchange rates
   */
  async getRates() {
    return await this.fetchRates();
  }

  /**
   * Convert amount from one currency to another
   */
  async convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) {
      return { amount, currency: toCurrency };
    }

    const rates = await this.fetchRates();
    if (!rates) {
      throw new Error('Exchange rates not available');
    }

    const fromRate = fromCurrency === 'USD' ? 1 : rates.rates.get(fromCurrency);
    const toRate = toCurrency === 'USD' ? 1 : rates.rates.get(toCurrency);

    if (!fromRate || !toRate) {
      throw new Error(`Unsupported currency: ${fromCurrency} or ${toCurrency}`);
    }

    const convertedAmount = (amount / fromRate) * toRate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      currency: toCurrency,
      rate: toRate / fromRate
    };
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount, currency) {
    const currencyInfo = SUPPORTED_CURRENCIES[currency];
    if (!currencyInfo) {
      return `${currency} ${amount.toFixed(2)}`;
    }

    try {
      return new Intl.NumberFormat(currencyInfo.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch {
      return `${currencyInfo.symbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * Get list of supported currencies
   */
  getSupportedCurrencies() {
    return Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => ({
      code,
      ...info
    }));
  }
}

// Export singleton instance
export default new CurrencyService();
