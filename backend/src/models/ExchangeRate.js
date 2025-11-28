import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: true,
    default: 'USD'
  },
  rates: {
    type: Map,
    of: Number,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for quick lookups
exchangeRateSchema.index({ baseCurrency: 1 });

// Static method to get conversion rate
exchangeRateSchema.statics.getRate = async function(from, to) {
  if (from === to) return 1;

  const rates = await this.findOne({ baseCurrency: 'USD' }).sort({ lastUpdated: -1 });
  if (!rates) return null;

  // Convert through USD as base
  const fromRate = from === 'USD' ? 1 : rates.rates.get(from);
  const toRate = to === 'USD' ? 1 : rates.rates.get(to);

  if (!fromRate || !toRate) return null;

  return toRate / fromRate;
};

// Static method to convert amount
exchangeRateSchema.statics.convert = async function(amount, from, to) {
  const rate = await this.getRate(from, to);
  if (!rate) return null;
  return Math.round(amount * rate * 100) / 100;
};

const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);
export default ExchangeRate;
