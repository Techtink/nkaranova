import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiCheck, FiCalendar, FiUser, FiDollarSign, FiChevronLeft, FiChevronRight, FiMessageSquare } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';
import './Admin.scss';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Bookings' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'consultation_done', label: 'Consultation Done' },
  { value: 'quote_submitted', label: 'Quote Submitted' },
  { value: 'quote_accepted', label: 'Quote Accepted' },
  { value: 'paid', label: 'Paid' },
  { value: 'converted', label: 'Converted to Order' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'declined', label: 'Declined' }
];

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  consultation_done: 'Consultation Done',
  quote_submitted: 'Quote Submitted',
  quote_accepted: 'Quote Accepted',
  paid: 'Paid',
  converted: 'Converted',
  cancelled: 'Cancelled',
  declined: 'Declined'
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [filter, page]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getBookings({
        status: filter === 'all' ? undefined : filter,
        page,
        limit: 10,
        search
      });
      setBookings(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || response.data.data?.length || 0);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getBookingStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching booking stats:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleMarkConsultationComplete = async () => {
    if (!selectedBooking) return;

    try {
      await adminAPI.markConsultationComplete(selectedBooking._id, consultationNotes);
      fetchBookings();
      fetchStats();
      setShowModal(false);
      setConsultationNotes('');
    } catch (error) {
      console.error('Error marking consultation complete:', error);
      alert(error.response?.data?.message || 'Failed to mark consultation complete');
    }
  };

  const viewBooking = (booking) => {
    setSelectedBooking(booking);
    setConsultationNotes('');
    setShowModal(true);
  };

  const handleChatWithCustomer = (customerId) => {
    navigate(`/admin/chat?userId=${customerId}`);
  };

  const handleChatWithTailor = (tailorUserId) => {
    navigate(`/admin/chat?userId=${tailorUserId}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'confirmed': return 'badge-info';
      case 'consultation_done': return 'badge-purple';
      case 'quote_submitted': return 'badge-orange';
      case 'quote_accepted': return 'badge-teal';
      case 'paid': return 'badge-success';
      case 'converted': return 'badge-success';
      case 'cancelled': return 'badge-error';
      case 'declined': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency
    }).format(amount);
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page page">
      <div className="container">
        {/* ERP Page Header */}
        <div className="erp-page-header">
          <div className="header-top">
            <div className="header-left">
              <div className="header-icon">
                <FiCalendar />
              </div>
              <div className="header-text">
                <h1>Booking Management</h1>
                <p>Manage customer bookings and consultations</p>
              </div>
            </div>
          </div>
          <div className="header-line" />
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="admin-stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.confirmed}</div>
              <div className="stat-label">Confirmed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.consultationDone}</div>
              <div className="stat-label">Awaiting Quote</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.quoteSubmitted}</div>
              <div className="stat-label">Quote Pending</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.paid}</div>
              <div className="stat-label">Paid</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.converted}</div>
              <div className="stat-label">Converted</div>
            </div>
          </div>
        )}

        {/* ERP Filters */}
        <div className="erp-filters">
          <form className="search-input" onSubmit={handleSearch}>
            <span className="search-icon"><FiSearch /></span>
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="filter-select">
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <span className="filter-count">{totalCount} results</span>
        </div>

        {/* Bookings Table */}
        <div className="erp-table-container">
          {bookings.length === 0 ? (
            <div className="erp-empty-state">
              <FiCalendar />
              <p className="empty-title">No bookings found</p>
              <p>No bookings match the current filters.</p>
            </div>
          ) : (
          <table className="erp-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Tailor</th>
              <th>Service</th>
              <th>Date</th>
              <th>Status</th>
              <th>Quote</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking._id}>
                <td>
                  <div className="user-cell">
                    <span className="user-name">
                      {booking.customer?.firstName} {booking.customer?.lastName}
                    </span>
                    <span className="user-email">{booking.customer?.email}</span>
                  </div>
                </td>
                <td>
                  <div className="user-cell">
                    <span className="user-name">
                      {booking.tailor?.businessName || booking.tailor?.username}
                    </span>
                    <span className="user-email">
                      {booking.tailor?.user?.firstName} {booking.tailor?.user?.lastName}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="service-text">{booking.service}</span>
                </td>
                <td>
                  <div className="date-cell">
                    <FiCalendar className="date-icon" />
                    <span>{formatDate(booking.date)}</span>
                    <span className="time-text">{booking.startTime}</span>
                  </div>
                </td>
                <td>
                  <span className={`erp-badge ${getStatusBadgeClass(booking.status)}`}>
                    {STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </td>
                <td>
                  {booking.quote?.totalAmount ? (
                    <span className="quote-amount">
                      {formatCurrency(booking.quote.totalAmount, booking.quote.currency)}
                    </span>
                  ) : (
                    <span className="no-quote">-</span>
                  )}
                </td>
                <td>
                  <div className="cell-actions">
                    <button
                      className="erp-action-btn action-view"
                      onClick={() => viewBooking(booking)}
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    {booking.status === 'confirmed' && (
                      <button
                        className="erp-action-btn action-approve"
                        onClick={() => viewBooking(booking)}
                        title="Mark Consultation Complete"
                      >
                        <FiCheck />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          )}

          {totalPages > 1 && (
            <div className="erp-pagination">
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <div className="pagination-buttons">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <FiChevronLeft />
                </button>
                <button className="active">{page}</button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </div>

      {/* Booking Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Booking Details"
        size="large"
      >
        {selectedBooking && (
          <div className="booking-details">
            {/* Status Banner */}
            <div className={`status-banner ${getStatusBadgeClass(selectedBooking.status)}`}>
              <span className={`badge ${getStatusBadgeClass(selectedBooking.status)}`}>
                {STATUS_LABELS[selectedBooking.status] || selectedBooking.status}
              </span>
            </div>

            {/* Customer & Tailor Info */}
            <div className="detail-section">
              <h4>Parties</h4>
              <div className="parties-grid">
                <div className="party-card">
                  <div className="party-header">
                    <FiUser />
                    <span>Customer</span>
                  </div>
                  <p className="party-name">
                    {selectedBooking.customer?.firstName} {selectedBooking.customer?.lastName}
                  </p>
                  <p className="party-email">{selectedBooking.customer?.email}</p>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleChatWithCustomer(selectedBooking.customer?._id)}
                  >
                    <FiMessageSquare /> Chat
                  </Button>
                </div>
                <div className="party-card">
                  <div className="party-header">
                    <FiUser />
                    <span>Tailor</span>
                  </div>
                  <p className="party-name">
                    {selectedBooking.tailor?.businessName || selectedBooking.tailor?.username}
                  </p>
                  <p className="party-email">
                    {selectedBooking.tailor?.user?.firstName} {selectedBooking.tailor?.user?.lastName}
                  </p>
                  <Button
                    size="small"
                    variant="outline"
                    onClick={() => handleChatWithTailor(selectedBooking.tailor?.user?._id)}
                  >
                    <FiMessageSquare /> Chat
                  </Button>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="detail-section">
              <h4>Service Details</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Service</label>
                  <span>{selectedBooking.service}</span>
                </div>
                <div className="detail-item">
                  <label>Consultation Date</label>
                  <span>{formatDate(selectedBooking.date)} at {selectedBooking.startTime}</span>
                </div>
                {selectedBooking.notes && (
                  <div className="detail-item full-width">
                    <label>Customer Notes</label>
                    <span>{selectedBooking.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quote Information */}
            {selectedBooking.quote?.submittedAt && (
              <div className="detail-section">
                <h4>Quote Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Total Amount</label>
                    <span className="amount">
                      {formatCurrency(selectedBooking.quote.totalAmount, selectedBooking.quote.currency)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Submitted</label>
                    <span>{formatDateTime(selectedBooking.quote.submittedAt)}</span>
                  </div>
                  {selectedBooking.quote.laborCost > 0 && (
                    <div className="detail-item">
                      <label>Labor Cost</label>
                      <span>{formatCurrency(selectedBooking.quote.laborCost, selectedBooking.quote.currency)}</span>
                    </div>
                  )}
                  {selectedBooking.quote.materialCost > 0 && (
                    <div className="detail-item">
                      <label>Material Cost</label>
                      <span>{formatCurrency(selectedBooking.quote.materialCost, selectedBooking.quote.currency)}</span>
                    </div>
                  )}
                  {selectedBooking.quote.totalEstimatedDays && (
                    <div className="detail-item">
                      <label>Estimated Timeline</label>
                      <span>{selectedBooking.quote.totalEstimatedDays} days</span>
                    </div>
                  )}
                  {selectedBooking.quote.notes && (
                    <div className="detail-item full-width">
                      <label>Quote Notes</label>
                      <span>{selectedBooking.quote.notes}</span>
                    </div>
                  )}
                </div>

                {/* Quote Items */}
                {selectedBooking.quote.items?.length > 0 && (
                  <div className="quote-items">
                    <h5>Quote Items</h5>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedBooking.quote.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>{formatCurrency(item.unitPrice, selectedBooking.quote.currency)}</td>
                            <td>{formatCurrency(item.quantity * item.unitPrice, selectedBooking.quote.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Customer Response */}
                {selectedBooking.quote.customerResponse && (
                  <div className="customer-response">
                    <h5>Customer Response</h5>
                    <span className={`badge ${
                      selectedBooking.quote.customerResponse.status === 'accepted' ? 'badge-success' :
                      selectedBooking.quote.customerResponse.status === 'rejected' ? 'badge-error' :
                      'badge-warning'
                    }`}>
                      {selectedBooking.quote.customerResponse.status}
                    </span>
                    {selectedBooking.quote.customerResponse.rejectionReason && (
                      <p className="rejection-reason">
                        Reason: {selectedBooking.quote.customerResponse.rejectionReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Consultation Completion Action */}
            {selectedBooking.status === 'confirmed' && (
              <div className="detail-section action-section">
                <h4>Mark Consultation Complete</h4>
                <p className="action-description">
                  After the tailor has completed the consultation with the customer, mark it as complete
                  so the tailor can submit a quote.
                </p>
                <div className="form-group">
                  <label>Consultation Notes (optional)</label>
                  <textarea
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder="Add any notes about the consultation..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleMarkConsultationComplete}>
                  <FiCheck /> Mark Consultation Complete
                </Button>
              </div>
            )}

            {/* Timeline */}
            <div className="detail-section">
              <h4>Timeline</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <span className="timeline-label">Created</span>
                  <span className="timeline-date">{formatDateTime(selectedBooking.createdAt)}</span>
                </div>
                {selectedBooking.consultation?.completedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Consultation Completed</span>
                    <span className="timeline-date">{formatDateTime(selectedBooking.consultation.completedAt)}</span>
                  </div>
                )}
                {selectedBooking.quote?.submittedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Quote Submitted</span>
                    <span className="timeline-date">{formatDateTime(selectedBooking.quote.submittedAt)}</span>
                  </div>
                )}
                {selectedBooking.quote?.customerResponse?.respondedAt && (
                  <div className="timeline-item">
                    <span className="timeline-label">Customer Response</span>
                    <span className="timeline-date">{formatDateTime(selectedBooking.quote.customerResponse.respondedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
}
