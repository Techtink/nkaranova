import { useState } from 'react';
import { FiX, FiStar } from 'react-icons/fi';
import { reviewsAPI } from '../../services/api';
import './ReviewModal.scss';

export default function ReviewModal({ isOpen, onClose, booking, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [recommend, setRecommend] = useState(true);
  const [comment, setComment] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a review title');
      return;
    }

    if (!comment.trim()) {
      setError('Please enter your review');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    setLoading(true);

    try {
      await reviewsAPI.create({
        tailorUsername: booking.tailor?.username,
        rating,
        title: title.trim(),
        comment: comment.trim(),
        bookingId: booking._id,
        recommend,
        nickname: nickname.trim() || undefined,
        email: email.trim() || undefined
      });

      onSuccess?.();
      onClose();

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setRecommend(true);
      setNickname('');
      setEmail('');
      setAcceptTerms(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
        onClick={() => setRating(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
      >
        <FiStar />
      </button>
    ));
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>

        <form onSubmit={handleSubmit}>
          {/* Overall Rating */}
          <div className="form-section">
            <h2 className="section-title">Overall rating</h2>
            <div className="star-rating">
              {renderStars()}
            </div>
            <p className="rating-hint">Click to rate</p>
          </div>

          {/* Review Title */}
          <div className="form-section">
            <label className="form-label">Review title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Example: Easy to use"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Recommend */}
          <div className="form-section">
            <label className="form-label">Would you recommend this tailor to a friend?</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="recommend"
                  checked={recommend === true}
                  onChange={() => setRecommend(true)}
                />
                <span className="radio-custom"></span>
                Yes
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="recommend"
                  checked={recommend === false}
                  onChange={() => setRecommend(false)}
                />
                <span className="radio-custom"></span>
                No
              </label>
            </div>
          </div>

          {/* Review Comment */}
          <div className="form-section">
            <label className="form-label">Your review</label>
            <textarea
              className="form-textarea"
              placeholder="Example: Since I started using this service a month ago, it has been great. What I like best/what is worst about this tailor is..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Nickname and Email */}
          <div className="form-row">
            <div className="form-section">
              <label className="form-label">Nickname</label>
              <input
                type="text"
                className="form-input"
                placeholder="Example: bob27"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            <div className="form-section">
              <label className="form-label">Email address (will not be published)</label>
              <input
                type="email"
                className="form-input"
                placeholder="Example: your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Terms */}
          <div className="form-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
              />
              <span className="checkbox-custom"></span>
              I accept the <a href="/terms" target="_blank" rel="noopener noreferrer">terms and conditions</a>
            </label>
          </div>

          {/* Disclaimer */}
          <p className="disclaimer">
            You will be able to receive emails in connection with this review (eg if
            others comment on your review). All emails contain the option to
            unsubscribe. We can use the text and star rating from your review in other
            marketing.
          </p>

          {error && <p className="error-message">{error}</p>}

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit product review'}
          </button>
        </form>
      </div>
    </div>
  );
}
