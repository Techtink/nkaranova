# Tailor Connect - Implementation Plan

## Project Overview
A marketplace platform connecting customers with tailors worldwide, with secure in-platform communication and booking.

## Tech Stack
- **Frontend**: React 18 + Vite, SCSS, React Router v6
- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with HTTP-only cookies
- **File Upload**: Multer + cloud storage (configurable)
- **Real-time**: Socket.io for messaging

---

## Phase 1: Project Setup & Core Infrastructure

### 1.1 Project Structure
```
nkaranova/
├── backend/
│   ├── src/
│   │   ├── config/         # DB, env, constants
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers
│   │   └── app.js          # Express app
│   ├── uploads/            # Local file storage
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── assets/         # Images, fonts
│   │   ├── components/     # Reusable components
│   │   ├── context/        # React context (auth, etc.)
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   ├── styles/         # SCSS files
│   │   ├── utils/          # Helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── package.json
└── README.md
```

### 1.2 Database Models
1. **User** - Authentication (email, password, role: customer/tailor/admin)
2. **TailorProfile** - Extended tailor info (linked to User)
3. **Work** - Portfolio items
4. **Review** - Customer ratings
5. **Conversation** - Message threads
6. **Message** - Individual messages
7. **Booking** - Appointments
8. **TailorAvailability** - Weekly schedule

---

## Phase 2: Authentication & User Management

- User registration (customer/tailor flows)
- Login/logout with JWT
- Password reset flow
- Role-based access control
- Profile management

---

## Phase 3: Tailor Features

### 3.1 Profile Management
- Username, business name, bio, location
- Specialties selection
- Profile photo upload
- Private contact info (admin-only visible)

### 3.2 Portfolio Builder
- Work upload with images
- Categories, descriptions, fabric types
- Edit/delete works

### 3.3 Availability Manager
- Weekly schedule setup
- Working hours per day

### 3.4 Verification System
- Document upload
- Verification status tracking

---

## Phase 4: Customer Features

### 4.1 Discovery
- Gallery/homepage with featured works
- Search by category/location
- Filter and sort options

### 4.2 Tailor Profiles (Public View)
- View bio, works, reviews
- Verification badge display

### 4.3 Booking System
- View tailor availability
- Book appointments
- Manage bookings

### 4.4 Reviews
- Leave ratings (1-5 stars)
- Write review text
- View all reviews

---

## Phase 5: Messaging System

- Conversation creation
- Real-time messaging with Socket.io
- Message history
- Unread indicators

---

## Phase 6: Admin Panel

- Dashboard with analytics
- Tailor approval workflow
- Work moderation
- Review moderation
- Verification management
- View all conversations

---

## Phase 7: AI Features (Future Enhancement)

- AI-powered tailor finder
- Personalized recommendations
- This can be added later with OpenAI integration

---

## Implementation Order

1. **Setup** - Project scaffolding, dependencies, configs
2. **Database** - All Mongoose models
3. **Auth API** - Register, login, JWT middleware
4. **Tailor API** - Profile, works, availability
5. **Customer API** - Browse, search, reviews
6. **Booking API** - Create, manage appointments
7. **Messaging API** - Conversations, messages, Socket.io
8. **Admin API** - Moderation endpoints
9. **Frontend Auth** - Login, register pages
10. **Frontend Public** - Gallery, tailor profiles
11. **Frontend Tailor Dashboard** - All tailor features
12. **Frontend Customer** - Booking, messaging, reviews
13. **Frontend Admin** - Admin dashboard
14. **Styling** - SCSS theming, responsive design

---

## Decisions Made

1. **File Storage**: Local storage initially (can migrate to cloud later)
2. **AI Features**: Include AI-powered tailor finder in initial build
3. **Email Notifications**: Yes - for bookings and messages (Nodemailer)
4. **Payment Integration**: Stripe for payments/escrow
5. **Deployment Target**: DigitalOcean

---

## Additional Phases

### Phase 7: Payment System (Stripe)
- Stripe Connect for tailor payouts
- Escrow system (hold payment until service complete)
- Payment history

### Phase 8: Email Notifications
- Booking confirmations
- Message notifications
- Verification status updates

### Phase 9: AI Tailor Finder
- OpenAI integration
- Natural language search
- Personalized recommendations based on history
