// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import styles from './HomePage.module.css'; // Assuming you have this from previous steps
import axios from 'axios';

// --- LeadCard Component ---
// This component will display a single lead, either as featured or as a list item.
// We'll keep it relatively simple for now and focus on the click logic.
const LeadCard = ({ place, isFeatured = false, onClickCard }) => {
  const imageUrl = place.photo_url 
                 ? place.photo_url 
                 : `https://via.placeholder.com/600x300.png/2a2a2e/ffffff?text=${encodeURIComponent(place.name || 'Venue')}`; // Darker placeholder

  // Conditional styling or structure based on 'isFeatured'
  const cardStyle = isFeatured ? styles.featuredLeadCard : styles.listLeadCard;
  const nameStyle = isFeatured ? styles.featuredCardName : styles.listCardName;
  const addressStyle = isFeatured ? styles.featuredCardAddress : styles.listCardAddress;
  // Add more conditional styles as needed

  return (
    <div 
      className={cardStyle}
      onClick={!isFeatured && onClickCard ? () => onClickCard(place) : undefined} // Only add onClick to list items
      style={!isFeatured && onClickCard ? { cursor: 'pointer' } : {}}
    >
      {/* Image - Show more prominently for featured, maybe smaller/none for list */}
      {isFeatured && (
        <div className={styles.cardImageContainer}>
          <img 
            src={imageUrl} 
            alt={place.name || 'Venue image'} 
            className={styles.cardImage}
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = `https://via.placeholder.com/600x300.png/2a2a2e/ffffff?text=${encodeURIComponent(place.name || 'No Image')}`;
            }}
          />
        </div>
      )}
      {/* If you want small images for list items, add conditional rendering here too */}
      {/* {!isFeatured && place.photo_url && (
        <div className={styles.listCardImageContainer}>
          <img src={place.photo_url} alt={place.name} className={styles.cardImage} />
        </div>
      )} */}

      <div className={styles.cardContent}>
        <h4 className={nameStyle}>{place.name || 'N/A'}</h4>
        <p className={addressStyle}>{place.address || 'N/A'}</p>
        
        {isFeatured && place.phone_number && (
          <p className={styles.featuredCardDetail}>Phone: {place.phone_number}</p>
        )}
        {isFeatured && place.website && (
           <p className={styles.featuredCardDetail}><a href={place.website} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>Visit Website</a></p>
        )}
        
        <div className={styles.cardActions}>
          <button className={styles.saveLeadButton}>Save to My Leads</button>
        </div>
      </div>
    </div>
  );
};


// --- SearchResults Component ---
// This component will receive the full list of results, the currently featured lead,
// and the handler to change the featured lead.
const SearchResults = ({ allResults, featuredLead, onSelectLead }) => {
  if (!featuredLead) return null; // Don't render if there's no lead to feature

  // Filter out the currently featured lead from the side list
  // Show up to 4 other leads in the side list
  const otherLeads = allResults
    .filter(p => p.google_place_id !== featuredLead.google_place_id)
    .slice(0, 4);

  return (
    <div className={styles.resultsDisplayContainer}>
      <div className={styles.leadsLayout}>
        {/* Featured Lead Section */}
        <div className={styles.featuredLeadSection}>
          <LeadCard place={featuredLead} isFeatured={true} />
        </div>
        
        {/* List of Other Leads Section */}
        {otherLeads.length > 0 && (
          <div className={styles.otherLeadsSection}>
            {otherLeads.map(place => (
              <LeadCard 
                key={place.google_place_id || place.name + place.address} 
                place={place} 
                isFeatured={false} 
                onClickCard={onSelectLead} // Pass the handler here
              />
            ))}
          </div>
        )}
      </div>

      {/* Pro Teaser - shows if there are more results than displayed (1 featured + 4 list) */}
      {allResults.length > 5 && ( 
        <div className={styles.proTeaser}>
          <p>Want to see all {allResults.length} results and unlock full details?</p>
          <button className={styles.proButton}>Go Pro!</button>
        </div>
      )}
    </div>
  );
};


// --- HomePage Component (Main) ---
function HomePage() {
  const [query, setQuery] = useState('');
  const [allSearchResults, setAllSearchResults] = useState([]); // Stores ALL results from API
  const [selectedLead, setSelectedLead] = useState(null);    // This will be our featured lead
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);     // To track if a search has been made

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) { 
      setSearchError('Please enter a search term.'); 
      setAllSearchResults([]); // Clear previous results if query is empty
      setSelectedLead(null);
      setHasSearched(true); // Still counts as a search attempt
      return; 
    }
    
    setIsLoading(true); 
    setSearchError(''); 
    // Don't clear allSearchResults & selectedLead immediately if you want to keep old results during load
    // For this version, let's clear them for a fresh search feel
    setAllSearchResults([]);
    setSelectedLead(null);
    setHasSearched(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002'; // Ensure your backend is on 5002
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/places`, { params: { query: query } });
      if (response.data && response.data.status === "OK" && response.data.places.length > 0) {
        setAllSearchResults(response.data.places);
        setSelectedLead(response.data.places[0]); // Set the first result as initially featured
      } else if (response.data && (response.data.status === "ZERO_RESULTS" || response.data.places.length === 0)) {
        // setAllSearchResults([]); // Already cleared above
        // setSelectedLead(null);
        setSearchError(`No leads found for "${query}". Try different keywords!`);
      } else {
        // setAllSearchResults([]); // Already cleared
        // setSelectedLead(null);
        setSearchError(response.data.message || 'An error occurred while fetching leads.');
      }
    } catch (err) {
      console.error("Search API error:", err);
      // setAllSearchResults([]); // Already cleared
      // setSelectedLead(null);
      setSearchError(err.response?.data?.message || err.message || 'Failed to connect to the search service.');
    } finally {
      setIsLoading(false);
    }
  };

  // This function will be called when a lead in the side list is clicked
  const handleSelectLeadFromList = (place) => {
    setSelectedLead(place);
    // Optional: Scroll the featured lead section into view if needed, especially on mobile
    // const featuredSection = document.getElementById('featured-lead-area');
    // if (featuredSection) {
    //   featuredSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // }
  };

  return (
    <div className={styles.homePageContainer}> {/* This should have your background effects */}
      <header className={styles.heroSection}> {/* This contains tagline and search form */}
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

      {/* Results Area: This div wraps loading, error, or actual results */}
      <div className={styles.resultsArea} id="featured-lead-area"> {/* Added id for potential scroll target */}
        {isLoading && (
            <p className={styles.loadingMessage}>✨ Fetching fresh leads for "{query}"...</p>
        )}

        {!isLoading && searchError && (
            <p className={`${styles.message} ${styles.errorMessage}`}>{searchError}</p>
        )}
        
        {!isLoading && !searchError && hasSearched && allSearchResults.length === 0 && (
          <p className={styles.message}>🤔 No leads found for "{query}". Try a different search!</p>
        )}

        {/* Render SearchResults only if not loading, no error, and a selectedLead exists */}
        {!isLoading && !searchError && selectedLead && (
          <SearchResults 
            allResults={allSearchResults} 
            featuredLead={selectedLead}
            onSelectLead={handleSelectLeadFromList} 
          />
        )}
      </div>
    </div>
  );
}

export default HomePage;