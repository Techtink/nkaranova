import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiX, FiEye, FiTrash2, FiScissors, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './Admin.scss';

export default function AdminTailors() {
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedTailor, setSelectedTailor] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchTailors();
  }, [filter, page]);

  const fetchTailors = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getTailors({
        status: filter,
        page,
        limit: 10,
        search
      });
      setTailors(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || response.data.data?.length || 0);
    } catch (error) {
      console.error('Error fetching tailors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTailors();
  };

  const handleApprove = async (tailorId) => {
    try {
      await adminAPI.approveTailor(tailorId);
      fetchTailors();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving tailor:', error);
    }
  };

  const handleReject = async (tailorId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await adminAPI.rejectTailor(tailorId, reason);
        fetchTailors();
        setShowModal(false);
      } catch (error) {
        console.error('Error rejecting tailor:', error);
      }
    }
  };

  const handleSuspend = async (tailorId) => {
    const reason = prompt('Enter suspension reason:');
    if (reason) {
      try {
        await adminAPI.suspendTailor(tailorId, reason);
        fetchTailors();
        setShowModal(false);
      } catch (error) {
        console.error('Error suspending tailor:', error);
      }
    }
  };

  const viewTailor = (tailor) => {
    setSelectedTailor(tailor);
    setShowModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-error';
      case 'suspended': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  if (loading && tailors.length === 0) {
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
                <FiScissors />
              </div>
              <div className="header-text">
                <h1>Manage Tailors</h1>
                <p>Review and manage tailor profiles</p>
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
              placeholder="Search tailors..."
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
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <span className="filter-count">{totalCount} results</span>
        </div>

        {tailors.length === 0 ? (
          <div className="erp-table-container">
            <div className="erp-empty-state">
              <FiScissors />
              <p className="empty-title">No tailors found</p>
              <p>No tailors match the current filters.</p>
            </div>
          </div>
        ) : (
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Tailor</th>
                  <th>Business</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tailors.map((tailor) => (
                  <tr key={tailor._id}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={tailor.user?.profileImage || '/default-avatar.png'}
                          alt={tailor.user?.firstName}
                          className="avatar"
                        />
                        <div className="user-info">
                          <span className="name">
                            {tailor.user?.firstName} {tailor.user?.lastName}
                          </span>
                          <span className="email">{tailor.user?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{tailor.businessName || '-'}</td>
                    <td>
                      {tailor.location?.city && tailor.location?.country
                        ? `${tailor.location.city}, ${tailor.location.country}`
                        : '-'}
                    </td>
                    <td>
                      <span className={`erp-badge ${getStatusBadgeClass(tailor.approvalStatus)}`}>
                        {tailor.approvalStatus}
                      </span>
                    </td>
                    <td>
                      {tailor.averageRating ? (
                        <span className="rating">
                          ⭐ {tailor.averageRating.toFixed(1)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          className="erp-action-btn action-view"
                          onClick={() => viewTailor(tailor)}
                          title="View details"
                        >
                          <FiEye />
                        </button>
                        {tailor.approvalStatus === 'pending' && (
                          <>
                            <button
                              className="erp-action-btn action-approve"
                              onClick={() => handleApprove(tailor._id)}
                              title="Approve"
                            >
                              <FiCheck />
                            </button>
                            <button
                              className="erp-action-btn action-delete"
                              onClick={() => handleReject(tailor._id)}
                              title="Reject"
                            >
                              <FiX />
                            </button>
                          </>
                        )}
                        {tailor.approvalStatus === 'approved' && (
                          <button
                            className="erp-action-btn action-delete"
                            onClick={() => handleSuspend(tailor._id)}
                            title="Suspend"
                          >
                            <FiTrash2 />
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

        {/* Tailor Detail Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Tailor Details"
        >
          {selectedTailor && (
            <div className="detail-modal">
              <div className="modal-body">
                <div className="detail-section">
                  <h4>Personal Information</h4>
                  <div className="detail-content">
                    <p><strong>Name:</strong> {selectedTailor.user?.firstName} {selectedTailor.user?.lastName}</p>
                    <p><strong>Email:</strong> {selectedTailor.user?.email}</p>
                    <p><strong>Username:</strong> {selectedTailor.username || '-'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Business Information</h4>
                  <div className="detail-content">
                    <p><strong>Business Name:</strong> {selectedTailor.businessName || '-'}</p>
                    <p><strong>Location:</strong> {selectedTailor.location?.city}, {selectedTailor.location?.state}, {selectedTailor.location?.country}</p>
                    <p><strong>Phone:</strong> {selectedTailor.privateContactInfo?.phone || '-'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Bio</h4>
                  <div className="detail-content">
                    <p>{selectedTailor.bio || 'No bio provided'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Specialties</h4>
                  <div className="detail-content">
                    <p>{selectedTailor.specialties?.join(', ') || 'None specified'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Status</h4>
                  <div className="detail-content">
                    <p><strong>Approval:</strong> <span className={`status-badge ${selectedTailor.approvalStatus}`}>{selectedTailor.approvalStatus}</span></p>
                    <p><strong>Verification:</strong> <span className={`status-badge ${selectedTailor.verificationStatus}`}>{selectedTailor.verificationStatus}</span></p>
                    <p><strong>Accepting Bookings:</strong> {selectedTailor.acceptingBookings ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Statistics</h4>
                  <div className="detail-content">
                    <p><strong>Average Rating:</strong> {selectedTailor.averageRating?.toFixed(1) || '-'}</p>
                    <p><strong>Total Reviews:</strong> {selectedTailor.reviewCount || 0}</p>
                  </div>
                </div>

                <div className="detail-actions">
                  {selectedTailor.approvalStatus === 'pending' && (
                    <>
                      <Button onClick={() => handleApprove(selectedTailor._id)}>
                        Approve
                      </Button>
                      <Button variant="outline" onClick={() => handleReject(selectedTailor._id)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {selectedTailor.approvalStatus === 'approved' && (
                    <Button variant="outline" onClick={() => handleSuspend(selectedTailor._id)}>
                      Suspend
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
      </div>
    </div>
  );
}
