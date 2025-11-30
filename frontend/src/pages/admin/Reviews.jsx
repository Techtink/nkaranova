import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiX, FiEye, FiStar, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './Admin.scss';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [filter, page]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getReviews({
        status: filter,
        page,
        limit: 10,
        search
      });
      setReviews(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || response.data.data?.length || 0);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleApprove = async (reviewId) => {
    try {
      await adminAPI.approveReview(reviewId);
      fetchReviews();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleReject = async (reviewId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await adminAPI.rejectReview(reviewId, reason);
        fetchReviews();
        setShowModal(false);
      } catch (error) {
        console.error('Error rejecting review:', error);
      }
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await adminAPI.deleteReview(reviewId);
        fetchReviews();
        setShowModal(false);
      } catch (error) {
        console.error('Error deleting review:', error);
      }
    }
  };

  const viewReview = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, index) => (
      <FiStar
        key={index}
        className={index < rating ? 'filled' : 'empty'}
      />
    ));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-error';
      default: return 'badge-gray';
    }
  };

  if (loading && reviews.length === 0) {
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
                <FiStar />
              </div>
              <div className="header-text">
                <h1>Manage Reviews</h1>
                <p>Moderate customer reviews</p>
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
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>

          <div className="filter-select">
            <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <span className="filter-count">{totalCount} results</span>
        </div>

        {reviews.length === 0 ? (
          <div className="erp-table-container">
            <div className="erp-empty-state">
              <FiStar />
              <p className="empty-title">No reviews found</p>
              <p>No reviews match the current filters.</p>
            </div>
          </div>
        ) : (
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Tailor</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={review.customer?.profileImage || '/default-avatar.png'}
                          alt={review.customer?.firstName}
                          className="avatar"
                        />
                        <div className="user-info">
                          <span className="name">
                            {review.customer?.firstName} {review.customer?.lastName}
                          </span>
                          <span className="email">{review.customer?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {review.tailor?.businessName || `${review.tailor?.user?.firstName} ${review.tailor?.user?.lastName}`}
                    </td>
                    <td>
                      <div className="rating">
                        {renderStars(review.rating)}
                      </div>
                    </td>
                    <td>
                      {review.comment?.length > 50
                        ? `${review.comment.substring(0, 50)}...`
                        : review.comment || '-'}
                    </td>
                    <td>
                      <span className={`erp-badge ${getStatusBadgeClass(review.approvalStatus)}`}>
                        {review.approvalStatus}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          className="erp-action-btn action-view"
                          onClick={() => viewReview(review)}
                          title="View details"
                        >
                          <FiEye />
                        </button>
                        {review.approvalStatus === 'pending' && (
                          <>
                            <button
                              className="erp-action-btn action-approve"
                              onClick={() => handleApprove(review._id)}
                              title="Approve"
                            >
                              <FiCheck />
                            </button>
                            <button
                              className="erp-action-btn action-delete"
                              onClick={() => handleReject(review._id)}
                              title="Reject"
                            >
                              <FiX />
                            </button>
                          </>
                        )}
                        <button
                          className="erp-action-btn action-delete"
                          onClick={() => handleDelete(review._id)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
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

        {/* Review Detail Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Review Details"
        >
          {selectedReview && (
            <div className="detail-modal">
              <div className="modal-body">
                <div className="review-content">
                  <div className="review-header">
                    <img
                      src={selectedReview.customer?.profileImage || '/default-avatar.png'}
                      alt={selectedReview.customer?.firstName}
                      className="reviewer-avatar"
                    />
                    <div className="reviewer-info">
                      <span className="reviewer-name">
                        {selectedReview.customer?.firstName} {selectedReview.customer?.lastName}
                      </span>
                      <span className="review-date">
                        {new Date(selectedReview.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="review-rating">
                      {renderStars(selectedReview.rating)}
                    </div>
                  </div>

                  {selectedReview.title && (
                    <div className="review-title">
                      <strong>{selectedReview.title}</strong>
                    </div>
                  )}

                  <div className="review-text">
                    {selectedReview.comment || 'No comment provided'}
                  </div>

                  {selectedReview.recommend !== undefined && (
                    <div className="review-recommend">
                      <span className={`recommend-badge ${selectedReview.recommend ? 'yes' : 'no'}`}>
                        {selectedReview.recommend ? '✓ Would recommend' : '✗ Would not recommend'}
                      </span>
                    </div>
                  )}

                  <div className="review-target">
                    <span className="target-label">Review for:</span>
                    <div className="target-info">
                      <img
                        src={selectedReview.tailor?.user?.profileImage || '/default-avatar.png'}
                        alt={selectedReview.tailor?.businessName}
                      />
                      <span className="target-name">
                        {selectedReview.tailor?.businessName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Booking Information</h4>
                  <div className="detail-content">
                    <p><strong>Booking ID:</strong> {selectedReview.booking?._id || '-'}</p>
                    <p><strong>Service:</strong> {selectedReview.booking?.serviceType || '-'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Status</h4>
                  <div className="detail-content">
                    <p><span className={`status-badge ${selectedReview.approvalStatus}`}>{selectedReview.approvalStatus}</span></p>
                    {selectedReview.rejectionReason && (
                      <p><strong>Rejection Reason:</strong> {selectedReview.rejectionReason}</p>
                    )}
                  </div>
                </div>

                <div className="detail-actions">
                  {selectedReview.approvalStatus === 'pending' && (
                    <>
                      <Button onClick={() => handleApprove(selectedReview._id)}>
                        Approve
                      </Button>
                      <Button variant="outline" onClick={() => handleReject(selectedReview._id)}>
                        Reject
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => handleDelete(selectedReview._id)}>
                    Delete
                  </Button>
                  <Button variant="ghost" onClick={() => setShowModal(false)}>
                    Close
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
