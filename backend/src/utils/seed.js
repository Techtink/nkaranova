import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import TailorProfile from '../models/TailorProfile.js';
import TailorAvailability from '../models/TailorAvailability.js';
import Work from '../models/Work.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await TailorProfile.deleteMany({});
    await TailorAvailability.deleteMany({});
    await Work.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user (password will be hashed by User model pre-save hook)
    const admin = await User.create({
      email: 'admin@tailorconnect.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    console.log('Created admin user');

    // Create sample customers (password will be hashed by User model pre-save hook)
    const customers = await User.create([
      {
        email: 'john@example.com',
        password: 'customer123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer'
      },
      {
        email: 'jane@example.com',
        password: 'customer123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer'
      }
    ]);
    console.log('Created sample customers');

    // Create sample tailors (password will be hashed by User model pre-save hook)
    const tailorUsers = await User.create([
      {
        email: 'maria@example.com',
        password: 'tailor123',
        firstName: 'Maria',
        lastName: 'Garcia',
        role: 'tailor'
      },
      {
        email: 'david@example.com',
        password: 'tailor123',
        firstName: 'David',
        lastName: 'Chen',
        role: 'tailor'
      },
      {
        email: 'aisha@example.com',
        password: 'tailor123',
        firstName: 'Aisha',
        lastName: 'Okonkwo',
        role: 'tailor'
      }
    ]);

    // Create tailor profiles
    const tailorProfiles = await TailorProfile.create([
      {
        user: tailorUsers[0]._id,
        username: 'mariagarcia',
        businessName: 'Maria\'s Elegant Designs',
        bio: 'Specializing in wedding dresses and formal wear for over 15 years. Every piece is handcrafted with love and attention to detail.',
        specialties: ['Wedding Dresses', 'Formal Wear', 'Alterations & Repairs'],
        location: {
          city: 'Los Angeles',
          state: 'California',
          country: 'USA'
        },
        approvalStatus: 'approved',
        verificationStatus: 'approved',
        averageRating: 4.8,
        reviewCount: 24,
        acceptingBookings: true
      },
      {
        user: tailorUsers[1]._id,
        username: 'davidchen',
        businessName: 'Chen\'s Bespoke Suits',
        bio: 'Master tailor specializing in men\'s suits and formal attire. Trained in Hong Kong with 20 years of experience.',
        specialties: ['Men\'s Suits', 'Formal Wear', 'Custom Design'],
        location: {
          city: 'New York',
          state: 'New York',
          country: 'USA'
        },
        approvalStatus: 'approved',
        verificationStatus: 'approved',
        averageRating: 4.9,
        reviewCount: 42,
        acceptingBookings: true
      },
      {
        user: tailorUsers[2]._id,
        username: 'aishaokonkwo',
        businessName: 'Aisha\'s African Couture',
        bio: 'Celebrating African heritage through fashion. Specializing in traditional and modern African attire.',
        specialties: ['Traditional African', 'Wedding Dresses', 'Custom Design'],
        location: {
          city: 'London',
          country: 'UK'
        },
        approvalStatus: 'approved',
        verificationStatus: 'approved',
        averageRating: 4.7,
        reviewCount: 18,
        acceptingBookings: true
      }
    ]);
    console.log('Created tailor profiles');

    // Create availability for tailors
    const defaultSchedule = {
      monday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
      tuesday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
      wednesday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
      thursday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
      friday: { isOpen: true, slots: [{ start: '09:00', end: '17:00' }] },
      saturday: { isOpen: true, slots: [{ start: '10:00', end: '14:00' }] },
      sunday: { isOpen: false, slots: [] }
    };

    for (const profile of tailorProfiles) {
      await TailorAvailability.create({
        tailor: profile._id,
        schedule: defaultSchedule,
        slotDuration: 60,
        bufferTime: 15,
        advanceBookingDays: 30
      });
    }
    console.log('Created tailor availability');

    // Create sample works
    await Work.create([
      {
        tailor: tailorProfiles[0]._id,
        title: 'Elegant Lace Wedding Dress',
        description: 'A stunning A-line wedding dress featuring delicate French lace and a cathedral train.',
        images: [{ url: '/uploads/works/sample1.jpg', isPrimary: true }],
        category: 'Wedding & Bridal',
        fabricTypes: ['Lace', 'Silk'],
        tags: ['wedding', 'bridal', 'lace', 'elegant'],
        price: { amount: 2500, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        isFeatured: true
      },
      {
        tailor: tailorProfiles[1]._id,
        title: 'Classic Navy Three-Piece Suit',
        description: 'Timeless navy blue three-piece suit crafted from premium Italian wool.',
        images: [{ url: '/uploads/works/sample2.jpg', isPrimary: true }],
        category: 'Suits & Formal',
        fabricTypes: ['Wool'],
        tags: ['suit', 'formal', 'navy', 'business'],
        price: { amount: 1800, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        isFeatured: true
      },
      {
        tailor: tailorProfiles[2]._id,
        title: 'Ankara Print Evening Gown',
        description: 'Vibrant Ankara print evening gown with modern silhouette and traditional African patterns.',
        images: [{ url: '/uploads/works/sample3.jpg', isPrimary: true }],
        category: 'Traditional Wear',
        fabricTypes: ['Ankara', 'Cotton'],
        tags: ['african', 'ankara', 'evening', 'traditional'],
        price: { amount: 450, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        isFeatured: true
      }
    ]);
    console.log('Created sample works');

    console.log('\n========================================');
    console.log('Seed data created successfully!');
    console.log('========================================\n');
    console.log('Test Accounts:');
    console.log('Admin: admin@tailorconnect.com / admin123');
    console.log('Customer: john@example.com / customer123');
    console.log('Tailor: maria@example.com / tailor123');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
