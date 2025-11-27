import { useState } from 'react';
import { FiSearch, FiSend } from 'react-icons/fi';
import TailorCard from '../components/cards/TailorCard';
import Button from '../components/common/Button';
import { searchAPI } from '../services/api';
import './AISearch.scss';

export default function AISearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const exampleQueries = [
    "I need a wedding dress with vintage lace details",
    "Looking for a tailor who specializes in African traditional wear",
    "Custom suit maker in New York with great reviews",
    "Someone who can do alterations on a tight deadline"
  ];

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await searchAPI.ai(query);
      setResults(response.data.data || []);
    } catch (error) {
      console.error('AI search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
  };

  return (
    <div className="ai-search-page page">
      <div className="container">
        <div className="ai-search-hero">
          <h1>AI-Powered Tailor Finder</h1>
          <p>Describe what you're looking for in natural language, and our AI will find the best matches for you.</p>

          <form onSubmit={handleSearch} className="ai-search-form">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <textarea
                placeholder="Describe what you're looking for... (e.g., 'I need a tailor who specializes in wedding dresses with experience in lace work')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={3}
              />
            </div>
            <Button type="submit" loading={loading} disabled={!query.trim()}>
              <FiSend /> Find Tailors
            </Button>
          </form>

          {!searched && (
            <div className="example-queries">
              <p>Try these examples:</p>
              <div className="examples">
                {exampleQueries.map((example, index) => (
                  <button
                    key={index}
                    className="example-btn"
                    onClick={() => handleExampleClick(example)}
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {searched && (
          <div className="ai-search-results">
            <h2>
              {loading ? 'Searching...' : `Found ${results.length} matching tailors`}
            </h2>

            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <p>Our AI is finding the best matches for you...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <h3>No matches found</h3>
                <p>Try describing what you're looking for differently, or browse all tailors.</p>
                <Button onClick={() => window.location.href = '/tailors'}>
                  Browse All Tailors
                </Button>
              </div>
            ) : (
              <div className="grid grid-4">
                {results.map(tailor => (
                  <TailorCard key={tailor._id} tailor={tailor} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
