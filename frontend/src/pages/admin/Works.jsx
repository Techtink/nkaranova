import { useState, useEffect } from 'react';
import { FiSearch, FiCheck, FiX, FiEye, FiImage, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import './Admin.scss';

export default function AdminWorks() {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [selectedWork, setSelectedWork] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchWorks();
  }, [filter, page]);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getWorks({
        status: filter,
        page,
        limit: 10,
        search
      });
      setWorks(response.data.data);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalCount(response.data.pagination?.total || response.data.data?.length || 0);
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchWorks();
  };

  const handleApprove = async (workId) => {
    try {
      await adminAPI.approveWork(workId);
      fetchWorks();
      setShowModal(false);
    } catch (error) {
      console.error('Error approving work:', error);
    }
  };

  const handleReject = async (workId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await adminAPI.rejectWork(workId, reason);
        fetchWorks();
        setShowModal(false);
      } catch (error) {
        console.error('Error rejecting work:', error);
      }
    }
  };

  const viewWork = (work) => {
    setSelectedWork(work);
    setShowModal(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-error';
      default: return 'badge-gray';
    }
  };

  if (loading && works.length === 0) {
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
                <FiImage />
              </div>
              <div className="header-text">
                <h1>Manage Works</h1>
                <p>Review and approve portfolio items</p>
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
              placeholder="Search works..."
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

        {works.length === 0 ? (
          <div className="erp-table-container">
            <div className="erp-empty-state">
              <FiImage />
              <p className="empty-title">No works found</p>
              <p>No works match the current filters.</p>
            </div>
          </div>
        ) : (
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Work</th>
                  <th>Category</th>
                  <th>Tailor</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {works.map((work) => (
                  <tr key={work._id}>
                    <td>
                      <div className="work-cell">
                        <img
                          src={work.images?.[0]?.url || '/placeholder-work.png'}
                          alt={work.title}
                          className="work-image"
                        />
                        <div className="work-info">
                          <span className="title">{work.title}</span>
                          <span className="tailor">{work.tailor?.businessName}</span>
                        </div>
                      </div>
                    </td>
                    <td>{work.category}</td>
                    <td>
                      {work.tailor?.user?.firstName} {work.tailor?.user?.lastName}
                    </td>
                    <td>
                      {work.price?.amount
                        ? `${work.price.currency} ${work.price.amount}${work.price.isStartingPrice ? '+' : ''}`
                        : '-'}
                    </td>
                    <td>
                      <span className={`erp-badge ${getStatusBadgeClass(work.approvalStatus)}`}>
                        {work.approvalStatus}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <button
                          className="erp-action-btn action-view"
                          onClick={() => viewWork(work)}
                          title="View details"
                        >
                          <FiEye />
                        </button>
                        {work.approvalStatus === 'pending' && (
                          <>
                            <button
                              className="erp-action-btn action-approve"
                              onClick={() => handleApprove(work._id)}
                              title="Approve"
                            >
                              <FiCheck />
                            </button>
                            <button
                              className="erp-action-btn action-delete"
                              onClick={() => handleReject(work._id)}
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

        {/* Work Detail Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Work Details"
        >
          {selectedWork && (
            <div className="detail-modal">
              <div className="modal-body">
                <div className="detail-section">
                  <h4>Images</h4>
                  <div className="detail-images">
                    {selectedWork.images?.map((img, index) => (
                      <img
                        key={index}
                        src={img.url}
                        alt={`${selectedWork.title} ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Title</h4>
                  <div className="detail-content">
                    <p>{selectedWork.title}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Description</h4>
                  <div className="detail-content">
                    <p>{selectedWork.description || 'No description provided'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Details</h4>
                  <div className="detail-content">
                    <p><strong>Category:</strong> {selectedWork.category}</p>
                    <p><strong>Fabrics:</strong> {selectedWork.fabricTypes?.join(', ') || '-'}</p>
                    <p><strong>Tags:</strong> {selectedWork.tags?.join(', ') || '-'}</p>
                    <p><strong>Price:</strong> {selectedWork.price?.amount ? `${selectedWork.price.currency} ${selectedWork.price.amount}${selectedWork.price.isStartingPrice ? '+' : ''}` : '-'}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Tailor</h4>
                  <div className="detail-content">
                    <p><strong>Business:</strong> {selectedWork.tailor?.businessName}</p>
                    <p><strong>Name:</strong> {selectedWork.tailor?.user?.firstName} {selectedWork.tailor?.user?.lastName}</p>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Status</h4>
                  <div className="detail-content">
                    <p><span className={`status-badge ${selectedWork.approvalStatus}`}>{selectedWork.approvalStatus}</span></p>
                    <p><strong>Featured:</strong> {selectedWork.isFeatured ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                <div className="detail-actions">
                  {selectedWork.approvalStatus === 'pending' && (
                    <>
                      <Button onClick={() => handleApprove(selectedWork._id)}>
                        Approve
                      </Button>
                      <Button variant="outline" onClick={() => handleReject(selectedWork._id)}>
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
