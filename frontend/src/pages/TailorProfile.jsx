import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiMapPin, FiMessageCircle, FiCalendar, FiEdit3, FiUser, FiPlus, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import WorkCard from '../components/cards/WorkCard';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import VerifiedBadge from '../components/common/VerifiedBadge';
import { tailorsAPI, reviewsAPI, usersAPI, measurementsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './TailorProfile.scss';

export default function TailorProfile() {
  const { username } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [tailor, setTailor] = useState(null);
  const [works, setWorks] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('works');
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchTailorData();
  }, [username]);

  const fetchTailorData = async () => {
    setLoading(true);
    try {
      const [tailorRes, reviewsRes] = await Promise.all([
        tailorsAPI.getByUsername(username),
        reviewsAPI.getTailorReviews(username, { limit: 10 })
      ]);

      setTailor(tailorRes.data.data.tailor);
      setWorks(tailorRes.data.data.works || []);
      setReviews(reviewsRes.data.data || []);
      setReviewStats(reviewsRes.data.stats || {});

      // Add to browsing history if authenticated
      if (isAuthenticated && tailorRes.data.data.tailor._id) {
        usersAPI.addToHistory(tailorRes.data.data.tailor._id).catch(() => {});
      }
    } catch (error) {
      console.error('Error fetching tailor:', error);
      toast.error('Tailor not found');
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

  if (!tailor) {
    return (
      <div className="page">
        <div className="container">
          <div className="empty-state">
            <h3>Tailor not found</h3>
            <p>The tailor you're looking for doesn't exist or has been removed.</p>
            <Link to="/tailors">
              <Button>Browse Tailors</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = tailor.businessName || `${tailor.user?.firstName} ${tailor.user?.lastName}`;
  const isVerified = tailor.verificationStatus === 'approved';

  return (
    <div className="tailor-profile-page">
      {/* Hero Section */}
      <section className="profile-hero">
        <div className="container">
          <div className="profile-header">
            <div className="profile-avatar">
              {tailor.profilePhoto ? (
                <img src={tailor.profilePhoto} alt={displayName} />
              ) : (
                <span>{displayName.charAt(0)}</span>
              )}
            </div>

            <div className="profile-info">
              <div className="profile-name-row">
                <h1>{displayName}</h1>
                {isVerified && (
                  <VerifiedBadge size="lg" showLabel />
                )}
              </div>

              <p className="profile-username">@{tailor.username}</p>

              {tailor.location && (
                <p className="profile-location">
                  <FiMapPin />
                  {tailor.location.city}{tailor.location.country && `, ${tailor.location.country}`}
                </p>
              )}

              <div className="profile-stats">
                <div className="stat">
                  <FiStar className="star-filled" />
                  <span className="stat-value">{tailor.averageRating?.toFixed(1) || '0.0'}</span>
                  <span className="stat-label">({tailor.reviewCount || 0} reviews)</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{works.length}</span>
                  <span className="stat-label">works</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{tailor.completedBookings || 0}</span>
                  <span className="stat-label">completed</span>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <Link to={`/messages?tailor=${tailor.username}`}>
                <Button variant="outline">
                  <FiMessageCircle /> Message
                </Button>
              </Link>
              {tailor.acceptingBookings && (
                <Button onClick={() => setShowBookingModal(true)}>
                  <FiCalendar /> Book Appointment
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="profile-content">
        <div className="container">
          {/* Bio */}
          {tailor.bio && (
            <div className="profile-bio">
              <h3>About</h3>
              <p>{tailor.bio}</p>
            </div>
          )}

          {/* Specialties */}
          {tailor.specialties && tailor.specialties.length > 0 && (
            <div className="profile-specialties">
              <h3>Specialties</h3>
              <div className="specialty-tags">
                {tailor.specialties.map((specialty, index) => (
                  <span key={index} className="specialty-tag">{specialty}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`tab ${activeTab === 'works' ? 'active' : ''}`}
              onClick={() => setActiveTab('works')}
            >
              Portfolio ({works.length})
            </button>
            <button
              className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({tailor.reviewCount || 0})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'works' && (
            <div className="tab-content">
              {works.length === 0 ? (
                <div className="empty-state">
                  <h3>No works yet</h3>
                  <p>This tailor hasn't uploaded any works yet.</p>
                </div>
              ) : (
                <div className="grid grid-3">
                  {works.map(work => (
                    <WorkCard key={work._id} work={work} showTailor={false} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="tab-content">
              {/* Rating Summary */}
              <div className="reviews-summary">
                <div className="rating-overview">
                  <span className="rating-big">{reviewStats.averageRating?.toFixed(1) || '0.0'}</span>
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FiStar
                        key={star}
                        className={star <= Math.round(reviewStats.averageRating || 0) ? 'filled' : ''}
                      />
                    ))}
                  </div>
                  <span className="rating-count">{reviewStats.totalReviews || 0} reviews</span>
                </div>

                {reviewStats.ratingDistribution && (
                  <div className="rating-bars">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="rating-bar">
                        <span className="bar-label">{rating}</span>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{
                              width: `${((reviewStats.ratingDistribution[rating] || 0) / (reviewStats.totalReviews || 1)) * 100}%`
                            }}
                          />
                        </div>
                        <span className="bar-count">{reviewStats.ratingDistribution[rating] || 0}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="empty-state">
                  <h3>No reviews yet</h3>
                  <p>Be the first to leave a review!</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review._id} className="review-card">
                      <div className="review-header">
                        <div className="review-author">
                          <div className="avatar avatar-sm">
                            {review.customer?.avatar ? (
                              <img src={review.customer.avatar} alt="" />
                            ) : (
                              review.customer?.firstName?.charAt(0)
                            )}
                          </div>
                          <div>
                            <span className="author-name">
                              {review.customer?.firstName} {review.customer?.lastName}
                            </span>
                            <span className="review-date">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="review-rating">
                          {[1, 2, 3, 4, 5].map(star => (
                            <FiStar
                              key={star}
                              className={star <= review.rating ? 'filled' : ''}
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && <h4 className="review-title">{review.title}</h4>}
                      <p className="review-comment">{review.comment}</p>

                      {review.response && (
                        <div className="review-response">
                          <strong>Response from {displayName}:</strong>
                          <p>{review.response.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book Appointment"
        size="lg"
      >
        <BookingForm
          tailor={tailor}
          onClose={() => setShowBookingModal(false)}
        />
      </Modal>
    </div>
  );
}

// Simple Booking Form Component
function BookingForm({ tailor, onClose }) {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    service: '',
    notes: '',
    measurementProfileId: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [measurementProfiles, setMeasurementProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch measurement profiles when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchMeasurementProfiles();
    }
  }, [isAuthenticated]);

  const fetchMeasurementProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const { data } = await measurementsAPI.getProfiles();
      if (data.success) {
        setMeasurementProfiles(data.data);
        // Auto-select default profile
        const defaultProfile = data.data.find(p => p.isDefault);
        if (defaultProfile) {
          setFormData(prev => ({ ...prev, measurementProfileId: defaultProfile._id }));
        }
      }
    } catch (error) {
      console.log('No measurement profiles found');
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleDateChange = async (date) => {
    setFormData(prev => ({ ...prev, date, startTime: '' }));

    if (date) {
      try {
        const response = await tailorsAPI.getSlots(tailor.username, date);
        setAvailableSlots(response.data.data || []);
      } catch (error) {
        console.error('Error fetching slots:', error);
        setAvailableSlots([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please login to book an appointment');
      return;
    }

    setLoading(true);
    try {
      const { bookingsAPI } = await import('../services/api');
      const selectedSlot = availableSlots.find(s => s.start === formData.startTime);

      await bookingsAPI.create({
        tailorUsername: tailor.username,
        date: formData.date,
        startTime: formData.startTime,
        endTime: selectedSlot?.end || formData.startTime,
        service: formData.service,
        notes: formData.notes,
        measurementProfileId: formData.measurementProfileId || undefined
      });

      toast.success('Booking request sent!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Calculate profile completeness
  const getCompleteness = (profile) => {
    if (!profile.measurements || profile.measurements.length === 0) return 0;
    const essentialPoints = ['chest', 'waist', 'hip', 'shoulder_width', 'height'];
    const filled = essentialPoints.filter(key =>
      profile.measurements.some(m => m.pointKey === key && m.value)
    ).length;
    return Math.round((filled / essentialPoints.length) * 100);
  };

  if (!isAuthenticated) {
    return (
      <div className="booking-auth-required">
        <p>Please login to book an appointment</p>
        <Link to="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="booking-form">
      {/* Measurement Profile Selection */}
      <div className="form-group measurement-profiles-section">
        <label>
          <FiEdit3 style={{ marginRight: '0.5rem' }} />
          Your Measurements (Optional)
        </label>
        <p className="form-hint">
          Share your measurements with the tailor to help them prepare for your appointment.
        </p>

        {loadingProfiles ? (
          <div className="profiles-loading">
            <div className="spinner spinner-sm" />
            <span>Loading profiles...</span>
          </div>
        ) : measurementProfiles.length === 0 ? (
          <div className="no-profiles-notice">
            <FiUser />
            <span>No measurement profiles found.</span>
            <Link to="/measurements" className="create-profile-link">
              <FiPlus /> Create Profile
            </Link>
          </div>
        ) : (
          <div className="measurement-profile-selector">
            <button
              type="button"
              className={`profile-option ${!formData.measurementProfileId ? 'selected' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, measurementProfileId: '' }))}
            >
              <div className="option-content">
                <span className="option-label">Skip for now</span>
                <span className="option-desc">Provide measurements later</span>
              </div>
              {!formData.measurementProfileId && <FiCheck className="check-icon" />}
            </button>

            {measurementProfiles.map(profile => (
              <button
                key={profile._id}
                type="button"
                className={`profile-option ${formData.measurementProfileId === profile._id ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, measurementProfileId: profile._id }))}
              >
                <div className="option-content">
                  <span className="option-label">
                    {profile.profileName}
                    {profile.isDefault && <span className="default-tag">Default</span>}
                  </span>
                  <span className="option-desc">
                    {profile.gender === 'male' ? '♂' : '♀'} {profile.gender} •{' '}
                    {getCompleteness(profile)}% complete •{' '}
                    {profile.measurements?.length || 0} measurements
                  </span>
                </div>
                {formData.measurementProfileId === profile._id && <FiCheck className="check-icon" />}
              </button>
            ))}

            <Link to="/measurements" className="manage-profiles-link">
              <FiEdit3 /> Manage Profiles
            </Link>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleDateChange(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      {formData.date && (
        <div className="form-group">
          <label>Available Time Slots</label>
          {availableSlots.length === 0 ? (
            <p className="no-slots">No available slots for this date</p>
          ) : (
            <div className="time-slots">
              {availableSlots.map(slot => (
                <button
                  type="button"
                  key={slot.start}
                  className={`time-slot ${formData.startTime === slot.start ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, startTime: slot.start }))}
                >
                  {slot.start} - {slot.end}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="form-group">
        <label>Service Required</label>
        <input
          type="text"
          placeholder="e.g., Wedding dress fitting, Suit measurement"
          value={formData.service}
          onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
          required
        />
      </div>

      <div className="form-group">
        <label>Additional Notes (Optional)</label>
        <textarea
          placeholder="Any specific requirements or details..."
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="booking-actions">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
          disabled={!formData.date || !formData.startTime || !formData.service}
        >
          Send Booking Request
        </Button>
      </div>
    </form>
  );
}
