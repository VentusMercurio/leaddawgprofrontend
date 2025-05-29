// src/components/LeadDetailModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './LeadDetailModal.module.css'; // We'll create this CSS file

const STATUS_OPTIONS = ["New", "Contacted", "Followed Up", "Interested", "Booked", "Not Interested", "Pending"];

function LeadDetailModal({ lead, isOpen, onClose, onUpdateLead, onDeleteLead }) {
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (lead) {
      setCurrentNotes(lead.user_notes || '');
      setCurrentStatus(lead.user_status || 'New');
    } else {
      // Reset when lead is null (modal closed or no lead)
      setCurrentNotes('');
      setCurrentStatus('New');
    }
  }, [lead]); // Re-run when the lead prop changes

  if (!isOpen || !lead) {
    return null; // Don't render if not open or no lead data
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    await onUpdateLead(lead.id, { user_notes: currentNotes, user_status: currentStatus });
    setIsSaving(false);
    onClose(); // Close modal after saving
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${lead.name_at_save}? This cannot be undone.`)) {
      setIsDeleting(true);
      await onDeleteLead(lead.id);
      setIsDeleting(false);
      onClose(); // Close modal after deleting
    }
  };
  
  const googleMapsUrl = lead.google_maps_url || 
    (lead.address_at_save ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address_at_save)}` : null);


  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{lead.name_at_save || 'Lead Details'}</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailSection}>
            <strong>Address:</strong>
            <p>{lead.address_at_save || 'N/A'}</p>
          </div>
          {lead.phone_at_save && (
            <div className={styles.detailSection}>
              <strong>Phone:</strong>
              <p><a href={`tel:${lead.phone_at_save}`}>{lead.phone_at_save}</a></p>
            </div>
          )}
          {lead.website_at_save && (
            <div className={styles.detailSection}>
              <strong>Website:</strong>
              <p><a href={lead.website_at_save} target="_blank" rel="noopener noreferrer">{lead.website_at_save}</a></p>
            </div>
          )}
          {googleMapsUrl && (
            <div className={styles.detailSection}>
               <strong>Map:</strong>
               <p><a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">View on Google Maps</a></p>
            </div>
          )}
          <div className={styles.detailSection}>
            <strong>Status:</strong>
            <select 
                value={currentStatus} 
                onChange={(e) => setCurrentStatus(e.target.value)}
                className={styles.statusSelectModal}
                disabled={isSaving || isDeleting}
            >
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className={styles.detailSection}>
            <strong>Notes:</strong>
            <textarea
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              rows="5"
              placeholder="Add your notes about this lead..."
              className={styles.notesTextarea}
              disabled={isSaving || isDeleting}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button 
            onClick={handleDelete} 
            className={`${styles.modalButton} ${styles.deleteButton}`}
            disabled={isSaving || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Lead'}
          </button>
          <button 
            onClick={handleSaveChanges} 
            className={`${styles.modalButton} ${styles.saveButton}`}
            disabled={isSaving || isDeleting}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeadDetailModal;