import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiX, FiEye, FiFileText, FiCheckCircle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './Admin.scss';

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchVerifications();
  }, [filter, page]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getVerifications({
        status: filter,
        page,
        limit: 10,
        search
      });
      setVerifications(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || response.data.data?.length || 0);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchVerifications();
  };

  const handleApprove = async (tailorId) => {
    try {
      await adminAPI.approveVerification(tailorId);
      fetchVerifications();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving verification:', error);
    }
  };

  const handleReject = async (tailorId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await adminAPI.rejectVerification(tailorId, reason);
        fetchVerifications();
        setShowModal(false);
      } catch (error) {
        console.error('Error rejecting verification:', error);
      }
    }
  };

  const viewVerification = (tailor) => {
    setSelectedVerification(tailor);
    setShowModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-error';
      default: return 'badge-gray';
    }
  };

  if (loading && verifications.length === 0) {
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
                <FiCheckCircle />
              </div>
              <div className="header-text">
                <h1>Verification Requests</h1>
                <p>Review identity verification documents</p>
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
            </select>
          </div>

          <span className="filter-count">{totalCount} results</span>
        </div>

        {verifications.length === 0 ? (
          <div className="erp-table-container">
            <div className="erp-empty-state">
              <FiCheckCircle />
              <p className="empty-title">No verification requests</p>
              <p>No verification requests match the current filters.</p>
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
                  <th>Documents</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifications.map((tailor) => (
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
                      {tailor.verificationDocuments?.length || 0} document(s)
                    </td>
                    <td>
                      <span className={`erp-badge ${getStatusBadgeClass(tailor.verificationStatus)}`}>
                        {tailor.verificationStatus}
                      </span>
                    </td>
                    <td>
                      {tailor.verificationSubmittedAt
                        ? new Date(tailor.verificationSubmittedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          className="erp-action-btn action-view"
                          onClick={() => viewVerification(tailor)}
                          title="View details"
                        >
                          <FiEye />
                        </button>
                        {tailor.verificationStatus === 'pending' && (
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

        {/* Verification Detail Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Verification Request"
        >
          {selectedVerification && (
            <div className="detail-modal">
              <div className="modal-body">
                <div className="detail-section">
                  <h4>Tailor Information</h4>
                  <div className="detail-content">
                    <p><strong>Name:</strong> {selectedVerification.user?.firstName} {selectedVerification.user?.lastName}</p>
                    <p><strong>Email:</strong> {selectedVerification.user?.email}</p>
                    <p><strong>Business:</strong> {selectedVerification.businessName || '-'}</p>
                    <p><strong>Location:</strong> {selectedVerification.location?.city}, {selectedVerification.location?.state}, {selectedVerification.location?.country}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Verification Documents</h4>
                  {selectedVerification.verificationDocuments?.length > 0 ? (
                    <div className="verification-documents">
                      {selectedVerification.verificationDocuments.map((doc, index) => (
                        <div key={index} className="document-item">
                          <div className="document-info">
                            <FiFileText />
                            <div>
                              <span className="doc-name">{doc.type || `Document ${index + 1}`}</span>
                              <span className="doc-date">
                                Uploaded: {new Date(doc.uploadedAt || selectedVerification.verificationSubmittedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="view-doc"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="detail-content">
                      <p>No documents uploaded</p>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h4>Status</h4>
                  <div className="detail-content">
                    <p><strong>Verification Status:</strong> <span className={`status-badge ${selectedVerification.verificationStatus}`}>{selectedVerification.verificationStatus}</span></p>
                    <p><strong>Profile Status:</strong> <span className={`status-badge ${selectedVerification.approvalStatus}`}>{selectedVerification.approvalStatus}</span></p>
                    {selectedVerification.verificationSubmittedAt && (
                      <p><strong>Submitted:</strong> {new Date(selectedVerification.verificationSubmittedAt).toLocaleString()}</p>
                    )}
                    {selectedVerification.verificationRejectionReason && (
                      <p><strong>Previous Rejection:</strong> {selectedVerification.verificationRejectionReason}</p>
                    )}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Additional Information</h4>
                  <div className="detail-content">
                    <p><strong>Bio:</strong> {selectedVerification.bio || 'Not provided'}</p>
                    <p><strong>Specialties:</strong> {selectedVerification.specialties?.join(', ') || 'None specified'}</p>
                    <p><strong>Experience:</strong> {selectedVerification.yearsOfExperience ? `${selectedVerification.yearsOfExperience} years` : 'Not specified'}</p>
                  </div>
                </div>

                <div className="detail-actions">
                  {selectedVerification.verificationStatus === 'pending' && (
                    <>
                      <Button onClick={() => handleApprove(selectedVerification._id)}>
                        Approve Verification
                      </Button>
                      <Button variant="outline" onClick={() => handleReject(selectedVerification._id)}>
                        Reject
                      </Button>
                    </>
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
