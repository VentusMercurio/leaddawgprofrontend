// src/pages/HomePage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './HomePage.module.css';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const RESULTS_PER_VIEW = 6; 
const NON_PRO_VISIBLE_LIMIT = 5; // How many items a non-pro user sees before the teaser

// --- Helper Function ---
const getInitials = (name, isLarge = false) => {
  if (!name) return isLarge ? "N/A" : "NA";
  const words = name.split(' ');
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && name.length >= 2) return (name.substring(0,2)).toUpperCase();
  if (name.length > 0) return name[0].toUpperCase();
  return isLarge ? "N/A" : "NA";
};

// --- LeadCard Component ---
const LeadCard = ({ place, isFeatured = false, onClickCard, onSaveLead, isLeadSaved, isSavingLead }) => {
  const placeholderText = encodeURIComponent(place.name || 'Venue');
  const featuredPlaceholderInitials = <div className={styles.initialsPlaceholder}><span>{getInitials(place.name, true)}</span></div>;
  const listPlaceholderInitials = <div className={styles.initialsPlaceholderSmall}><span>{getInitials(place.name, false)}</span></div>;
  const [currentImageSrc, setCurrentImageSrc] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    let determinedSrc = null;
    if (place.photo_url && typeof place.photo_url === 'string' && place.photo_url.trim() !== '') {
      determinedSrc = `${API_BASE_URL}/api/search/image-proxy?url=${encodeURIComponent(place.photo_url)}`;
    }
    setCurrentImageSrc(determinedSrc);
    setImageLoadFailed(false);
  }, [place.photo_url, place.name]);

  const handleImageError = () => { if (!imageLoadFailed) { setImageLoadFailed(true); }};
  const handleImageLoad = () => { if (currentImageSrc && currentImageSrc.includes(encodeURIComponent(place.photo_url||''))) { setImageLoadFailed(false); }};
  
  const cardClassName = isFeatured ? styles.featuredLeadCard : styles.listLeadCard;
  const showImageVisualInList = !isFeatured && place.photo_url && typeof place.photo_url === 'string' && place.photo_url.trim() !== '';
  const showImageContainer = isFeatured || showImageVisualInList;
  let imageDisplayElement = isFeatured ? featuredPlaceholderInitials : (showImageVisualInList ? listPlaceholderInitials : null);

  if (currentImageSrc && !imageLoadFailed) {
    imageDisplayElement = <img key={currentImageSrc} src={currentImageSrc} alt={`${place.name || 'Venue'} image`} className={styles.cardImage} onLoad={handleImageLoad} onError={handleImageError} />;
  }

  return (
    <div className={cardClassName} onClick={!isFeatured && onClickCard ? () => onClickCard(place) : undefined} style={!isFeatured && onClickCard ? { cursor: 'pointer' } : {}} title={!isFeatured && onClickCard ? `View details for ${place.name}` : ''}>
      {showImageContainer && <div className={isFeatured ? styles.cardImageContainer : styles.listCardImageContainer}>{imageDisplayElement}</div>}
      <div className={styles.cardContent}>
        <h4 className={isFeatured ? styles.featuredCardName : styles.listCardName}>{place.name || 'N/A'}</h4>
        <p className={isFeatured ? styles.featuredCardAddress : styles.listCardAddress}>{isFeatured ? (place.address || 'N/A') : (place.address ? place.address.split(',')[0] : 'N/A')}</p>
        {isFeatured && place.phone_number && <p className={styles.featuredCardDetail}>Phone: {place.phone_number}</p>}
        {isFeatured && place.website && <p className={styles.featuredCardDetail}><a href={place.website} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>Visit Website</a></p>}
        {isFeatured && (
          <div className={styles.cardActions}>
            <button className={styles.saveLeadButton} onClick={(e) => { e.stopPropagation(); onSaveLead(place); }} disabled={isLeadSaved || isSavingLead}>
              {isSavingLead ? 'Saving...' : (isLeadSaved ? 'Saved ✓' : 'Save to My Leads')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- SearchResults Component ---
const SearchResults = ({ allResults, currentViewResults, onSelectLeadInView, onSaveLead, savedLeadIds, savingLeadId, currentFeaturedInView }) => {
  if (!currentViewResults || currentViewResults.length === 0 || !currentFeaturedInView) return null;
  const otherLeadsInThisView = currentViewResults.filter(p => p.google_place_id !== currentFeaturedInView.google_place_id).slice(0, 5);
  return (
    <div className={styles.resultsDisplayContainer}>
      <div className={styles.leadsLayout}>
        {currentFeaturedInView && (
          <div className={styles.featuredLeadSection}>
            <LeadCard place={currentFeaturedInView} isFeatured={true} onSaveLead={onSaveLead} isLeadSaved={savedLeadIds.includes(currentFeaturedInView.google_place_id)} isSavingLead={savingLeadId === currentFeaturedInView.google_place_id} />
          </div>
        )}
        {otherLeadsInThisView.length > 0 && (
          <div className={styles.otherLeadsSection}>
            {otherLeadsInThisView.map(place => (<LeadCard key={place.google_place_id || place.name + place.address} place={place} isFeatured={false} onClickCard={() => onSelectLeadInView(place)} />))}
          </div>
        )}
      </div>
      {/* Pro Teaser is now fully handled in HomePage based on isProUser and total results */}
    </div>
  );
};

// --- HomePage Component ---
function HomePage() {
  const [query, setQuery] = useState(() => sessionStorage.getItem('leadDawg_searchQuery') || '');
  const [allSearchResults, setAllSearchResults] = useState(() => JSON.parse(sessionStorage.getItem('leadDawg_allSearchResults') || '[]'));
  const [selectedLeadInCurrentView, setSelectedLeadInCurrentView] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(() => sessionStorage.getItem('leadDawg_hasSearched') === 'true');
  const [currentResultsPage, setCurrentResultsPage] = useState(1);

  const { isLoggedIn, currentUser, isLoadingAuth } = useAuth(); // Ensure isLoadingAuth is destructured
  const navigate = useNavigate();
  const [savedLeadIdsThisSearch, setSavedLeadIdsThisSearch] = useState([]);
  const [savingLeadId, setSavingLeadId] = useState(null);
  const [userSavedLeadGoogleIds, setUserSavedLeadGoogleIds] = useState(new Set());

  // This is the critical definition for controlling Pro features
  const isProUser = isLoggedIn && currentUser && currentUser.tier === 'pro';
  
  // Log this information on every render to see its state
  console.log("HomePage Render - isLoggedIn:", isLoggedIn, "currentUser:", currentUser, "isProUser:", isProUser, "isLoadingAuth:", isLoadingAuth);

  useEffect(() => { sessionStorage.setItem('leadDawg_searchQuery', query); }, [query]);
  useEffect(() => {
    if (allSearchResults.length > 0) sessionStorage.setItem('leadDawg_allSearchResults', JSON.stringify(allSearchResults));
    else sessionStorage.removeItem('leadDawg_allSearchResults');
  }, [allSearchResults]);
  useEffect(() => { sessionStorage.setItem('leadDawg_hasSearched', hasSearched.toString()); }, [hasSearched]);
  
  const fetchUserSavedLeadIds = useCallback(async () => {
    if (isLoggedIn) {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/leads`, { withCredentials: true });
        if (response.data && response.data.leads) setUserSavedLeadGoogleIds(new Set(response.data.leads.map(lead => lead.place_id_google)));
      } catch (error) { console.error("Error fetching user's saved lead IDs:", error); }
    } else setUserSavedLeadGoogleIds(new Set());
  }, [isLoggedIn]);
  useEffect(() => { fetchUserSavedLeadIds(); }, [fetchUserSavedLeadIds]);

  useEffect(() => {
    if (allSearchResults.length > 0) {
      const startIndex = (currentResultsPage - 1) * RESULTS_PER_VIEW;
      setSelectedLeadInCurrentView(allSearchResults[startIndex < allSearchResults.length ? startIndex : 0]);
    } else {
      setSelectedLeadInCurrentView(null);
    }
  }, [allSearchResults, currentResultsPage]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const currentQuery = query.trim();
    if (!currentQuery) { setSearchError('Please enter a search term.'); setAllSearchResults([]); setSelectedLeadInCurrentView(null); setHasSearched(true); return; }
    setIsLoading(true); setSearchError(''); setAllSearchResults([]); setSelectedLeadInCurrentView(null); 
    setHasSearched(true); setSavedLeadIdsThisSearch([]); setCurrentResultsPage(1);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/search/places`, { params: { query: currentQuery } });
      if (response.data && response.data.status === "OK" && response.data.places.length > 0) {
        setAllSearchResults(response.data.places);
      } else {
        setAllSearchResults([]); setSelectedLeadInCurrentView(null);
        setSearchError(`No leads found for "${currentQuery}". Try different keywords!`);
      }
    } catch (err) {
      console.error("Search API error:", err);
      setAllSearchResults([]); setSelectedLeadInCurrentView(null);
      setSearchError(err.response?.data?.message || err.message || 'Failed to connect to the search service.');
    } finally { setIsLoading(false); }
  };

  const handleSelectLeadFromListInView = (place) => { setSelectedLeadInCurrentView(place); };

  const handleSaveLead = async (placeToSave) => {
    console.log("--- handleSaveLead CALLED ---"); // Log when function is called
    console.log("Current State - isLoggedIn:", isLoggedIn, "currentUser:", currentUser);
    console.log("Place to save:", placeToSave);

    if (!isLoggedIn) {
      console.log("User not logged in, navigating to /login");
      navigate('/login', { state: { from: '/', message: 'Please login to save leads.' } });
      return;
    }
    if (!placeToSave || !placeToSave.google_place_id) {
      alert("Cannot save this lead, essential data (like Google Place ID) is missing.");
      console.error("Invalid place data to save:", placeToSave);
      return;
    }
    if (savedLeadIdsThisSearch.includes(placeToSave.google_place_id) || userSavedLeadGoogleIds.has(placeToSave.google_place_id)) {
        alert(`${placeToSave.name} is already saved!`);
        console.log("Lead already saved, not re-saving.");
        return;
    }

    setSavingLeadId(placeToSave.google_place_id);
    const payload = {
      google_place_id: placeToSave.google_place_id,
      name: placeToSave.name,
      address: placeToSave.address,
      phone: placeToSave.phone_number,
      website: placeToSave.website,
    };
    console.log("Payload for saving lead:", payload);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/leads`, payload, { withCredentials: true });
      console.log("Save lead API response status:", response.status);
      console.log("Save lead API response data:", response.data);

      if (response.status === 201) {
        setSavedLeadIdsThisSearch(prev => [...prev, placeToSave.google_place_id]);
        setUserSavedLeadGoogleIds(prev => new Set(prev).add(placeToSave.google_place_id));
        alert(`${placeToSave.name} saved to My Leads!`);
      } else if (response.status === 409) {
        setSavedLeadIdsThisSearch(prev => [...prev, placeToSave.google_place_id]);
        setUserSavedLeadGoogleIds(prev => new Set(prev).add(placeToSave.google_place_id));
        alert(`${placeToSave.name} was already in your saved leads (confirmed by backend).`);
      } else {
        alert(`Unexpected response from server: ${response.status}. ${response.data?.message || ''}`);
      }
    } catch (err) {
      console.error("Error saving lead API call:", err);
      console.error("Error response data:", err.response?.data);
      alert(err.response?.data?.message || "Failed to save lead. Please try again.");
    } finally {
      setSavingLeadId(null);
    }
  };

  const totalResultPages = Math.ceil(allSearchResults.length / RESULTS_PER_VIEW);
  const currentViewResults = allSearchResults.slice(
    (currentResultsPage - 1) * RESULTS_PER_VIEW,
    currentResultsPage * RESULTS_PER_VIEW
  );

  // If initial auth check is still loading, show a minimal loading state for the whole page
  if (isLoadingAuth) {
    return (
      <div className={styles.homePageContainer} style={{justifyContent: 'flex-start'}}> {/* Keep consistent container */}
         <header className={styles.heroSection}> {/* Keep consistent header */}
            <p className={styles.tagline}>What can we fetch today?</p>
            {/* Optionally disable form or show simpler loading */}
         </header>
        <p className={styles.loadingMessage} style={{marginTop: '50px'}}>Initializing user session...</p>
      </div>
    );
  }

  return (
    <div className={styles.homePageContainer}>
      <header className={styles.heroSection}>
        <p className={styles.tagline}>What can we fetch today?</p>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <input type="text" className={styles.searchInput} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g., breweries in Albany, salons in NYC..." />
          <button type="submit" className={styles.searchButton} disabled={isLoading}>{isLoading ? 'Fetching...' : 'Fetch Leads'}</button>
        </form>
      </header>

      <div className={styles.resultsArea} id="featured-lead-area">
        {isLoading && <p className={styles.loadingMessage}>✨ Fetching fresh leads for "{query}"...</p>}
        {!isLoading && searchError && <p className={`${styles.message} ${styles.errorMessage}`}>{searchError}</p>}
        {!isLoading && !searchError && hasSearched && allSearchResults.length === 0 && (
          <p className={styles.message}>🤔 No leads found for "{query}". Try a different search!</p>
        )}

        {!isLoading && !searchError && allSearchResults.length > 0 && currentViewResults.length > 0 && (selectedLeadInCurrentView || currentViewResults[0]) && (
          <SearchResults 
            allResults={allSearchResults} 
            currentViewResults={currentViewResults} 
            currentFeaturedInView={selectedLeadInCurrentView || currentViewResults[0]} 
            onSelectLeadInView={handleSelectLeadFromListInView}
            onSaveLead={handleSaveLead}
            savedLeadIds={[...savedLeadIdsThisSearch, ...Array.from(userSavedLeadGoogleIds)]}
            savingLeadId={savingLeadId}
          />
        )}

        {/* Pagination Controls: Show if Pro, not loading, no error, results exist, and more than one page */}
        {!isLoading && !searchError && isLoggedIn && isProUser && allSearchResults.length > 0 && totalResultPages > 1 && (
          <div className={styles.resultsPaginationControls}>
            <button onClick={() => setCurrentResultsPage(p => Math.max(1, p - 1))} disabled={currentResultsPage === 1} className={styles.pageButton}>« Previous</button>
            <span>Page {currentResultsPage} of {totalResultPages}</span>
            <button onClick={() => setCurrentResultsPage(p => Math.min(totalResultPages, p + 1))} disabled={currentResultsPage === totalResultPages} className={styles.pageButton}>Next »</button>
          </div>
        )}

        {/* Pro Teaser: Show if user is (definitively) logged in AND NOT Pro, 
             not loading, no error, AND total results exceed the initial FREE view limit */}
        {!isLoading && !searchError && isLoggedIn && !isProUser && allSearchResults.length > NON_PRO_VISIBLE_LIMIT && (
           <div className={styles.proTeaser}>
             <p>Want to see all {allSearchResults.length} results and unlock full details?</p>
             <Link to="/pricing" className={styles.proButton}>Go Pro!</Link>
           </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;