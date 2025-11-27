import { TailorProfile, FeaturedSpot, FeaturedWaitlist, TokenTransaction, Settings } from '../models/index.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Helper function to check if spots are at capacity
const checkSpotsAvailable = async () => {
  const maxFeatured = await Settings.getValue('max_featured_tailors');
  const now = new Date();

  const activeCount = await FeaturedSpot.countDocuments({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  return {
    available: activeCount < maxFeatured,
    currentCount: activeCount,
    maxCount: maxFeatured,
    spotsLeft: Math.max(0, maxFeatured - activeCount)
  };
};

// @desc    Get featured tailors
// @route   GET /api/featured
// @access  Public
export const getFeaturedTailors = async (req, res) => {
  try {
    const maxFeatured = await Settings.getValue('max_featured_tailors');

    const featuredSpots = await FeaturedSpot.getActiveFeatured();

    // Get unique tailors from featured spots
    const featuredTailors = [];
    const seenTailors = new Set();

    for (const spot of featuredSpots) {
      if (spot.tailor && !seenTailors.has(spot.tailor._id.toString())) {
        seenTailors.add(spot.tailor._id.toString());
        featuredTailors.push({
          ...spot.tailor.toObject(),
          featuredUntil: spot.endDate,
          featuredSource: spot.source
        });
      }

      if (featuredTailors.length >= maxFeatured) break;
    }

    res.json({
      success: true,
      data: featuredTailors
    });
  } catch (error) {
    console.error('Get featured tailors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get featured spot pricing
// @route   GET /api/featured/pricing
// @access  Public
export const getFeaturedPricing = async (req, res) => {
  try {
    const price7Days = await Settings.getValue('featured_spot_price_7_days');
    const price14Days = await Settings.getValue('featured_spot_price_14_days');
    const price30Days = await Settings.getValue('featured_spot_price_30_days');
    const tokensRequired = await Settings.getValue('tokens_for_featured_spot');
    const tokenDuration = await Settings.getValue('featured_spot_duration_days');

    res.json({
      success: true,
      data: {
        payment: [
          { days: 7, price: price7Days, priceFormatted: `$${(price7Days / 100).toFixed(2)}` },
          { days: 14, price: price14Days, priceFormatted: `$${(price14Days / 100).toFixed(2)}` },
          { days: 30, price: price30Days, priceFormatted: `$${(price30Days / 100).toFixed(2)}` }
        ],
        tokens: {
          required: tokensRequired,
          durationDays: tokenDuration
        }
      }
    });
  } catch (error) {
    console.error('Get featured pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Redeem tokens for featured spot
// @route   POST /api/featured/redeem-tokens
// @access  Private (Tailor)
export const redeemTokensForFeaturedSpot = async (req, res) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    // Check if tailor is approved
    if (tailor.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved tailors can be featured'
      });
    }

    const tokensRequired = await Settings.getValue('tokens_for_featured_spot');
    const durationDays = await Settings.getValue('featured_spot_duration_days');

    // Check balance
    if (tailor.tokenBalance < tokensRequired) {
      return res.status(400).json({
        success: false,
        message: `Insufficient tokens. You need ${tokensRequired} tokens, but have ${tailor.tokenBalance}`
      });
    }

    // Check if tailor is already on waitlist
    const existingWaitlist = await FeaturedWaitlist.findOne({
      tailor: tailor._id,
      status: 'waiting'
    });

    if (existingWaitlist) {
      return res.status(400).json({
        success: false,
        message: 'You are already on the waitlist for a featured spot'
      });
    }

    // Check if tailor already has an active featured spot
    const existingSpot = await FeaturedSpot.findOne({
      tailor: tailor._id,
      status: 'active',
      endDate: { $gte: new Date() }
    }).sort({ endDate: -1 });

    // Check availability
    const spotsStatus = await checkSpotsAvailable();

    // If tailor already has a spot, extend it (no capacity check)
    // If tailor doesn't have a spot and spots are full, add to waitlist
    if (!existingSpot && !spotsStatus.available) {
      // Deduct tokens and add to waitlist
      tailor.tokenBalance -= tokensRequired;
      await tailor.save();

      // Create token transaction for reservation
      await TokenTransaction.create({
        tailor: tailor._id,
        type: 'debit',
        amount: tokensRequired,
        balanceAfter: tailor.tokenBalance,
        reason: 'featured_spot_waitlist',
        description: `Reserved ${tokensRequired} tokens for featured spot waitlist`
      });

      // Get next position in queue
      const position = await FeaturedWaitlist.getNextPosition();

      // Waitlist entries expire after 30 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const waitlistEntry = await FeaturedWaitlist.create({
        tailor: tailor._id,
        source: 'tokens',
        position,
        tokensReserved: tokensRequired,
        durationDays,
        expiresAt,
        createdBy: req.user._id
      });

      // Get queue position
      const queuePosition = await FeaturedWaitlist.getTailorPosition(tailor._id);

      return res.json({
        success: true,
        waitlisted: true,
        data: {
          waitlistEntry,
          queuePosition,
          newTokenBalance: tailor.tokenBalance,
          message: `All featured spots are currently full. You've been added to the waitlist at position ${queuePosition}. Your tokens have been reserved and you'll be featured as soon as a spot opens up.`
        }
      });
    }

    // Spot available or extending existing spot
    const startDate = existingSpot ? existingSpot.endDate : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    // Deduct tokens
    tailor.tokenBalance -= tokensRequired;
    await tailor.save();

    // Create token transaction
    const transaction = await TokenTransaction.create({
      tailor: tailor._id,
      type: 'debit',
      amount: tokensRequired,
      balanceAfter: tailor.tokenBalance,
      reason: 'featured_spot_redemption',
      description: `Redeemed ${tokensRequired} tokens for ${durationDays}-day featured spot`
    });

    // Create featured spot
    const featuredSpot = await FeaturedSpot.create({
      tailor: tailor._id,
      source: 'tokens',
      startDate,
      endDate,
      tokensSpent: tokensRequired,
      durationDays,
      createdBy: req.user._id
    });

    // Update transaction with featured spot reference
    transaction.relatedFeaturedSpot = featuredSpot._id;
    await transaction.save();

    res.json({
      success: true,
      waitlisted: false,
      data: {
        featuredSpot,
        newTokenBalance: tailor.tokenBalance
      }
    });
  } catch (error) {
    console.error('Redeem tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create payment intent for featured spot
// @route   POST /api/featured/create-payment
// @access  Private (Tailor)
export const createFeaturedSpotPayment = async (req, res) => {
  try {
    const { durationDays } = req.body;

    if (![7, 14, 30].includes(durationDays)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid duration. Choose 7, 14, or 30 days'
      });
    }

    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    // Check if tailor is approved
    if (tailor.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved tailors can purchase featured spots'
      });
    }

    // Get price based on duration
    let priceKey;
    if (durationDays === 7) priceKey = 'featured_spot_price_7_days';
    else if (durationDays === 14) priceKey = 'featured_spot_price_14_days';
    else priceKey = 'featured_spot_price_30_days';

    const price = await Settings.getValue(priceKey);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price,
      currency: 'usd',
      metadata: {
        type: 'featured_spot',
        tailorId: tailor._id.toString(),
        userId: req.user._id.toString(),
        durationDays: durationDays.toString()
      }
    });

    res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        amount: price,
        durationDays
      }
    });
  } catch (error) {
    console.error('Create featured spot payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Confirm featured spot payment
// @route   POST /api/featured/confirm-payment
// @access  Private (Tailor)
export const confirmFeaturedSpotPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    const { tailorId, durationDays } = paymentIntent.metadata;

    const tailor = await TailorProfile.findById(tailorId);
    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    // Check if this payment was already processed
    const existingSpot = await FeaturedSpot.findOne({
      stripePaymentIntentId: paymentIntentId
    });

    if (existingSpot) {
      return res.json({
        success: true,
        data: existingSpot,
        message: 'Payment already processed'
      });
    }

    // Calculate start and end dates
    const existingActiveSpot = await FeaturedSpot.findOne({
      tailor: tailor._id,
      status: 'active',
      endDate: { $gte: new Date() }
    }).sort({ endDate: -1 });

    const startDate = existingActiveSpot ? existingActiveSpot.endDate : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(durationDays));

    // Create featured spot
    const featuredSpot = await FeaturedSpot.create({
      tailor: tailor._id,
      source: 'payment',
      startDate,
      endDate,
      paymentAmount: paymentIntent.amount,
      paymentCurrency: paymentIntent.currency.toUpperCase(),
      stripePaymentIntentId: paymentIntentId,
      durationDays: parseInt(durationDays),
      createdBy: req.user._id
    });

    res.json({
      success: true,
      data: featuredSpot
    });
  } catch (error) {
    console.error('Confirm featured spot payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get my featured spot status
// @route   GET /api/featured/my-status
// @access  Private (Tailor)
export const getMyFeaturedStatus = async (req, res) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const now = new Date();

    // Get active featured spots
    const activeSpots = await FeaturedSpot.find({
      tailor: tailor._id,
      status: 'active',
      endDate: { $gte: now }
    }).sort({ endDate: 1 });

    // Get past featured spots
    const pastSpots = await FeaturedSpot.find({
      tailor: tailor._id,
      $or: [
        { status: { $ne: 'active' } },
        { endDate: { $lt: now } }
      ]
    }).sort({ createdAt: -1 }).limit(10);

    const isFeatured = activeSpots.length > 0;
    const currentSpot = isFeatured ? activeSpots[0] : null;
    const featuredUntil = isFeatured
      ? activeSpots.reduce((latest, spot) => spot.endDate > latest ? spot.endDate : latest, activeSpots[0].endDate)
      : null;

    res.json({
      success: true,
      data: {
        isFeatured,
        currentSpot,
        featuredUntil,
        activeSpots,
        pastSpots,
        tokenBalance: tailor.tokenBalance
      }
    });
  } catch (error) {
    console.error('Get my featured status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admin: Get all featured spots
// @route   GET /api/featured/admin/all
// @access  Private (Admin)
export const getAllFeaturedSpots = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;

    const spots = await FeaturedSpot.find(query)
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FeaturedSpot.countDocuments(query);

    res.json({
      success: true,
      data: spots,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all featured spots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admin: Create featured spot manually
// @route   POST /api/featured/admin/create
// @access  Private (Admin)
export const adminCreateFeaturedSpot = async (req, res) => {
  try {
    const { tailorId, durationDays, notes } = req.body;

    const tailor = await TailorProfile.findById(tailorId);
    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found'
      });
    }

    // Calculate dates
    const existingSpot = await FeaturedSpot.findOne({
      tailor: tailor._id,
      status: 'active',
      endDate: { $gte: new Date() }
    }).sort({ endDate: -1 });

    const startDate = existingSpot ? existingSpot.endDate : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);

    const featuredSpot = await FeaturedSpot.create({
      tailor: tailor._id,
      source: 'admin',
      startDate,
      endDate,
      durationDays,
      notes,
      createdBy: req.user._id
    });

    res.json({
      success: true,
      data: featuredSpot
    });
  } catch (error) {
    console.error('Admin create featured spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admin: Cancel featured spot
// @route   POST /api/featured/admin/cancel/:spotId
// @access  Private (Admin)
export const adminCancelFeaturedSpot = async (req, res) => {
  try {
    const { reason } = req.body;

    const spot = await FeaturedSpot.findById(req.params.spotId);
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Featured spot not found'
      });
    }

    spot.status = 'cancelled';
    spot.cancelledAt = new Date();
    spot.cancelledBy = req.user._id;
    spot.cancellationReason = reason;
    await spot.save();

    res.json({
      success: true,
      data: spot
    });
  } catch (error) {
    console.error('Admin cancel featured spot error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Expire old featured spots (called by cron job)
// @route   POST /api/featured/expire
// @access  Internal
export const expireFeaturedSpots = async () => {
  try {
    const now = new Date();
    const result = await FeaturedSpot.updateMany(
      {
        status: 'active',
        endDate: { $lt: now }
      },
      {
        status: 'expired'
      }
    );
    console.log(`Expired ${result.modifiedCount} featured spots`);

    // Process waitlist if spots opened up
    if (result.modifiedCount > 0) {
      await processWaitlist();
    }

    return result.modifiedCount;
  } catch (error) {
    console.error('Expire featured spots error:', error);
    throw error;
  }
};

// @desc    Process waitlist - activate entries when spots become available
// @access  Internal
export const processWaitlist = async () => {
  try {
    const spotsStatus = await checkSpotsAvailable();

    if (!spotsStatus.available) {
      console.log('No spots available, waitlist not processed');
      return { activated: 0 };
    }

    let activated = 0;

    // Process entries while spots are available
    while (spotsStatus.spotsLeft > activated) {
      const nextEntry = await FeaturedWaitlist.getNextInQueue();

      if (!nextEntry) {
        console.log('No more entries in waitlist');
        break;
      }

      // Check if entry hasn't expired
      if (nextEntry.expiresAt < new Date()) {
        nextEntry.status = 'expired';
        await nextEntry.save();

        // Refund tokens if applicable
        if (nextEntry.source === 'tokens' && nextEntry.tokensReserved > 0) {
          const tailor = await TailorProfile.findById(nextEntry.tailor);
          if (tailor) {
            tailor.tokenBalance += nextEntry.tokensReserved;
            await tailor.save();

            await TokenTransaction.create({
              tailor: tailor._id,
              type: 'credit',
              amount: nextEntry.tokensReserved,
              balanceAfter: tailor.tokenBalance,
              reason: 'waitlist_expired_refund',
              description: 'Tokens refunded - waitlist entry expired'
            });
          }
        }
        continue;
      }

      // Activate this entry
      await nextEntry.activate(FeaturedSpot);
      activated++;

      console.log(`Activated waitlist entry for tailor ${nextEntry.tailor}`);
    }

    console.log(`Processed waitlist: ${activated} entries activated`);
    return { activated };
  } catch (error) {
    console.error('Process waitlist error:', error);
    throw error;
  }
};

// @desc    Get featured spots availability status
// @route   GET /api/featured/availability
// @access  Public
export const getFeaturedAvailability = async (req, res) => {
  try {
    const spotsStatus = await checkSpotsAvailable();
    const queueSize = await FeaturedWaitlist.getQueueSize();

    res.json({
      success: true,
      data: {
        ...spotsStatus,
        queueSize,
        estimatedWaitDays: queueSize > 0
          ? Math.ceil(queueSize * (await Settings.getValue('featured_spot_duration_days')))
          : 0
      }
    });
  } catch (error) {
    console.error('Get featured availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get my waitlist status
// @route   GET /api/featured/my-waitlist-status
// @access  Private (Tailor)
export const getMyWaitlistStatus = async (req, res) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const waitlistEntry = await FeaturedWaitlist.findOne({
      tailor: tailor._id,
      status: 'waiting'
    });

    if (!waitlistEntry) {
      return res.json({
        success: true,
        data: {
          onWaitlist: false
        }
      });
    }

    const position = await FeaturedWaitlist.getTailorPosition(tailor._id);

    res.json({
      success: true,
      data: {
        onWaitlist: true,
        position,
        entry: waitlistEntry
      }
    });
  } catch (error) {
    console.error('Get my waitlist status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Cancel my waitlist entry
// @route   POST /api/featured/cancel-waitlist
// @access  Private (Tailor)
export const cancelMyWaitlistEntry = async (req, res) => {
  try {
    const tailor = await TailorProfile.findOne({ user: req.user._id });

    if (!tailor) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found'
      });
    }

    const waitlistEntry = await FeaturedWaitlist.findOne({
      tailor: tailor._id,
      status: 'waiting'
    });

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'No waitlist entry found'
      });
    }

    // Refund tokens if applicable
    if (waitlistEntry.source === 'tokens' && waitlistEntry.tokensReserved > 0) {
      tailor.tokenBalance += waitlistEntry.tokensReserved;
      await tailor.save();

      await TokenTransaction.create({
        tailor: tailor._id,
        type: 'credit',
        amount: waitlistEntry.tokensReserved,
        balanceAfter: tailor.tokenBalance,
        reason: 'waitlist_cancelled_refund',
        description: 'Tokens refunded - waitlist entry cancelled'
      });
    }

    // Update waitlist entry
    waitlistEntry.status = 'cancelled';
    waitlistEntry.cancelledAt = new Date();
    waitlistEntry.cancellationReason = 'User cancelled';
    await waitlistEntry.save();

    res.json({
      success: true,
      data: {
        message: 'Waitlist entry cancelled successfully',
        tokensRefunded: waitlistEntry.tokensReserved,
        newTokenBalance: tailor.tokenBalance
      }
    });
  } catch (error) {
    console.error('Cancel waitlist entry error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admin: Get waitlist entries
// @route   GET /api/featured/admin/waitlist
// @access  Private (Admin)
export const getWaitlist = async (req, res) => {
  try {
    const { status = 'waiting', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status !== 'all') query.status = status;

    const entries = await FeaturedWaitlist.find(query)
      .populate({
        path: 'tailor',
        select: 'username businessName profilePhoto',
        populate: { path: 'user', select: 'firstName lastName email' }
      })
      .sort({ position: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await FeaturedWaitlist.countDocuments(query);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Admin: Process waitlist manually
// @route   POST /api/featured/admin/process-waitlist
// @access  Private (Admin)
export const adminProcessWaitlist = async (req, res) => {
  try {
    const result = await processWaitlist();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Admin process waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
