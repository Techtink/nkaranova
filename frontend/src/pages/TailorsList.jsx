import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiStar, FiChevronLeft, FiChevronRight, FiSearch, FiMapPin, FiX, FiClock, FiTrendingUp } from 'react-icons/fi';
import Header from '../components/layout/Header';
import { tailorsAPI } from '../services/api';
import { SPECIALTIES } from '../utils/constants';
import './TailorsList.scss';

export default function TailorsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('location') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const searchRef = useRef(null);

  const currentPage = parseInt(searchParams.get('page')) || 1;

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
        sortBy: 'rating'
      };

      // Add search params if they exist
      const search = searchParams.get('search');
      const specialty = searchParams.get('specialty');
      const location = searchParams.get('location');

      if (search) params.search = search;
      if (specialty) params.specialty = specialty;
      if (location) params.location = location;

      const response = await tailorsAPI.getAll(params);
      setTailors(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error fetching tailors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);

    // Update search params
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
      // Save to recent searches
      const updated = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 4);
      setRecentSearches(updated);
      localStorage.setItem('recentTailorSearches', JSON.stringify(updated));
    } else {
      newParams.delete('search');
    }

    if (locationQuery.trim()) {
      newParams.set('location', locationQuery.trim());
    } else {
      newParams.delete('location');
    }

    newParams.delete('page');
    setSearchParams(newParams);
    setShowSuggestions(false);
  };

  const handleSpecialtyClick = (specialty) => {
    const newParams = new URLSearchParams(searchParams);
    if (specialty) {
      newParams.set('specialty', specialty);
    } else {
      newParams.delete('specialty');
    }
    newParams.delete('page');
    setSearchParams(newParams);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (search) => {
    setSearchQuery(search);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('search', search);
    newParams.delete('page');
    setSearchParams(newParams);
    setShowSuggestions(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setLocationQuery('');
    setSearchParams({});
  };

  const hasActiveFilters = searchParams.get('search') || searchParams.get('location') || searchParams.get('specialty');

  const popularSpecialties = SPECIALTIES.slice(0, 8);

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
            <form className="search-form" onSubmit={handleSearch}>
              <div className="search-input-group">
                <FiSearch className="input-icon" />
                <input
                  type="text"
                  placeholder="Search by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                />
              </div>
              <div className="search-divider" />
              <div className="search-input-group">
                <FiMapPin className="input-icon" />
                <input
                  type="text"
                  placeholder="City or country..."
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="search-btn">
                <FiSearch />
                <span>Search</span>
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="search-suggestions">
                {recentSearches.length > 0 && (
                  <div className="suggestion-column">
                    <div className="suggestion-header">
                      <FiClock className="suggestion-icon" />
                      <span>Recent Searches</span>
                    </div>
                    <div className="suggestion-list">
                      {recentSearches.map((search, idx) => (
                        <button key={idx} type="button" onClick={() => handleRecentSearchClick(search)}>
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
                      <button key={idx} type="button" onClick={() => handleSpecialtyClick(spec)}>
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="active-filters">
              {searchParams.get('search') && (
                <span className="filter-tag">
                  Search: {searchParams.get('search')}
                  <button onClick={() => {
                    setSearchQuery('');
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('search');
                    setSearchParams(newParams);
                  }}><FiX /></button>
                </span>
              )}
              {searchParams.get('location') && (
                <span className="filter-tag">
                  <FiMapPin /> {searchParams.get('location')}
                  <button onClick={() => {
                    setLocationQuery('');
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('location');
                    setSearchParams(newParams);
                  }}><FiX /></button>
                </span>
              )}
              {searchParams.get('specialty') && (
                <span className="filter-tag">
                  {searchParams.get('specialty')}
                  <button onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('specialty');
                    setSearchParams(newParams);
                  }}><FiX /></button>
                </span>
              )}
              <button className="clear-all-btn" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          )}

          {/* Tailors Grid */}
          {loading ? (
            <div className="loading-container">
              <div className="spinner" />
            </div>
          ) : tailors.length === 0 ? (
            <div className="empty-state">
              <h3>No tailors found</h3>
              <p>Try adjusting your search or filters</p>
              {hasActiveFilters && (
                <button className="btn-clear" onClick={clearFilters}>Clear filters</button>
              )}
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
                      <div className="card-image">
                        {tailor.profilePhoto ? (
                          <img src={tailor.profilePhoto} alt={displayName} />
                        ) : (
                          <div className="avatar-placeholder">{displayName.charAt(0)}</div>
                        )}
                      </div>
                      <div className="card-content">
                        <div className="card-header">
                          <h3>{displayName}</h3>
                        </div>
                        <span className="card-username">@{tailor.username}</span>

                        <div className="card-stats">
                          <div className="stat">
                            <span className="stat-label">Rating</span>
                            <div className="stat-value">
                              <FiStar className="star" />
                              {rating.toFixed(1)}
                            </div>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Reviews</span>
                            <div className="stat-value">
                              {reviewCount}
                            </div>
                          </div>
                          {tailor.location?.city && (
                            <div className="stat">
                              <span className="stat-label">Location</span>
                              <div className="stat-value">
                                {tailor.location.city}
                              </div>
                            </div>
                          )}
                        </div>

                        {tailor.specialties?.length > 0 && (
                          <div className="card-tags">
                            {tailor.specialties.slice(0, 3).map(spec => (
                              <span key={spec} className="specialty-tag">{spec}</span>
                            ))}
                          </div>
                        )}
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
