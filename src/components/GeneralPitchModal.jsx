// src/components/GeneralPitchModal.jsx
import React, { useState, useEffect } from 'react';
// This line is CRITICAL. It must import from the CSS module where .modalOverlay is defined.
// If your .modalOverlay is in LeadDetailView.module.css, this is correct.
import styles from './LeadDetailView.module.css'; 

const DEFAULT_PITCH_TEMPLATE_KEY = 'leadDawg_generalPitchTemplate';

const getDefaultLaDawgzPitch = () => {
  // !!! CUSTOMIZE THIS TEMPLATE THOROUGHLY !!!
  return `Subject: LA Dawgz 🌭 Bringing the Sizzle to [Venue Name]!

Hey [Venue Name] Team,

My name is Chris, and I run LA Dawgz... [REST OF YOUR PITCH TEMPLATE] ...

Best regards,

Chris
LA Dawgz
[Your Info]`;
};

function GeneralPitchModal({ isOpen, onClose }) {
  const [pitchText, setPitchText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedTemplate = localStorage.getItem(DEFAULT_PITCH_TEMPLATE_KEY);
      setPitchText(savedTemplate || getDefaultLaDawgzPitch());
      setCopied(false);
    }
  }, [isOpen]);

  // **** THIS IS THE MOST IMPORTANT PART FOR POP-UP BEHAVIOR ****
  if (!isOpen) {
    return null; // If not open, render nothing, so it "disappears"
  }
  // **** END OF IMPORTANT PART ****

  const handleSaveTemplate = () => {
    localStorage.setItem(DEFAULT_PITCH_TEMPLATE_KEY, pitchText);
    alert("Pitch template saved!");
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(pitchText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      alert("Failed to copy. Please copy manually.");
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm("Reset to default LA Dawgz template?")) {
        const defaultPitch = getDefaultLaDawgzPitch();
        setPitchText(defaultPitch);
        localStorage.setItem(DEFAULT_PITCH_TEMPLATE_KEY, defaultPitch);
    }
  };

  return (
    // The root div MUST use styles.modalOverlay
    <div className={styles.modalOverlay} onClick={onClose}> 
      <div 
        // This div uses both modalContent for base styling and generalPitchModalContent for specifics
        className={`${styles.modalContent} ${styles.generalPitchModalContent}`} 
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <div className={styles.modalHeader}>
          <h3>Your General Pitch Template</h3>
          {/* Ensure .closeButtonTopRight is styled in your CSS */}
          <button onClick={onClose} className={styles.closeButtonTopRight}>×</button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.templateInfo}> 
            Edit your base pitch template. Use placeholders like <strong>[Venue Name]</strong>.
          </p>
          <textarea
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            rows="18"
            className={styles.pitchTextarea} // Ensure .pitchTextarea is styled
          />
        </div>
        <div className={`${styles.modalFooter} ${styles.generalPitchFooter}`}>
            <button onClick={handleResetToDefault} className={`${styles.modalButton} ${styles.resetButton}`}>
                Reset to Default
            </button>
            <div> 
                <button onClick={handleSaveTemplate} className={`${styles.modalButton} ${styles.saveTemplateButton}`}>
                    Save My Template
                </button>
                <button onClick={handleCopyToClipboard} className={`${styles.modalButton} ${styles.copyPitchButtonMain}`}>
                    {copied ? 'Copied ✓' : 'Copy to Clipboard'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

export default GeneralPitchModal;