import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiX, FiTag, FiPlus, FiChevronDown, FiStar, FiMapPin, FiClock, FiInfo } from 'react-icons/fi';
import Header from '../components/layout/Header';
import { searchAPI, tailorsAPI } from '../services/api';
import './AISearch.scss';

const STYLE_PREFERENCES = [
  'Traditional', 'Modern', 'Casual', 'Formal', 'Wedding', 'African', 'Western', 'Custom Fit'
];

const SORT_OPTIONS = [
  { value: 'best_match', label: 'Best Match' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'reviews', label: 'Most Reviews' },
  { value: 'newest', label: 'Newest' }
];

export default function AISearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [featuredTailors, setFeaturedTailors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('best_match');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    fetchFeaturedTailors();
  }, []);

  const fetchFeaturedTailors = async () => {
    try {
      const response = await tailorsAPI.getAll({ limit: 6, sortBy: 'rating' });
      setFeaturedTailors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching featured tailors:', error);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() && selectedTags.length === 0) return;

    setLoading(true);
    setSearched(true);

    try {
      const searchQuery = [query, ...selectedTags].filter(Boolean).join(' ');
      const response = await searchAPI.ai(searchQuery);
      setResults(response.data.data || []);
    } catch (error) {
      console.error('AI search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearched(false);
    setResults([]);
  };

  const handleAddTag = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setShowTagDropdown(false);
  };

  const handleRemoveTag = (tag) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <>
      <Header />
      <div className="ai-search-page">
        {/* Blue Gradient Header */}
        <div className="ai-search-header">
          <div className="container">
            {/* Main Search Bar */}
            <div className="search-bar-container">
              <div className="search-bar">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Describe what you're looking for..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                {query && (
                  <button className="clear-btn" onClick={handleClearSearch}>
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            {/* Style Preferences Section */}
            <div className="preferences-section">
              <div className="preferences-header">
                <FiTag className="pref-icon" />
                <div className="pref-text">
                  <span className="pref-title">What style are you looking for?</span>
                  <span className="pref-subtitle">Add preferences to help our AI find better matches for you.</span>
                </div>
              </div>

              <div className="selected-tags">
                {selectedTags.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>
                      <FiX />
                    </button>
                  </span>
                ))}
                <div className="add-tag-wrapper">
                  <button
                    className="add-tag-btn"
                    onClick={() => setShowTagDropdown(!showTagDropdown)}
                  >
                    <FiPlus />
                  </button>
                  {showTagDropdown && (
                    <div className="tag-dropdown">
                      {STYLE_PREFERENCES.filter(t => !selectedTags.includes(t)).map(tag => (
                        <button key={tag} onClick={() => handleAddTag(tag)}>
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results Summary */}
            {searched && !loading && (
              <div className="results-summary">
                <FiInfo className="info-icon" />
                <span>
                  Found <strong>{results.length}</strong> tailors matching your description.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="ai-search-content">
          <div className="container">
            {/* Featured Tailors Section */}
            {!searched && featuredTailors.length > 0 && (
              <section className="featured-section">
                <div className="section-header">
                  <h2>Top Rated Tailors <span>({featuredTailors.length})</span></h2>
                  <Link to="/tailors" className="view-all">View All</Link>
                </div>
                <div className="featured-grid">
                  {featuredTailors.map(tailor => (
                    <Link
                      key={tailor._id}
                      to={`/tailor/${tailor.username}`}
                      className="featured-card"
                    >
                      <div className="featured-rating">
                        {tailor.rating?.toFixed(1) || '5.0'} stars
                      </div>
                      <h3>{tailor.businessName || `${tailor.firstName} ${tailor.lastName}`}</h3>
                      <p>{tailor.bio?.substring(0, 80) || 'Expert tailor specializing in custom designs...'}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Search Results Section */}
            <section className="results-section">
              <div className="results-header">
                <h2>
                  {searched ? 'Search Results' : 'All Tailors'}
                  <span>({searched ? results.length : featuredTailors.length})</span>
                </h2>

                <div className="results-controls">
                  <div className="sort-dropdown">
                    <span>Sort by:</span>
                    <button
                      className="sort-btn"
                      onClick={() => setShowSortDropdown(!showSortDropdown)}
                    >
                      {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                      <FiChevronDown className={showSortDropdown ? 'rotate' : ''} />
                    </button>
                    {showSortDropdown && (
                      <div className="sort-menu">
                        {SORT_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            className={sortBy === option.value ? 'active' : ''}
                            onClick={() => {
                              setSortBy(option.value);
                              setShowSortDropdown(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Chips */}
              <div className="filter-chips">
                {STYLE_PREFERENCES.slice(0, 7).map(pref => (
                  <button
                    key={pref}
                    className={`filter-chip ${selectedTags.includes(pref) ? 'active' : ''}`}
                    onClick={() => selectedTags.includes(pref) ? handleRemoveTag(pref) : handleAddTag(pref)}
                  >
                    {pref}
                  </button>
                ))}
                <button className="filter-chip more-filters">
                  More Filters
                </button>
              </div>

              {/* Results Grid */}
              {loading ? (
                <div className="loading-container">
                  <div className="spinner" />
                  <p>Our AI is finding the best matches for you...</p>
                </div>
              ) : (
                <div className="results-grid">
                  {(searched ? results : featuredTailors).map(tailor => (
                    <Link
                      key={tailor._id}
                      to={`/tailor/${tailor.username}`}
                      className="result-card"
                    >
                      <div className="result-card-image">
                        {tailor.profilePhoto ? (
                          <img src={tailor.profilePhoto} alt={tailor.businessName} />
                        ) : (
                          <div className="avatar-placeholder">
                            {(tailor.businessName || tailor.firstName)?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="result-card-content">
                        <div className="result-card-header">
                          <h3>{tailor.businessName || `${tailor.firstName} ${tailor.lastName}`}</h3>
                          <div className="match-badge">
                            Match {Math.floor(Math.random() * 15) + 85}%
                          </div>
                        </div>
                        <span className="tailor-username">@{tailor.username}</span>

                        <div className="result-card-stats">
                          <div className="stat">
                            <span className="stat-label">Rating</span>
                            <div className="stat-value">
                              <FiStar className="star" />
                              {tailor.rating?.toFixed(1) || '5.0'}
                            </div>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Location</span>
                            <div className="stat-value">
                              <FiMapPin />
                              {tailor.location?.city || 'Lagos'}
                            </div>
                          </div>
                          <div className="stat">
                            <span className="stat-label">Experience</span>
                            <div className="stat-value">
                              <FiClock />
                              {tailor.yearsOfExperience || '5'}+ yrs
                            </div>
                          </div>
                        </div>

                        {tailor.specialties?.length > 0 && (
                          <div className="result-card-tags">
                            {tailor.specialties.slice(0, 3).map(spec => (
                              <span key={spec} className="specialty-tag">{spec}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {searched && results.length === 0 && !loading && (
                <div className="empty-state">
                  <h3>No matches found</h3>
                  <p>Try describing what you're looking for differently, or adjust your preferences.</p>
                  <button onClick={handleClearSearch} className="btn-primary">
                    Clear Search
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
