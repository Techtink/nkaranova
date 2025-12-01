import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiSearch,
  FiStar,
  FiMapPin,
  FiCalendar,
  FiHeart,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiGrid,
  FiUsers,
  FiAward,
  FiScissors,
  FiHexagon,
  FiPenTool,
  FiLayers,
  FiTarget,
  FiTrello,
  FiCpu
} from 'react-icons/fi';
import Header from '../components/layout/Header';
import { tailorsAPI } from '../services/api';
import { SPECIALTIES } from '../utils/constants';
import './TailorsList.scss';

// Category icons mapping
const CATEGORY_ICONS = {
  'All': FiGrid,
  'Wedding Dresses': FiHeart,
  'Men\'s Suits': FiUsers,
  'Traditional African': FiHexagon,
  'Traditional Asian': FiLayers,
  'Formal Wear': FiAward,
  'Casual Wear': FiTarget,
  'Alterations & Repairs': FiScissors,
  'Custom Design': FiPenTool,
  'Embroidery': FiTrello,
  'Leather Work': FiCpu
};

// Category colors for icons
const CATEGORY_COLORS = {
  'All': '#6366F1',
  'Wedding Dresses': '#EC4899',
  'Men\'s Suits': '#3B82F6',
  'Traditional African': '#F59E0B',
  'Traditional Asian': '#10B981',
  'Formal Wear': '#8B5CF6',
  'Casual Wear': '#06B6D4',
  'Alterations & Repairs': '#EF4444',
  'Custom Design': '#F97316',
  'Embroidery': '#84CC16',
  'Leather Work': '#78716C'
};

export default function TailorsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  const activeCategory = searchParams.get('specialty') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sortBy') || 'rating';

  useEffect(() => {
    fetchTailors();
  }, [searchParams]);

  const fetchTailors = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchParams.get('search'),
        specialty: searchParams.get('specialty'),
        sortBy
      };

      const response = await tailorsAPI.getAll(params);
      setTailors(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching tailors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set('specialty', category);
    } else {
      newParams.delete('specialty');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    const { totalPages, total } = pagination;
    const totalPagesNum = totalPages || 1;

    const pages = [];
    const maxVisible = 4;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPagesNum, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="tailors-pagination">
        <span className="pagination-info">
          Showing page {currentPage} of {totalPagesNum} ({total || tailors.length} tailors)
        </span>

        <div className="pagination-controls">
          <button
            className="pagination-btn pagination-nav"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <FiChevronLeft /> Previous
          </button>

          <div className="pagination-numbers">
            {pages.map(page => (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            className="pagination-btn pagination-nav"
            disabled={currentPage === totalPagesNum}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next <FiChevronRight />
          </button>
        </div>
      </div>
    );
  };

  // Simplified categories for tabs
  const displayCategories = ['All', 'Wedding Dresses', 'Men\'s Suits', 'Traditional African', 'Formal Wear', 'Custom Design'];

  return (
    <>
      <Header />
      <div className="tailors-list-page">
        {/* Category Tabs Bar */}
        <div className="category-tabs-bar">
          <div className="container">
            <div className="category-tabs">
              {displayCategories.map(cat => {
                const IconComponent = CATEGORY_ICONS[cat] || FiGrid;
                const iconColor = CATEGORY_COLORS[cat] || '#6366F1';
                const isActive = cat === 'All' ? !activeCategory : activeCategory === cat;

                return (
                  <button
                    key={cat}
                    className={`category-tab ${isActive ? 'active' : ''}`}
                    onClick={() => handleCategoryChange(cat === 'All' ? '' : cat)}
                  >
                    <span className="tab-icon" style={{ backgroundColor: `${iconColor}15`, color: iconColor }}>
                      <IconComponent />
                    </span>
                    <span className="tab-label">{cat === 'All' ? 'All Tailors' : cat}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar */}
            <form className="search-bar" onSubmit={handleSearch}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search tailors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="tailors-content">
          <div className="container">
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
              </div>
            ) : tailors.length === 0 ? (
              <div className="empty-state">
                <h3>No tailors found</h3>
                <p>Try adjusting your filters or search criteria</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchParams(new URLSearchParams());
                  }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Tailors List */}
                <div className="tailors-list">
                  {tailors.map(tailor => {
                    const displayName = tailor.businessName || `${tailor.user?.firstName} ${tailor.user?.lastName}`;
                    const primarySpecialty = tailor.specialties?.[0] || 'Custom Design';

                    return (
                      <div key={tailor._id} className="tailor-row">
                        {/* Profile Column */}
                        <div className="tailor-profile">
                          <Link to={`/tailor/${tailor.username}`} className="profile-photo">
                            {tailor.profilePhoto ? (
                              <img src={tailor.profilePhoto} alt={displayName} />
                            ) : (
                              <span className="photo-placeholder">{displayName.charAt(0)}</span>
                            )}
                          </Link>
                          <div className="profile-info">
                            <Link to={`/tailor/${tailor.username}`} className="profile-name">
                              {displayName}
                            </Link>
                            <span className="profile-title">{tailor.bio?.substring(0, 40) || 'Professional Tailor'}</span>
                          </div>
                          <div className="profile-stats">
                            <FiStar className="star-icon" />
                            <span className="stat-value">{tailor.averageRating?.toFixed(1) || '5.0'}</span>
                            <span className="stat-label">({tailor.reviewCount || 0} reviews)</span>
                          </div>
                        </div>

                        {/* Skills Column */}
                        <div className="tailor-skills">
                          <div className="key-specialty">
                            <span className="specialty-label">Key specialty</span>
                            <span className="specialty-value">{primarySpecialty}</span>
                          </div>
                          <div className="skills-list">
                            {(tailor.specialties || []).slice(0, 4).map((skill, idx) => (
                              <div key={idx} className="skill-item">
                                <span className="skill-name">{skill}</span>
                                <div className="skill-bar">
                                  <div
                                    className="skill-progress"
                                    style={{ width: `${Math.min(100, 60 + idx * 10)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent Works Column */}
                        <div className="tailor-works">
                          <div className="works-header">
                            <span className="works-title">RECENT WORKS</span>
                          </div>
                          <div className="works-cards">
                            {(tailor.recentWorks || []).length > 0 ? (
                              tailor.recentWorks.slice(0, 3).map((work, idx) => (
                                <Link
                                  key={work._id || idx}
                                  to={`/work/${work._id}`}
                                  className="work-card"
                                >
                                  <span className={`work-badge badge-${idx % 3}`}>
                                    {work.category || 'Custom'}
                                  </span>
                                  <span className="work-date">
                                    <FiCalendar /> {new Date(work.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
                                  </span>
                                  <h4 className="work-title">{work.title}</h4>
                                  <p className="work-desc">{work.description?.substring(0, 60) || 'Beautiful custom work'}</p>
                                </Link>
                              ))
                            ) : (
                              <>
                                <div className="work-card placeholder-card">
                                  <span className="work-badge badge-0">Portfolio</span>
                                  <h4 className="work-title">View Full Portfolio</h4>
                                  <p className="work-desc">See all works by this tailor</p>
                                </div>
                                <div className="work-card placeholder-card">
                                  <span className="work-badge badge-1">Reviews</span>
                                  <h4 className="work-title">{tailor.reviewCount || 0} Reviews</h4>
                                  <p className="work-desc">Read what clients say</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Location Badge */}
                        {tailor.location?.city && (
                          <div className="tailor-location">
                            <FiMapPin />
                            <span>{tailor.location.city}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && renderPagination()}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
