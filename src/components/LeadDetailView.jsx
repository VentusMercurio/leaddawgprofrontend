// src/components/LeadDetailView.jsx
import React, { useState, useEffect } from 'react';
import styles from './LeadDetailView.module.css';
// import { XIcon, StarIcon, LinkIcon, PhoneIcon, MapPinIcon, ClockIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'; // Example for icons

const STATUS_OPTIONS = ["New", "Contacted", "Followed Up", "Interested", "Booked", "Not Interested", "Pending"];

function LeadDetailView({ lead, onClose, onUpdateLead, onDeleteLead }) {
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (lead) {
      setCurrentNotes(lead.user_notes || '');
      setCurrentStatus(lead.user_status || 'New');
      setIsEditingNotes(false); // Reset editing state when lead changes
    }
  }, [lead]);

  if (!lead) {
    return null; // Or some "no lead selected" state if it's always rendered but hidden
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    // Pass only fields that might have changed
    const updates = { user_notes: currentNotes, user_status: currentStatus };
    await onUpdateLead(lead.id, updates);
    setIsSaving(false);
    setIsEditingNotes(false); // Exit editing mode
    // onClose(); // Optionally close after save, or let user close manually
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${lead.name_at_save}? This cannot be undone.`)) {
      setIsDeleting(true);
      await onDeleteLead(lead.id);
      // onClose will likely be called by parent after successful delete & list update
    }
  };

  const placeholderText = encodeURIComponent(lead.name_at_save || 'Venue');
  const heroImageUrl = lead.photo_url || `https://via.placeholder.com/1200x400.png/1a1a1a/555555?text=${placeholderText}`;
  
  // Fallback for Google Maps link if URL not directly available
  const googleMapsLink = lead.google_maps_url || 
    (lead.address_at_save ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address_at_save)}` : null);


  return (
    <div className={styles.overlay}>
      <div className={styles.viewContainer}>
        <button onClick={onClose} className={styles.closeButtonTopRight} title="Close Details">
          {/* <XIcon className={styles.icon} /> Using an icon library later */} ×
        </button>

        <div className={styles.headerImage} style={{ backgroundImage: `url(${heroImageUrl})` }}>
          {/* Optional: Overlay on image, like venue type badges */}
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
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {/* Actions like "Copy Pitch" can go here */}
            </div>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Address</span>
              <p>{lead.address_at_save || 'N/A'}</p>
              {googleMapsLink && <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>View on Map</a>}
            </div>

            {lead.phone_at_save && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Phone</span>
                <p><a href={`tel:${lead.phone_at_save}`}>{lead.phone_at_save}</a></p>
              </div>
            )}

            {lead.website_at_save && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Website</span>
                <p><a href={lead.website_at_save} target="_blank" rel="noopener noreferrer" className={styles.actionLink}>{lead.website_at_save}</a></p>
              </div>
            )}
            
            {lead.opening_hours && lead.opening_hours.length > 0 && (
                <div className={`${styles.detailItem} ${styles.fullWidth}`}> {/* Full width for hours */}
                    <span className={styles.detailLabel}>Opening Hours</span>
                    <ul className={styles.hoursList}>
                        {lead.opening_hours.map((line, index) => <li key={index}>{line}</li>)}
                    </ul>
                </div>
            )}
          </div>

          {/* --- YELP SECTION PLACEHOLDER --- */}
          <div className={styles.yelpSection}>
            <h4>Yelp Insights (Coming Soon!)</h4>
            <div className={styles.yelpPlaceholder}>
              <p>Yelp Rating: N/A</p>
              <p>Review Snippets: N/A</p>
            </div>
          </div>
          {/* --- END YELP SECTION --- */}
          
          <div className={styles.notesSection}>
            <h4>Your Notes {isEditingNotes && <span style={{fontSize: '0.8em', fontWeight: 'normal'}}>(Editing)</span>}</h4>
            {isEditingNotes ? (
              <textarea
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                rows="6"
                className={styles.notesTextarea}
                placeholder="Add your notes..."
                disabled={isSaving}
              />
            ) : (
              <div className={styles.notesDisplay} onClick={() => setIsEditingNotes(true)} title="Click to edit notes">
                {currentNotes || <span className={styles.placeholderText}>Click to add notes...</span>}
              </div>
            )}
          </div>
        </div>

        <div className={styles.footerActions}>
          <button 
            onClick={handleDelete} 
            className={`${styles.footerButton} ${styles.deleteBtn}`}
            disabled={isDeleting || isSaving}
          >
            {isDeleting ? 'Deleting...' : 'Delete Lead'}
          </button>
          <button 
            onClick={handleSaveChanges} 
            className={`${styles.footerButton} ${styles.saveBtn}`}
            disabled={isSaving || isDeleting || (!isEditingNotes && currentStatus === (lead.user_status || 'New'))} // Disable if no changes
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadDetailView;