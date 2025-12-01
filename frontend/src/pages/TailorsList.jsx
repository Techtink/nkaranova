import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import TailorCard from '../components/cards/TailorCard';
import Button from '../components/common/Button';
import { tailorsAPI } from '../services/api';
import { SPECIALTIES } from '../utils/constants';
import './TailorsList.scss';

export default function TailorsList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialty: searchParams.get('specialty') || '',
    location: searchParams.get('location') || '',
    minRating: searchParams.get('minRating') || '',
    sortBy: searchParams.get('sortBy') || 'rating'
  });

  useEffect(() => {
    fetchTailors();
  }, [searchParams]);

  const fetchTailors = async () => {
    setLoading(true);
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 12,
        search: searchParams.get('search'),
        specialty: searchParams.get('specialty'),
        location: searchParams.get('location'),
        minRating: searchParams.get('minRating'),
        sortBy: searchParams.get('sortBy') || 'rating'
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const newParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) newParams.set(key, value);
    });
    setSearchParams(newParams);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      specialty: '',
      location: '',
      minRating: '',
      sortBy: 'rating'
    });
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page);
    setSearchParams(newParams);
  };

  return (
    <div className="tailors-page page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1>Find Tailors</h1>
            <p>Browse talented tailors from around the world</p>
          </div>
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
          </button>
        </div>

        {/* Filters */}
        <div className={`filters-panel ${showFilters ? 'open' : ''}`}>
          <div className="filters-header">
            <h3>Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <FiX />
            </button>
          </div>

          <div className="filters-body">
            <div className="filter-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Search by name, bio..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Specialty</label>
              <select
                value={filters.specialty}
                onChange={(e) => handleFilterChange('specialty', e.target.value)}
              >
                <option value="">All Specialties</option>
                {SPECIALTIES.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Location</label>
              <input
                type="text"
                placeholder="City or country"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>Minimum Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => handleFilterChange('minRating', e.target.value)}
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <option value="rating">Top Rated</option>
                <option value="reviews">Most Reviews</option>
                <option value="newest">Newest</option>
                <option value="works">Most Works</option>
              </select>
            </div>
          </div>

          <div className="filters-actions">
            <Button variant="ghost" onClick={clearFilters}>Clear All</Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : tailors.length === 0 ? (
          <div className="empty-state">
            <h3>No tailors found</h3>
            <p>Try adjusting your filters or search criteria</p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <>
            <p className="results-count">
              Showing {tailors.length} of {pagination.total || 0} tailors
            </p>

            <div className="grid grid-4">
              {tailors.map(tailor => (
                <TailorCard key={tailor._id} tailor={tailor} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <Button
                  variant="ghost"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </Button>
                <span className="page-info">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="ghost"
                  disabled={!pagination.hasNextPage}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
