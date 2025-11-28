import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import TailorProfile from '../models/TailorProfile.js';
import Booking from '../models/Booking.js';
import Order from '../models/Order.js';

dotenv.config();

const seedOrder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find an existing tailor
    const tailor = await TailorProfile.findOne({ approvalStatus: 'approved' }).populate('user');
    if (!tailor) {
      console.error('No approved tailor found. Please run the main seed first.');
      process.exit(1);
    }

    // Find an existing customer
    const customer = await User.findOne({ role: 'customer' });
    if (!customer) {
      console.error('No customer found. Please run the main seed first.');
      process.exit(1);
    }

    console.log(`Using tailor: ${tailor.businessName} (${tailor.user.email})`);
    console.log(`Using customer: ${customer.firstName} ${customer.lastName} (${customer.email})`);

    // Create a new booking
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const booking = await Booking.create({
      tailor: tailor._id,
      customer: customer._id,
      date: tomorrow,
      startTime: '10:00',
      endTime: '11:00',
      service: 'Custom outfit - New order for testing',
      notes: 'This is a test order waiting to be accepted by the tailor',
      status: 'completed', // Booking completed, payment made
      price: { amount: 500, currency: 'USD' },
      paymentStatus: 'held',
      completedAt: now
    });

    console.log('Created booking:', booking._id);

    // Create a new order with 'awaiting_plan' status
    const planDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const order = await Order.create({
      booking: booking._id,
      customer: customer._id,
      tailor: tailor._id,
      status: 'awaiting_plan',
      planDeadline: planDeadline,
      statusHistory: [{
        status: 'awaiting_plan',
        changedAt: now,
        note: 'Order created, awaiting tailor acceptance'
      }]
    });

    console.log('Created order:', order._id);

    console.log('\n========================================');
    console.log('Order seeded successfully!');
    console.log('========================================\n');
    console.log(`Order ID: ${order._id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Tailor: ${tailor.businessName}`);
    console.log(`Customer: ${customer.firstName} ${customer.lastName}`);
    console.log(`Plan Deadline: ${planDeadline.toISOString()}`);
    console.log('\nThe tailor can now accept this order from their mobile app.');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedOrder();
