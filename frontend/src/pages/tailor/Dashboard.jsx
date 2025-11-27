import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiImage, FiStar, FiMessageSquare, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { bookingsAPI, tailorsAPI } from '../../services/api';
import Button from '../../components/common/Button';
import './Dashboard.scss';

export default function TailorDashboard() {
  const { tailorProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await bookingsAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  const isPending = tailorProfile?.approvalStatus === 'pending';
  const isRejected = tailorProfile?.approvalStatus === 'rejected';

  return (
    <div className="tailor-dashboard page">
      <div className="container">
        <div className="page-header">
          <h1>Dashboard</h1>
          <p>Welcome back, {tailorProfile?.businessName || tailorProfile?.username}</p>
        </div>

        {/* Status Alerts */}
        {isPending && (
          <div className="alert alert-warning">
            <FiClock />
            <div>
              <strong>Profile Pending Approval</strong>
              <p>Your profile is being reviewed. You'll be notified once it's approved.</p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="alert alert-error">
            <FiAlertCircle />
            <div>
              <strong>Profile Rejected</strong>
              <p>{tailorProfile?.approvalNote || 'Please update your profile and resubmit.'}</p>
            </div>
          </div>
        )}

        {tailorProfile?.verificationStatus === 'none' && (
          <div className="alert alert-info">
            <FiCheckCircle />
            <div>
              <strong>Get Verified</strong>
              <p>Verified tailors get more visibility and trust from customers.</p>
            </div>
            <Link to="/tailor/settings">
              <Button size="sm">Start Verification</Button>
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FiCalendar />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.stats?.pending || 0}</span>
              <span className="stat-label">Pending Bookings</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon success">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.stats?.completed || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon warning">
              <FiStar />
            </div>
            <div className="stat-content">
              <span className="stat-value">{tailorProfile?.averageRating?.toFixed(1) || '0.0'}</span>
              <span className="stat-label">Average Rating</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <FiImage />
            </div>
            <div className="stat-content">
              <span className="stat-value">{tailorProfile?.workCount || 0}</span>
              <span className="stat-label">Portfolio Items</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/tailor/portfolio" className="action-card">
              <FiImage />
              <span>Manage Portfolio</span>
            </Link>
            <Link to="/tailor/bookings" className="action-card">
              <FiCalendar />
              <span>View Bookings</span>
            </Link>
            <Link to="/tailor/availability" className="action-card">
              <FiClock />
              <span>Set Availability</span>
            </Link>
            <Link to="/messages" className="action-card">
              <FiMessageSquare />
              <span>Messages</span>
            </Link>
          </div>
        </div>

        {/* Upcoming Bookings */}
        {stats?.upcomingBookings?.length > 0 && (
          <div className="upcoming-bookings">
            <h2>Upcoming Bookings</h2>
            <div className="bookings-list">
              {stats.upcomingBookings.map(booking => (
                <div key={booking._id} className="booking-item">
                  <div className="booking-date">
                    <span className="day">{new Date(booking.date).getDate()}</span>
                    <span className="month">{new Date(booking.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="booking-info">
                    <span className="customer-name">
                      {booking.customer?.firstName} {booking.customer?.lastName}
                    </span>
                    <span className="booking-time">{booking.startTime} - {booking.endTime}</span>
                    <span className="booking-service">{booking.service}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/tailor/bookings" className="view-all">View All Bookings →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
