import Stripe from 'stripe';

class StripeService {
  constructor() {
    this.stripe = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      this.initialized = true;
    } else {
      console.log('Stripe service not configured - payments will be simulated');
    }
  }

  // Create a connected account for a tailor
  async createConnectedAccount(tailor, email) {
    this.initialize();

    if (!this.stripe) {
      return { success: true, accountId: `simulated_${tailor._id}` };
    }

    try {
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        },
        metadata: {
          tailorId: tailor._id.toString()
        }
      });

      return { success: true, accountId: account.id };
    } catch (error) {
      console.error('Stripe account creation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate onboarding link for tailor
  async createAccountLink(accountId, returnUrl, refreshUrl) {
    this.initialize();

    if (!this.stripe) {
      return { success: true, url: returnUrl };
    }

    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
      });

      return { success: true, url: accountLink.url };
    } catch (error) {
      console.error('Stripe account link error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a payment intent (held in escrow)
  async createPaymentIntent(amount, currency, tailorAccountId, bookingId) {
    this.initialize();

    if (!this.stripe) {
      return {
        success: true,
        clientSecret: `simulated_secret_${bookingId}`,
        paymentIntentId: `simulated_pi_${bookingId}`
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency || 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual', // Hold payment (escrow)
        transfer_data: {
          destination: tailorAccountId
        },
        metadata: {
          bookingId: bookingId.toString()
        }
      });

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      return { success: false, error: error.message };
    }
  }

  // Capture payment (release from escrow to tailor)
  async capturePayment(paymentIntentId) {
    this.initialize();

    if (!this.stripe) {
      return { success: true };
    }

    try {
      await this.stripe.paymentIntents.capture(paymentIntentId);
      return { success: true };
    } catch (error) {
      console.error('Stripe capture error:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel payment intent (refund)
  async cancelPayment(paymentIntentId) {
    this.initialize();

    if (!this.stripe) {
      return { success: true };
    }

    try {
      await this.stripe.paymentIntents.cancel(paymentIntentId);
      return { success: true };
    } catch (error) {
      console.error('Stripe cancel error:', error);
      return { success: false, error: error.message };
    }
  }

  // Refund a captured payment
  async refundPayment(paymentIntentId, amount = null) {
    this.initialize();

    if (!this.stripe) {
      return { success: true };
    }

    try {
      const refundData = { payment_intent: paymentIntentId };
      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      await this.stripe.refunds.create(refundData);
      return { success: true };
    } catch (error) {
      console.error('Stripe refund error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get account status
  async getAccountStatus(accountId) {
    this.initialize();

    if (!this.stripe) {
      return { success: true, status: 'active', payoutsEnabled: true };
    }

    try {
      const account = await this.stripe.accounts.retrieve(accountId);
      return {
        success: true,
        status: account.details_submitted ? 'active' : 'pending',
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled
      };
    } catch (error) {
      console.error('Stripe account status error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new StripeService();
