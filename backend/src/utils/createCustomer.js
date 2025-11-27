import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const createCustomer = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create customer user
    const customerEmail = 'customer@nkaranova.com';
    const customerPassword = 'Customer123!';

    let customer = await User.findOne({ email: customerEmail });

    if (customer) {
      console.log('Customer user already exists');
    } else {
      customer = await User.create({
        firstName: 'Test',
        lastName: 'Customer',
        email: customerEmail,
        password: customerPassword,
        role: 'customer',
        isEmailVerified: true
      });
      console.log('Customer user created!');
    }

    console.log('\n========================================');
    console.log('Customer Login Credentials:');
    console.log('Email: customer@nkaranova.com');
    console.log('Password: Customer123!');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createCustomer();
