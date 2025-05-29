// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import styles from './HomePage.module.css';
import axios from 'axios';

// --- Lead Card Component (UPDATED) ---
const LeadCard = ({ place, isFeatured = false }) => {
  // Use the photo_url from the place data if available, otherwise fallback to placeholder
  const imageUrl = place.photo_url 
                 ? place.photo_url 
                 : `https://via.placeholder.com/600x400.png?text=${encodeURIComponent(place.name || 'Venue')}`;
  
  // For list items, we might not show the image or show a smaller one.
  // Current CSS has .cardImagePlaceholder hidden for non-featured.
  // If you want small images for list items, you'd adjust CSS and JSX here.

  return (
    <div className={isFeatured ? styles.featuredLeadCard : styles.listLeadCard}>
      {isFeatured && (
        <div className={styles.cardImageContainer}> {/* Changed class for clarity */}
          <img 
            src={imageUrl} 
            alt={place.name || 'Venue image'} 
            className={styles.cardImage} // New class for the img tag
            onError={(e) => { 
              // Fallback if the image URL fails to load (e.g., broken link from API)
              e.target.onerror = null; // Prevents looping if placeholder also fails
              e.target.src = `https://via.placeholder.com/600x400.png?text=${encodeURIComponent(place.name || 'Error Loading Image')}`;
            }}
          />
        </div>
      )}
      
      <div className={styles.cardContent}>
        <h4 className={styles.cardName}>{place.name || 'N/A'}</h4>
        <p className={styles.cardAddress}>{place.address || 'N/A'}</p>
        
        {isFeatured && place.phone_number && (
          <p className={styles.cardPhone}>Phone: {place.phone_number}</p>
        )}
        {isFeatured && place.website && (
           <p className={styles.cardWebsite}><a href={place.website} target="_blank" rel="noopener noreferrer">Visit Website</a></p>
        )}
        
        <div className={styles.cardActions}>
          <button className={styles.saveLeadButton}>Save to My Leads</button>
          {/* Add "View Details" later */}
        </div>
      </div>
    </div>
  );
};


// --- SearchResults Component (No change from your last good version) ---
const SearchResults = ({ results, loading, error }) => {
  // ... (This component's logic for slicing results and mapping to LeadCard remains the same)
  if (loading) return <p className={styles.loadingMessage}>✨ Finding top spots for you...</p>;
  if (!results || results.length === 0) return null;

  const featuredResult = results[0];
  const otherResults = results.slice(1, 5); 

  return (
    <div className={styles.resultsDisplayContainer}>
      <div className={styles.leadsLayout}>
        {featuredResult && (
          <div className={styles.featuredLeadSection}>
            <LeadCard place={featuredResult} isFeatured={true} />
          </div>
        )}
        {otherResults.length > 0 && (
          <div className={styles.otherLeadsSection}>
            {otherResults.map(place => (
              <LeadCard key={place.google_place_id || place.name} place={place} isFeatured={false} />
            ))}
          </div>
        )}
      </div>
      {results.length > 5 && (
        <div className={styles.proTeaser}>
          <p>Want to see all {results.length} results and unlock full details?</p>
          <button className={styles.proButton}>Go Pro!</button>
        </div>
      )}
    </div>
  );
};


// --- HomePage Component (No change from your last good version, only the LeadCard within it is updated) ---
function HomePage() {
  // ... (useState for query, searchResults, isLoading, searchError, hasSearched - all same)
  // ... (handleSearchSubmit function - all same)
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchSubmit = async (event) => {
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