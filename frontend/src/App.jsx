import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
// import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';
import TailorLayout from './components/layout/TailorLayout';
import GuestChat from './components/chat/GuestChat';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import TailorsList from './pages/TailorsList';
import TailorProfile from './pages/TailorProfile';
import Gallery from './pages/Gallery';
import AISearch from './pages/AISearch';
import Messages from './pages/Messages';
import CustomerBookings from './pages/CustomerBookings';
import CustomerOrders from './pages/CustomerOrders';
import Settings from './pages/Settings';
import Measurements from './pages/Measurements';

// Tailor Dashboard Pages
import TailorDashboard from './pages/tailor/Dashboard';
import TailorPortfolio from './pages/tailor/Portfolio';
import TailorBookings from './pages/tailor/Bookings';
import TailorAvailability from './pages/tailor/Availability';
import TailorSettings from './pages/tailor/Settings';
import TailorReferrals from './pages/tailor/Referrals';
import TailorMeasurements from './pages/tailor/Measurements';
import TailorOrders from './pages/tailor/Orders';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminTailors from './pages/admin/Tailors';
import AdminWorks from './pages/admin/Works';
import AdminReviews from './pages/admin/Reviews';
import AdminVerifications from './pages/admin/Verifications';
import AdminGuestChats from './pages/admin/GuestChats';
import AdminSettings from './pages/admin/Settings';
import AdminReferrals from './pages/admin/Referrals';
import AdminFeaturedTailors from './pages/admin/FeaturedTailors';
import AdminTeam from './pages/admin/Team';

// Protected Route Component
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <div className="loading-container" style={{ minHeight: '100vh' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* <Header /> */}
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tailors" element={<TailorsList />} />
          <Route path="/tailor/:username" element={<TailorProfile />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/ai-search" element={<AISearch />} />

          {/* Protected Customer Routes */}
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute roles={['customer']}>
                <CustomerBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute roles={['customer']}>
                <CustomerOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/measurements"
            element={
              <ProtectedRoute>
                <Measurements />
              </ProtectedRoute>
            }
          />

          {/* Tailor Dashboard Routes with Layout */}
          <Route
            path="/tailor"
            element={
              <ProtectedRoute roles={['tailor']}>
                <TailorLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<TailorDashboard />} />
            <Route path="portfolio" element={<TailorPortfolio />} />
            <Route path="bookings" element={<TailorBookings />} />
            <Route path="orders" element={<TailorOrders />} />
            <Route path="availability" element={<TailorAvailability />} />
            <Route path="measurements" element={<TailorMeasurements />} />
            <Route path="settings" element={<TailorSettings />} />
            <Route path="referrals" element={<TailorReferrals />} />
          </Route>

          {/* Admin Routes with Layout */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="tailors" element={<AdminTailors />} />
            <Route path="works" element={<AdminWorks />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="guest-chats" element={<AdminGuestChats />} />
            <Route path="referrals" element={<AdminReferrals />} />
            <Route path="featured" element={<AdminFeaturedTailors />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="page">
                <div className="container">
                  <div className="empty-state">
                    <h1>404</h1>
                    <p>Page not found</p>
                  </div>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
      <GuestChat />
    </div>
  );
}
