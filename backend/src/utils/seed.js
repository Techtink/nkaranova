import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import TailorProfile from '../models/TailorProfile.js';
import TailorAvailability from '../models/TailorAvailability.js';
import Work from '../models/Work.js';
import Booking from '../models/Booking.js';
import Order from '../models/Order.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

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
    await Booking.deleteMany({});
    await Order.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});

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
        role: 'customer',
        phone: '+1234567890',
        address: '123 Main Street, Los Angeles, CA 90001'
      },
      {
        email: 'jane@example.com',
        password: 'customer123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'customer',
        phone: '+1234567891',
        address: '456 Oak Avenue, New York, NY 10001'
      },
      {
        email: 'michael@example.com',
        password: 'customer123',
        firstName: 'Michael',
        lastName: 'Johnson',
        role: 'customer',
        phone: '+1234567892',
        address: '789 Pine Road, Chicago, IL 60601'
      },
      {
        email: 'sarah@example.com',
        password: 'customer123',
        firstName: 'Sarah',
        lastName: 'Williams',
        role: 'customer',
        phone: '+1234567893',
        address: '321 Elm Street, Miami, FL 33101'
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

    // Create sample portfolio works (more items)
    const works = await Work.create([
      // Maria's works
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
        isFeatured: true,
        viewCount: 156,
        likeCount: 45
      },
      {
        tailor: tailorProfiles[0]._id,
        title: 'Rose Gold Evening Gown',
        description: 'Stunning rose gold sequin evening gown with deep V-neck and mermaid silhouette.',
        images: [{ url: '/uploads/works/sample4.jpg', isPrimary: true }],
        category: 'Evening Wear',
        fabricTypes: ['Sequin', 'Satin'],
        tags: ['evening', 'gown', 'formal', 'sequin'],
        price: { amount: 1200, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        viewCount: 89,
        likeCount: 23
      },
      {
        tailor: tailorProfiles[0]._id,
        title: 'Classic White Bridal Alterations',
        description: 'Expert alterations to achieve the perfect fit for your wedding day.',
        images: [{ url: '/uploads/works/sample5.jpg', isPrimary: true }],
        category: 'Alterations',
        fabricTypes: ['Various'],
        tags: ['alterations', 'bridal', 'wedding', 'fitting'],
        price: { amount: 350, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        viewCount: 67,
        likeCount: 15
      },
      // David's works
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
        isFeatured: true,
        viewCount: 234,
        likeCount: 67
      },
      {
        tailor: tailorProfiles[1]._id,
        title: 'Charcoal Business Suit',
        description: 'Slim-fit charcoal business suit perfect for the modern professional.',
        images: [{ url: '/uploads/works/sample6.jpg', isPrimary: true }],
        category: 'Suits & Formal',
        fabricTypes: ['Wool', 'Polyester'],
        tags: ['suit', 'business', 'charcoal', 'slim-fit'],
        price: { amount: 1500, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        viewCount: 178,
        likeCount: 52
      },
      {
        tailor: tailorProfiles[1]._id,
        title: 'Wedding Tuxedo',
        description: 'Classic black tuxedo with satin lapels for the sophisticated groom.',
        images: [{ url: '/uploads/works/sample7.jpg', isPrimary: true }],
        category: 'Wedding & Bridal',
        fabricTypes: ['Wool', 'Satin'],
        tags: ['tuxedo', 'wedding', 'groom', 'formal'],
        price: { amount: 2200, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        viewCount: 145,
        likeCount: 38
      },
      // Aisha's works
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
        isFeatured: true,
        viewCount: 198,
        likeCount: 56
      },
      {
        tailor: tailorProfiles[2]._id,
        title: 'Kente Cloth Wedding Dress',
        description: 'Elegant fusion wedding dress incorporating authentic Ghanaian Kente cloth.',
        images: [{ url: '/uploads/works/sample8.jpg', isPrimary: true }],
        category: 'Wedding & Bridal',
        fabricTypes: ['Kente', 'Silk'],
        tags: ['kente', 'wedding', 'african', 'fusion'],
        price: { amount: 850, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        viewCount: 112,
        likeCount: 34
      },
      {
        tailor: tailorProfiles[2]._id,
        title: 'Agbada Set - Royal Blue',
        description: 'Majestic royal blue Agbada set with intricate embroidery for special occasions.',
        images: [{ url: '/uploads/works/sample9.jpg', isPrimary: true }],
        category: 'Traditional Wear',
        fabricTypes: ['Brocade', 'Cotton'],
        tags: ['agbada', 'nigerian', 'traditional', 'embroidery'],
        price: { amount: 600, currency: 'USD', isStartingPrice: true },
        approvalStatus: 'approved',
        viewCount: 87,
        likeCount: 29
      }
    ]);
    console.log('Created sample portfolio works');

    // Create sample bookings
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const bookings = await Booking.create([
      // Completed bookings (for completed orders)
      {
        tailor: tailorProfiles[0]._id,
        customer: customers[0]._id,
        date: twoWeeksAgo,
        startTime: '10:00',
        endTime: '11:00',
        service: 'Wedding dress consultation and measurements',
        notes: 'Bride wants a classic A-line silhouette with lace details',
        status: 'completed',
        price: { amount: 2500, currency: 'USD' },
        paymentStatus: 'released',
        completedAt: new Date(twoWeeksAgo.getTime() + 60 * 60 * 1000)
      },
      {
        tailor: tailorProfiles[1]._id,
        customer: customers[1]._id,
        date: lastWeek,
        startTime: '14:00',
        endTime: '15:00',
        service: 'Three-piece suit fitting',
        notes: 'Navy blue suit for corporate events',
        status: 'completed',
        price: { amount: 1800, currency: 'USD' },
        paymentStatus: 'released',
        completedAt: new Date(lastWeek.getTime() + 60 * 60 * 1000)
      },
      {
        tailor: tailorProfiles[2]._id,
        customer: customers[2]._id,
        date: lastWeek,
        startTime: '11:00',
        endTime: '12:00',
        service: 'Ankara dress custom order',
        notes: 'Traditional Ankara print for engagement party',
        status: 'completed',
        price: { amount: 450, currency: 'USD' },
        paymentStatus: 'released',
        completedAt: new Date(lastWeek.getTime() + 60 * 60 * 1000)
      },
      // In progress bookings
      {
        tailor: tailorProfiles[0]._id,
        customer: customers[3]._id,
        date: lastWeek,
        startTime: '15:00',
        endTime: '16:00',
        service: 'Evening gown alterations',
        notes: 'Need to take in the waist and adjust hem length',
        status: 'completed',
        price: { amount: 350, currency: 'USD' },
        paymentStatus: 'held',
        completedAt: new Date(lastWeek.getTime() + 60 * 60 * 1000)
      },
      {
        tailor: tailorProfiles[1]._id,
        customer: customers[0]._id,
        date: lastWeek,
        startTime: '09:00',
        endTime: '10:00',
        service: 'Wedding tuxedo consultation',
        notes: 'Classic black tuxedo for summer wedding',
        status: 'completed',
        price: { amount: 2200, currency: 'USD' },
        paymentStatus: 'held',
        completedAt: new Date(lastWeek.getTime() + 60 * 60 * 1000)
      },
      // Pending bookings (awaiting work plan)
      {
        tailor: tailorProfiles[2]._id,
        customer: customers[1]._id,
        date: tomorrow,
        startTime: '10:00',
        endTime: '11:00',
        service: 'Kente cloth outfit',
        notes: 'Traditional outfit for cultural celebration',
        status: 'completed',
        price: { amount: 600, currency: 'USD' },
        paymentStatus: 'held',
        completedAt: now
      },
      {
        tailor: tailorProfiles[0]._id,
        customer: customers[2]._id,
        date: tomorrow,
        startTime: '14:00',
        endTime: '15:00',
        service: 'Bridesmaid dress fitting',
        notes: 'Three matching bridesmaid dresses in blush pink',
        status: 'completed',
        price: { amount: 1500, currency: 'USD' },
        paymentStatus: 'held',
        completedAt: now
      }
    ]);
    console.log('Created sample bookings');

    // Create sample orders with different statuses
    const planDeadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const orders = await Order.create([
      // Order 1: Completed order
      {
        booking: bookings[0]._id,
        customer: customers[0]._id,
        tailor: tailorProfiles[0]._id,
        status: 'completed',
        planDeadline: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000),
        workPlan: {
          submittedAt: new Date(twoWeeksAgo.getTime() + 24 * 60 * 60 * 1000),
          approvedAt: new Date(twoWeeksAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
          estimatedCompletion: new Date(twoWeeksAgo.getTime() + 12 * 24 * 60 * 60 * 1000),
          totalEstimatedDays: 10,
          stages: [
            { name: 'Design consultation', description: 'Finalize design details', estimatedDays: 1, order: 0, status: 'completed', startedAt: new Date(twoWeeksAgo.getTime() + 2 * 24 * 60 * 60 * 1000), completedAt: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Fabric selection', description: 'Select and order fabrics', estimatedDays: 2, order: 1, status: 'completed', startedAt: new Date(twoWeeksAgo.getTime() + 3 * 24 * 60 * 60 * 1000), completedAt: new Date(twoWeeksAgo.getTime() + 5 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Pattern cutting', description: 'Create and cut patterns', estimatedDays: 2, order: 2, status: 'completed', startedAt: new Date(twoWeeksAgo.getTime() + 5 * 24 * 60 * 60 * 1000), completedAt: new Date(twoWeeksAgo.getTime() + 7 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Assembly', description: 'Sew the garment', estimatedDays: 3, order: 3, status: 'completed', startedAt: new Date(twoWeeksAgo.getTime() + 7 * 24 * 60 * 60 * 1000), completedAt: new Date(twoWeeksAgo.getTime() + 10 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Final fitting', description: 'Final adjustments', estimatedDays: 2, order: 4, status: 'completed', startedAt: new Date(twoWeeksAgo.getTime() + 10 * 24 * 60 * 60 * 1000), completedAt: new Date(twoWeeksAgo.getTime() + 12 * 24 * 60 * 60 * 1000), notes: [] }
          ]
        },
        currentStage: 4,
        workStartedAt: new Date(twoWeeksAgo.getTime() + 2 * 24 * 60 * 60 * 1000),
        workCompletedAt: new Date(twoWeeksAgo.getTime() + 12 * 24 * 60 * 60 * 1000),
        deliveredAt: new Date(twoWeeksAgo.getTime() + 13 * 24 * 60 * 60 * 1000),
        completedAt: new Date(twoWeeksAgo.getTime() + 13 * 24 * 60 * 60 * 1000)
      },
      // Order 2: In progress order
      {
        booking: bookings[1]._id,
        customer: customers[1]._id,
        tailor: tailorProfiles[1]._id,
        status: 'in_progress',
        planDeadline: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        workPlan: {
          submittedAt: new Date(lastWeek.getTime() + 24 * 60 * 60 * 1000),
          approvedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
          estimatedCompletion: nextWeek,
          totalEstimatedDays: 14,
          stages: [
            { name: 'Measurements', description: 'Take detailed measurements', estimatedDays: 1, order: 0, status: 'completed', startedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000), completedAt: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Fabric procurement', description: 'Source Italian wool', estimatedDays: 3, order: 1, status: 'completed', startedAt: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000), completedAt: new Date(lastWeek.getTime() + 6 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Cutting', description: 'Cut all suit pieces', estimatedDays: 2, order: 2, status: 'in_progress', startedAt: new Date(lastWeek.getTime() + 6 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Jacket construction', description: 'Construct the jacket', estimatedDays: 4, order: 3, status: 'pending', notes: [] },
            { name: 'Trousers & vest', description: 'Complete trousers and vest', estimatedDays: 2, order: 4, status: 'pending', notes: [] },
            { name: 'Final fitting', description: 'Fitting and adjustments', estimatedDays: 2, order: 5, status: 'pending', notes: [] }
          ]
        },
        currentStage: 2,
        workStartedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      // Order 3: Ready for delivery
      {
        booking: bookings[2]._id,
        customer: customers[2]._id,
        tailor: tailorProfiles[2]._id,
        status: 'ready',
        planDeadline: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        workPlan: {
          submittedAt: new Date(lastWeek.getTime() + 12 * 60 * 60 * 1000),
          approvedAt: new Date(lastWeek.getTime() + 24 * 60 * 60 * 1000),
          estimatedCompletion: now,
          totalEstimatedDays: 5,
          stages: [
            { name: 'Design finalization', description: 'Confirm Ankara pattern choice', estimatedDays: 1, order: 0, status: 'completed', startedAt: new Date(lastWeek.getTime() + 24 * 60 * 60 * 1000), completedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Cutting', description: 'Cut fabric pieces', estimatedDays: 1, order: 1, status: 'completed', startedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000), completedAt: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Sewing', description: 'Assemble the dress', estimatedDays: 2, order: 2, status: 'completed', startedAt: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000), completedAt: new Date(lastWeek.getTime() + 5 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Finishing', description: 'Final touches and quality check', estimatedDays: 1, order: 3, status: 'completed', startedAt: new Date(lastWeek.getTime() + 5 * 24 * 60 * 60 * 1000), completedAt: new Date(lastWeek.getTime() + 6 * 24 * 60 * 60 * 1000), notes: [] }
          ]
        },
        currentStage: 3,
        workStartedAt: new Date(lastWeek.getTime() + 24 * 60 * 60 * 1000),
        workCompletedAt: new Date(lastWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
      },
      // Order 4: Awaiting work plan
      {
        booking: bookings[3]._id,
        customer: customers[3]._id,
        tailor: tailorProfiles[0]._id,
        status: 'awaiting_plan',
        planDeadline: planDeadline
      },
      // Order 5: In progress (different tailor)
      {
        booking: bookings[4]._id,
        customer: customers[0]._id,
        tailor: tailorProfiles[1]._id,
        status: 'in_progress',
        planDeadline: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000),
        workPlan: {
          submittedAt: new Date(lastWeek.getTime() + 24 * 60 * 60 * 1000),
          approvedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000),
          estimatedCompletion: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
          totalEstimatedDays: 16,
          stages: [
            { name: 'Consultation', description: 'Finalize tuxedo details', estimatedDays: 1, order: 0, status: 'completed', startedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000), completedAt: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Materials', description: 'Source premium materials', estimatedDays: 3, order: 1, status: 'in_progress', startedAt: new Date(lastWeek.getTime() + 3 * 24 * 60 * 60 * 1000), notes: [] },
            { name: 'Construction', description: 'Build the tuxedo', estimatedDays: 8, order: 2, status: 'pending', notes: [] },
            { name: 'Fitting', description: 'Multiple fittings', estimatedDays: 2, order: 3, status: 'pending', notes: [] },
            { name: 'Final touches', description: 'Buttonholes, pressing', estimatedDays: 2, order: 4, status: 'pending', notes: [] }
          ]
        },
        currentStage: 1,
        workStartedAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      // Order 6: Awaiting plan (pending acceptance)
      {
        booking: bookings[5]._id,
        customer: customers[1]._id,
        tailor: tailorProfiles[2]._id,
        status: 'awaiting_plan',
        planDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      },
      // Order 7: Awaiting plan
      {
        booking: bookings[6]._id,
        customer: customers[2]._id,
        tailor: tailorProfiles[0]._id,
        status: 'awaiting_plan',
        planDeadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      }
    ]);
    console.log('Created sample orders');

    // Create sample conversations and messages
    const conversations = [];

    // Conversation 1: John and Maria (about wedding dress)
    const conv1 = await Conversation.create({
      participants: [customers[0]._id, tailorUsers[0]._id],
      tailor: tailorProfiles[0]._id,
      lastMessage: {
        content: 'The dress is ready for final fitting! When would you like to come in?',
        sender: tailorUsers[0]._id,
        sentAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      unreadCount: new Map([
        [customers[0]._id.toString(), 1],
        [tailorUsers[0]._id.toString(), 0]
      ])
    });
    conversations.push(conv1);

    // Conversation 2: Jane and David (about suit)
    const conv2 = await Conversation.create({
      participants: [customers[1]._id, tailorUsers[1]._id],
      tailor: tailorProfiles[1]._id,
      lastMessage: {
        content: 'I have sourced the Italian wool. We can proceed with cutting tomorrow.',
        sender: tailorUsers[1]._id,
        sentAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
      },
      unreadCount: new Map([
        [customers[1]._id.toString(), 1],
        [tailorUsers[1]._id.toString(), 0]
      ])
    });
    conversations.push(conv2);

    // Conversation 3: Michael and Aisha (about Ankara dress)
    const conv3 = await Conversation.create({
      participants: [customers[2]._id, tailorUsers[2]._id],
      tailor: tailorProfiles[2]._id,
      lastMessage: {
        content: 'Your outfit is ready for pickup! The colors came out beautifully.',
        sender: tailorUsers[2]._id,
        sentAt: new Date(now.getTime() - 30 * 60 * 1000)
      },
      unreadCount: new Map([
        [customers[2]._id.toString(), 1],
        [tailorUsers[2]._id.toString(), 0]
      ])
    });
    conversations.push(conv3);

    // Conversation 4: Sarah and Maria
    const conv4 = await Conversation.create({
      participants: [customers[3]._id, tailorUsers[0]._id],
      tailor: tailorProfiles[0]._id,
      lastMessage: {
        content: 'Hi Maria! I just submitted my booking. Looking forward to the alterations!',
        sender: customers[3]._id,
        sentAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      },
      unreadCount: new Map([
        [customers[3]._id.toString(), 0],
        [tailorUsers[0]._id.toString(), 1]
      ])
    });
    conversations.push(conv4);

    // Conversation 5: John and David (tuxedo)
    const conv5 = await Conversation.create({
      participants: [customers[0]._id, tailorUsers[1]._id],
      tailor: tailorProfiles[1]._id,
      lastMessage: {
        content: 'Can we schedule the first fitting for next Tuesday?',
        sender: customers[0]._id,
        sentAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
      },
      unreadCount: new Map([
        [customers[0]._id.toString(), 0],
        [tailorUsers[1]._id.toString(), 1]
      ])
    });
    conversations.push(conv5);

    console.log('Created sample conversations');

    // Create messages for each conversation
    // Conversation 1 messages (John and Maria)
    await Message.create([
      {
        conversation: conv1._id,
        sender: customers[0]._id,
        content: 'Hi Maria! I saw your beautiful wedding dress designs. I\'m interested in getting one made for my sister\'s wedding.',
        type: 'text',
        createdAt: new Date(twoWeeksAgo.getTime())
      },
      {
        conversation: conv1._id,
        sender: tailorUsers[0]._id,
        content: 'Hello John! Thank you for reaching out. I would love to help. Do you have any specific style in mind?',
        type: 'text',
        createdAt: new Date(twoWeeksAgo.getTime() + 30 * 60 * 1000)
      },
      {
        conversation: conv1._id,
        sender: customers[0]._id,
        content: 'Yes, we were thinking of a classic A-line silhouette with French lace details. The wedding is in 3 months.',
        type: 'text',
        createdAt: new Date(twoWeeksAgo.getTime() + 60 * 60 * 1000)
      },
      {
        conversation: conv1._id,
        sender: tailorUsers[0]._id,
        content: 'That sounds lovely! 3 months gives us plenty of time. I\'ve confirmed your booking for next week. We can discuss the details then.',
        type: 'text',
        createdAt: new Date(twoWeeksAgo.getTime() + 90 * 60 * 1000)
      },
      {
        conversation: conv1._id,
        sender: tailorUsers[0]._id,
        content: 'The dress is ready for final fitting! When would you like to come in?',
        type: 'text',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      }
    ]);

    // Conversation 2 messages (Jane and David)
    await Message.create([
      {
        conversation: conv2._id,
        sender: customers[1]._id,
        content: 'Good morning David! I need a navy three-piece suit for an important corporate event.',
        type: 'text',
        createdAt: new Date(lastWeek.getTime())
      },
      {
        conversation: conv2._id,
        sender: tailorUsers[1]._id,
        content: 'Good morning Jane! I specialize in exactly this type of work. When is the event?',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() + 20 * 60 * 1000)
      },
      {
        conversation: conv2._id,
        sender: customers[1]._id,
        content: 'It\'s in about 3 weeks. Is that enough time?',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() + 40 * 60 * 1000)
      },
      {
        conversation: conv2._id,
        sender: tailorUsers[1]._id,
        content: 'Yes, that\'s perfect. I\'ll use premium Italian wool. I\'ve accepted your booking and will send the work plan shortly.',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() + 60 * 60 * 1000)
      },
      {
        conversation: conv2._id,
        sender: tailorUsers[1]._id,
        content: 'I have sourced the Italian wool. We can proceed with cutting tomorrow.',
        type: 'text',
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000)
      }
    ]);

    // Conversation 3 messages (Michael and Aisha)
    await Message.create([
      {
        conversation: conv3._id,
        sender: customers[2]._id,
        content: 'Hello Aisha! I love your Ankara designs. I need something special for my engagement party.',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        conversation: conv3._id,
        sender: tailorUsers[2]._id,
        content: 'Congratulations on your engagement! I would be honored to create something special for you. Do you have any color preferences?',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
      },
      {
        conversation: conv3._id,
        sender: customers[2]._id,
        content: 'Thank you! I was thinking vibrant colors - maybe red and gold? Something that celebrates our heritage.',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
      },
      {
        conversation: conv3._id,
        sender: tailorUsers[2]._id,
        content: 'Beautiful choice! I have some stunning Ankara prints that would be perfect. Let me send you some options.',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000)
      },
      {
        conversation: conv3._id,
        sender: tailorUsers[2]._id,
        content: 'Your outfit is ready for pickup! The colors came out beautifully.',
        type: 'text',
        createdAt: new Date(now.getTime() - 30 * 60 * 1000)
      }
    ]);

    // Conversation 4 messages (Sarah and Maria)
    await Message.create([
      {
        conversation: conv4._id,
        sender: customers[3]._id,
        content: 'Hi Maria! I have an evening gown that needs some alterations. Are you available?',
        type: 'text',
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
      },
      {
        conversation: conv4._id,
        sender: tailorUsers[0]._id,
        content: 'Hello Sarah! Yes, I do alterations work as well. What adjustments does the gown need?',
        type: 'text',
        createdAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000)
      },
      {
        conversation: conv4._id,
        sender: customers[3]._id,
        content: 'The waist needs to be taken in and the hem adjusted. I\'ve just submitted a booking request.',
        type: 'text',
        createdAt: new Date(now.getTime() - 1.2 * 60 * 60 * 1000)
      },
      {
        conversation: conv4._id,
        sender: customers[3]._id,
        content: 'Hi Maria! I just submitted my booking. Looking forward to the alterations!',
        type: 'text',
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      }
    ]);

    // Conversation 5 messages (John and David - tuxedo)
    await Message.create([
      {
        conversation: conv5._id,
        sender: customers[0]._id,
        content: 'Hi David! I\'m getting married and need a classic black tuxedo.',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000)
      },
      {
        conversation: conv5._id,
        sender: tailorUsers[1]._id,
        content: 'Congratulations! A classic black tuxedo is timeless. When is the big day?',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)
      },
      {
        conversation: conv5._id,
        sender: customers[0]._id,
        content: 'In about 2 months. I want something really elegant with satin lapels.',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000)
      },
      {
        conversation: conv5._id,
        sender: tailorUsers[1]._id,
        content: 'Perfect timing. I\'ll create something you\'ll treasure. I\'ve submitted the work plan for your approval.',
        type: 'text',
        createdAt: new Date(lastWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000)
      },
      {
        conversation: conv5._id,
        sender: customers[0]._id,
        content: 'Can we schedule the first fitting for next Tuesday?',
        type: 'text',
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000)
      }
    ]);

    console.log('Created sample messages');

    console.log('\n========================================');
    console.log('Seed data created successfully!');
    console.log('========================================\n');
    console.log('Test Accounts:');
    console.log('Admin: admin@tailorconnect.com / admin123');
    console.log('Customer: john@example.com / customer123');
    console.log('Customer: jane@example.com / customer123');
    console.log('Customer: michael@example.com / customer123');
    console.log('Customer: sarah@example.com / customer123');
    console.log('Tailor: maria@example.com / tailor123');
    console.log('Tailor: david@example.com / tailor123');
    console.log('Tailor: aisha@example.com / tailor123');
    console.log('\n');
    console.log('Sample Data Summary:');
    console.log(`- ${tailorProfiles.length} tailors with profiles`);
    console.log(`- ${works.length} portfolio works`);
    console.log(`- ${bookings.length} bookings`);
    console.log(`- ${orders.length} orders (various statuses)`);
    console.log(`- ${conversations.length} conversations with messages`);
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
