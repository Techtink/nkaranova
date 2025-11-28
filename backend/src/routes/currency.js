import express from 'express';
import {
  getSupportedCurrencies,
  getExchangeRates,
  convertCurrency,
  formatCurrency,
  convertBatch
} from '../controllers/currencyController.js';

const router = express.Router();

// All routes are public for currency conversion
router.get('/supported', getSupportedCurrencies);
router.get('/rates', getExchangeRates);
router.post('/convert', convertCurrency);
router.get('/format', formatCurrency);
router.post('/convert-batch', convertBatch);

export default router;
