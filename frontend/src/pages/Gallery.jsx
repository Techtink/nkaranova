import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiEye,
  FiHeart,
  FiClock,
  FiHome
} from 'react-icons/fi';
import Header from '../components/layout/Header';
import { worksAPI } from '../services/api';
import { WORK_CATEGORIES } from '../utils/constants';
import './Gallery.scss';

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  // Filter states
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const activeCategory = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';
  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    fetchWorks();
  }, [searchParams]);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 9,
        category: activeCategory || undefined,
        sortBy
      };

      const response = await worksAPI.getAll(params);
      setWorks(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching works:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set('category', category);
    } else {
      newParams.delete('category');
    }
    newParams.delete('page');
    setSearchParams(newParams);
    setCategoryOpen(false);
  };

  const handleSortChange = (sort) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', sort);
    newParams.delete('page');
    setSearchParams(newParams);
    setSortOpen(false);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSortLabel = (value) => {
    switch (value) {
      case 'newest': return 'Newest';
      case 'popular': return 'Most Viewed';
      case 'likes': return 'Most Liked';
      default: return 'Newest';
    }
  };

  const renderPagination = () => {
    const { totalPages } = pagination;
    if (!totalPages || totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 4;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="gallery-pagination">
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
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next <FiChevronRight />
        </button>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="gallery-page">
        <div className="container">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <FiHome className="breadcrumb-icon" />
            <Link to="/">Home</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Gallery</span>
          </div>

          {/* Hero Section */}
          <div className="gallery-hero">
            <div className="gallery-hero-content">
              <h1 className="gallery-title">
                Explore Our<br />
                <span>Gallery</span>
              </h1>
            </div>
            <p className="gallery-description">
              From traditional attires to modern designs, explore beautiful creations from talented tailors that match your style and vision.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="gallery-filter-bar">
            {/* Category Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Category</label>
              <div className="filter-dropdown">
                <button
                  className="filter-dropdown-btn"
                  onClick={() => setCategoryOpen(!categoryOpen)}
                >
                  <span>{activeCategory || 'All Categories'}</span>
                  <FiChevronDown className={categoryOpen ? 'rotate' : ''} />
                </button>
                {categoryOpen && (
                  <div className="filter-dropdown-menu">
                    <button
                      className={!activeCategory ? 'active' : ''}
                      onClick={() => handleCategoryChange('')}
                    >
                      All Categories
                    </button>
                    {WORK_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        className={activeCategory === cat ? 'active' : ''}
                        onClick={() => handleCategoryChange(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="filter-item">
              <label className="filter-label">Sort By</label>
              <div className="filter-dropdown">
                <button
                  className="filter-dropdown-btn"
                  onClick={() => setSortOpen(!sortOpen)}
                >
                  <span>{getSortLabel(sortBy)}</span>
                  <FiChevronDown className={sortOpen ? 'rotate' : ''} />
                </button>
                {sortOpen && (
                  <div className="filter-dropdown-menu">
                    <button
                      className={sortBy === 'newest' ? 'active' : ''}
                      onClick={() => handleSortChange('newest')}
                    >
                      Newest
                    </button>
                    <button
                      className={sortBy === 'popular' ? 'active' : ''}
                      onClick={() => handleSortChange('popular')}
                    >
                      Most Viewed
                    </button>
                    <button
                      className={sortBy === 'likes' ? 'active' : ''}
                      onClick={() => handleSortChange('likes')}
                    >
                      Most Liked
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search Button */}
            <button className="filter-search-btn" onClick={fetchWorks}>
              <FiSearch /> Search
            </button>
          </div>

          {/* Works Grid */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
            </div>
          ) : works.length === 0 ? (
            <div className="empty-state">
              <h3>No works found</h3>
              <p>Try selecting a different category</p>
            </div>
          ) : (
            <>
              <div className="gallery-grid">
                {works.map(work => {
                  const primaryImage = work.images?.find(img => img.isPrimary)?.url || work.images?.[0]?.url;

                  return (
                    <div key={work._id} className="gallery-card">
                      <div className="gallery-card-image">
                        {primaryImage ? (
                          <img src={primaryImage} alt={work.title} />
                        ) : (
                          <div className="gallery-card-placeholder">No Image</div>
                        )}

                        {/* Category Badge */}
                        <span className="gallery-card-badge">
                          <span className="badge-dot" />
                          {work.category}
                        </span>

                        {/* View Details Overlay */}
                        <Link to={`/work/${work._id}`} className="gallery-card-overlay">
                          <span className="view-details-btn">View Details</span>
                        </Link>
                      </div>

                      {/* Stats Row */}
                      <div className="gallery-card-stats">
                        <span className="stat-item">
                          <FiEye /> {work.viewCount || 0}
                        </span>
                        <span className="stat-item">
                          <FiHeart /> {work.likeCount || 0}
                        </span>
                        {work.completionTime?.value && (
                          <span className="stat-item">
                            <FiClock /> {work.completionTime.value} {work.completionTime.unit}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="gallery-card-title">{work.title}</h3>

                      {/* Description */}
                      {work.description && (
                        <p className="gallery-card-description">
                          {work.description.substring(0, 80)}
                          {work.description.length > 80 ? '...' : ''}
                        </p>
                      )}

                      {/* Footer: Tailor + Price */}
                      <div className="gallery-card-footer">
                        {work.tailor && (
                          <Link to={`/tailor/${work.tailor.username}`} className="gallery-card-tailor">
                            <div className="tailor-avatar">
                              {work.tailor.profilePhoto ? (
                                <img src={work.tailor.profilePhoto} alt={work.tailor.username} />
                              ) : (
                                work.tailor.username?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <span className="tailor-name">
                              {work.tailor.businessName || work.tailor.username}
                            </span>
                          </Link>
                        )}
                        {work.price?.amount && (
                          <span className="gallery-card-price">
                            <FiClock />
                            {work.price.isStartingPrice && 'From '}
                            ${work.price.amount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </>
  );
}
