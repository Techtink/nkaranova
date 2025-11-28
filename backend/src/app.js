import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import tailorRoutes from './routes/tailors.js';
import workRoutes from './routes/works.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import conversationRoutes from './routes/conversations.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import searchRoutes from './routes/search.js';
import guestChatRoutes from './routes/guestChat.js';
import referralRoutes from './routes/referrals.js';
import featuredRoutes from './routes/featured.js';
import settingsRoutes from './routes/settings.js';
import measurementRoutes from './routes/measurements.js';
import orderRoutes from './routes/orders.js';
import uploadRoutes from './routes/uploads.js';
import currencyRoutes from './routes/currency.js';
import verificationRoutes from './routes/verification.js';
import faqRoutes from './routes/faqs.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Make io accessible in routes
app.set('io', io);

// Enable CORS - MUST be before rate limiting so 429 responses include CORS headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow images to load cross-origin
}));

// Body parser - increased limit for base64 image uploads in verification
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Rate limiting (after CORS so rate limit responses include CORS headers)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs (increased for dev)
  message: { success: false, message: 'Too many login attempts, please try again later' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create upload directories if they don't exist
import fs from 'fs';
const uploadDirs = ['uploads/profiles', 'uploads/works', 'uploads/verification', 'uploads/landing', 'uploads/misc'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tailors', tailorRoutes);
app.use('/api/works', workRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/guest-chat', guestChatRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/featured', featuredRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/measurements', measurementRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/faqs', faqRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket.io connection handling
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('user:online', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  // Join conversation room
  socket.on('conversation:join', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  // Leave conversation room
  socket.on('conversation:leave', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Handle new message
  socket.on('message:send', (data) => {
    io.to(`conversation:${data.conversationId}`).emit('message:new', data);
  });

  // Typing indicator
  socket.on('typing:start', (data) => {
    socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
      userId: data.userId,
      conversationId: data.conversationId
    });
  });

  socket.on('typing:stop', (data) => {
    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      userId: data.userId,
      conversationId: data.conversationId
    });
  });

  // Guest chat events
  socket.on('guest:join', (guestId) => {
    socket.join(`guest:${guestId}`);
    socket.guestId = guestId;
    console.log('Guest joined:', guestId);
  });

  socket.on('guest:leave', (guestId) => {
    socket.leave(`guest:${guestId}`);
  });

  // Admin joins admin chat room to receive all guest messages
  socket.on('admin:join-chat', () => {
    socket.join('admin-chat');
    console.log('Admin joined chat room:', socket.id);
  });

  socket.on('admin:leave-chat', () => {
    socket.leave('admin-chat');
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

export { io };
