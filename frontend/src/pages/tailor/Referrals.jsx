import { useState, useEffect } from 'react';
import { FiUsers, FiGift, FiCopy, FiCheck, FiClock, FiStar, FiDollarSign } from 'react-icons/fi';
import { referralsAPI, featuredAPI, settingsAPI } from '../../services/api';
import './Referrals.scss';

export default function TailorReferrals() {
  const [referralInfo, setReferralInfo] = useState(null);
  const [tokenHistory, setTokenHistory] = useState([]);
  const [featuredStatus, setFeaturedStatus] = useState(null);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(7);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [infoRes, historyRes, featuredRes, settingsRes] = await Promise.all([
        referralsAPI.getMyInfo(),
        referralsAPI.getTokenHistory({ limit: 10 }),
        featuredAPI.getMyStatus(),
        settingsAPI.getByCategory('referral')
      ]);

      setReferralInfo(infoRes.data.data);
      setTokenHistory(historyRes.data.data);
      setFeaturedStatus(featuredRes.data.data);

      // Convert settings array to object
      const settingsObj = {};
      settingsRes.data.data.forEach(s => {
        settingsObj[s.key] = s.value;
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    if (referralInfo?.referralCode) {
      navigator.clipboard.writeText(referralInfo.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (referralInfo?.referralCode) {
      const link = `${window.location.origin}/register?ref=${referralInfo.referralCode}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRedeemTokens = async () => {
    try {
      setProcessing(true);
      await featuredAPI.redeemTokens();
      fetchData();
      setShowRedeemModal(false);
      alert('Successfully redeemed tokens for a featured spot!');
    } catch (error) {
      console.error('Error redeeming tokens:', error);
      alert(error.response?.data?.message || 'Failed to redeem tokens');
    } finally {
      setProcessing(false);
    }
  };

  const handlePurchaseFeatured = async () => {
    try {
      setProcessing(true);
      const response = await featuredAPI.purchaseWithPayment({ durationDays: selectedDuration });

      if (response.data.data.url) {
        window.location.href = response.data.data.url;
      }
    } catch (error) {
      console.error('Error initiating purchase:', error);
      alert(error.response?.data?.message || 'Failed to initiate purchase');
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'referral_bonus':
        return <FiUsers className="transaction-icon earn" />;
      case 'featured_redemption':
        return <FiStar className="transaction-icon spend" />;
      case 'admin_adjustment':
        return <FiGift className="transaction-icon" />;
      default:
        return <FiGift className="transaction-icon" />;
    }
  };

  const getPriceForDuration = (days) => {
    switch (days) {
      case 7: return settings.featured_price_7_days || 29;
      case 14: return settings.featured_price_14_days || 49;
      case 30: return settings.featured_price_30_days || 89;
      default: return 29;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  const tokensRequired = settings.tokens_for_featured || 100;
  const canRedeem = referralInfo?.tokenBalance >= tokensRequired;
  const featuredDuration = settings.featured_duration_days || 7;

  return (
    <div className="tailor-page page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Referrals & Rewards</h1>
            <p>Earn tokens by referring tailors and get featured on the homepage</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="referral-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper primary">
              <FiGift />
            </div>
            <div className="stat-content">
              <span className="stat-value">{referralInfo?.tokenBalance || 0}</span>
              <span className="stat-label">Token Balance</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper success">
              <FiUsers />
            </div>
            <div className="stat-content">
              <span className="stat-value">{referralInfo?.successfulReferrals || 0}</span>
              <span className="stat-label">Successful Referrals</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper warning">
              <FiClock />
            </div>
            <div className="stat-content">
              <span className="stat-value">{referralInfo?.pendingReferrals || 0}</span>
              <span className="stat-label">Pending Referrals</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper info">
              <FiStar />
            </div>
            <div className="stat-content">
              <span className="stat-value">
                {featuredStatus?.isFeatured ? 'Active' : 'Not Featured'}
              </span>
              <span className="stat-label">Featured Status</span>
            </div>
          </div>
        </div>

        {/* Featured Status Banner */}
        {featuredStatus?.isFeatured && (
          <div className="featured-banner">
            <FiStar className="banner-icon" />
            <div className="banner-content">
              <h3>You're Featured!</h3>
              <p>Your profile is featured on the homepage until {formatDate(featuredStatus.currentSpot.endDate)}</p>
            </div>
          </div>
        )}

        {/* Referral Code Section */}
        <div className="referral-code-section">
          <h2>Your Referral Code</h2>
          <p>Share this code with other tailors. When they sign up and get verified, you'll earn {settings.tokens_per_referral || 10} tokens!</p>

          <div className="referral-code-box">
            <code className="referral-code">{referralInfo?.referralCode || 'N/A'}</code>
            <button
              className="btn btn-icon"
              onClick={copyReferralCode}
              title="Copy code"
            >
              {copied ? <FiCheck /> : <FiCopy />}
            </button>
          </div>

          <button className="btn btn-secondary" onClick={copyReferralLink}>
            <FiCopy />
            Copy Referral Link
          </button>
        </div>

        {/* How It Works */}
        <div className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Share Your Code</h3>
              <p>Share your unique referral code with other tailors</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>They Sign Up</h3>
              <p>They register using your referral code</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Get Verified</h3>
              <p>Once they're verified, you earn {settings.tokens_per_referral || 10} tokens</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Get Featured</h3>
              <p>Collect {tokensRequired} tokens to get a {featuredDuration}-day featured spot</p>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="actions-section">
          <h2>Get Featured</h2>
          <div className="action-cards">
            <div className={`action-card ${canRedeem ? 'available' : 'disabled'}`}>
              <div className="action-icon">
                <FiGift />
              </div>
              <h3>Redeem Tokens</h3>
              <p>Use {tokensRequired} tokens for a {featuredDuration}-day featured spot</p>
              <div className="progress-bar">
                <div
                  className="progress"
                  style={{ width: `${Math.min((referralInfo?.tokenBalance / tokensRequired) * 100, 100)}%` }}
                />
              </div>
              <span className="progress-text">
                {referralInfo?.tokenBalance || 0} / {tokensRequired} tokens
              </span>
              <button
                className="btn btn-primary"
                disabled={!canRedeem}
                onClick={() => setShowRedeemModal(true)}
              >
                Redeem Now
              </button>
            </div>

            <div className="action-card available">
              <div className="action-icon">
                <FiDollarSign />
              </div>
              <h3>Purchase Featured Spot</h3>
              <p>Pay to get featured immediately</p>
              <div className="pricing-options">
                <span>${settings.featured_price_7_days || 29}/7 days</span>
                <span>${settings.featured_price_14_days || 49}/14 days</span>
                <span>${settings.featured_price_30_days || 89}/30 days</span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => setShowPurchaseModal(true)}
              >
                Purchase Now
              </button>
            </div>
          </div>
        </div>

        {/* Token History */}
        <div className="token-history-section">
          <h2>Token History</h2>
          {tokenHistory.length === 0 ? (
            <div className="empty-state">
              <FiGift />
              <p>No token transactions yet</p>
            </div>
          ) : (
            <div className="transaction-list">
              {tokenHistory.map(transaction => (
                <div key={transaction._id} className="transaction-item">
                  {getTransactionIcon(transaction.type)}
                  <div className="transaction-info">
                    <span className="transaction-description">{transaction.description}</span>
                    <span className="transaction-date">{formatDate(transaction.createdAt)}</span>
                  </div>
                  <span className={`transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                    {transaction.amount >= 0 ? '+' : ''}{transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Redeem Modal */}
        {showRedeemModal && (
          <div className="modal-overlay" onClick={() => setShowRedeemModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Redeem Tokens</h2>
                <button className="close-btn" onClick={() => setShowRedeemModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="redeem-summary">
                  <p>You're about to redeem:</p>
                  <div className="redeem-details">
                    <span className="tokens">{tokensRequired} tokens</span>
                    <span className="arrow">→</span>
                    <span className="duration">{featuredDuration}-day featured spot</span>
                  </div>
                  <p className="balance-after">
                    Balance after redemption: <strong>{(referralInfo?.tokenBalance || 0) - tokensRequired} tokens</strong>
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowRedeemModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleRedeemTokens}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Confirm Redemption'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Modal */}
        {showPurchaseModal && (
          <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Purchase Featured Spot</h2>
                <button className="close-btn" onClick={() => setShowPurchaseModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Select Duration</label>
                  <div className="duration-options">
                    <label className={`duration-option ${selectedDuration === 7 ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="duration"
                        value={7}
                        checked={selectedDuration === 7}
                        onChange={() => setSelectedDuration(7)}
                      />
                      <span className="duration-days">7 Days</span>
                      <span className="duration-price">${getPriceForDuration(7)}</span>
                    </label>
                    <label className={`duration-option ${selectedDuration === 14 ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="duration"
                        value={14}
                        checked={selectedDuration === 14}
                        onChange={() => setSelectedDuration(14)}
                      />
                      <span className="duration-days">14 Days</span>
                      <span className="duration-price">${getPriceForDuration(14)}</span>
                    </label>
                    <label className={`duration-option ${selectedDuration === 30 ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="duration"
                        value={30}
                        checked={selectedDuration === 30}
                        onChange={() => setSelectedDuration(30)}
                      />
                      <span className="duration-days">30 Days</span>
                      <span className="duration-price">${getPriceForDuration(30)}</span>
                      <span className="best-value">Best Value</span>
                    </label>
                  </div>
                </div>
                <p className="payment-note">
                  You'll be redirected to our secure payment page to complete your purchase.
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowPurchaseModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handlePurchaseFeatured}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Pay $${getPriceForDuration(selectedDuration)}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
