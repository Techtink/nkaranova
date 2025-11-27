import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import WorkCard from '../components/cards/WorkCard';
import Button from '../components/common/Button';
import { worksAPI } from '../services/api';
import { WORK_CATEGORIES } from '../utils/constants';
import './Gallery.scss';

export default function Gallery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [works, setWorks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  const activeCategory = searchParams.get('category') || '';
  const sortBy = searchParams.get('sortBy') || 'newest';

  useEffect(() => {
    fetchWorks();
    fetchCategories();
  }, [searchParams]);

  const fetchWorks = async () => {
    setLoading(true);
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 20,
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

  const fetchCategories = async () => {
    try {
      const response = await worksAPI.getCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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
  };

  return (
    <div className="gallery-page page">
      <div className="container">
        <div className="page-header">
          <h1>Gallery</h1>
          <p>Explore beautiful creations from talented tailors</p>
        </div>

        {/* Filters */}
        <div className="gallery-filters">
          <div className="category-filters">
            <button
              className={`category-btn ${!activeCategory ? 'active' : ''}`}
              onClick={() => handleCategoryChange('')}
            >
              All
            </button>
            {WORK_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="popular">Most Viewed</option>
            <option value="likes">Most Liked</option>
          </select>
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
            <div className="grid grid-4">
              {works.map(work => (
                <WorkCard key={work._id} work={work} />
              ))}
            </div>

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
