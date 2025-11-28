import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiCheck, FiX, FiFileText, FiPlus, FiMinus, FiClock } from 'react-icons/fi';
import Button from '../../components/common/Button';
import { bookingsAPI } from '../../services/api';
import './Bookings.scss';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', description: 'Awaiting your confirmation' },
  confirmed: { label: 'Confirmed', color: 'info', description: 'Waiting for consultation' },
  consultation_done: { label: 'Needs Quote', color: 'purple', description: 'Submit your quote' },
  quote_submitted: { label: 'Quote Sent', color: 'orange', description: 'Waiting for customer response' },
  quote_accepted: { label: 'Quote Accepted', color: 'teal', description: 'Customer accepted, awaiting payment' },
  paid: { label: 'Paid', color: 'success', description: 'Payment received' },
  converted: { label: 'Converted', color: 'success', description: 'Order created' },
  cancelled: { label: 'Cancelled', color: 'error', description: 'Booking was cancelled' },
  declined: { label: 'Declined', color: 'gray', description: 'You declined this booking' }
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'consultation_done', label: 'Needs Quote' },
  { value: 'quote_submitted', label: 'Quote Sent' },
  { value: 'quote_accepted', label: 'Accepted' },
  { value: 'paid', label: 'Paid' }
];

export default function TailorBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  // Quote modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteData, setQuoteData] = useState({
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    laborCost: 0,
    materialCost: 0,
    notes: '',
    estimatedDays: { design: 3, sew: 7, deliver: 2 }
  });

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
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      await bookingsAPI.confirm(bookingId);
      toast.success('Booking confirmed! The customer has been notified.');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm booking');
    }
  };

  const handleDeclineBooking = async (bookingId) => {
    const reason = prompt('Please provide a reason for declining:');
    if (reason === null) return; // User cancelled

    try {
      await bookingsAPI.cancel(bookingId, reason || 'Declined by tailor');
      toast.success('Booking declined');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to decline booking');
    }
  };

  const openQuoteModal = (booking) => {
    setSelectedBooking(booking);
    setQuoteData({
      items: [{ description: booking.service || '', quantity: 1, unitPrice: 0 }],
      laborCost: 0,
      materialCost: 0,
      notes: '',
      estimatedDays: { design: 3, sew: 7, deliver: 2 }
    });
    setShowQuoteModal(true);
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const totalItems = quoteData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalAmount = totalItems + quoteData.laborCost + quoteData.materialCost;

    if (totalAmount <= 0) {
      toast.error('Please enter valid pricing for the quote');
      return;
    }

    setSubmittingQuote(true);
    try {
      await bookingsAPI.submitQuote(selectedBooking._id, {
        ...quoteData,
        totalAmount
      });
      toast.success('Quote submitted successfully! The customer will be notified.');
      setShowQuoteModal(false);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const updateQuoteItem = (index, field, value) => {
    const newItems = [...quoteData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setQuoteData({ ...quoteData, items: newItems });
  };

  const addQuoteItem = () => {
    setQuoteData({
      ...quoteData,
      items: [...quoteData.items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeQuoteItem = (index) => {
    if (quoteData.items.length > 1) {
      const newItems = quoteData.items.filter((_, i) => i !== index);
      setQuoteData({ ...quoteData, items: newItems });
    }
  };

  const calculateTotal = () => {
    const itemsTotal = quoteData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return itemsTotal + quoteData.laborCost + quoteData.materialCost;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount || 0);
  };

  return (
    <div className="tailor-bookings-page page">
      <div className="container">
        <div className="page-header">
          <h1>Bookings</h1>
          <p>Manage customer appointment requests and submit quotes</p>
        </div>

        <div className="filter-tabs">
          {FILTER_OPTIONS.map(option => (
            <button
              key={option.value}
              className={`filter-tab ${filter === option.value ? 'active' : ''}`}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
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
            <p>No {filter !== 'all' ? STATUS_CONFIG[filter]?.label?.toLowerCase() : ''} bookings at the moment</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => {
              const statusInfo = STATUS_CONFIG[booking.status] || { label: booking.status, color: 'gray' };

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
                      {booking.quote?.totalAmount && (
                        <div className="detail-row quote-amount">
                          <span className="label">Quote:</span>
                          <span className="amount">{formatCurrency(booking.quote.totalAmount)}</span>
                        </div>
                      )}
                    </div>

                    <div className="status-section">
                      <span className={`badge badge-${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="status-description">{statusInfo.description}</span>
                    </div>
                  </div>

                  <div className="booking-actions">
                    {booking.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleConfirmBooking(booking._id)}
                        >
                          <FiCheck /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeclineBooking(booking._id)}
                        >
                          <FiX /> Decline
                        </Button>
                      </>
                    )}

                    {booking.status === 'confirmed' && (
                      <div className="waiting-message">
                        <FiClock />
                        <span>Waiting for admin to mark consultation complete</span>
                      </div>
                    )}

                    {booking.status === 'consultation_done' && (
                      <Button
                        size="sm"
                        className="quote-btn"
                        onClick={() => openQuoteModal(booking)}
                      >
                        <FiFileText /> Submit Quote
                      </Button>
                    )}

                    {['quote_submitted', 'quote_accepted'].includes(booking.status) && (
                      <div className="waiting-message">
                        <FiClock />
                        <span>
                          {booking.status === 'quote_submitted'
                            ? 'Awaiting customer response'
                            : 'Awaiting customer payment'}
                        </span>
                      </div>
                    )}

                    {booking.status === 'converted' && booking.order && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/tailor/orders/${booking.order}`}
                      >
                        View Order
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quote Modal */}
      {showQuoteModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="modal-content quote-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Quote</h2>
              <button className="close-btn" onClick={() => setShowQuoteModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmitQuote}>
              <div className="modal-body">
                <div className="booking-summary">
                  <p><strong>Customer:</strong> {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}</p>
                  <p><strong>Service:</strong> {selectedBooking.service}</p>
                  <p><strong>Date:</strong> {formatDate(selectedBooking.date)}</p>
                </div>

                <div className="form-section">
                  <h3>Items</h3>
                  {quoteData.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => updateQuoteItem(index, 'description', e.target.value)}
                        className="item-description"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        min="1"
                        onChange={(e) => updateQuoteItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="item-qty"
                      />
                      <input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice}
                        min="0"
                        onChange={(e) => updateQuoteItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="item-price"
                      />
                      {quoteData.items.length > 1 && (
                        <button type="button" className="remove-item-btn" onClick={() => removeQuoteItem(index)}>
                          <FiMinus />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-item-btn" onClick={addQuoteItem}>
                    <FiPlus /> Add Item
                  </button>
                </div>

                <div className="form-section">
                  <h3>Additional Costs</h3>
                  <div className="cost-row">
                    <label>Labor Cost</label>
                    <input
                      type="number"
                      value={quoteData.laborCost}
                      min="0"
                      onChange={(e) => setQuoteData({ ...quoteData, laborCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="cost-row">
                    <label>Material Cost</label>
                    <input
                      type="number"
                      value={quoteData.materialCost}
                      min="0"
                      onChange={(e) => setQuoteData({ ...quoteData, materialCost: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>Estimated Timeline (days)</h3>
                  <div className="timeline-row">
                    <div className="timeline-item">
                      <label>Design</label>
                      <input
                        type="number"
                        value={quoteData.estimatedDays.design}
                        min="1"
                        onChange={(e) => setQuoteData({
                          ...quoteData,
                          estimatedDays: { ...quoteData.estimatedDays, design: parseInt(e.target.value) || 1 }
                        })}
                      />
                    </div>
                    <div className="timeline-item">
                      <label>Sewing</label>
                      <input
                        type="number"
                        value={quoteData.estimatedDays.sew}
                        min="1"
                        onChange={(e) => setQuoteData({
                          ...quoteData,
                          estimatedDays: { ...quoteData.estimatedDays, sew: parseInt(e.target.value) || 1 }
                        })}
                      />
                    </div>
                    <div className="timeline-item">
                      <label>Delivery</label>
                      <input
                        type="number"
                        value={quoteData.estimatedDays.deliver}
                        min="1"
                        onChange={(e) => setQuoteData({
                          ...quoteData,
                          estimatedDays: { ...quoteData.estimatedDays, deliver: parseInt(e.target.value) || 1 }
                        })}
                      />
                    </div>
                  </div>
                  <p className="total-days">
                    Total: ~{quoteData.estimatedDays.design + quoteData.estimatedDays.sew + quoteData.estimatedDays.deliver} days
                  </p>
                </div>

                <div className="form-section">
                  <h3>Notes</h3>
                  <textarea
                    placeholder="Additional notes for the customer..."
                    value={quoteData.notes}
                    onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="quote-total">
                  <span>Total Amount:</span>
                  <span className="amount">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>

              <div className="modal-footer">
                <Button type="button" variant="ghost" onClick={() => setShowQuoteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={submittingQuote}>
                  Submit Quote
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
