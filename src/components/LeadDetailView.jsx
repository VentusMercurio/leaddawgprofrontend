// src/components/LeadDetailView.jsx
import React, { useState, useEffect } from 'react';
import styles from './LeadDetailView.module.css';

// Ensure API_BASE_URL is correctly defined or imported if it's in a central config
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

const STATUS_OPTIONS = ["New", "Contacted", "Followed Up", "Interested", "Booked", "Not Interested", "Pending"];

// Helper function to generate the LA Dawgz Pitch
const generateLaDawgzPitch = (venueName) => {
  const venue = venueName || "[Venue Name]";
  // !!! CRITICAL: CUSTOMIZE THIS TEMPLATE THOROUGHLY !!!
  return `Subject: LA Dawgz 🌭 Bringing the Sizzle to ${venue}!

Hey ${venue} Team,

My name is Chris, and I run LA Dawgz, a high-energy pop-up serving authentic Los Angeles-style bacon-wrapped street dogs, topped with sizzling onions & peppers (fajitas), fresh pico de gallo, and our signature sauces! 🌶️

We're known for bringing a vibrant, fun atmosphere to events, festivals, and local venues, and our unique offering is a huge hit with crowds looking for something exciting and delicious. 
You can check out our vibe and menu here: [YOUR_LA_DAWGZ_WEBSITE_OR_INSTAGRAM_LINK_HERE]

I came across ${venue} and was really impressed by [MENTION_SOMETHING_SPECIFIC_ABOUT_THEIR_VENUE_HERE - e.g., "your great patio," "the awesome events you host," "your cool crowd"]. I believe LA Dawgz would be a fantastic and memorable addition to your lineup, potentially for:
*   Special event nights
*   Weekend pop-ups
*   Collaborations with your existing offerings (e.g., "Dawgz & Brews")

We're fully equipped for pop-up operations and are looking for cool spots in the area to partner with. 

Would you be open to a quick chat next week about how LA Dawgz could bring some LA flavor and draw a crowd to ${venue}?

Best regards,

Chris
LA Dawgz
[YOUR_PHONE_NUMBER_OPTIONAL]
[YOUR_LA_DAWGZ_WEBSITE_OR_INSTAGRAM_LINK_HERE_AGAIN_OR_EMAIL]`;
};

// Helper to generate initials
const getInitialsForPlaceholder = (name) => {
  if (!name) return "N/A";
  const words = name.split(' ');
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && name.length >= 2) return (name.substring(0,2)).toUpperCase();
  if (name.length > 0) return name[0].toUpperCase();
  return "N/A";
};


function LeadDetailView({ lead, onClose, onUpdateLead, onDeleteLead }) {
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showPitchTemplate, setShowPitchTemplate] = useState(false);
  const [pitchText, setPitchText] = useState('');
  const [pitchCopied, setPitchCopied] = useState(false);

  // State for the header image
  const [headerImageSrc, setHeaderImageSrc] = useState('');
  const [headerImageError, setHeaderImageError] = useState(false);

  useEffect(() => {
    if (lead) {
      setCurrentNotes(lead.user_notes || '');
      setCurrentStatus(lead.user_status || 'New');
      setIsEditingNotes(false);
      setPitchText(generateLaDawgzPitch(lead.name_at_save));
      setShowPitchTemplate(false);
      setPitchCopied(false);

      // Set up header image source
      if (lead.photo_url && typeof lead.photo_url === 'string' && lead.photo_url.trim() !== '') {
        setHeaderImageSrc(`${API_BASE_URL}/api/search/image-proxy?url=${encodeURIComponent(lead.photo_url)}`);
      } else {
        setHeaderImageSrc(''); // No original photo_url, will use initials placeholder
      }
      setHeaderImageError(false); // Reset error state for new lead
    } else {
      // Reset all when lead is null (modal closed or no lead)
      setCurrentNotes(''); setCurrentStatus('New'); setPitchText('');
      setShowPitchTemplate(false); setPitchCopied(false);
      setHeaderImageSrc(''); setHeaderImageError(false);
    }
  }, [lead]);

  if (!lead) {
    return null;
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const updates = { user_notes: currentNotes, user_status: currentStatus };
    const success = await onUpdateLead(lead.id, updates);
    setIsSaving(false);
    if (success) setIsEditingNotes(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${lead.name_at_save}? This cannot be undone.`)) {
      setIsDeleting(true);
      await onDeleteLead(lead.id);
      // Parent (DashboardPage) will handle closing by setting its selected lead to null
    } else {
      setIsDeleting(false); // Ensure isDeleting is false if user cancels confirm dialog
    }
  };
  
  const googleMapsLink = lead.google_maps_url || 
    (lead.address_at_save ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address_at_save)}` : null);

  const handleCopyPitchText = () => {
    navigator.clipboard.writeText(pitchText).then(() => {
      setPitchCopied(true);
      setTimeout(() => setPitchCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy pitch text: ', err);
      alert("Failed to copy pitch. Please copy manually or check browser permissions.");
    });
  };

  const handleHeaderImageError = () => {
    if (!headerImageError) { // Prevent potential loops
        console.warn(`HEADER IMAGE LOAD ERROR for "${lead.name_at_save}". Attempted src:`, headerImageSrc);
        setHeaderImageError(true);
    }
  };
  
  const handleHeaderImageLoad = () => {
    // If it was previously errored and now loads, reset error state
    if (headerImageError && headerImageSrc === `${API_BASE_URL}/api/search/image-proxy?url=${encodeURIComponent(lead.photo_url)}`) {
        setHeaderImageError(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.viewContainer}>
        <button onClick={onClose} className={styles.closeButtonTopRight} title="Close Details">×</button>

        <div className={styles.headerImageContainer}>
            {headerImageSrc && !headerImageError ? (
                <img 
                    key={headerImageSrc} // Add key to help React re-render if src changes
                    src={headerImageSrc} 
                    alt={`${lead.name_at_save || 'Header'} image`} 
                    className={styles.headerActualImage}
                    onLoad={handleHeaderImageLoad}
                    onError={handleHeaderImageError}
                />
            ) : (
                <div className={styles.initialsPlaceholderHeader}>
                    <span>{getInitialsForPlaceholder(lead.name_at_save)}</span>
                </div>
            )}
        </div>

        <div className={styles.mainContent}>
          <div className={styles.titleSection}>
            <h1>{lead.name_at_save || 'Lead Details'}</h1>
            <div className={styles.statusAndActions}>
              <select 
                value={currentStatus} 
                onChange={(e) => setCurrentStatus(e.target.value)}
                className={styles.statusDropdown}
                disabled={isSaving || isDeleting}
              >
                {STATUS_OPTIONS.map(status => (<option key={status} value={status}>{status}</option>))}
              </select>
              <button 
                onClick={() => {
                    if (lead && lead.name_at_save && (pitchText.includes("[Venue Name]") || !pitchText.startsWith("Subject:"))) {
                         setPitchText(generateLaDawgzPitch(lead.name_at_save));
                    }
                    setShowPitchTemplate(!showPitchTemplate);
                    setPitchCopied(false); 
                }} 
                className={styles.pitchToggleButton}
              >
                {showPitchTemplate ? 'Hide Pitch Template' : 'Generate Pitch Email'}
              </button>
            </div>
          </div>

          {showPitchTemplate && (
            <div className={styles.pitchTemplateSection}>
              <h4>Pitch Email Template for {lead.name_at_save}:</h4>
              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                rows="15" 
                className={styles.pitchTextarea}
                placeholder="Your generated pitch will appear here..."
              />
              <button onClick={handleCopyPitchText} className={styles.copyPitchButton}> 
                {pitchCopied ? 'Copied ✓' : 'Copy Pitch Text'}
              </button>
            </div>
          )}

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}><span className={styles.detailLabel}>Address</span><p>{lead.address_at_save || 'N/A'}</p>{googleMapsLink && <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>View on Map</a>}</div>
            {lead.phone_at_save && <div className={styles.detailItem}><span className={styles.detailLabel}>Phone</span><p><a href={`tel:${lead.phone_at_save}`}>{lead.phone_at_save}</a></p></div>}
            {lead.website_at_save && <div className={styles.detailItem}><span className={styles.detailLabel}>Website</span><p><a href={lead.website_at_save} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>{lead.website_at_save}</a></p></div>}
            {lead.opening_hours && lead.opening_hours.length > 0 && <div className={`${styles.detailItem} ${styles.fullWidth}`}><span className={styles.detailLabel}>Opening Hours</span><ul className={styles.hoursList}>{lead.opening_hours.map((line, index) => <li key={index}>{line}</li>)}</ul></div>}
          </div>

          <div className={styles.yelpSection}>
            <h4>Yelp Insights (Coming Soon!)</h4>
            <div className={styles.yelpPlaceholder}><p>Yelp Rating: N/A</p><p>Review Snippets: N/A</p></div>
          </div>
          
          <div className={styles.notesSection}>
            <h4>Your Notes {isEditingNotes && <span style={{fontSize: '0.8em', fontWeight: 'normal'}}>(Editing)</span>}</h4>
            {isEditingNotes ? (
              <textarea value={currentNotes} onChange={(e) => setCurrentNotes(e.target.value)} rows="6" className={styles.notesTextarea} placeholder="Add your notes about this lead..." disabled={isSaving} />
            ) : (
              <div className={styles.notesDisplay} onClick={() => setIsEditingNotes(true)} title="Click to edit notes">{currentNotes || <span className={styles.placeholderText}>Click to add notes...</span>}</div>
            )}
          </div>
        </div>

        <div className={styles.footerActions}>
          <button onClick={handleDelete} className={`${styles.footerButton} ${styles.deleteBtn}`} disabled={isDeleting || isSaving}>{isDeleting ? 'Deleting...' : 'Delete Lead'}</button>
          <button 
            onClick={handleSaveChanges} 
            className={`${styles.footerButton} ${styles.saveBtn}`} 
            disabled={isSaving || isDeleting || (currentStatus === (lead.user_status || 'New') && currentNotes === (lead.user_notes || '')) } 
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadDetailView;