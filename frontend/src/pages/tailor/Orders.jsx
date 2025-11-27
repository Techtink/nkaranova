import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiPlus,
  FiTrash2,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiSend,
  FiX
} from 'react-icons/fi';
import Button from '../../components/common/Button';
import { ordersAPI } from '../../services/api';
import './Orders.scss';

const ORDER_STATUS = {
  awaiting_plan: { label: 'Awaiting Plan', color: 'warning' },
  plan_review: { label: 'Plan Review', color: 'info' },
  plan_rejected: { label: 'Plan Rejected', color: 'error' },
  in_progress: { label: 'In Progress', color: 'primary' },
  ready: { label: 'Ready', color: 'success' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'gray' },
  disputed: { label: 'Disputed', color: 'error' }
};

export default function TailorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('awaiting_plan');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await ordersAPI.getTailorOrders(params);
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

  const openPlanModal = (order) => {
    setSelectedOrder(order);
    setShowPlanModal(true);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDeadline = (deadline) => {
    const now = new Date();
    const dl = new Date(deadline);
    const diff = dl - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 0) return { text: 'Overdue', isOverdue: true };
    if (hours < 24) return { text: `${hours} hours left`, isUrgent: true };
    const days = Math.ceil(hours / 24);
    return { text: `${days} day${days > 1 ? 's' : ''} left`, isOverdue: false };
  };

  return (
    <div className="tailor-orders-page page">
      <div className="container">
        <div className="page-header">
          <h1>Orders</h1>
          <p>Manage customer orders and work plans</p>
        </div>

        <div className="filter-tabs">
          {[
            { value: 'awaiting_plan', label: 'Needs Plan' },
            { value: 'plan_rejected', label: 'Rejected' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'ready', label: 'Ready' },
            { value: 'completed', label: 'Completed' },
            { value: 'all', label: 'All' }
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
            <h3>No orders</h3>
            <p>No {filter !== 'all' ? ORDER_STATUS[filter]?.label.toLowerCase() : ''} orders at the moment</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => {
              const statusInfo = ORDER_STATUS[order.status];
              const isExpanded = expandedOrders[order._id];
              const deadlineInfo = order.status === 'awaiting_plan'
                ? formatDeadline(order.planDeadline)
                : null;

              return (
                <div key={order._id} className={`order-card ${isExpanded ? 'expanded' : ''}`}>
                  <div className="order-header" onClick={() => toggleOrderExpand(order._id)}>
                    <div className="order-main-info">
                      <div className="customer-info">
                        <div className="avatar avatar-md">
                          {order.customer?.avatar ? (
                            <img src={order.customer.avatar} alt="" />
                          ) : (
                            order.customer?.firstName?.charAt(0)
                          )}
                        </div>
                        <div>
                          <span className="customer-name">
                            {order.customer?.firstName} {order.customer?.lastName}
                          </span>
                          <span className="order-service">{order.booking?.service}</span>
                        </div>
                      </div>

                      <div className="order-meta">
                        <span className={`badge badge-${statusInfo?.color || 'gray'}`}>
                          {statusInfo?.label || order.status}
                        </span>
                        {deadlineInfo && (
                          <span className={`deadline ${deadlineInfo.isOverdue ? 'overdue' : ''} ${deadlineInfo.isUrgent ? 'urgent' : ''}`}>
                            <FiClock /> {deadlineInfo.text}
                          </span>
                        )}
                        {order.status === 'in_progress' && order.progressPercentage !== undefined && (
                          <span className="progress-badge">
                            {order.progressPercentage}% complete
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
                      <div className="details-grid">
                        <div className="detail-section">
                          <h4>Booking Details</h4>
                          <div className="detail-row">
                            <span className="label">Date:</span>
                            <span>{formatDate(order.booking?.date)}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Service:</span>
                            <span>{order.booking?.service}</span>
                          </div>
                          {order.booking?.notes && (
                            <div className="detail-row">
                              <span className="label">Notes:</span>
                              <span>{order.booking.notes}</span>
                            </div>
                          )}
                        </div>

                        {order.workPlan?.stages && order.workPlan.stages.length > 0 && (
                          <div className="detail-section">
                            <h4>Work Plan</h4>
                            <div className="stages-list">
                              {order.workPlan.stages.map((stage, index) => (
                                <div
                                  key={stage._id || index}
                                  className={`stage-item ${stage.status}`}
                                >
                                  <div className="stage-indicator">
                                    {stage.status === 'completed' ? (
                                      <FiCheck />
                                    ) : stage.status === 'in_progress' ? (
                                      <span className="pulse" />
                                    ) : (
                                      <span className="number">{index + 1}</span>
                                    )}
                                  </div>
                                  <div className="stage-info">
                                    <span className="stage-name">{stage.name}</span>
                                    <span className="stage-days">{stage.estimatedDays} day(s)</span>
                                  </div>
                                  {order.status === 'in_progress' && stage.status === 'in_progress' && (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCompleteStage(order._id, index);
                                      }}
                                    >
                                      <FiCheck /> Complete
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {order.workPlan.estimatedCompletion && (
                              <div className="estimated-completion">
                                <FiClock />
                                Est. Completion: {formatDate(order.workPlan.estimatedCompletion)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="order-actions">
                        {(order.status === 'awaiting_plan' || order.status === 'plan_rejected') && (
                          <Button onClick={() => openPlanModal(order)}>
                            <FiEdit2 /> Create Work Plan
                          </Button>
                        )}
                        {order.status === 'in_progress' && (
                          <Button variant="ghost" onClick={() => handleRequestDelay(order._id)}>
                            <FiClock /> Request Delay
                          </Button>
                        )}
                      </div>

                      {order.status === 'plan_rejected' && order.workPlan?.rejectionReason && (
                        <div className="rejection-notice">
                          <FiAlertCircle />
                          <div>
                            <strong>Customer Feedback:</strong>
                            <p>{order.workPlan.rejectionReason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showPlanModal && selectedOrder && (
        <WorkPlanModal
          order={selectedOrder}
          onClose={() => {
            setShowPlanModal(false);
            setSelectedOrder(null);
          }}
          onSubmit={() => {
            setShowPlanModal(false);
            setSelectedOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}

// Work Plan Modal Component
function WorkPlanModal({ order, onClose, onSubmit }) {
  const [stages, setStages] = useState([
    { name: '', description: '', estimatedDays: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addStage = () => {
    setStages([...stages, { name: '', description: '', estimatedDays: 1 }]);
  };

  const removeStage = (index) => {
    if (stages.length > 1) {
      setStages(stages.filter((_, i) => i !== index));
    }
  };

  const updateStage = (index, field, value) => {
    const newStages = [...stages];
    newStages[index][field] = value;
    setStages(newStages);
  };

  const totalDays = stages.reduce((sum, s) => sum + (parseInt(s.estimatedDays) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const invalidStages = stages.filter(s => !s.name.trim() || s.estimatedDays < 1);
    if (invalidStages.length > 0) {
      toast.error('Please fill in all stage names and durations');
      return;
    }

    setSubmitting(true);
    try {
      await ordersAPI.submitWorkPlan(order._id, stages);
      toast.success('Work plan submitted successfully');
      onSubmit();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit work plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal work-plan-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Work Plan</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="order-summary">
            <h4>Order Details</h4>
            <p><strong>Customer:</strong> {order.customer?.firstName} {order.customer?.lastName}</p>
            <p><strong>Service:</strong> {order.booking?.service}</p>
            {order.booking?.notes && <p><strong>Notes:</strong> {order.booking.notes}</p>}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="stages-form">
              <h4>Work Stages</h4>
              <p className="form-help">Break down the work into stages with estimated durations</p>

              {stages.map((stage, index) => (
                <div key={index} className="stage-input-group">
                  <div className="stage-number">{index + 1}</div>
                  <div className="stage-fields">
                    <input
                      type="text"
                      placeholder="Stage name (e.g., Fabric Selection)"
                      value={stage.name}
                      onChange={(e) => updateStage(index, 'name', e.target.value)}
                      required
                    />
                    <textarea
                      placeholder="Description (optional)"
                      value={stage.description}
                      onChange={(e) => updateStage(index, 'description', e.target.value)}
                      rows={2}
                    />
                    <div className="days-input">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={stage.estimatedDays}
                        onChange={(e) => updateStage(index, 'estimatedDays', parseInt(e.target.value) || 1)}
                        required
                      />
                      <span>day(s)</span>
                    </div>
                  </div>
                  {stages.length > 1 && (
                    <button
                      type="button"
                      className="remove-stage-btn"
                      onClick={() => removeStage(index)}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}

              <button type="button" className="add-stage-btn" onClick={addStage}>
                <FiPlus /> Add Stage
              </button>
            </div>

            <div className="plan-summary">
              <div className="summary-item">
                <span>Total Stages:</span>
                <strong>{stages.length}</strong>
              </div>
              <div className="summary-item">
                <span>Total Estimated Days:</span>
                <strong>{totalDays}</strong>
              </div>
              <div className="summary-item">
                <span>Est. Completion:</span>
                <strong>
                  {new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                <FiSend /> Submit Plan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper function for completing stages
async function handleCompleteStage(orderId, stageIndex) {
  try {
    await ordersAPI.completeStage(orderId, stageIndex, '');
    toast.success('Stage marked as complete');
    window.location.reload(); // Simple refresh for now
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to complete stage');
  }
}

// Helper function for delay requests
async function handleRequestDelay(orderId) {
  const reason = prompt('Please provide a reason for the delay:');
  if (!reason) return;

  const days = prompt('How many additional days do you need?');
  if (!days || isNaN(parseInt(days))) return;

  try {
    await ordersAPI.requestDelay(orderId, reason, parseInt(days));
    toast.success('Delay request submitted');
    window.location.reload();
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to submit delay request');
  }
}
