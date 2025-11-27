import { Link } from 'react-router-dom';
import { FiStar, FiMapPin, FiAward } from 'react-icons/fi';
import VerifiedBadge from '../common/VerifiedBadge';
import './TailorCard.scss';

export default function TailorCard({ tailor }) {
  const {
    username,
    businessName,
    profilePhoto,
    bio,
    specialties,
    location,
    averageRating,
    reviewCount,
    verificationStatus,
    isFeatured,
    user
  } = tailor;

  const displayName = businessName || `${user?.firstName} ${user?.lastName}`;
  const isVerified = verificationStatus === 'approved';

  return (
    <Link to={`/tailor/${username}`} className={`tailor-card ${isFeatured ? 'featured' : ''}`}>
      <div className="tailor-card-image">
        {profilePhoto ? (
          <img src={profilePhoto} alt={displayName} />
        ) : (
          <div className="tailor-card-placeholder">
            {displayName.charAt(0)}
          </div>
        )}
        {isFeatured && (
          <span className="featured-tag">
            <FiAward /> Featured
          </span>
        )}
        {isVerified && (
          <span className="verified-tag">
            <VerifiedBadge size="sm" /> Verified
          </span>
        )}
      </div>

      <div className="tailor-card-content">
        <h3 className="tailor-card-name">{displayName}</h3>

        {location && (
          <p className="tailor-card-location">
            <FiMapPin />
            {location.city}{location.country && `, ${location.country}`}
          </p>
        )}

        {bio && (
          <p className="tailor-card-bio">{bio}</p>
        )}

        {specialties && specialties.length > 0 && (
          <div className="tailor-card-specialties">
            {specialties.slice(0, 3).map((specialty, index) => (
              <span key={index} className="specialty-tag">{specialty}</span>
            ))}
            {specialties.length > 3 && (
              <span className="specialty-more">+{specialties.length - 3}</span>
            )}
          </div>
        )}

        <div className="tailor-card-footer">
          <div className="tailor-card-rating">
            <FiStar className="star-icon" />
            <span className="rating-value">{averageRating?.toFixed(1) || '0.0'}</span>
            <span className="rating-count">({reviewCount || 0})</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
