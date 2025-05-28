// src/pages/HomePage.jsx
import React, { useState } from 'react';
import styles from './HomePage.module.css';
import axios from 'axios';

// Placeholder for SearchResults component (keep as is for now)
const SearchResults = ({ results, loading, error }) => {
  // ... (no change from previous version)
  if (loading) return <p className={styles.message}>Searching for leads...</p>; // Make sure these use styles.message
  if (error) return <p className={`${styles.message} ${styles.errorMessage}`}>Error: {error}</p>;
  if (!results || results.length === 0) return null;

  return (
    <div className={styles.resultsContainer}>
      <h3>Search Results ({results.length}):</h3>
      <ul>
        {results.map(place => (
          <li key={place.google_place_id || place.name}>{place.name} - {place.address}</li>
        ))}
      </ul>
    </div>
  );
};

function HomePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleSearchSubmit = async (event) => {
    // ... (no change to search logic itself)
    event.preventDefault();
    if (!query.trim()) {
      setSearchError('Please enter a search term.');
      return;
    }
    setIsLoading(true);
    setSearchError('');
    setSearchResults([]); 

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/places`, {
        params: { query: query }
      });
      if (response.data && response.data.status === "OK") {
        setSearchResults(response.data.places);
      } else if (response.data && response.data.status === "ZERO_RESULTS") {
        setSearchError('No leads found for your search. Try different keywords!');
      } else {
        setSearchError(response.data.message || 'An error occurred while fetching leads.');
      }
    } catch (err) {
      console.error("Search API error:", err);
      setSearchError(err.response?.data?.message || err.message || 'Failed to connect to the search service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.homePageContainer}> {/* This now centers everything */}
      <header className={styles.heroSection}>
        <p className={styles.tagline}>What can we fetch today?</p> {/* This is your main CTA text */}
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text"
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., breweries in Albany, salons in NYC..."
          />
          <button type="submit" className={styles.searchButton} disabled={isLoading}>
            {isLoading ? 'Fetching...' : 'Fetch Leads'}
          </button>
        </form>
        {/* Ensure messages also use the styles object */}
        {isLoading && !searchError && <p className={styles.message}>🚀 Fetching fresh leads...</p>}
        {searchError && <p className={`${styles.message} ${styles.errorMessage}`}>{searchError}</p>}

      </header>

      {/* Only render SearchResults if not loading and there are results */}
      {!isLoading && searchResults.length > 0 && (
         <SearchResults results={searchResults} loading={false} error={null} />
      )}
      {!isLoading && searchResults.length === 0 && query && !searchError && (
         <p className={styles.message}>🤔 No leads found. Try a different search!</p>
      )}
     
    </div>
  );
}

export default HomePage;