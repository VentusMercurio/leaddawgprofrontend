// src/pages/HomePage.jsx
import React, { useState, useEffect /* Add useEffect if needed for other things later */ } from 'react';
import styles from './HomePage.module.css';
import axios from 'axios';

// --- Lead Card Component (New) ---
// This will represent a single lead item, used for both featured and list views
const LeadCard = ({ place, isFeatured = false }) => {
  // Placeholder for an image - in the future, this could be a real image URL
  const placeholderImageUrl = `https://via.placeholder.com/600x400.png?text=${encodeURIComponent(place.name || 'Venue')}`;
  // For featured, use a larger image placeholder, for list items, smaller
  const imageSize = isFeatured ? { width: '100%', height: '250px' } : { width: '120px', height: '80px' };

  return (
    <div className={isFeatured ? styles.featuredLeadCard : styles.listLeadCard}>
      {/* Image Placeholder - visible more for featured */}
      {isFeatured && (
        <div className={styles.cardImagePlaceholder} style={{ backgroundImage: `url(${placeholderImageUrl})` }}>
          {/* <img src={placeholderImageUrl} alt={place.name || 'Venue Image'} /> */}
        </div>
      )}
      
      <div className={styles.cardContent}>
        <h4 className={styles.cardName}>{place.name || 'N/A'}</h4>
        <p className={styles.cardAddress}>{place.address || 'N/A'}</p>
        {/* Add more details here as needed, or a "View Details" button */}
        {isFeatured && place.phone_number && (
          <p className={styles.cardPhone}>Phone: {place.phone_number}</p>
        )}
        {isFeatured && place.website && (
           <p className={styles.cardWebsite}><a href={place.website} target="_blank" rel="noopener noreferrer">Visit Website</a></p>
        )}
        
        {/* Action buttons */}
        <div className={styles.cardActions}>
          <button className={styles.saveLeadButton}>Save to My Leads</button>
          {/* Add more actions later, e.g., "View Details" that opens a modal */}
        </div>
      </div>
    </div>
  );
};


// --- SearchResults Component (Modified) ---
const SearchResults = ({ results, loading, error }) => {
  if (loading) return <p className={styles.loadingMessage}>✨ Finding top spots for you...</p>;
  // Error and no results handling will be done in HomePage now for better layout control

  if (!results || results.length === 0) return null;

  const featuredResult = results[0];
  const otherResults = results.slice(1, 5); // Show next 4 results (total 5 visible)

  return (
    <div className={styles.resultsDisplayContainer}>
      {/* Optional: Section for a small map placeholder (for future) */}
      {/* <div className={styles.mapPlaceholder}>Map Area (Coming Soon!)</div> */}

      <div className={styles.leadsLayout}>
        {/* Featured Lead Section */}
        {featuredResult && (
          <div className={styles.featuredLeadSection}>
            {/* <h3>Top Match:</h3> */}
            <LeadCard place={featuredResult} isFeatured={true} />
          </div>
        )}

        {/* List of Other Leads Section */}
        {otherResults.length > 0 && (
          <div className={styles.otherLeadsSection}>
            {/* <h4>More Places:</h4> */}
            {otherResults.map(place => (
              <LeadCard key={place.google_place_id || place.name} place={place} isFeatured={false} />
            ))}
          </div>
        )}
      </div>

      {results.length > 5 && ( // If more than 5 results were fetched from backend
        <div className={styles.proTeaser}>
          <p>Want to see all {results.length} results and unlock full details?</p>
          <button className={styles.proButton}>Go Pro!</button>
        </div>
      )}
    </div>
  );
};


// --- HomePage Component (Main) ---
function HomePage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false); // To track if a search has been made

  const handleSearchSubmit = async (event) => {
    // ... (handleSearchSubmit logic remains the same as previous version)
    event.preventDefault();
    if (!query.trim()) { setSearchError('Please enter a search term.'); return; }
    setIsLoading(true); setSearchError(''); setSearchResults([]); setHasSearched(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/places`, { params: { query: query } });
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
    <div className={styles.homePageContainer}>
      <header className={styles.heroSection}>
        <p className={styles.tagline}>What can we fetch today?</p>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input
            type="text" className={styles.searchInput} value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., breweries in Albany, salons in NYC..."
          />
          <button type="submit" className={styles.searchButton} disabled={isLoading}>
            {isLoading ? 'Fetching...' : 'Fetch Leads'}
          </button>
        </form>
      </header>

      {/* Display Area: Error, Loading, or Results */}
      <div className={styles.resultsArea}>
        {isLoading && <p className={styles.loadingMessage}>✨ Finding top spots for you...</p>}
        {!isLoading && searchError && <p className={`${styles.message} ${styles.errorMessage}`}>{searchError}</p>}
        {!isLoading && !searchError && hasSearched && searchResults.length === 0 && (
          <p className={styles.message}>🤔 No leads found for "{query}". Try a different search!</p>
        )}
        {!isLoading && !searchError && searchResults.length > 0 && (
          <SearchResults results={searchResults} />
        )}
      </div>
    </div>
  );
}

export default HomePage;