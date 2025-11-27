import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiCheck, FiX, FiCheckCircle } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { bookingsAPI } from '../../services/api';
import { BOOKING_STATUS } from '../../utils/constants';
import './Bookings.scss';

export default function TailorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await bookingsAPI.getTailorBookings(params);
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId, status, note = '') => {
    try {
      await bookingsAPI.updateStatus(bookingId, { status, note });
      toast.success(`Booking ${status}`);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update booking');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="tailor-bookings-page page">
      <div className="container">
        <div className="page-header">
          <h1>Bookings</h1>
          <p>Manage customer appointment requests</p>
        </div>

        <div className="filter-tabs">
          {['pending', 'accepted', 'completed', 'all'].map(status => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="empty-state">
            <h3>No bookings</h3>
            <p>No {filter !== 'all' ? filter : ''} bookings at the moment</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => {
              const statusInfo = BOOKING_STATUS[booking.status];

              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-main">
                    <div className="customer-info">
                      <div className="avatar avatar-md">
                        {booking.customer?.avatar ? (
                          <img src={booking.customer.avatar} alt="" />
                        ) : (
                          booking.customer?.firstName?.charAt(0)
                        )}
                      </div>
                      <div>
                        <span className="customer-name">
                          {booking.customer?.firstName} {booking.customer?.lastName}
                        </span>
                        <span className="customer-email">{booking.customer?.email}</span>
                      </div>
                    </div>

                    <div className="booking-details">
                      <div className="detail-row">
                        <span className="label">Date:</span>
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Time:</span>
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Service:</span>
                        <span>{booking.service}</span>
                      </div>
                      {booking.notes && (
                        <div className="detail-row">
                          <span className="label">Notes:</span>
                          <span>{booking.notes}</span>
                        </div>
                      )}
                    </div>

                    <span className={`badge badge-${statusInfo?.color || 'gray'}`}>
                      {statusInfo?.label || booking.status}
                    </span>
                  </div>

                  {booking.status === 'pending' && (
                    <div className="booking-actions">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(booking._id, 'accepted')}
                      >
                        <FiCheck /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStatusUpdate(booking._id, 'declined', 'Schedule conflict')}
                      >
                        <FiX /> Decline
                      </Button>
                    </div>
                  )}

                  {booking.status === 'accepted' && (
                    <div className="booking-actions">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(booking._id, 'completed')}
                      >
                        <FiCheckCircle /> Mark Complete
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
