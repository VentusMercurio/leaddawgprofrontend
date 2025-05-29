// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import styles from './HomePage.module.css';
import axios from 'axios';

// --- LeadCard Component (REMOVING DEBUG TEXT) ---
const LeadCard = ({ place, isFeatured = false, onClickCard }) => {
  const placeholderText = encodeURIComponent(place.name || 'Venue');
  const featuredPlaceholder = `https://via.placeholder.com/600x300.png/2a2a2e/ffffff?text=FP:${placeholderText}`;
  const listPlaceholder = `https://via.placeholder.com/100x75.png/2a2a2e/ffffff?text=LP:${placeholderText}`;

  // State for image source and error, managed by useEffect now
  const [currentImageSrc, setCurrentImageSrc] = useState(isFeatured ? featuredPlaceholder : listPlaceholder);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    // This effect runs when the 'place' prop changes, or when 'isFeatured' changes.
    // It attempts to load the real photo_url if available.
    let determinedSrc = isFeatured ? featuredPlaceholder : listPlaceholder; // Default to placeholder
    if (place.photo_url && typeof place.photo_url === 'string' && place.photo_url.trim() !== '') {
      determinedSrc = place.photo_url;
    }
    
    setCurrentImageSrc(determinedSrc);
    setImageLoadFailed(false); // Reset error state for a new image/place
  }, [place.photo_url, place.name, isFeatured]); // Dependencies

  const handleImageError = () => {
    if (!imageLoadFailed) { // Prevent looping if placeholder itself fails
      console.warn(`IMAGE LOAD ERROR for "${place.name}". Attempted src:`, currentImageSrc, "Will use placeholder.");
      setImageLoadFailed(true); // Mark that the primary image attempt failed
      // The src will effectively be the placeholder because currentImageSrc won't update to a real URL again
      // unless place.photo_url changes in props.
      // If you want to explicitly set to placeholder again on error:
      // setCurrentImageSrc(isFeatured ? featuredPlaceholder : listPlaceholder);
    }
  };

  const handleImageLoad = () => {
    // console.log(`IMAGE LOAD SUCCESS for "${place.name}". Src:`, currentImageSrc);
    // If a real image loads successfully, ensure no error state lingers
    if (currentImageSrc === place.photo_url) {
        setImageLoadFailed(false);
    }
  };
  
  const cardClassName = isFeatured ? styles.featuredLeadCard : styles.listLeadCard;
  
  // Determine if an image container should be shown
  // Show for featured, or for list items IF they have a photo_url (and it hasn't errored out into placeholder)
  const showImageVisual = isFeatured || (!isFeatured && place.photo_url && typeof place.photo_url === 'string' && place.photo_url.trim() !== '');

  // Determine the final src for the img tag: either the currentImageSrc (which could be real or placeholder)
  // OR if imageLoadFailed is true, definitely the placeholder.
  const finalDisplaySrc = imageLoadFailed ? (isFeatured ? featuredPlaceholder : listPlaceholder) : currentImageSrc;

  return (
    <div 
      className={cardClassName}
      onClick={!isFeatured && onClickCard ? () => onClickCard(place) : undefined}
      style={!isFeatured && onClickCard ? { cursor: 'pointer' } : {}}
      title={!isFeatured && onClickCard ? `View details for ${place.name}` : ''}
    >
      {showImageVisual && (
        <div className={isFeatured ? styles.cardImageContainer : styles.listCardImageContainer}>
          <img 
            key={finalDisplaySrc} // Key helps React differ between real img and placeholder if src string is same
            src={finalDisplaySrc} 
            alt={`${place.name || 'Venue'} image`} 
            className={styles.cardImage}
            onLoad={handleImageLoad}
            onError={handleImageError} 
          />
        </div>
      )}
      
      <div className={styles.cardContent}>
        <h4 className={isFeatured ? styles.featuredCardName : styles.listCardName}>
          {place.name || 'N/A'}
        </h4>
        <p className={isFeatured ? styles.featuredCardAddress : styles.listCardAddress}>
          {isFeatured ? (place.address || 'N/A') : (place.address ? place.address.split(',')[0] : 'N/A')}
        </p>
        {isFeatured && place.phone_number && (
          <p className={styles.featuredCardDetail}>Phone: {place.phone_number}</p>
        )}
        {isFeatured && place.website && (
           <p className={styles.featuredCardDetail}>
             <a href={place.website} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>
               Visit Website
             </a>
           </p>
        )}
        {isFeatured && (
          <div className={styles.cardActions}>
            <button className={styles.saveLeadButton}>Save to My Leads</button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SearchResults Component (No changes needed from your last working version) ---
const SearchResults = ({ allResults, featuredLead, onSelectLead }) => {
  // ... (The logic here should be the one that correctly filters and maps to LeadCard)
  if (!featuredLead) return null;
  const otherLeads = allResults
    .filter(p => p.google_place_id !== featuredLead.google_place_id)
    .slice(0, 4);

  return (
    <div className={styles.resultsDisplayContainer}>
      <div className={styles.leadsLayout}>
        {featuredLead && (
          <div className={styles.featuredLeadSection}>
            <LeadCard place={featuredLead} isFeatured={true} />
          </div>
        )}
        {otherLeads.length > 0 && (
          <div className={styles.otherLeadsSection}>
            {otherLeads.map(place => (
              <LeadCard 
                key={place.google_place_id || place.name + place.address} 
                place={place} 
                isFeatured={false} 
                onClickCard={onSelectLead}
              />
            ))}
          </div>
        )}
      </div>
      {allResults.length > 5 && ( 
        <div className={styles.proTeaser}>
          <p>Want to see all {allResults.length} results and unlock full details?</p>
          <button className={styles.proButton}>Go Pro!</button>
        </div>
      )}
    </div>
  );
};

// --- HomePage Component (No changes needed from your last working version) ---
function HomePage() {
  // ... (The state and handlers here should be the version that implemented click-to-feature)
  const [query, setQuery] = useState('');
  const [allSearchResults, setAllSearchResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) { setSearchError('Please enter a search term.'); setAllSearchResults([]); setSelectedLead(null); setHasSearched(true); return; }
    setIsLoading(true); setSearchError(''); setAllSearchResults([]); setSelectedLead(null); setHasSearched(true);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/places`, { params: { query: query } });
      if (response.data && response.data.status === "OK" && response.data.places.length > 0) {
        setAllSearchResults(response.data.places);
        setSelectedLead(response.data.places[0]);
      } else if (response.data && (response.data.status === "ZERO_RESULTS" || response.data.places.length === 0)) {
        setSearchError(`No leads found for "${query}". Try different keywords!`);
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

  const handleSelectLeadFromList = (place) => {
    setSelectedLead(place);
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

      <div className={styles.resultsArea} id="featured-lead-area">
        {isLoading && <p className={styles.loadingMessage}>✨ Fetching fresh leads for "{query}"...</p>}
        {!isLoading && searchError && <p className={`${styles.message} ${styles.errorMessage}`}>{searchError}</p>}
        {!isLoading && !searchError && hasSearched && allSearchResults.length === 0 && (
          <p className={styles.message}>🤔 No leads found for "{query}". Try a different search!</p>
        )}
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