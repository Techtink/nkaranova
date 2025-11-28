import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiEye, FiPackage, FiChevronLeft, FiChevronRight, FiMessageSquare, FiCalendar, FiUser, FiScissors } from 'react-icons/fi';
import { ordersAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './Admin.scss';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultNotes, setConsultNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [filter, page]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersAPI.getAdminOrders({
        status: filter === 'all' ? undefined : filter,
        page,
        limit: 10,
        search
      });
      setOrders(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || response.data.data?.length || 0);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleCompleteConsultation = async () => {
    if (!selectedOrder) return;

    setSubmitting(true);
    try {
      await ordersAPI.completeConsultation(selectedOrder._id, consultNotes);
      setShowConsultModal(false);
      setShowModal(false);
      setConsultNotes('');
      fetchOrders();
    } catch (error) {
      console.error('Error completing consultation:', error);
      alert(error.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const viewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const openConsultModal = (order) => {
    setSelectedOrder(order);
    setConsultNotes('');
    setShowConsultModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'in_progress': return 'badge-info';
      case 'ready': return 'badge-info';
      case 'consultation': return 'badge-warning';
      case 'awaiting_plan': return 'badge-warning';
      case 'plan_review': return 'badge-warning';
      case 'plan_rejected': return 'badge-error';
      case 'cancelled': return 'badge-error';
      case 'disputed': return 'badge-error';
      default: return 'badge-gray';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      awaiting_plan: 'Awaiting Plan',
      consultation: 'Consultation',
      plan_review: 'Plan Review',
      plan_rejected: 'Plan Rejected',
      in_progress: 'In Progress',
      ready: 'Ready',
      completed: 'Completed',
      cancelled: 'Cancelled',
      disputed: 'Disputed'
    };
    return labels[status] || status;
  };

  const getStageIcon = (stageName) => {
    switch (stageName?.toLowerCase()) {
      case 'consult': return FiMessageSquare;
      case 'design': return FiScissors;
      case 'sew': return FiPackage;
      case 'deliver': return FiCheck;
      default: return FiPackage;
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && orders.length === 0) {
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
                <FiPackage />
              </div>
              <div className="header-text">
                <h1>Manage Orders</h1>
                <p>Monitor and manage customer orders</p>
              </div>
            </div>
          </div>
          <div className="header-line" />
        </div>

        {/* ERP Filters */}
        <div className="erp-filters">
          <form className="search-input" onSubmit={handleSearch}>
            <span className="search-icon"><FiSearch /></span>
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="filter-select">
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="consultation">Consultation</option>
              <option value="awaiting_plan">Awaiting Plan</option>
              <option value="plan_review">Plan Review</option>
              <option value="in_progress">In Progress</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <span className="filter-count">{totalCount} results</span>
        </div>

        {orders.length === 0 ? (
          <div className="erp-table-container">
            <div className="erp-empty-state">
              <FiPackage />
              <p className="empty-title">No orders found</p>
              <p>No orders match the current filters.</p>
            </div>
          </div>
        ) : (
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Tailor</th>
                  <th>Status</th>
                  <th>Current Stage</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="order-cell">
                        <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <FiUser className="user-icon" />
                        <div className="user-info">
                          <span className="name">{order.customer?.firstName} {order.customer?.lastName}</span>
                          <span className="email">{order.customer?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="tailor-cell">
                        <FiScissors className="tailor-icon" />
                        <div className="tailor-info">
                          <span className="name">{order.tailor?.businessName || 'N/A'}</span>
                          <span className="owner">{order.tailor?.user?.firstName} {order.tailor?.user?.lastName}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`erp-badge ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td>
                      {order.workPlan?.stages?.[order.currentStage] ? (
                        <span className="current-stage">
                          {order.workPlan.stages[order.currentStage].displayName || order.workPlan.stages[order.currentStage].name}
                        </span>
                      ) : (
                        <span className="no-stage">-</span>
                      )}
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="cell-actions">
                        <button
                          className="erp-action-btn action-view"
                          onClick={() => viewOrder(order)}
                          title="View details"
                        >
                          <FiEye />
                        </button>
                        {order.status === 'consultation' && (
                          <button
                            className="erp-action-btn action-approve"
                            onClick={() => openConsultModal(order)}
                            title="Complete Consultation"
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
        )}

        {/* Order Detail Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Order Details"
        >
          {selectedOrder && (
            <div className="detail-modal">
              <div className="modal-body">
                <div className="detail-section">
                  <h4>Order Information</h4>
                  <div className="detail-content">
                    <p><strong>Order ID:</strong> #{selectedOrder._id.slice(-6).toUpperCase()}</p>
                    <p><strong>Status:</strong> <span className={`erp-badge ${getStatusBadgeClass(selectedOrder.status)}`}>{getStatusLabel(selectedOrder.status)}</span></p>
                    <p><strong>Created:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Customer</h4>
                  <div className="detail-content">
                    <p><strong>Name:</strong> {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer?.email}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Tailor</h4>
                  <div className="detail-content">
                    <p><strong>Business:</strong> {selectedOrder.tailor?.businessName}</p>
                    <p><strong>Owner:</strong> {selectedOrder.tailor?.user?.firstName} {selectedOrder.tailor?.user?.lastName}</p>
                  </div>
                </div>

                {selectedOrder.workPlan?.stages && (
                  <div className="detail-section">
                    <h4>Work Plan Stages</h4>
                    <div className="stages-list">
                      {selectedOrder.workPlan.stages.map((stage, index) => {
                        const StageIcon = getStageIcon(stage.name);
                        return (
                          <div key={index} className={`stage-item ${stage.status}`}>
                            <div className="stage-icon">
                              <StageIcon />
                            </div>
                            <div className="stage-info">
                              <span className="stage-name">{stage.displayName || stage.name}</span>
                              <span className={`stage-status ${stage.status}`}>
                                {stage.status === 'completed' ? 'Completed' : stage.status === 'in_progress' ? 'In Progress' : 'Pending'}
                              </span>
                            </div>
                            {stage.estimatedDays > 0 && (
                              <span className="stage-days">{stage.estimatedDays} days</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Timeline</h4>
                  <div className="detail-content">
                    {selectedOrder.workPlan?.estimatedCompletion && (
                      <p><strong>Est. Completion:</strong> {formatDate(selectedOrder.workPlan.estimatedCompletion)}</p>
                    )}
                    {selectedOrder.workStartedAt && (
                      <p><strong>Work Started:</strong> {formatDate(selectedOrder.workStartedAt)}</p>
                    )}
                    {selectedOrder.completedAt && (
                      <p><strong>Completed:</strong> {formatDate(selectedOrder.completedAt)}</p>
                    )}
                  </div>
                </div>

                <div className="detail-actions">
                  {selectedOrder.status === 'consultation' && (
                    <Button onClick={() => openConsultModal(selectedOrder)}>
                      Complete Consultation
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setShowModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Complete Consultation Modal */}
        <Modal
          isOpen={showConsultModal}
          onClose={() => setShowConsultModal(false)}
          title="Complete Consultation"
        >
          {selectedOrder && (
            <div className="detail-modal">
              <div className="modal-body">
                <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                  Mark the consultation as complete for order #{selectedOrder._id.slice(-6).toUpperCase()}.
                  This will move the order to the Design phase.
                </p>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label htmlFor="consultNotes">Consultation Notes (optional)</label>
                  <textarea
                    id="consultNotes"
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    placeholder="Add any notes from the consultation..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      resize: 'vertical',
                      marginTop: '8px'
                    }}
                  />
                </div>

                <div className="detail-actions">
                  <Button onClick={handleCompleteConsultation} disabled={submitting}>
                    {submitting ? 'Completing...' : 'Complete Consultation'}
                  </Button>
                  <Button variant="ghost" onClick={() => setShowConsultModal(false)} disabled={submitting}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
