// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import styles from './DashboardPage.module.css';
import { useNavigate } from 'react-router-dom';
import LeadDetailModal from '../components/LeadDetailModal'; // Import the modal

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const STATUS_OPTIONS = ["New", "Contacted", "Followed Up", "Interested", "Booked", "Not Interested", "Pending"];

function DashboardPage() {
  const { isLoggedIn, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [savedLeads, setSavedLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [error, setError] = useState('');

  // --- State for Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadForModal, setSelectedLeadForModal] = useState(null);

  const fetchSavedLeads = useCallback(async () => {
    // ... (fetchSavedLeads logic - no changes) ...
    if (!isLoggedIn) return;
    setIsLoadingLeads(true); setError('');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/leads`, { withCredentials: true });
      if (response.data && response.data.leads) { setSavedLeads(response.data.leads); } 
      else { setSavedLeads([]); }
    } catch (err) {
      console.error("Error fetching saved leads:", err);
      setError(err.response?.data?.message || "Failed to fetch saved leads.");
      setSavedLeads([]);
    } finally { setIsLoadingLeads(false); }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoadingAuth && !isLoggedIn) { navigate('/login'); } 
    else if (isLoggedIn) { fetchSavedLeads(); }
  }, [isLoggedIn, isLoadingAuth, navigate, fetchSavedLeads]);

  const handleStatusChangeOnTable = async (leadId, newStatus) => {
    // ... (handleStatusChangeOnTable logic - mostly same, renamed for clarity) ...
    const originalLeads = [...savedLeads];
    setSavedLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? { ...lead, user_status: newStatus, _isUpdating: true } : lead ));
    try {
      await axios.put(`${API_BASE_URL}/api/leads/${leadId}`, { user_status: newStatus }, { withCredentials: true });
      // Refetch for consistency or update local state more precisely
      setSavedLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? { ...lead, user_status: newStatus, _isUpdating: false } : lead ));
    } catch (err) {
      console.error("Error updating lead status:", err);
      setError(`Failed to update status for lead ID ${leadId}.`);
      setSavedLeads(originalLeads);
    }
  };

  const handleOpenLeadModal = (lead) => {
    setSelectedLeadForModal(lead);
    setIsModalOpen(true);
  };

  const handleCloseLeadModal = () => {
    setIsModalOpen(false);
    setSelectedLeadForModal(null);
  };

  const handleUpdateLeadInModal = async (leadId, updates) => {
    // updates will be an object like { user_notes: "...", user_status: "..." }
    try {
      const response = await axios.put(`${API_BASE_URL}/api/leads/${leadId}`, updates, {
        withCredentials: true,
      });
      if (response.data && response.data.lead) {
        // Update the lead in the main savedLeads array
        setSavedLeads(prevLeads => 
          prevLeads.map(l => l.id === leadId ? response.data.lead : l)
        );
        return true; // Indicate success
      }
    } catch (err) {
      console.error("Error updating lead from modal:", err);
      alert(err.response?.data?.message || "Failed to update lead.");
      return false; // Indicate failure
    }
    return false;
  };

  const handleDeleteLeadInModal = async (leadId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/leads/${leadId}`, {
        withCredentials: true,
      });
      // Remove the lead from the main savedLeads array
      setSavedLeads(prevLeads => prevLeads.filter(l => l.id !== leadId));
      return true; // Indicate success
    } catch (err) {
      console.error("Error deleting lead from modal:", err);
      alert(err.response?.data?.message || "Failed to delete lead.");
      return false; // Indicate failure
    }
    return false;
  };


  if (isLoadingAuth || (!isLoggedIn && !isLoadingAuth) ) { 
    return <div className={styles.loadingPage}>Loading dashboard...</div>;
  }
  
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>My Saved Leads</h1>
        <p>Manage your prospects and track your outreach. ({savedLeads.length} saved)</p>
      </header>

      {/* ... (isLoadingLeads, error, noLeadsMessage rendering - no changes) ... */}
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
                <tr key={lead.id} className={lead._isUpdating ? styles.isUpdatingRow : ''}>
                  <td onClick={() => handleOpenLeadModal(lead)} style={{cursor: 'pointer', color: 'var(--primary-color)'}}>{lead.name_at_save}</td>
                  <td onClick={() => handleOpenLeadModal(lead)} style={{cursor: 'pointer'}}>{lead.address_at_save ? lead.address_at_save.split(',')[0] : 'N/A'}</td>
                  <td onClick={() => handleOpenLeadModal(lead)} style={{cursor: 'pointer'}}>{new Date(lead.saved_at).toLocaleDateString()}</td>
                  <td>
                    <select 
                      value={lead.user_status} 
                      onChange={(e) => handleStatusChangeOnTable(lead.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()} // Prevent row click when changing status
                      className={styles.statusSelect}
                      disabled={lead._isUpdating}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button 
                      className={styles.actionButton} 
                      onClick={() => handleOpenLeadModal(lead)}
                    >
                      View/Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LeadDetailModal
        lead={selectedLeadForModal}
        isOpen={isModalOpen}
        onClose={handleCloseLeadModal}
        onUpdateLead={handleUpdateLeadInModal}
        onDeleteLead={handleDeleteLeadInModal}
      />
    </div>
  );
}

export default DashboardPage;