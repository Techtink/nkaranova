import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiSearch,
  FiChevronDown,
  FiSliders,
  FiChevronRight,
  FiHome,
  FiChevronLeft,
  FiStar
} from 'react-icons/fi';
import Header from '../components/layout/Header';
import { tailorsAPI } from '../services/api';
import { SPECIALTIES } from '../utils/constants';
import './TailorsList.scss';

export default function TailorsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);

  const activeSpecialty = searchParams.get('specialty') || '';
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
        limit: 12,
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

  const handleSpecialtyChange = (specialty) => {
    const newParams = new URLSearchParams(searchParams);
    if (specialty) {
      newParams.set('specialty', specialty);
    } else {
      newParams.delete('specialty');
    }
    newParams.delete('page');
    setSearchParams(newParams);
    setShowSpecialtyDropdown(false);
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSearchParams(new URLSearchParams());
  };

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

  return (
    <>
      <Header />
      <div className="tailors-list-page">
        <div className="container">
          {/* Main Card Container */}
          <div className="tailors-main-card">
            {/* Breadcrumb */}
            <div className="breadcrumb">
              <Link to="/"><FiHome /></Link>
              <FiChevronRight className="separator" />
              <span className="current">Find Tailors</span>
            </div>

            {/* Header Section */}
            <div className="tailors-header">
              <h1>Find Tailors</h1>
              {tailors.length > 0 && (
                <div className="tailors-preview">
                  <div className="avatar-stack">
                    {tailors.slice(0, 4).map((tailor, idx) => (
                      <div key={tailor._id} className="stacked-avatar" style={{ zIndex: 4 - idx }}>
                        {tailor.profilePhoto ? (
                          <img src={tailor.profilePhoto} alt="" />
                        ) : (
                          <span>{(tailor.businessName || tailor.user?.firstName || 'T').charAt(0)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <span className="tailor-count">{pagination.total || tailors.length}</span>
                </div>
              )}
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
              <form className="search-input" onSubmit={handleSearch}>
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <div className="specialty-dropdown">
                <button
                  className="dropdown-btn"
                  onClick={() => setShowSpecialtyDropdown(!showSpecialtyDropdown)}
                >
                  <span>{activeSpecialty || 'Specialty'}</span>
                  <FiChevronDown className={showSpecialtyDropdown ? 'rotate' : ''} />
                </button>
                {showSpecialtyDropdown && (
                  <div className="dropdown-menu">
                    <button
                      className={!activeSpecialty ? 'active' : ''}
                      onClick={() => handleSpecialtyChange('')}
                    >
                      All Specialties
                    </button>
                    {SPECIALTIES.map(spec => (
                      <button
                        key={spec}
                        className={activeSpecialty === spec ? 'active' : ''}
                        onClick={() => handleSpecialtyChange(spec)}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="filter-btn" onClick={clearFilters}>
                <FiSliders />
              </button>
            </div>

            {/* Tailors Grid */}
            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
              </div>
            ) : tailors.length === 0 ? (
              <div className="empty-state">
                <h3>No tailors found</h3>
                <p>Try adjusting your filters or search criteria</p>
                <button className="btn-primary" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="tailors-grid">
                  {tailors.map(tailor => {
                    const displayName = tailor.businessName || `${tailor.user?.firstName || ''} ${tailor.user?.lastName || ''}`.trim() || 'Tailor';
                    const primarySpecialty = tailor.specialties?.[0] || 'Custom Design';
                    const rating = tailor.averageRating || 5.0;
                    const ratingPercent = (rating / 5) * 100;

                    return (
                      <Link
                        key={tailor._id}
                        to={`/tailor/${tailor.username}`}
                        className="tailor-card"
                      >
                        {/* Profile Photo */}
                        <div className="card-avatar">
                          {tailor.profilePhoto ? (
                            <img src={tailor.profilePhoto} alt={displayName} />
                          ) : (
                            <span className="avatar-placeholder">{displayName.charAt(0)}</span>
                          )}
                        </div>

                        {/* Name & Role */}
                        <h3 className="card-name">{displayName}</h3>
                        <p className="card-role">{primarySpecialty}</p>

                        {/* Stats */}
                        <div className="card-stats">
                          <div className="stat">
                            <span className="stat-label">Works</span>
                            <span className="stat-value">{tailor.workCount || 0}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Reviews</span>
                            <span className="stat-value">{tailor.reviewCount || 0}</span>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Years</span>
                            <span className="stat-value">{tailor.yearsOfExperience || 1}</span>
                          </div>
                        </div>

                        {/* Rating Bar */}
                        <div className="card-rating">
                          <div className="rating-bar">
                            <div
                              className="rating-fill"
                              style={{ width: `${ratingPercent}%` }}
                            />
                          </div>
                          <span className="rating-label">
                            <FiStar className="star" />
                            Rating: <strong>{rating.toFixed(1)}</strong>
                          </span>
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
      </div>
    </>
  );
}
