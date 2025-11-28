import currencyService, { SUPPORTED_CURRENCIES } from '../services/currencyService.js';

// @desc    Get supported currencies
// @route   GET /api/currency/supported
// @access  Public
export const getSupportedCurrencies = async (req, res) => {
  try {
    const currencies = currencyService.getSupportedCurrencies();
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    console.error('Get currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get currencies'
    });
  }
};

// @desc    Get current exchange rates
// @route   GET /api/currency/rates
// @access  Public
export const getExchangeRates = async (req, res) => {
  try {
    const rates = await currencyService.getRates();

    if (!rates) {
      return res.status(503).json({
        success: false,
        message: 'Exchange rates not available'
      });
    }

    res.json({
      success: true,
      data: {
        baseCurrency: rates.baseCurrency,
        rates: Object.fromEntries(rates.rates),
        lastUpdated: rates.lastUpdated
      }
    });
  } catch (error) {
    console.error('Get rates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exchange rates'
    });
  }
};

// @desc    Convert currency
// @route   POST /api/currency/convert
// @access  Public
export const convertCurrency = async (req, res) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Amount, from currency, and to currency are required'
      });
    }

    if (!SUPPORTED_CURRENCIES[from] || !SUPPORTED_CURRENCIES[to]) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported currency'
      });
    }

    const result = await currencyService.convert(amount, from, to);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Convert currency error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to convert currency'
    });
  }
};

// @desc    Format currency for display
// @route   GET /api/currency/format
// @access  Public
export const formatCurrency = async (req, res) => {
  try {
    const { amount, currency } = req.query;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required'
      });
    }

    const formatted = currencyService.formatCurrency(parseFloat(amount), currency);

    res.json({
      success: true,
      data: { formatted }
    });
  } catch (error) {
    console.error('Format currency error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to format currency'
    });
  }
};

// @desc    Batch convert multiple amounts
// @route   POST /api/currency/convert-batch
// @access  Public
export const convertBatch = async (req, res) => {
  try {
    const { amounts, from, to } = req.body;

    if (!amounts || !Array.isArray(amounts) || !from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Amounts array, from currency, and to currency are required'
      });
    }

    const results = await Promise.all(
      amounts.map(amount => currencyService.convert(amount, from, to))
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Batch convert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert currencies'
    });
  }
};
