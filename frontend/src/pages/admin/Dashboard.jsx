import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHome, FiUsers, FiScissors, FiImage, FiStar, FiAlertCircle, FiCheckCircle, FiMessageCircle, FiArrowRight } from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import './Admin.scss';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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
                <FiHome />
              </div>
              <div className="header-text">
                <h1>Dashboard</h1>
                <p>Platform overview and management</p>
              </div>
            </div>
          </div>
          <div className="header-line" />
        </div>

        {/* Stats Cards */}
        <div className="erp-stats">
          <div className="erp-stat-card">
            <div className="stat-icon primary">
              <FiUsers />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.stats?.totalUsers || 0}</span>
              <span className="stat-label">Total Customers</span>
            </div>
          </div>

          <div className="erp-stat-card">
            <div className="stat-icon success">
              <FiScissors />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.stats?.totalTailors || 0}</span>
              <span className="stat-label">Active Tailors</span>
            </div>
          </div>

          <div className="erp-stat-card">
            <div className="stat-icon info">
              <FiImage />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.stats?.totalWorks || 0}</span>
              <span className="stat-label">Portfolio Items</span>
            </div>
          </div>

          <div className="erp-stat-card">
            <div className="stat-icon warning">
              <FiStar />
            </div>
            <div className="stat-content">
              <span className="stat-value">{stats?.stats?.totalReviews || 0}</span>
              <span className="stat-label">Reviews</span>
            </div>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="erp-card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <h2>Pending Actions</h2>
          </div>
          <div className="card-body">
            <div className="erp-stats" style={{ marginBottom: 0 }}>
              <Link to="/admin/tailors" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon warning">
                  <FiAlertCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats?.stats?.pendingTailors || 0}</span>
                  <span className="stat-label">Pending Tailors</span>
                </div>
              </Link>

              <Link to="/admin/works" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon warning">
                  <FiAlertCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats?.stats?.pendingWorks || 0}</span>
                  <span className="stat-label">Pending Works</span>
                </div>
              </Link>

              <Link to="/admin/reviews" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon warning">
                  <FiAlertCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats?.stats?.pendingReviews || 0}</span>
                  <span className="stat-label">Pending Reviews</span>
                </div>
              </Link>

              <Link to="/admin/verifications" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon info">
                  <FiCheckCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-value">{stats?.stats?.pendingVerifications || 0}</span>
                  <span className="stat-label">Verification Requests</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="erp-card">
          <div className="card-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="card-body">
            <div className="erp-stats" style={{ marginBottom: 0 }}>
              <Link to="/admin/tailors" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon primary">
                  <FiScissors />
                </div>
                <div className="stat-content">
                  <span className="stat-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Manage Tailors</span>
                </div>
              </Link>
              <Link to="/admin/works" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon info">
                  <FiImage />
                </div>
                <div className="stat-content">
                  <span className="stat-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Manage Works</span>
                </div>
              </Link>
              <Link to="/admin/reviews" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon warning">
                  <FiStar />
                </div>
                <div className="stat-content">
                  <span className="stat-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Manage Reviews</span>
                </div>
              </Link>
              <Link to="/admin/verifications" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon success">
                  <FiCheckCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Verifications</span>
                </div>
              </Link>
              <Link to="/admin/guest-chats" className="erp-stat-card" style={{ textDecoration: 'none' }}>
                <div className="stat-icon primary">
                  <FiMessageCircle />
                </div>
                <div className="stat-content">
                  <span className="stat-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Guest Chats</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
