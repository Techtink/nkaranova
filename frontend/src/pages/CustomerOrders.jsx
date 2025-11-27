import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  FiPackage,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiMessageSquare,
  FiThumbsUp,
  FiThumbsDown,
  FiStar,
  FiX
} from 'react-icons/fi';
import Button from '../components/common/Button';
import { ordersAPI } from '../services/api';
import './CustomerOrders.scss';

const ORDER_STATUS = {
  awaiting_plan: { label: 'Awaiting Plan', color: 'warning', description: 'Tailor is preparing your work plan' },
  plan_review: { label: 'Review Plan', color: 'info', description: 'Work plan ready for your approval' },
  plan_rejected: { label: 'Plan Rejected', color: 'error', description: 'Waiting for revised plan' },
  in_progress: { label: 'In Progress', color: 'primary', description: 'Your order is being worked on' },
  ready: { label: 'Ready', color: 'success', description: 'Order complete, ready for pickup' },
  completed: { label: 'Completed', color: 'success', description: 'Order delivered' },
  cancelled: { label: 'Cancelled', color: 'gray', description: 'Order was cancelled' },
  disputed: { label: 'Disputed', color: 'error', description: 'Under review' }
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await ordersAPI.getCustomerOrders(params);
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleApproveWorkPlan = async (orderId) => {
    try {
      await ordersAPI.approveWorkPlan(orderId);
      toast.success('Work plan approved! Work will begin shortly.');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve work plan');
    }
  };

  const handleRejectWorkPlan = async (orderId, reason) => {
    try {
      await ordersAPI.rejectWorkPlan(orderId, reason);
      toast.success('Feedback sent to tailor');
      setShowRejectModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send feedback');
    }
  };

  const handleRespondToDelay = async (orderId, requestId, approved) => {
    try {
      await ordersAPI.respondToDelayRequest(orderId, requestId, approved, '');
      toast.success(approved ? 'Delay approved' : 'Delay declined');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond to delay request');
    }
  };

  const handleMarkCompleted = async (orderId) => {
    setSelectedOrder(orders.find(o => o._id === orderId));
    setShowReviewModal(true);
  };

  const submitCompletion = async (orderId, rating, comment) => {
    try {
      await ordersAPI.markCompleted(orderId, { rating, comment });
      toast.success('Order marked as completed!');
      setShowReviewModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete order');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'primary';
    if (percentage >= 25) return 'warning';
    return 'gray';
  };

  return (
    <div className="customer-orders-page page">
      <div className="container">
        <div className="page-header">
          <h1>My Orders</h1>
          <p>Track progress of your tailoring orders</p>
        </div>

        <div className="filter-tabs">
          {[
            { value: 'all', label: 'All' },
            { value: 'plan_review', label: 'Needs Review' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'ready', label: 'Ready' },
            { value: 'completed', label: 'Completed' }
          ].map(tab => (
            <button
              key={tab.value}
              className={`filter-tab ${filter === tab.value ? 'active' : ''}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <FiPackage style={{ width: 64, height: 64 }} />
            <h3>No orders found</h3>
            <p>You don't have any orders yet.</p>
            <Link to="/tailors">
              <Button>Find a Tailor</Button>
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => {
              const statusInfo = ORDER_STATUS[order.status];
              const isExpanded = expandedOrders[order._id];
              const hasPendingDelay = order.delayRequests?.some(dr => dr.status === 'pending');

              return (
                <div key={order._id} className={`order-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="order-header" onClick={() => toggleOrderExpand(order._id)}>
                    <div className="order-main-info">
                      <div className="tailor-info">
                        <div className="avatar avatar-md">
                          {order.tailor?.profilePhoto ? (
                            <img src={order.tailor.profilePhoto} alt="" />
                          ) : (
                            order.tailor?.username?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <Link
                            to={`/tailor/${order.tailor?.username}`}
                            className="tailor-name"
                            onClick={e => e.stopPropagation()}
                          >
                            {order.tailor?.businessName || order.tailor?.username}
                          </Link>
                          <span className="order-service">{order.booking?.service}</span>
                        </div>
                      </div>

                      <div className="order-status-section">
                        <span className={`badge badge-${statusInfo?.color || 'gray'}`}>
                          {statusInfo?.label || order.status}
                        </span>
                        {order.status === 'in_progress' && order.progressPercentage !== undefined && (
                          <div className="progress-indicator">
                            <div className="progress-bar">
                              <div
                                className={`progress-fill ${getProgressColor(order.progressPercentage)}`}
                                style={{ width: `${order.progressPercentage}%` }}
                              />
                            </div>
                            <span className="progress-text">{order.progressPercentage}%</span>
                          </div>
                        )}
                        {hasPendingDelay && (
                          <span className="delay-badge">
                            <FiAlertCircle /> Delay Request
                          </span>
                        )}
                      </div>
                    </div>

                    <button className="expand-btn">
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="order-details">
                      <p className="status-description">{statusInfo?.description}</p>

                      {/* Work Plan Section */}
                      {order.workPlan?.stages && order.workPlan.stages.length > 0 && (
                        <div className="work-plan-section">
                          <h4>Work Progress</h4>

                          <div className="progress-timeline">
                            {order.workPlan.stages.map((stage, index) => (
                              <div
                                key={stage._id || index}
                                className={`timeline-item ${stage.status}`}
                              >
                                <div className="timeline-marker">
                                  {stage.status === 'completed' ? (
                                    <FiCheck />
                                  ) : stage.status === 'in_progress' ? (
                                    <div className="pulse-dot" />
                                  ) : (
                                    <span>{index + 1}</span>
                                  )}
                                </div>
                                <div className="timeline-content">
                                  <span className="stage-name">{stage.name}</span>
                                  {stage.description && (
                                    <p className="stage-description">{stage.description}</p>
                                  )}
                                  <span className="stage-duration">
                                    <FiClock /> {stage.estimatedDays} day(s)
                                    {stage.status === 'completed' && stage.completedAt && (
                                      <span className="completed-date">
                                        {' '}• Completed {formatDate(stage.completedAt)}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {order.workPlan.estimatedCompletion && (
                            <div className="estimated-completion">
                              <FiClock />
                              <span>
                                Estimated Completion: {formatDate(order.workPlan.estimatedCompletion)}
                                {order.isOverdue && <span className="overdue-text"> (Overdue)</span>}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delay Request Section */}
                      {hasPendingDelay && (
                        <div className="delay-request-section">
                          <h4>Delay Request</h4>
                          {order.delayRequests
                            .filter(dr => dr.status === 'pending')
                            .map(request => (
                              <div key={request._id} className="delay-request-card">
                                <p><strong>Reason:</strong> {request.reason}</p>
                                <p><strong>Additional Days Requested:</strong> {request.additionalDays}</p>
                                <div className="delay-actions">
                                  <Button
                                    size="sm"
                                    onClick={() => handleRespondToDelay(order._id, request._id, true)}
                                  >
                                    <FiThumbsUp /> Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRespondToDelay(order._id, request._id, false)}
                                  >
                                    <FiThumbsDown /> Decline
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="order-actions">
                        {order.status === 'plan_review' && (
                          <>
                            <Button onClick={() => handleApproveWorkPlan(order._id)}>
                              <FiThumbsUp /> Approve Plan
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowRejectModal(true);
                              }}
                            >
                              <FiThumbsDown /> Request Changes
                            </Button>
                          </>
                        )}

                        {order.status === 'ready' && (
                          <Button onClick={() => handleMarkCompleted(order._id)}>
                            <FiCheck /> Confirm Receipt
                          </Button>
                        )}

                        <Link to={`/messages?tailor=${order.tailor?.username}`}>
                          <Button variant="outline" size="sm">
                            <FiMessageSquare /> Message Tailor
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Work Plan Modal */}
      {showRejectModal && selectedOrder && (
        <RejectPlanModal
          order={selectedOrder}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedOrder(null);
          }}
          onSubmit={(reason) => handleRejectWorkPlan(selectedOrder._id, reason)}
        />
      )}

      {/* Completion Review Modal */}
      {showReviewModal && selectedOrder && (
        <CompletionReviewModal
          order={selectedOrder}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedOrder(null);
          }}
          onSubmit={(rating, comment) => submitCompletion(selectedOrder._id, rating, comment)}
        />
      )}
    </div>
  );
}

// Reject Plan Modal
function RejectPlanModal({ order, onClose, onSubmit }) {
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

// Completion Review Modal
function CompletionReviewModal({ order, onClose, onSubmit }) {
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
