import TailorProfile from '../models/TailorProfile.js';
import Booking from '../models/Booking.js';
import stripeService from '../services/stripeService.js';

// @desc    Create Stripe Connect account for tailor
// @route   POST /api/payments/connect
// @access  Private/Tailor
export const createConnectAccount = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    if (tailor.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Stripe account already exists'
      });
    }

    const result = await stripeService.createConnectedAccount(tailor, req.user.email);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to create Stripe account'
      });
    }

    tailor.stripeAccountId = result.accountId;
    await tailor.save();

    res.status(200).json({
      success: true,
      data: { accountId: result.accountId }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stripe onboarding link
// @route   GET /api/payments/onboarding
// @access  Private/Tailor
export const getOnboardingLink = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    if (!tailor.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe account found. Create one first.'
      });
    }

    const returnUrl = `${process.env.FRONTEND_URL}/tailor/dashboard/payments?success=true`;
    const refreshUrl = `${process.env.FRONTEND_URL}/tailor/dashboard/payments?refresh=true`;

    const result = await stripeService.createAccountLink(
      tailor.stripeAccountId,
      returnUrl,
      refreshUrl
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to create onboarding link'
      });
    }

    res.status(200).json({
      success: true,
      data: { url: result.url }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stripe account status
// @route   GET /api/payments/status
// @access  Private/Tailor
export const getAccountStatus = async (req, res, next) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    if (!tailor.stripeAccountId) {
      return res.status(200).json({
        success: true,
        data: {
          hasAccount: false,
          status: null,
          payoutsEnabled: false
        }
      });
    }

    const result = await stripeService.getAccountStatus(tailor.stripeAccountId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    // Update tailor's onboarding status
    if (result.payoutsEnabled && !tailor.stripeOnboardingComplete) {
      tailor.stripeOnboardingComplete = true;
      await tailor.save();
    }

    res.status(200).json({
      success: true,
      data: {
        hasAccount: true,
        status: result.status,
        payoutsEnabled: result.payoutsEnabled,
        chargesEnabled: result.chargesEnabled
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create payment intent for booking
// @route   POST /api/payments/booking/:bookingId
// @access  Private
export const createBookingPayment = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate('tailor');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (booking.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Booking must be accepted before payment'
      });
    }

    if (!booking.price?.amount) {
      return res.status(400).json({
        success: false,
        message: 'Booking price not set'
      });
    }

    const tailor = await TailorProfile.findById(booking.tailor);

    if (!tailor.stripeAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Tailor has not set up payments'
      });
    }

    const result = await stripeService.createPaymentIntent(
      booking.price.amount,
      booking.price.currency,
      tailor.stripeAccountId,
      booking._id
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error || 'Failed to create payment'
      });
    }

    booking.stripePaymentIntentId = result.paymentIntentId;
    booking.paymentStatus = 'pending';
    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        clientSecret: result.clientSecret
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm payment (called after client-side confirmation)
// @route   POST /api/payments/confirm/:bookingId
// @access  Private
export const confirmPayment = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    booking.paymentStatus = 'held';
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/webhook
// @access  Public
export const handleWebhook = async (req, res, next) => {
  try {
    // In production, verify webhook signature
    const event = req.body;

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;

        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            paymentStatus: 'held'
          });
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedBookingId = failedPayment.metadata.bookingId;

        if (failedBookingId) {
          await Booking.findByIdAndUpdate(failedBookingId, {
            paymentStatus: 'pending'
          });
        }
        break;

      case 'account.updated':
        const account = event.data.object;
        const tailor = await TailorProfile.findOne({ stripeAccountId: account.id });

        if (tailor) {
          tailor.stripeOnboardingComplete = account.payouts_enabled;
          await tailor.save();
        }
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};
