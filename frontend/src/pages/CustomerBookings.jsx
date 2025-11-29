import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiScissors,
  FiCheck,
  FiMessageSquare,
  FiShare2,
  FiFileText,
  FiAlertCircle
} from 'react-icons/fi';
import Button from '../components/common/Button';
import { bookingsAPI } from '../services/api';
import { BOOKING_STATUS } from '../utils/constants';
import './CustomerBookings.scss';

// Progress stage icons
const StageIcon = ({ stage, isCompleted, isCurrent }) => {
  const icons = {
    booked: FiCalendar,
    confirmed: FiCheck,
    in_progress: FiScissors,
    completed: FiCheck
  };
  const Icon = icons[stage] || FiCalendar;

  return (
    <div className={`stage-icon ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
      <Icon />
    </div>
  );
};

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('in-progress');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Map filter to API status values
      let params = {};
      if (filter === 'in-progress') {
        params.status = 'pending,accepted';
      } else if (filter === 'completed') {
        params.status = 'completed';
      } else if (filter === 'cancelled') {
        params.status = 'cancelled,rejected';
      }
      const response = await bookingsAPI.getCustomerBookings(params);
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
  };

  const formatShortDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getDaysUntil = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressStages = (status) => {
    const stages = [
      { id: 'booked', label: 'Booked' },
      { id: 'confirmed', label: 'Confirmed' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'completed', label: 'Completed' }
    ];

    let currentIndex = 0;
    if (status === 'accepted') currentIndex = 1;
    if (status === 'in_progress') currentIndex = 2;
    if (status === 'completed') currentIndex = 3;

    return stages.map((stage, index) => ({
      ...stage,
      isCompleted: index < currentIndex,
      isCurrent: index === currentIndex
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      accepted: 'info',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error'
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      accepted: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  return (
    <div className="customer-bookings-page page">
      <div className="container">
        {/* Filter Tabs Header */}
        <div className="bookings-header">
          <div className="filter-tabs">
            <button
              className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`}
              onClick={() => setFilter('in-progress')}
            >
              In-Progress
            </button>
            <button
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed
            </button>
            <button
              className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
              onClick={() => setFilter('cancelled')}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <FiCalendar style={{ width: 64, height: 64 }} />
            <h3>No bookings found</h3>
            <p>You don't have any {filter} bookings.</p>
            <Link to="/tailors">
              <Button>Find a Tailor</Button>
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => {
              const stages = getProgressStages(booking.status);
              const daysUntil = getDaysUntil(booking.date);
              const statusColor = getStatusColor(booking.status);

              return (
                <div key={booking._id} className="booking-card">
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="service-type">
                      <span className="service-name">{booking.service || 'Tailoring Service'}</span>
                      <span className={`status-badge ${statusColor}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                    <button className="share-btn">
                      <FiShare2 />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    {/* Left Section - Booking Info */}
                    <div className="booking-info">
                      {/* Route Info */}
                      <div className="route-info">
                        <div className="location">
                          <span className="location-name">
                            {booking.tailor?.businessName || booking.tailor?.username}
                          </span>
                          <span className="location-date">{formatDate(booking.date)}</span>
                        </div>
                        <div className="route-icon">
                          <FiScissors />
                        </div>
                        <div className="location">
                          <span className="location-name">{booking.startTime} - {booking.endTime}</span>
                          <span className="location-date">Appointment Time</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="days-progress">
                        <div
                          className={`progress-bar ${daysUntil <= 0 ? 'overdue' : daysUntil <= 3 ? 'soon' : ''}`}
                          style={{ width: `${Math.min(100, Math.max(10, 100 - (daysUntil * 10)))}%` }}
                        />
                        <span className="days-text">
                          {daysUntil > 0
                            ? `${daysUntil} Days (Until Appointment)`
                            : daysUntil === 0
                              ? 'Today!'
                              : `${Math.abs(daysUntil)} Days Ago`}
                        </span>
                      </div>

                      {/* Reference Details */}
                      <div className="reference-grid">
                        <div className="ref-item">
                          <span className="ref-label">Booking Ref.</span>
                          <span className="ref-value">{booking._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="ref-item">
                          <span className="ref-label">Tailor</span>
                          <span className="ref-value">{booking.tailor?.username || 'N/A'}</span>
                        </div>
                        <div className="ref-item">
                          <span className="ref-label">Service</span>
                          <span className="ref-value">{booking.service || 'Custom'}</span>
                        </div>
                        <div className="ref-item">
                          <span className="ref-label">Duration</span>
                          <span className="ref-value">1 Hour</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Progress Timeline */}
                    <div className="progress-section">
                      <div className="tailor-label">
                        {booking.tailor?.businessName || 'Tailor'}
                      </div>
                      <div className="progress-timeline">
                        {stages.map((stage, index) => (
                          <div key={stage.id} className="timeline-stage">
                            <StageIcon
                              stage={stage.id}
                              isCompleted={stage.isCompleted}
                              isCurrent={stage.isCurrent}
                            />
                            <span className="stage-code">{stage.label.substring(0, 3).toUpperCase()}</span>
                            <span className={`stage-status ${stage.isCompleted ? 'completed' : stage.isCurrent ? 'current' : ''}`}>
                              {stage.isCompleted ? 'Done' : stage.isCurrent ? 'Current' : 'Pending'}
                            </span>
                            {index < stages.length - 1 && (
                              <div className={`connector ${stage.isCompleted ? 'completed' : ''}`} />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="card-actions">
                    <Link to={`/tailor/${booking.tailor?.username}`} className="action-btn primary">
                      <FiUser />
                      View Tailor Profile
                    </Link>
                    <Link to={`/messages?tailor=${booking.tailor?.username}`} className="action-btn secondary">
                      <FiMessageSquare />
                      Message Tailor
                    </Link>
                    {['pending', 'accepted'].includes(booking.status) && (
                      <button className="action-btn warning">
                        <FiAlertCircle />
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
