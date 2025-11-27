import { Link } from 'react-router-dom';
import { FiHeart, FiEye } from 'react-icons/fi';
import './WorkCard.scss';

export default function WorkCard({ work, showTailor = true }) {
  const {
    _id,
    title,
    images,
    category,
    price,
    tailor,
    viewCount,
    likeCount
  } = work;

  const primaryImage = images?.find(img => img.isPrimary)?.url || images?.[0]?.url;

  return (
    <Link to={`/work/${_id}`} className="work-card">
      <div className="work-card-image">
        {primaryImage ? (
          <img src={primaryImage} alt={title} />
        ) : (
          <div className="work-card-placeholder">
            No Image
          </div>
        )}
        <div className="work-card-overlay">
          <span className="stat">
            <FiEye /> {viewCount || 0}
          </span>
          <span className="stat">
            <FiHeart /> {likeCount || 0}
          </span>
        </div>
      </div>

      <div className="work-card-content">
        <h3 className="work-card-title">{title}</h3>

        <div className="work-card-meta">
          <span className="work-card-category">{category}</span>
          {price?.amount && (
            <span className="work-card-price">
              {price.isStartingPrice && 'From '}
              ${price.amount.toLocaleString()}
            </span>
          )}
        </div>

        {showTailor && tailor && (
          <div className="work-card-tailor">
            <div className="tailor-avatar">
              {tailor.profilePhoto ? (
                <img src={tailor.profilePhoto} alt={tailor.username} />
              ) : (
                tailor.username?.charAt(0).toUpperCase()
              )}
            </div>
            <span className="tailor-name">
              {tailor.businessName || tailor.username}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
