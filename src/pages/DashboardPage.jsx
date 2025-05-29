// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; // To check if user is logged in
import axios from 'axios';
import styles from './DashboardPage.module.css'; // We'll create this CSS file
import { useNavigate } from 'react-router-dom'; // For redirecting if not logged in

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const STATUS_OPTIONS = ["New", "Contacted", "Followed Up", "Interested", "Booked", "Not Interested", "Pending"]; // Keep this consistent

function DashboardPage() {
  const { isLoggedIn, isLoadingAuth, currentUser } = useAuth();
  const navigate = useNavigate();
  const [savedLeads, setSavedLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [error, setError] = useState('');

  const fetchSavedLeads = useCallback(async () => {
    if (!isLoggedIn) return; // Should be protected by a ProtectedRoute later

    setIsLoadingLeads(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/leads`, {
        withCredentials: true, // Crucial for sending session cookie
      });
      if (response.data && response.data.leads) {
        setSavedLeads(response.data.leads);
      } else {
        setSavedLeads([]);
      }
    } catch (err) {
      console.error("Error fetching saved leads:", err);
      setError(err.response?.data?.message || "Failed to fetch saved leads.");
      setSavedLeads([]);
    } finally {
      setIsLoadingLeads(false);
    }
  }, [isLoggedIn]); // Dependency: re-fetch if login status changes (e.g., after login)

  useEffect(() => {
    if (!isLoadingAuth && !isLoggedIn) {
      navigate('/login'); // Redirect to login if not authenticated
    } else if (isLoggedIn) {
      fetchSavedLeads();
    }
  }, [isLoggedIn, isLoadingAuth, navigate, fetchSavedLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    // Find the lead in the current state to update its UI optimistically (or wait for refetch)
    const originalLeads = [...savedLeads];
    setSavedLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === leadId ? { ...lead, user_status: newStatus, isUpdating: true } : lead // Add isUpdating flag
      )
    );

    try {
      await axios.put(`${API_BASE_URL}/api/leads/${leadId}`, 
        { user_status: newStatus },
        { withCredentials: true }
      );
      // Optionally re-fetch all leads to get the latest state including updated_at
      // fetchSavedLeads(); 
      // Or just remove the isUpdating flag
       setSavedLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === leadId ? { ...lead, user_status: newStatus, isUpdating: false } : lead
        )
      );
    } catch (err) {
      console.error("Error updating lead status:", err);
      setError(`Failed to update status for lead ID ${leadId}.`);
      setSavedLeads(originalLeads); // Revert to original state on error
    }
  };

  if (isLoadingAuth || (!isLoggedIn && !isLoadingAuth) ) { 
    // If still checking auth, or if definitely not logged in (and redirect hasn't happened yet)
    // you might show a generic loading or nothing until redirect.
    // The redirect in useEffect should handle the not logged in case.
    return <div className={styles.loadingPage}>Loading dashboard...</div>;
  }
  
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>My Saved Leads</h1>
        <p>Manage your prospects and track your outreach.</p>
      </header>

      {isLoadingLeads && <p className={styles.loadingMessage}>Fetching your leads...</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}

      {!isLoadingLeads && !error && savedLeads.length === 0 && (
        <p className={styles.noLeadsMessage}>You haven't saved any leads yet. Start searching to build your list!</p>
      )}

      {!isLoadingLeads && savedLeads.length > 0 && (
        <div className={styles.leadsTableContainer}>
          <table className={styles.leadsTable}>
            <thead>
              <tr>
                <th>Venue Name</th>
                <th>Address</th>
                <th>Saved On</th>
                <th>Status</th>
                <th>Actions</th> 
              </tr>
            </thead>
            <tbody>
              {savedLeads.map(lead => (
                <tr key={lead.id} className={lead.isUpdating ? styles.isUpdatingRow : ''}>
                  <td>{lead.name_at_save}</td>
                  <td>{lead.address_at_save ? lead.address_at_save.split(',')[0] : 'N/A'}</td>
                  <td>{new Date(lead.saved_at).toLocaleDateString()}</td>
                  <td>
                    <select 
                      value={lead.user_status} 
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={styles.statusSelect}
                      disabled={lead.isUpdating}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className={styles.actionButton} onClick={() => alert(`View/Edit details for ${lead.name_at_save}`)}>Details</button>
                    {/* Add other actions like "Copy Pitch" or "Delete" later */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;