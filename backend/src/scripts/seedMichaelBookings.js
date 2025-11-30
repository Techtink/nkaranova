import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import TailorProfile from '../models/TailorProfile.js';
import Booking from '../models/Booking.js';
import Order from '../models/Order.js';

dotenv.config();

const seedMichaelBookings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find Michael
    const michael = await User.findOne({ email: 'michael@example.com' });
    if (!michael) {
      console.error('User michael@example.com not found');
      process.exit(1);
    }
    console.log('Found user:', michael.email, michael._id);

    // Find a tailor to use
    const tailor = await TailorProfile.findOne({ approvalStatus: 'approved' }).populate('user');
    if (!tailor) {
      console.error('No approved tailor found');
      process.exit(1);
    }
    console.log('Using tailor:', tailor.businessName || tailor.username);

    // Clear existing bookings and orders for Michael
    await Order.deleteMany({ customer: michael._id });
    await Booking.deleteMany({ customer: michael._id });
    console.log('Cleared existing bookings and orders for Michael');

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    // 1. Booking with order in plan_review status (Pending Approval)
    const pendingApprovalBooking = await Booking.create({
      tailor: tailor._id,
      customer: michael._id,
      date: oneWeekAgo,
      startTime: '10:00',
      endTime: '11:00',
      service: 'Custom 3-Piece Suit',
      notes: 'Navy blue suit for wedding',
      status: 'converted',
      statusHistory: [
        { status: 'pending', changedAt: threeWeeksAgo },
        { status: 'confirmed', changedAt: twoWeeksAgo },
        { status: 'consultation_done', changedAt: twoWeeksAgo },
        { status: 'quote_submitted', changedAt: oneWeekAgo },
        { status: 'quote_accepted', changedAt: oneWeekAgo },
        { status: 'paid', changedAt: oneWeekAgo },
        { status: 'converted', changedAt: oneWeekAgo }
      ],
      quote: {
        submittedAt: oneWeekAgo,
        totalAmount: 85000,
        currency: 'NGN',
        estimatedDays: { design: 3, sew: 8, deliver: 3 },
        totalEstimatedDays: 14,
        items: [
          { description: 'Suit Jacket', quantity: 1, unitPrice: 45000 },
          { description: 'Trousers', quantity: 1, unitPrice: 25000 },
          { description: 'Waistcoat', quantity: 1, unitPrice: 15000 }
        ]
      }
    });

    const pendingApprovalOrder = await Order.create({
      booking: pendingApprovalBooking._id,
      customer: michael._id,
      tailor: tailor._id,
      status: 'plan_review',
      planDeadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      workPlan: {
        submittedAt: now,
        estimatedCompletion: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        totalEstimatedDays: 14,
        stages: [
          { name: 'Measurements & Pattern', description: 'Final measurements and pattern creation', estimatedDays: 2, order: 0, status: 'pending' },
          { name: 'Fabric Cutting', description: 'Cut all pieces for the suit', estimatedDays: 2, order: 1, status: 'pending' },
          { name: 'Jacket Construction', description: 'Sew the jacket body and lining', estimatedDays: 4, order: 2, status: 'pending' },
          { name: 'Trousers & Waistcoat', description: 'Complete trousers and waistcoat', estimatedDays: 3, order: 3, status: 'pending' },
          { name: 'Final Fitting & Delivery', description: 'Final adjustments and handover', estimatedDays: 3, order: 4, status: 'pending' }
        ]
      },
      statusHistory: [
        { status: 'awaiting_plan', changedAt: oneWeekAgo },
        { status: 'plan_review', changedAt: now }
      ]
    });

    // Update booking with order reference
    pendingApprovalBooking.order = pendingApprovalOrder._id;
    await pendingApprovalBooking.save();
    console.log('Created: Pending Approval booking');

    // 2. Booking with order having pending delay request
    const delayRequestBooking = await Booking.create({
      tailor: tailor._id,
      customer: michael._id,
      date: twoWeeksAgo,
      startTime: '14:00',
      endTime: '15:00',
      service: 'Traditional Agbada Set',
      notes: 'White agbada for naming ceremony',
      status: 'converted',
      statusHistory: [
        { status: 'pending', changedAt: threeWeeksAgo },
        { status: 'confirmed', changedAt: threeWeeksAgo },
        { status: 'converted', changedAt: twoWeeksAgo }
      ],
      quote: {
        submittedAt: twoWeeksAgo,
        totalAmount: 120000,
        currency: 'NGN',
        estimatedDays: { design: 2, sew: 6, deliver: 2 },
        totalEstimatedDays: 10,
        items: [
          { description: 'Agbada Top', quantity: 1, unitPrice: 60000 },
          { description: 'Agbada Sokoto', quantity: 1, unitPrice: 30000 },
          { description: 'Fila Cap', quantity: 1, unitPrice: 30000 }
        ]
      }
    });

    const delayRequestOrder = await Order.create({
      booking: delayRequestBooking._id,
      customer: michael._id,
      tailor: tailor._id,
      status: 'in_progress',
      planDeadline: twoWeeksAgo,
      workStartedAt: twoWeeksAgo,
      workPlan: {
        submittedAt: twoWeeksAgo,
        approvedAt: twoWeeksAgo,
        estimatedCompletion: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // Was due 4 days ago
        totalEstimatedDays: 10,
        stages: [
          { name: 'Design & Pattern', description: 'Create embroidery design', estimatedDays: 2, order: 0, status: 'completed', completedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
          { name: 'Fabric Preparation', description: 'Cut and prepare fabric', estimatedDays: 2, order: 1, status: 'completed', completedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
          { name: 'Embroidery Work', description: 'Hand embroidery on agbada', estimatedDays: 4, order: 2, status: 'in_progress', startedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
          { name: 'Assembly & Finishing', description: 'Final sewing and finishing', estimatedDays: 2, order: 3, status: 'pending' }
        ]
      },
      currentStage: 2,
      delayRequests: [
        {
          requestedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
          requestedBy: tailor.user._id,
          reason: 'The embroidery work is more intricate than expected and requires additional time for quality craftsmanship.',
          additionalDays: 5,
          status: 'pending'
        }
      ],
      statusHistory: [
        { status: 'awaiting_plan', changedAt: twoWeeksAgo },
        { status: 'plan_review', changedAt: twoWeeksAgo },
        { status: 'in_progress', changedAt: twoWeeksAgo }
      ]
    });

    delayRequestBooking.order = delayRequestOrder._id;
    await delayRequestBooking.save();
    console.log('Created: Delay Request booking');

    // 3. In-Progress bookings (various stages)
    const inProgressBooking1 = await Booking.create({
      tailor: tailor._id,
      customer: michael._id,
      date: oneWeekAgo,
      startTime: '09:00',
      endTime: '10:00',
      service: 'Senator Outfit',
      notes: 'Gray senator for office wear',
      status: 'converted',
      statusHistory: [
        { status: 'pending', changedAt: twoWeeksAgo },
        { status: 'confirmed', changedAt: oneWeekAgo },
        { status: 'converted', changedAt: oneWeekAgo }
      ],
      quote: {
        submittedAt: oneWeekAgo,
        totalAmount: 45000,
        currency: 'NGN',
        estimatedDays: { design: 1, sew: 5, deliver: 1 },
        totalEstimatedDays: 7,
        items: [
          { description: 'Senator Top', quantity: 1, unitPrice: 25000 },
          { description: 'Senator Trouser', quantity: 1, unitPrice: 20000 }
        ]
      }
    });

    const inProgressOrder1 = await Order.create({
      booking: inProgressBooking1._id,
      customer: michael._id,
      tailor: tailor._id,
      status: 'in_progress',
      planDeadline: oneWeekAgo,
      workStartedAt: oneWeekAgo,
      workPlan: {
        submittedAt: oneWeekAgo,
        approvedAt: oneWeekAgo,
        estimatedCompletion: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        totalEstimatedDays: 7,
        stages: [
          { name: 'Pattern & Cutting', description: 'Create pattern and cut fabric', estimatedDays: 2, order: 0, status: 'completed', completedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
          { name: 'Sewing', description: 'Sew the senator outfit', estimatedDays: 3, order: 1, status: 'in_progress', startedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
          { name: 'Finishing', description: 'Final touches and quality check', estimatedDays: 2, order: 2, status: 'pending' }
        ]
      },
      currentStage: 1,
      statusHistory: [
        { status: 'awaiting_plan', changedAt: oneWeekAgo },
        { status: 'plan_review', changedAt: oneWeekAgo },
        { status: 'in_progress', changedAt: oneWeekAgo }
      ]
    });

    inProgressBooking1.order = inProgressOrder1._id;
    await inProgressBooking1.save();

    // Pending booking (no order yet)
    await Booking.create({
      tailor: tailor._id,
      customer: michael._id,
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      startTime: '11:00',
      endTime: '12:00',
      service: 'Kaftan',
      notes: 'Simple kaftan for casual wear',
      status: 'pending',
      statusHistory: [
        { status: 'pending', changedAt: now }
      ]
    });

    // Confirmed booking
    await Booking.create({
      tailor: tailor._id,
      customer: michael._id,
      date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      startTime: '15:00',
      endTime: '16:00',
      service: 'Dashiki Shirt',
      notes: 'Colorful dashiki for event',
      status: 'confirmed',
      statusHistory: [
        { status: 'pending', changedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { status: 'confirmed', changedAt: now }
      ]
    });

    console.log('Created: In-Progress bookings');

    // 4. Cancelled booking
    await Booking.create({
      tailor: tailor._id,
      customer: michael._id,
      date: threeWeeksAgo,
      startTime: '16:00',
      endTime: '17:00',
      service: 'Wedding Gown Alterations',
      notes: 'Cancelled due to wedding postponement',
      status: 'cancelled',
      statusHistory: [
        { status: 'pending', changedAt: threeWeeksAgo },
        { status: 'confirmed', changedAt: threeWeeksAgo },
        { status: 'cancelled', changedAt: twoWeeksAgo, note: 'Customer cancelled - wedding postponed' }
      ],
      cancelledAt: twoWeeksAgo,
      cancellationReason: 'Wedding has been postponed to next year'
    });

    // Declined booking
    await Booking.create({
      tailor: tailor._id,
      customer: michael._id,
      date: twoWeeksAgo,
      startTime: '09:00',
      endTime: '10:00',
      service: 'Leather Jacket',
      notes: 'Wanted custom leather jacket',
      status: 'declined',
      statusHistory: [
        { status: 'pending', changedAt: twoWeeksAgo },
        { status: 'declined', changedAt: twoWeeksAgo, note: 'Tailor does not work with leather' }
      ]
    });

    console.log('Created: Cancelled bookings');

    // 5. Completed booking (for review)
    const completedBooking = await Booking.create({
      tailor: tailor._id,
      customer: michael._id,
      date: threeWeeksAgo,
      startTime: '10:00',
      endTime: '11:00',
      service: 'Ankara Shirt',
      notes: 'Ankara shirt for birthday',
      status: 'completed',
      completedAt: oneWeekAgo,
      statusHistory: [
        { status: 'pending', changedAt: threeWeeksAgo },
        { status: 'confirmed', changedAt: threeWeeksAgo },
        { status: 'converted', changedAt: threeWeeksAgo },
        { status: 'completed', changedAt: oneWeekAgo }
      ],
      quote: {
        submittedAt: threeWeeksAgo,
        totalAmount: 25000,
        currency: 'NGN',
        estimatedDays: { design: 1, sew: 3, deliver: 1 },
        totalEstimatedDays: 5,
        items: [
          { description: 'Ankara Shirt', quantity: 1, unitPrice: 25000 }
        ]
      }
    });

    const completedOrder = await Order.create({
      booking: completedBooking._id,
      customer: michael._id,
      tailor: tailor._id,
      status: 'completed',
      planDeadline: threeWeeksAgo,
      workStartedAt: threeWeeksAgo,
      workCompletedAt: new Date(oneWeekAgo.getTime() - 2 * 24 * 60 * 60 * 1000),
      completedAt: oneWeekAgo,
      workPlan: {
        submittedAt: threeWeeksAgo,
        approvedAt: threeWeeksAgo,
        estimatedCompletion: twoWeeksAgo,
        totalEstimatedDays: 5,
        stages: [
          { name: 'Pattern & Cutting', estimatedDays: 1, order: 0, status: 'completed', completedAt: threeWeeksAgo },
          { name: 'Sewing', estimatedDays: 3, order: 1, status: 'completed', completedAt: new Date(twoWeeksAgo.getTime() + 2 * 24 * 60 * 60 * 1000) },
          { name: 'Finishing', estimatedDays: 1, order: 2, status: 'completed', completedAt: new Date(oneWeekAgo.getTime() - 2 * 24 * 60 * 60 * 1000) }
        ]
      },
      completionFeedback: {
        rating: 5,
        comment: 'Excellent work! The shirt fits perfectly.',
        submittedAt: oneWeekAgo
      },
      statusHistory: [
        { status: 'awaiting_plan', changedAt: threeWeeksAgo },
        { status: 'in_progress', changedAt: threeWeeksAgo },
        { status: 'ready', changedAt: new Date(oneWeekAgo.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { status: 'completed', changedAt: oneWeekAgo }
      ]
    });

    completedBooking.order = completedOrder._id;
    await completedBooking.save();
    console.log('Created: Completed booking');

    console.log('\n=== Seed Summary ===');
    console.log('Created for michael@example.com:');
    console.log('- 1 Pending Approval (plan_review status)');
    console.log('- 1 Delay Request (in_progress with pending delay)');
    console.log('- 3 In-Progress (pending, confirmed, in_progress with order)');
    console.log('- 2 Cancelled (cancelled, declined)');
    console.log('- 1 Completed (with order and review)');
    console.log('\nTotal: 8 bookings, 4 orders');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedMichaelBookings();
