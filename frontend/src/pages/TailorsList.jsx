import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiStar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Header from '../components/layout/Header';
import { tailorsAPI } from '../services/api';
import { SPECIALTIES } from '../utils/constants';
import './TailorsList.scss';

export default function TailorsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

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
