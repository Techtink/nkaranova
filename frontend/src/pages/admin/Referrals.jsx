import { useState, useEffect } from 'react';
import { FiUsers, FiCheck, FiClock, FiX, FiGift, FiPlus, FiMinus, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { referralsAPI, adminAPI } from '../../services/api';
import './Admin.scss';

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  useEffect(() => {
    fetchReferrals();
  }, [filter, pagination.page]);

  useEffect(() => {
    fetchTailors();
  }, []);

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      if (filter !== 'all') params.status = filter;

      const response = await referralsAPI.getAllReferrals(params);
      setReferrals(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTailors = async () => {
    try {
      const response = await adminAPI.getTailors({ limit: 100 });
      setTailors(response.data.data);
    } catch (error) {
      console.error('Error fetching tailors:', error);
    }
  };

  const handleCompleteReferral = async (referralId) => {
    if (!confirm('Are you sure you want to complete this referral and award tokens?')) return;

    try {
      await referralsAPI.completeReferral(referralId);
      fetchReferrals();
    } catch (error) {
      console.error('Error completing referral:', error);
      alert(error.response?.data?.message || 'Failed to complete referral');
    }
  };

  const handleAdjustTokens = async () => {
    if (!selectedTailor || adjustAmount === 0) {
      alert('Please select a tailor and enter an amount');
      return;
    }

    try {
      await referralsAPI.adjustTokens({
        tailorId: selectedTailor,
        amount: adjustAmount,
        reason: 'admin_adjustment',
        description: adjustReason || 'Manual adjustment by admin'
      });
      setShowAdjustModal(false);
      setSelectedTailor('');
      setAdjustAmount(0);
      setAdjustReason('');
      alert('Tokens adjusted successfully!');
    } catch (error) {
      console.error('Error adjusting tokens:', error);
      alert(error.response?.data?.message || 'Failed to adjust tokens');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="erp-badge badge-success"><FiCheck /> Completed</span>;
      case 'pending':
        return <span className="erp-badge badge-warning"><FiClock /> Pending</span>;
      case 'invalid':
        return <span className="erp-badge badge-error"><FiX /> Invalid</span>;
      default:
        return <span className="erp-badge badge-gray">{status}</span>;
    }
  };

  if (loading && referrals.length === 0) {
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
                <FiUsers />
              </div>
              <div className="header-text">
                <h1>Referrals</h1>
                <p>Manage tailor referrals and token rewards</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-erp btn-erp-primary" onClick={() => setShowAdjustModal(true)}>
                <FiGift />
                Adjust Tokens
              </button>
            </div>
          </div>
          <div className="header-line" />
        </div>

        {/* ERP Stats */}
        <div className="erp-stats">
          <div className="erp-stat-card">
            <div className="stat-icon success">
              <FiCheck />
            </div>
            <div className="stat-content">
              <span className="stat-value">
                {referrals.filter(r => r.status === 'completed').length}
              </span>
              <span className="stat-label">Completed Referrals</span>
            </div>
          </div>
          <div className="erp-stat-card">
            <div className="stat-icon warning">
              <FiClock />
            </div>
            <div className="stat-content">
              <span className="stat-value">
                {referrals.filter(r => r.status === 'pending').length}
              </span>
              <span className="stat-label">Pending Referrals</span>
            </div>
          </div>
          <div className="erp-stat-card">
            <div className="stat-icon primary">
              <FiGift />
            </div>
            <div className="stat-content">
              <span className="stat-value">
                {referrals.filter(r => r.status === 'completed').reduce((acc, r) => acc + (r.tokensAwarded || 0), 0)}
              </span>
              <span className="stat-label">Total Tokens Awarded</span>
            </div>
          </div>
        </div>

        {/* ERP Tabs */}
        <div className="erp-tabs">
          <button
            className={`erp-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`erp-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button
            className={`erp-tab ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          <button
            className={`erp-tab ${filter === 'invalid' ? 'active' : ''}`}
            onClick={() => setFilter('invalid')}
          >
            Invalid
          </button>
        </div>

        {/* Referrals List */}
        {referrals.length === 0 ? (
          <div className="erp-table-container">
            <div className="erp-empty-state">
              <FiUsers />
              <p className="empty-title">No referrals found</p>
              <p>No referrals match the current filters.</p>
            </div>
          </div>
        ) : (
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Referrer</th>
                  <th>Referred Tailor</th>
                  <th>Code Used</th>
                  <th>Status</th>
                  <th>Tokens Awarded</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(referral => (
                  <tr key={referral._id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-info">
                          <span className="name">{referral.referrer?.businessName || referral.referrer?.username}</span>
                          <span className="email">{referral.referrer?.user?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="user-info">
                          <span className="name">{referral.referred?.businessName || referral.referred?.username}</span>
                          <span className="email">{referral.referred?.user?.email}</span>
                          {referral.referred?.verificationStatus === 'approved' && (
                            <span className="erp-badge badge-success" style={{ marginTop: '4px', fontSize: '10px' }}>Verified</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><code>{referral.referralCode}</code></td>
                    <td>{getStatusBadge(referral.status)}</td>
                    <td>
                      {referral.tokensAwarded > 0 ? (
                        <span className="cell-primary" style={{ color: 'var(--success)' }}>+{referral.tokensAwarded}</span>
                      ) : '-'}
                    </td>
                    <td className="cell-secondary">{formatDate(referral.createdAt)}</td>
                    <td>
                      <div className="cell-actions">
                        {referral.status === 'pending' && (
                          <button
                            className="erp-action-btn action-approve"
                            onClick={() => handleCompleteReferral(referral._id)}
                            title="Complete referral and award tokens"
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

            {/* ERP Pagination */}
            {pagination.pages > 1 && (
              <div className="erp-pagination">
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <div className="pagination-buttons">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    <FiChevronLeft />
                  </button>
                  <button className="active">{pagination.page}</button>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    <FiChevronRight />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Adjust Tokens Modal */}
        {showAdjustModal && (
          <div className="modal-overlay" onClick={() => setShowAdjustModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Adjust Tailor Tokens</h2>
                <button className="close-btn" onClick={() => setShowAdjustModal(false)}>
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Tailor</label>
                  <select
                    value={selectedTailor}
                    onChange={(e) => setSelectedTailor(e.target.value)}
                  >
                    <option value="">Choose a tailor...</option>
                    {tailors.map(tailor => (
                      <option key={tailor._id} value={tailor._id}>
                        {tailor.businessName || tailor.username} - {tailor.tokenBalance || 0} tokens ({tailor.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Token Adjustment</label>
                  <div className="token-adjust-input">
                    <button
                      type="button"
                      className="btn btn-icon"
                      onClick={() => setAdjustAmount(prev => prev - 10)}
                    >
                      <FiMinus />
                    </button>
                    <input
                      type="number"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                    />
                    <button
                      type="button"
                      className="btn btn-icon"
                      onClick={() => setAdjustAmount(prev => prev + 10)}
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <p className="form-help">
                    {adjustAmount > 0 ? `Will add ${adjustAmount} tokens` :
                     adjustAmount < 0 ? `Will remove ${Math.abs(adjustAmount)} tokens` :
                     'No change'}
                  </p>
                </div>

                <div className="form-group">
                  <label>Reason (Optional)</label>
                  <textarea
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Reason for adjustment..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAdjustTokens}
                  disabled={!selectedTailor || adjustAmount === 0}
                >
                  <FiGift />
                  {adjustAmount >= 0 ? 'Add Tokens' : 'Remove Tokens'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
