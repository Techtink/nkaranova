import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Settings from '../models/Settings.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create admin user
    const adminEmail = 'admin@nkaranova.com';
    const adminPassword = 'Admin123!';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin user already exists');
    } else {
      admin = await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true
      });
      console.log('Admin user created!');
    }

    // Initialize settings
    await Settings.initializeDefaults();
    console.log('Settings initialized!');

    console.log('\n========================================');
    console.log('Admin Login Credentials:');
    console.log('Email: admin@nkaranova.com');
    console.log('Password: Admin123!');
    console.log('========================================');
    console.log('\nIMPORTANT: Change this password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
