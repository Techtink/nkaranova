import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
  FiChevronRight,
  FiStar,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiThumbsUp,
  FiThumbsDown,
  FiX
} from 'react-icons/fi';
import Header from '../components/layout/Header';
import Button from '../components/common/Button';
import ReviewModal from '../components/reviews/ReviewModal';
import { bookingsAPI, ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CustomerBookings.scss';

// Progress stage icons
const StageIcon = ({ stage, isCompleted, isCurrent }) => {
  const icons = {
    booked: FiCalendar,
    confirmed: FiCheck,
    quote: FiFileText,
    paid: FiDollarSign,
    in_progress: FiScissors,
    ready: FiPackage,
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
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('in-progress');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const handleOpenReview = (booking) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
  };

  const handleReviewSuccess = () => {
    // Optionally refresh bookings or show a success message
    alert('Thank you! Your review has been submitted and is pending approval.');
  };

  useEffect(() => {
    fetchBookings();
  }, [filter, page]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let params = { page, limit: 10 };
      if (filter === 'pending-approval') {
        // Bookings with orders awaiting work plan approval
        params.status = 'converted';
        params.orderStatus = 'plan_review';
      } else if (filter === 'delay-requests') {
        // Bookings with pending delay requests
        params.status = 'converted';
        params.hasDelayRequest = 'true';
      } else if (filter === 'in-progress') {
        // Include all active statuses (exclude converted with completed orders)
        params.status = 'pending,confirmed,consultation_done,quote_submitted,quote_accepted,paid,converted';
      } else if (filter === 'completed') {
        // Bookings with completed orders
        params.status = 'converted';
        params.orderStatus = 'completed';
      } else if (filter === 'cancelled') {
        params.status = 'cancelled,declined';
      }
      const response = await bookingsAPI.getCustomerBookings(params);
      let fetchedBookings = response.data.data || [];

      // Client-side filtering for special filters (until backend supports)
      if (filter === 'pending-approval') {
        fetchedBookings = fetchedBookings.filter(b => b.order?.status === 'plan_review');
      } else if (filter === 'delay-requests') {
        fetchedBookings = fetchedBookings.filter(b =>
          b.order?.delayRequests?.some(dr => dr.status === 'pending')
        );
      } else if (filter === 'completed') {
        fetchedBookings = fetchedBookings.filter(b => b.order?.status === 'completed');
      } else if (filter === 'in-progress') {
        // Exclude bookings with completed orders from in-progress view
        fetchedBookings = fetchedBookings.filter(b => b.order?.status !== 'completed');
      }

      setBookings(fetchedBookings);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(fetchedBookings.length);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle delay request response
  const handleRespondToDelay = async (orderId, requestId, approved) => {
    try {
      await ordersAPI.respondToDelayRequest(orderId, requestId, approved, '');
      toast.success(approved ? 'Delay approved' : 'Delay declined');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond to delay request');
    }
  };

  // Handle work plan approval
  const handleApproveWorkPlan = async (orderId) => {
    try {
      await ordersAPI.approveWorkPlan(orderId);
      toast.success('Work plan approved! Work will begin shortly.');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve work plan');
    }
  };

  // Handle work plan rejection
  const handleRejectWorkPlan = async (orderId, reason) => {
    try {
      await ordersAPI.rejectWorkPlan(orderId, reason);
      toast.success('Feedback sent to tailor');
      setRejectModalOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send feedback');
    }
  };

  // Handle confirm receipt (mark order complete)
  const handleConfirmReceipt = async (orderId, rating, comment) => {
    try {
      await ordersAPI.markCompleted(orderId, { rating, comment });
      toast.success('Order confirmed as received!');
      setReviewModalOpen(false);
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm receipt');
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
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

  const getProgressPercent = (status, booking) => {
    // If booking has an order, use order progress
    if (booking?.order?.progressPercentage !== undefined) {
      // Map order progress to booking progress (order is 60-100% of total journey)
      return 60 + (booking.order.progressPercentage * 0.4);
    }
    const statusProgress = {
      pending: 15,
      confirmed: 30,
      consultation_done: 40,
      quote_submitted: 50,
      quote_accepted: 55,
      paid: 60,
      converted: 70,
      completed: 100,
      cancelled: 0,
      declined: 0
    };
    return statusProgress[status] || 15;
  };

  const getProgressStages = (status, booking) => {
    // 5-stage timeline: BOK → CNF → QOT → WIP → DON
    const stages = [
      { id: 'booked', label: 'Booked', code: 'BOK' },
      { id: 'confirmed', label: 'Confirmed', code: 'CNF' },
      { id: 'quote', label: 'Quote', code: 'QOT' },
      { id: 'in_progress', label: 'In Progress', code: 'WIP' },
      { id: 'completed', label: 'Completed', code: 'DON' }
    ];

    // Map backend status to stage index
    let currentIndex = 0;
    if (['confirmed', 'consultation_done'].includes(status)) currentIndex = 1;
    if (['quote_submitted', 'quote_accepted'].includes(status)) currentIndex = 2;
    if (['paid', 'converted'].includes(status)) currentIndex = 3;
    if (status === 'completed') currentIndex = 4;

    // If has order, check order status
    if (booking?.order) {
      if (booking.order.status === 'ready') currentIndex = 4;
      if (booking.order.status === 'completed') currentIndex = 4;
    }

    // Assign dates based on booking data
    const stageDates = {
      booked: booking?.createdAt,
      confirmed: booking?.statusHistory?.find(h => h.status === 'confirmed')?.changedAt,
      quote: booking?.quote?.submittedAt,
      in_progress: booking?.order?.workStartedAt || booking?.statusHistory?.find(h => h.status === 'converted')?.changedAt,
      completed: booking?.completedAt || booking?.order?.completedAt
    };

    return stages.map((stage, index) => {
      const isCompleted = index < currentIndex;
      const isCurrent = index === currentIndex;
      const isPending = index > currentIndex;

      let date;
      if (stageDates[stage.id]) {
        date = formatDate(stageDates[stage.id]);
      } else if (isCompleted) {
        date = formatDate(booking?.updatedAt);
      } else if (isCurrent) {
        date = 'Current';
      } else if (isPending) {
        date = 'Pending';
      }

      return {
        ...stage,
        isCompleted,
        isCurrent,
        date
      };
    });
  };

  const getCurrentStageLabel = (status, booking) => {
    // If has order, show order status
    if (booking?.order) {
      const orderLabels = {
        in_progress: 'Work In Progress',
        ready: 'Ready for Pickup',
        completed: 'Completed'
      };
      return orderLabels[booking.order.status] || 'In Progress';
    }
    const labels = {
      pending: 'Pending Confirmation',
      confirmed: 'Confirmed',
      consultation_done: 'Consultation Complete',
      quote_submitted: 'Quote Pending',
      quote_accepted: 'Quote Accepted',
      paid: 'Payment Received',
      converted: 'Work Started',
      completed: 'Completed',
      cancelled: 'Cancelled',
      declined: 'Declined'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status, booking) => {
    // If has order with delay request, show warning
    if (booking?.order?.delayRequests?.some(dr => dr.status === 'pending')) {
      return 'warning';
    }
    if (booking?.order) {
      const orderColors = {
        in_progress: 'info',
        ready: 'success',
        completed: 'success'
      };
      return orderColors[booking.order.status] || 'info';
    }
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      consultation_done: 'info',
      quote_submitted: 'warning',
      quote_accepted: 'info',
      paid: 'success',
      converted: 'info',
      completed: 'success',
      cancelled: 'error',
      declined: 'error'
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="customer-bookings-page page">
      <Header />

      <div className="container">
        {/* ERP Page Header */}
        <div className="erp-page-header">
          <div className="header-top">
            <div className="header-left">
              <div className="header-icon">
                <FiCalendar />
              </div>
              <div className="header-text">
                <h1>My Bookings</h1>
                <p>Track and manage all your tailoring appointments</p>
              </div>
            </div>
          </div>
          <div className="header-line" />
        </div>
        {/* Filter Tabs Header - Centered Pill */}
        <div className="bookings-header-wrapper">
          <div className="bookings-header">
            <div className="filter-tabs">
              <button
                className={`filter-tab ${filter === 'pending-approval' ? 'active' : ''}`}
                onClick={() => handleFilterChange('pending-approval')}
              >
                Pending Approval
              </button>
              <button
                className={`filter-tab ${filter === 'delay-requests' ? 'active' : ''}`}
                onClick={() => handleFilterChange('delay-requests')}
              >
                Delay Requests
              </button>
              <button
                className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`}
                onClick={() => handleFilterChange('in-progress')}
              >
                In-Progress
              </button>
              <button
                className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
                onClick={() => handleFilterChange('completed')}
              >
                Completed
              </button>
              <button
                className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
                onClick={() => handleFilterChange('cancelled')}
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
              const progressPercent = getProgressPercent(booking.status, booking);
              const statusColor = getStatusColor(booking.status, booking);
              const hasPendingDelay = booking?.order?.delayRequests?.some(dr => dr.status === 'pending');
              const workStages = booking?.order?.workPlan?.stages || [];

              return (
                <div key={booking._id} className="booking-card">
                  {/* Card Body */}
                  <div className="card-body">
                    {/* Route Row: Customer Name on left, Tailor Name on right */}
                    <div className="route-row">
                      <div className="endpoint customer">
                        <div className="endpoint-meta">
                          <span className="meta-service">{booking.service || 'Tailoring Service'}</span>
                          <span className={`meta-status ${statusColor}`}>
                            {getCurrentStageLabel(booking.status)}
                          </span>
                        </div>
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
                                <div className={`connector ${stage.isCompleted && index < stages.length - 2 ? 'completed' : ''}`} />
                              )}
                              <div className="stage-info">
                                <span className="stage-code">{stage.code}</span>
                                <span className={`stage-label ${!stage.isCompleted && !stage.isCurrent ? 'pending' : ''}`}>
                                  {stage.label}
                                </span>
                                <span className={`stage-date ${!stage.isCompleted && !stage.isCurrent ? 'pending' : ''}`}>
                                  {stage.date}
                                </span>
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

                    {/* Reference Grid - 3 columns, 2 rows per column */}
                    <div className="reference-grid">
                      {/* Column 1 */}
                      <div className="ref-column">
                        <div className="ref-item">
                          <span className="ref-label">Booking Ref:</span>
                          <span className="ref-value">{booking._id.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="ref-item">
                          <span className="ref-label">Customer Ref:</span>
                          <span className="ref-value">{user?._id?.slice(-8).toUpperCase() || 'N/A'}</span>
                        </div>
                      </div>
                      {/* Column 2 */}
                      <div className="ref-column">
                        <div className="ref-item">
                          <span className="ref-label">Shipper:</span>
                          <span className="ref-value">
                            {user?.firstName && user?.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user?.username || 'Customer'}
                          </span>
                        </div>
                        <div className="ref-item">
                          <span className="ref-label">Consignee:</span>
                          <span className="ref-value">{booking.tailor?.businessName || booking.tailor?.username || 'N/A'}</span>
                        </div>
                      </div>
                      {/* Column 3 */}
                      <div className="ref-column">
                        <div className="ref-item">
                          <span className="ref-label">Appointment:</span>
                          <span className="ref-value">{formatDate(booking.date)}</span>
                        </div>
                        <div className="ref-item">
                          <span className="ref-label">Time:</span>
                          <span className="ref-value">{booking.startTime} - {booking.endTime}</span>
                        </div>
                      </div>
                      {/* Column 4 - Work Stages (only when order exists) */}
                      {workStages.length > 0 && (
                        <div className="ref-column work-stages-column">
                          <div className="ref-item work-stages-header">
                            <span className="ref-label">Work Progress:</span>
                          </div>
                          <div className="work-stages-list">
                            {workStages.map((stage, idx) => (
                              <div key={stage._id || idx} className={`work-stage ${stage.status}`}>
                                <span className="stage-marker">
                                  {stage.status === 'completed' ? <FiCheck /> :
                                   stage.status === 'in_progress' ? <FiScissors /> :
                                   <span className="stage-num">{idx + 1}</span>}
                                </span>
                                <span className="stage-name">{stage.name}</span>
                                <span className="stage-days">{stage.estimatedDays}d</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delay Request Alert */}
                    {hasPendingDelay && (
                      <div className="delay-alert-row">
                        <div className="delay-alert">
                          <FiAlertCircle className="delay-icon" />
                          <div className="delay-content">
                            <span className="delay-title">Delay Request Pending</span>
                            {booking.order.delayRequests
                              .filter(dr => dr.status === 'pending')
                              .map(request => (
                                <div key={request._id} className="delay-request">
                                  <span className="delay-reason">{request.reason}</span>
                                  <span className="delay-days">+{request.additionalDays} days</span>
                                  <div className="delay-actions">
                                    <button
                                      className="delay-btn approve"
                                      onClick={() => handleRespondToDelay(booking.order._id, request._id, true)}
                                    >
                                      <FiThumbsUp /> Approve
                                    </button>
                                    <button
                                      className="delay-btn decline"
                                      onClick={() => handleRespondToDelay(booking.order._id, request._id, false)}
                                    >
                                      <FiThumbsDown /> Decline
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="card-actions">
                    {/* Work Plan Approval Actions */}
                    {booking.order?.status === 'plan_review' && (
                      <>
                        <button
                          className="action-btn success"
                          onClick={() => handleApproveWorkPlan(booking.order._id)}
                        >
                          <FiThumbsUp />
                          Approve Plan
                        </button>
                        <button
                          className="action-btn"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setRejectModalOpen(true);
                          }}
                        >
                          <FiThumbsDown />
                          Request Changes
                        </button>
                      </>
                    )}

                    {/* Confirm Receipt Action */}
                    {booking.order?.status === 'ready' && (
                      <button
                        className="action-btn success"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setReviewModalOpen(true);
                        }}
                      >
                        <FiCheck />
                        Confirm Receipt
                      </button>
                    )}

                    <Link to={`/tailor/${booking.tailor?.username}`} className="action-btn primary">
                      <FiUser />
                      View Tailor
                    </Link>
                    <Link to={`/messages?tailor=${booking.tailor?.username}`} className="action-btn secondary">
                      <FiMessageSquare />
                      Message
                    </Link>
                    {booking.order?.status === 'completed' && !booking.order?.completionFeedback && (
                      <button
                        className="action-btn rating"
                        onClick={() => handleOpenReview(booking)}
                      >
                        <FiStar />
                        Rate & Review
                      </button>
                    )}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <span className="pagination-info">
                  Page {page} of {totalPages} ({totalCount} bookings)
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
        )}
      </div>

      {/* Review Modal - for regular reviews and completed orders */}
      <ReviewModal
        isOpen={reviewModalOpen && (!selectedBooking?.order?.status || selectedBooking?.order?.status === 'completed')}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onSuccess={handleReviewSuccess}
      />

      {/* Confirm Receipt Modal - when order is ready */}
      {reviewModalOpen && selectedBooking?.order?.status === 'ready' && (
        <ConfirmReceiptModal
          booking={selectedBooking}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedBooking(null);
          }}
          onSubmit={(rating, comment) => handleConfirmReceipt(selectedBooking.order._id, rating, comment)}
        />
      )}

      {/* Reject Work Plan Modal */}
      {rejectModalOpen && selectedBooking && (
        <RejectPlanModal
          booking={selectedBooking}
          onClose={() => {
            setRejectModalOpen(false);
            setSelectedBooking(null);
          }}
          onSubmit={(reason) => handleRejectWorkPlan(selectedBooking.order._id, reason)}
        />
      )}
    </div>
  );
}

// Reject Work Plan Modal Component
function RejectPlanModal({ booking, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide feedback');
      return;
    }
    setSubmitting(true);
    await onSubmit(reason);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal reject-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Changes</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <p>Let the tailor know what changes you'd like to see in the work plan:</p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="E.g., I'd like the fitting stage to be longer..."
              rows={4}
              required
            />
            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Send Feedback
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Confirm Receipt Modal Component
function ConfirmReceiptModal({ booking, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(rating, comment);
    setSubmitting(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal review-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Confirm Order Receipt</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>
        <div className="modal-body">
          <p>How was your experience with this order?</p>
          <form onSubmit={handleSubmit}>
            <div className="rating-section">
              <label>Rating</label>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= rating ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    <FiStar />
                  </button>
                ))}
              </div>
            </div>

            <div className="comment-section">
              <label>Feedback (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                <FiCheck /> Confirm Receipt
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
