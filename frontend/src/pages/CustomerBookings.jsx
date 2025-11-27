import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import Button from '../components/common/Button';
import { bookingsAPI } from '../services/api';
import { BOOKING_STATUS } from '../utils/constants';
import './CustomerBookings.scss';

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bookings-page page">
      <div className="container">
        <div className="page-header">
          <h1>My Bookings</h1>
          <p>Manage your appointments with tailors</p>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {['all', 'pending', 'accepted', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
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
            <p>You haven't made any bookings yet.</p>
            <Link to="/tailors">
              <Button>Find a Tailor</Button>
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => {
              const statusInfo = BOOKING_STATUS[booking.status];

              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-header">
                    <div className="tailor-info">
                      <div className="avatar avatar-md">
                        {booking.tailor?.profilePhoto ? (
                          <img src={booking.tailor.profilePhoto} alt="" />
                        ) : (
                          booking.tailor?.username?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <Link to={`/tailor/${booking.tailor?.username}`} className="tailor-name">
                          {booking.tailor?.businessName || booking.tailor?.username}
                        </Link>
                        <span className={`badge badge-${statusInfo?.color || 'gray'}`}>
                          {statusInfo?.label || booking.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="booking-details">
                    <div className="detail">
                      <FiCalendar />
                      <span>{formatDate(booking.date)}</span>
                    </div>
                    <div className="detail">
                      <FiClock />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                  </div>

                  <div className="booking-service">
                    <strong>Service:</strong> {booking.service}
                  </div>

                  {booking.notes && (
                    <div className="booking-notes">
                      <strong>Notes:</strong> {booking.notes}
                    </div>
                  )}

                  <div className="booking-actions">
                    <Link to={`/messages?tailor=${booking.tailor?.username}`}>
                      <Button variant="outline" size="sm">Message</Button>
                    </Link>
                    {['pending', 'accepted'].includes(booking.status) && (
                      <Button variant="ghost" size="sm">Cancel</Button>
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
