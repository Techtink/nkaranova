import { useState, useEffect } from 'react';
import { FiStar, FiPlus, FiX, FiDollarSign, FiGift } from 'react-icons/fi';
import { featuredAPI, adminAPI } from '../../services/api';
import './Admin.scss';

export default function FeaturedTailors() {
  const [spots, setSpots] = useState([]);
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState('');
  const [duration, setDuration] = useState(7);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [spotsRes, tailorsRes] = await Promise.all([
        featuredAPI.getAllSpots({ status: filter === 'all' ? undefined : filter }),
        adminAPI.getTailors({ status: 'approved', limit: 100 })
      ]);
      setSpots(spotsRes.data.data);
      setTailors(tailorsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedTailor) {
      alert('Please select a tailor');
      return;
    }

    try {
      await featuredAPI.createSpot({
        tailorId: selectedTailor,
        durationDays: duration,
        notes
      });
      setShowModal(false);
      setSelectedTailor('');
      setDuration(7);
      setNotes('');
      fetchData();
    } catch (error) {
      console.error('Error creating featured spot:', error);
      alert(error.response?.data?.message || 'Failed to create featured spot');
    }
  };

  const handleCancel = async (spotId) => {
    const reason = prompt('Reason for cancellation (optional):');
    if (reason === null) return; // User clicked cancel

    try {
      await featuredAPI.cancelSpot(spotId, reason);
      fetchData();
    } catch (error) {
      console.error('Error cancelling spot:', error);
      alert('Failed to cancel featured spot');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'tokens': return <FiGift className="source-icon tokens" />;
      case 'payment': return <FiDollarSign className="source-icon payment" />;
      case 'admin': return <FiStar className="source-icon admin" />;
      default: return null;
    }
  };

  const getStatusBadge = (spot) => {
    const now = new Date();
    const start = new Date(spot.startDate);
    const end = new Date(spot.endDate);

    if (spot.status === 'cancelled') return <span className="erp-badge badge-error">Cancelled</span>;
    if (now < start) return <span className="erp-badge badge-info">Scheduled</span>;
    if (now > end) return <span className="erp-badge badge-gray">Expired</span>;
    return <span className="erp-badge badge-success">Active</span>;
  };

  if (loading) {
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
                <h1>Featured Tailors</h1>
                <p>Manage featured placements on the homepage</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="btn-erp btn-erp-primary" onClick={() => setShowModal(true)}>
                <FiPlus />
                Add Featured Spot
              </button>
            </div>
          </div>
          <div className="header-line" />
        </div>

        {/* ERP Tabs */}
        <div className="erp-tabs">
          <button
            className={`erp-tab ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`erp-tab ${filter === 'expired' ? 'active' : ''}`}
            onClick={() => setFilter('expired')}
          >
            Expired
          </button>
          <button
            className={`erp-tab ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
          <button
            className={`erp-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>

        {/* Featured Spots List */}
        {spots.length === 0 ? (
          <div className="erp-table-container">
            <div className="erp-empty-state">
              <FiStar />
              <p className="empty-title">No featured spots found</p>
              <p>No featured spots match the current filters.</p>
            </div>
          </div>
        ) : (
          <div className="erp-table-container">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Tailor</th>
                  <th>Source</th>
                  <th>Duration</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {spots.map(spot => (
                  <tr key={spot._id}>
                    <td>
                      <div className="user-cell">
                        <img
                          src={spot.tailor?.profilePhoto || '/default-avatar.png'}
                          alt={spot.tailor?.businessName}
                          className="avatar"
                        />
                        <div className="user-info">
                          <span className="name">{spot.tailor?.businessName || spot.tailor?.username}</span>
                          <span className="email">{spot.tailor?.user?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`erp-badge badge-${spot.source === 'tokens' ? 'info' : spot.source === 'payment' ? 'success' : 'primary'}`}>
                        {getSourceIcon(spot.source)}
                        {spot.source}
                      </span>
                    </td>
                    <td>{spot.durationDays} days</td>
                    <td>{formatDate(spot.startDate)}</td>
                    <td>{formatDate(spot.endDate)}</td>
                    <td>{getStatusBadge(spot)}</td>
                    <td>
                      <div className="cell-actions">
                        {spot.status === 'active' && new Date(spot.endDate) > new Date() && (
                          <button
                            className="erp-action-btn action-delete"
                            onClick={() => handleCancel(spot._id)}
                            title="Cancel featured spot"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Featured Spot</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>
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
                        {tailor.businessName || tailor.username} ({tailor.user?.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration (Days)</label>
                  <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))}>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for featuring this tailor..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleCreate}>
                  <FiStar />
                  Create Featured Spot
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
