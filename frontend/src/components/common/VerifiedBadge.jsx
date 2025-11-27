import './VerifiedBadge.scss';

export default function VerifiedBadge({ size = 'md', showLabel = false, className = '' }) {
  const sizeClasses = {
    sm: 'verified-badge--sm',
    md: 'verified-badge--md',
    lg: 'verified-badge--lg'
  };

  return (
    <span className={`verified-badge ${sizeClasses[size]} ${className}`} title="Verified Tailor">
      <svg
        className="verified-badge__icon"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer badge shape */}
        <path
          d="M12 2L14.4 4.4L17.6 3.6L18.4 6.8L21.6 7.6L20.8 10.8L23.2 13.2L20.8 15.6L21.6 18.8L18.4 19.6L17.6 22.8L14.4 22L12 24.4L9.6 22L6.4 22.8L5.6 19.6L2.4 18.8L3.2 15.6L0.8 13.2L3.2 10.8L2.4 7.6L5.6 6.8L6.4 3.6L9.6 4.4L12 2Z"
          className="verified-badge__bg"
        />
        {/* Checkmark */}
        <path
          d="M9 12.5L11 14.5L15.5 10"
          className="verified-badge__check"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && <span className="verified-badge__label">Verified</span>}
    </span>
  );
}
