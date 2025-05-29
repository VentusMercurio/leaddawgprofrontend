// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './HomePage.module.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Make sure Link is imported

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

// --- LeadCard Component ---
const LeadCard = ({ place, isFeatured = false, onClickCard, onSaveLead, isLeadSaved, isSavingLead }) => {
  const placeholderText = encodeURIComponent(place.name || 'Venue');
  const featuredPlaceholder = `https://via.placeholder.com/600x300.png/2a2a2e/ffffff?text=FP:${placeholderText}`;
  const listPlaceholder = `https://via.placeholder.com/100x75.png/2a2a2e/ffffff?text=LP:${placeholderText}`;

  const [currentImageSrc, setCurrentImageSrc] = useState(isFeatured ? featuredPlaceholder : listPlaceholder);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    let determinedSrc = isFeatured ? featuredPlaceholder : listPlaceholder;
    if (place.photo_url && typeof place.photo_url === 'string' && place.photo_url.trim() !== '') {
      determinedSrc = place.photo_url;
    }
    setCurrentImageSrc(determinedSrc);
    setImageLoadFailed(false);
  }, [place.photo_url, place.name, isFeatured, featuredPlaceholder, listPlaceholder]);

  const handleImageError = () => {
    if (!imageLoadFailed) {
      console.warn(`IMAGE LOAD ERROR for "${place.name}". Attempted src:`, currentImageSrc, "Will use placeholder.");
      setImageLoadFailed(true);
      setCurrentImageSrc(isFeatured ? featuredPlaceholder : listPlaceholder);
    }
  };

  const handleImageLoad = () => {
    if (currentImageSrc === place.photo_url) {
        setImageLoadFailed(false);
    }
  };
  
  const cardClassName = isFeatured ? styles.featuredLeadCard : styles.listLeadCard;
  const finalDisplaySrc = imageLoadFailed ? (isFeatured ? featuredPlaceholder : listPlaceholder) : currentImageSrc;
  const showImageVisual = isFeatured || (!isFeatured && place.photo_url && typeof place.photo_url === 'string' && place.photo_url.trim() !== '');

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
            key={finalDisplaySrc} 
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
            <button 
              className={styles.saveLeadButton}
              onClick={(e) => { e.stopPropagation(); onSaveLead(place); }} 
              disabled={isLeadSaved || isSavingLead} 
            >
              {isSavingLead ? 'Saving...' : (isLeadSaved ? 'Saved ✓' : 'Save to My Leads')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SearchResults Component (MODIFIED "Go Pro!" button to be a Link) ---
const SearchResults = ({ allResults, featuredLead, onSelectLead, onSaveLead, savedLeadIds, savingLeadId }) => {
  if (!featuredLead && (!allResults || allResults.length === 0)) { // Check allResults too
      return null; 
  }
  
  // Ensure featuredLead exists before trying to access its properties for filtering
  const featuredLeadId = featuredLead ? featuredLead.google_place_id : null;

  const otherLeads = allResults
    .filter(p => p.google_place_id !== featuredLeadId) 
    .slice(0, 4);

  // Determine if the "Go Pro" teaser should be shown
  // It shows if the total number of API results is greater than what we are displaying (1 featured + up to 4 others)
  const displayedCount = (featuredLead ? 1 : 0) + otherLeads.length;
  const showProTeaser = allResults.length > displayedCount && allResults.length > 0;


  return (
    <div className={styles.resultsDisplayContainer}>
      <div className={styles.leadsLayout}>
        {featuredLead && (
          <div className={styles.featuredLeadSection}>
            <LeadCard 
              place={featuredLead} 
              isFeatured={true} 
              onSaveLead={onSaveLead}
              isLeadSaved={featuredLeadId ? savedLeadIds.includes(featuredLeadId) : false}
              isSavingLead={featuredLeadId ? savingLeadId === featuredLeadId : false}
            />
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
                // Not passing save props to list items as per current design
              />
            ))}
          </div>
        )}
      </div>
      {showProTeaser && ( 
        <div className={styles.proTeaser}>
          <p>Want to see all {allResults.length} results and unlock full details?</p>
          <Link to="/pricing" className={styles.proButton}> {/* CHANGED TO LINK */}
            Go Pro!
          </Link>
        </div>
      )}
    </div>
  );
};


// --- HomePage Component ---
function HomePage() {
  const [query, setQuery] = useState('');
  const [allSearchResults, setAllSearchResults] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const { isLoggedIn } = useAuth(); 
  const navigate = useNavigate();   

  const [savedLeadIdsThisSearch, setSavedLeadIdsThisSearch] = useState([]);
  const [savingLeadId, setSavingLeadId] = useState(null); 
  const [userSavedLeadGoogleIds, setUserSavedLeadGoogleIds] = useState(new Set());

  const fetchUserSavedLeadIds = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/leads`, { withCredentials: true });
        if (response.data && response.data.leads) {
          const ids = new Set(response.data.leads.map(lead => lead.place_id_google));
          setUserSavedLeadGoogleIds(ids);
        }
      } catch (error) { console.error("Error fetching user's saved lead IDs:", error); }
    } else {
      setUserSavedLeadGoogleIds(new Set());
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchUserSavedLeadIds();
  }, [fetchUserSavedLeadIds]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) { setSearchError('Please enter a search term.'); setAllSearchResults([]); setSelectedLead(null); setHasSearched(true); return; }
    setIsLoading(true); setSearchError(''); setAllSearchResults([]); setSelectedLead(null); setHasSearched(true);
    setSavedLeadIdsThisSearch([]); 
    
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

  const handleSaveLead = async (placeToSave) => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: '/', message: 'Please login to save leads.' } });
      return;
    }
    if (!placeToSave || !placeToSave.google_place_id) {
      alert("Cannot save this lead, data is incomplete.");
      return;
    }
    if (savedLeadIdsThisSearch.includes(placeToSave.google_place_id) || userSavedLeadGoogleIds.has(placeToSave.google_place_id)) {
        alert(`${placeToSave.name} is already saved!`);
        return;
    }
    setSavingLeadId(placeToSave.google_place_id);
    try {
      const payload = {
        google_place_id: placeToSave.google_place_id,
        name: placeToSave.name,
        address: placeToSave.address,
        phone: placeToSave.phone_number,
        website: placeToSave.website,
      };
      const response = await axios.post(`${API_BASE_URL}/api/leads`, payload, { withCredentials: true });
      if (response.status === 201) {
        setSavedLeadIdsThisSearch(prev => [...prev, placeToSave.google_place_id]);
        setUserSavedLeadGoogleIds(prev => new Set(prev).add(placeToSave.google_place_id));
        alert(`${placeToSave.name} saved to My Leads!`);
      } else if (response.status === 409) {
        setSavedLeadIdsThisSearch(prev => [...prev, placeToSave.google_place_id]);
        setUserSavedLeadGoogleIds(prev => new Set(prev).add(placeToSave.google_place_id));
        alert(`${placeToSave.name} was already in your saved leads.`);
      }
    } catch (err) {
      console.error("Error saving lead:", err);
      alert(err.response?.data?.message || "Failed to save lead. Please try again.");
    } finally {
      setSavingLeadId(null);
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
            onSaveLead={handleSaveLead}
            savedLeadIds={[...savedLeadIdsThisSearch, ...Array.from(userSavedLeadGoogleIds)]}
            savingLeadId={savingLeadId}
          />
        )}
      </div>
    </div>
  );
}

export default HomePage;