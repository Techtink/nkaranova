import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiStar, FiChevronLeft, FiChevronRight, FiSearch, FiHeart, FiTrendingUp } from 'react-icons/fi';
import Header from '../components/layout/Header';
import { tailorsAPI } from '../services/api';
import { SPECIALTIES } from '../utils/constants';
import './TailorsList.scss';

export default function TailorsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);

  const activeSpecialty = searchParams.get('specialty') || '';
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const sortBy = searchParams.get('sortBy') || 'rating';

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentTailorSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 4));
    }
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchTailors();
  }, [searchParams]);

  const fetchTailors = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 12,
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

  const handleSpecialtyChange = (specialty) => {
    const newParams = new URLSearchParams(searchParams);
    if (specialty) {
      newParams.set('specialty', specialty);
    } else {
      newParams.delete('specialty');
    }
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handleSortChange = (sort) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', sort);
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (query) => {
    if (!query.trim()) return;

    // Save to recent searches
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recentTailorSearches', JSON.stringify(updated));

    // Apply as specialty filter
    handleSpecialtyChange(query);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const popularSpecialties = [
    'Wedding Dresses', 'Men\'s Suits', 'Traditional African',
    'Alterations & Repairs', 'Custom Design', 'Formal Wear',
    'Children\'s Clothing', 'Embroidery'
  ];

  const renderPagination = () => {
    const { totalPages, total } = pagination;
    const totalPagesNum = totalPages || 1;

    const pages = [];
    const maxVisible = 5;
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
          Page {currentPage} of {totalPagesNum} ({total || tailors.length} tailors)
        </span>

        <div className="pagination-controls">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <FiChevronLeft />
          </button>

          {pages.map(page => (
            <button
              key={page}
              className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          <button
            className="pagination-btn"
            disabled={currentPage === totalPagesNum}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            <FiChevronRight />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="tailors-list-page">
        <div className="container">
          {/* Search Bar */}
          <div className="search-wrapper" ref={searchRef}>
            <form className="search-bar-large" onSubmit={handleSearchSubmit}>
              <input
                type="text"
                placeholder="Search for specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
              />
              <button type="submit" className="search-btn">
                <FiSearch />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="search-suggestions">
                {recentSearches.length > 0 && (
                  <div className="suggestion-column">
                    <div className="suggestion-header">
                      <FiHeart className="suggestion-icon" />
                      <span>Recent Searches</span>
                    </div>
                    <div className="suggestion-list">
                      {recentSearches.map((search, idx) => (
                        <button key={idx} type="button" onClick={() => handleSearch(search)}>
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="suggestion-column popular">
                  <div className="suggestion-header">
                    <FiTrendingUp className="suggestion-icon" />
                    <span>Popular Specialties</span>
                  </div>
                  <div className="suggestion-list">
                    {popularSpecialties.map((spec, idx) => (
                      <button key={idx} type="button" onClick={() => handleSearch(spec)}>
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section Header */}
          <div className="section-title-row">
            <h2>{activeSpecialty || 'All Tailors'}</h2>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="rating">Top Rated</option>
              <option value="reviews">Most Reviews</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Tailors Grid */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
            </div>
          ) : tailors.length === 0 ? (
            <div className="empty-state">
              <h3>No tailors found</h3>
              <p>Try selecting a different specialty</p>
            </div>
          ) : (
            <>
              <div className="tailors-grid">
                {tailors.map(tailor => {
                  const displayName = tailor.businessName || `${tailor.user?.firstName || ''} ${tailor.user?.lastName || ''}`.trim() || 'Tailor';
                  const rating = tailor.averageRating || 5.0;
                  const reviewCount = tailor.reviewCount || 0;

                  return (
                    <Link
                      key={tailor._id}
                      to={`/tailor/${tailor.username}`}
                      className="tailor-card"
                    >
                      <div className="card-photo">
                        {tailor.profilePhoto ? (
                          <img src={tailor.profilePhoto} alt={displayName} />
                        ) : (
                          <span className="photo-placeholder">{displayName.charAt(0)}</span>
                        )}
                      </div>
                      <h3 className="card-name">{displayName}</h3>
                      <p className="card-reviews">
                        <FiStar className="star-icon" />
                        {reviewCount} reviews
                      </p>
                      <div className="card-stat">
                        <span className="stat-label">Rating</span>
                        <span className="stat-value">{rating.toFixed(1)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && renderPagination()}
            </>
          )}
        </div>
      </div>
    </>
  );
}
