import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { currencyAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CurrencyContext = createContext(null);

// Currency symbols for formatting
const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  CAD: 'CA$',
  AUD: 'A$',
  NGN: '\u20A6',
  GHS: 'GH\u20B5',
  KES: 'KSh',
  ZAR: 'R',
  INR: '\u20B9',
  JPY: '\u00A5',
  CNY: '\u00A5',
  BRL: 'R$',
  MXN: 'MX$',
  AED: 'AED'
};

export function CurrencyProvider({ children }) {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState('USD');
  const [rates, setRates] = useState(null);
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load supported currencies and rates on mount
  useEffect(() => {
    const loadCurrencyData = async () => {
      try {
        setLoading(true);
        const [currenciesRes, ratesRes] = await Promise.all([
          currencyAPI.getSupportedCurrencies(),
          currencyAPI.getExchangeRates()
        ]);

        if (currenciesRes.data.success) {
          setSupportedCurrencies(currenciesRes.data.data);
        }

        if (ratesRes.data.success) {
          setRates(ratesRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load currency data:', err);
        setError('Failed to load currency data');
      } finally {
        setLoading(false);
      }
    };

    loadCurrencyData();
  }, []);

  // Set currency from user preference or AsyncStorage
  useEffect(() => {
    const loadCurrencyPreference = async () => {
      if (user?.preferences?.currency) {
        setCurrencyState(user.preferences.currency);
      } else {
        const saved = await AsyncStorage.getItem('preferredCurrency');
        if (saved) {
          setCurrencyState(saved);
        }
      }
    };

    loadCurrencyPreference();
  }, [user]);

  // Update currency preference
  const setCurrency = useCallback(async (newCurrency) => {
    setCurrencyState(newCurrency);
    await AsyncStorage.setItem('preferredCurrency', newCurrency);
  }, []);

  // Convert amount from USD (base currency) to user's preferred currency
  const convert = useCallback((amount, fromCurrency = 'USD') => {
    if (!rates || !rates.rates) return amount;
    if (fromCurrency === currency) return amount;

    const fromRate = fromCurrency === 'USD' ? 1 : rates.rates[fromCurrency];
    const toRate = currency === 'USD' ? 1 : rates.rates[currency];

    if (!fromRate || !toRate) return amount;

    return Math.round((amount / fromRate) * toRate * 100) / 100;
  }, [rates, currency]);

  // Format currency for display
  const formatCurrency = useCallback((amount, currencyCode = null) => {
    const displayCurrency = currencyCode || currency;
    const symbol = CURRENCY_SYMBOLS[displayCurrency] || displayCurrency;

    // Handle different decimal conventions
    const decimals = displayCurrency === 'JPY' ? 0 : 2;

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(amount);
    } catch {
      return `${symbol}${amount.toFixed(decimals)}`;
    }
  }, [currency]);

  // Convert and format in one step (most common use case)
  const convertAndFormat = useCallback((amount, fromCurrency = 'USD') => {
    const converted = convert(amount, fromCurrency);
    return formatCurrency(converted);
  }, [convert, formatCurrency]);

  // Get symbol for current currency
  const getSymbol = useCallback((currencyCode = null) => {
    return CURRENCY_SYMBOLS[currencyCode || currency] || (currencyCode || currency);
  }, [currency]);

  const value = {
    currency,
    setCurrency,
    rates,
    supportedCurrencies,
    loading,
    error,
    convert,
    formatCurrency,
    convertAndFormat,
    getSymbol,
    CURRENCY_SYMBOLS
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
