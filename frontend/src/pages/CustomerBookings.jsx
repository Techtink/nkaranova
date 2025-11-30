import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiCheck,
  FiMessageSquare,
  FiShare2,
  FiUser,
  FiScissors,
  FiPackage,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import Button from '../components/common/Button';
import { bookingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CustomerBookings.scss';

// Progress stage icons
const StageIcon = ({ stage, isCompleted, isCurrent }) => {
  const icons = {
    booked: FiCalendar,
    confirmed: FiCheck,
    in_progress: FiScissors,
    completed: FiPackage
  };
  const Icon = icons[stage] || FiCalendar;

  return (
    <div className={`stage-icon ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
      <Icon />
    </div>
  );
};

export default function CustomerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('in-progress');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
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
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysSinceBooking = (createdAt) => {
    const created = new Date(createdAt);
    const today = new Date();
    const diffTime = today - created;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressPercent = (status) => {
    const statusProgress = {
      pending: 25,
      accepted: 50,
      in_progress: 75,
      completed: 100
    };
    return statusProgress[status] || 25;
  };

  const getProgressStages = (status, booking) => {
    const stages = [
      { id: 'booked', label: 'Booked', code: 'BOK' },
      { id: 'confirmed', label: 'Confirmed', code: 'CNF' },
      { id: 'in_progress', label: 'In Progress', code: 'WIP' },
      { id: 'completed', label: 'Completed', code: 'DON' }
    ];

    let currentIndex = 0;
    if (status === 'accepted') currentIndex = 1;
    if (status === 'in_progress') currentIndex = 2;
    if (status === 'completed') currentIndex = 3;

    // Assign dates based on booking data
    const stageDates = {
      booked: booking?.createdAt,
      confirmed: booking?.acceptedAt,
      in_progress: booking?.startedAt,
      completed: booking?.completedAt
    };

    return stages.map((stage, index) => ({
      ...stage,
      isCompleted: index < currentIndex,
      isCurrent: index === currentIndex,
      date: stageDates[stage.id] ? formatDate(stageDates[stage.id]) : null
    }));
  };

  const getCurrentStageLabel = (status) => {
    const labels = {
      pending: 'Pending Confirmation',
      accepted: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      accepted: 'info',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'error',
      rejected: 'error'
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="customer-bookings-page page">
      <div className="container">
        {/* Filter Tabs Header - Centered Pill */}
        <div className="bookings-header-wrapper">
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
              const stages = getProgressStages(booking.status, booking);
              const daysSinceBooking = getDaysSinceBooking(booking.createdAt);
              const progressPercent = getProgressPercent(booking.status);
              const statusColor = getStatusColor(booking.status);

              return (
                <div key={booking._id} className="booking-card">
                  {/* Card Header */}
                  <div className="card-header">
                    <div className="header-left">
                      <span className="service-name">{booking.service || 'Tailoring Service'}</span>
                      <span className={`stage-pill ${statusColor}`}>
                        {getCurrentStageLabel(booking.status)}
                      </span>
                    </div>
                    <button className="share-btn">
                      <FiShare2 />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    {/* Route Row: Customer Name on left, Tailor Name on right */}
                    <div className="route-row">
                      <div className="endpoint customer">
                        <span className="endpoint-name">
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.username || 'Customer'}
                        </span>
                        <span className="endpoint-date">{formatDate(booking.createdAt)}</span>
                      </div>
                      <div className="endpoint tailor">
                        <span className="endpoint-name">
                          {booking.tailor?.businessName || booking.tailor?.username || 'Tailor'}
                        </span>
                        <span className="endpoint-date">
                          {booking.status === 'pending'
                            ? 'Awaiting'
                            : formatDate(booking.acceptedAt || booking.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Row - Progress bar left, Timeline icons right */}
                    <div className="progress-timeline-row">
                      {/* Progress Bar */}
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                      </div>

                      {/* Timeline Container with Nav Arrows */}
                      <div className="timeline-container">
                        <button className="timeline-nav">
                          <FiChevronLeft />
                        </button>
                        <div className="timeline-icons">
                          {stages.map((stage, index) => (
                            <div key={stage.id} className="timeline-stage">
                              <StageIcon
                                stage={stage.id}
                                isCompleted={stage.isCompleted}
                                isCurrent={stage.isCurrent}
                              />
                              {index < stages.length - 1 && (
                                <div className={`connector ${stage.isCompleted ? 'completed' : ''}`} />
                              )}
                              <div className="stage-info">
                                <span className="stage-code">{stage.code}</span>
                                <span className={`stage-label ${!stage.isCompleted && !stage.isCurrent ? 'pending' : ''}`}>
                                  {stage.label}
                                </span>
                                {stage.date && (
                                  <span className="stage-date">{stage.date}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="timeline-nav">
                          <FiChevronRight />
                        </button>
                      </div>

                      {/* Days Indicator */}
                      <div className="days-indicator">
                        <span className="days-count">{daysSinceBooking}</span>
                        <span className="days-label">Days</span>
                      </div>
                    </div>

                    {/* Reference Grid - 3 columns, 2 rows */}
                    <div className="reference-grid">
                      {/* Row 1 */}
                      <div className="ref-item">
                        <span className="ref-label">Booking Ref:</span>
                        <span className="ref-value">{booking._id.slice(-8).toUpperCase()}</span>
                      </div>
                      <div className="ref-item">
                        <span className="ref-label">Shipper:</span>
                        <span className="ref-value">
                          {user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user?.username || 'Customer'}
                        </span>
                      </div>
                      <div className="ref-item">
                        <span className="ref-label">Appointment:</span>
                        <span className="ref-value">{formatDate(booking.date)}</span>
                      </div>
                      {/* Row 2 */}
                      <div className="ref-item">
                        <span className="ref-label">Customer Ref:</span>
                        <span className="ref-value">{user?._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                      </div>
                      <div className="ref-item">
                        <span className="ref-label">Consignee:</span>
                        <span className="ref-value">{booking.tailor?.businessName || booking.tailor?.username || 'N/A'}</span>
                      </div>
                      <div className="ref-item">
                        <span className="ref-label">Time:</span>
                        <span className="ref-value">{booking.startTime} - {booking.endTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="card-actions">
                    <Link to={`/tailor/${booking.tailor?.username}`} className="action-btn primary">
                      <FiUser />
                      View Tailor
                    </Link>
                    <Link to={`/messages?tailor=${booking.tailor?.username}`} className="action-btn secondary">
                      <FiMessageSquare />
                      Message
                    </Link>
                    {['pending', 'accepted'].includes(booking.status) && (
                      <button className="action-btn warning">
                        <FiAlertCircle />
                        Cancel
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
