// src/pages/DashboardPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import styles from './DashboardPage.module.css';
import { useNavigate } from 'react-router-dom';
import LeadDetailView from '../components/LeadDetailView'; // Import the new full-screen view

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';
const STATUS_OPTIONS = ["New", "Contacted", "Followed Up", "Interested", "Booked", "Not Interested", "Pending"];

function DashboardPage() {
  const { isLoggedIn, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [savedLeads, setSavedLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [error, setError] = useState('');

  // --- State for Full-Screen Detail View ---
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false); // Renamed from isModalOpen
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null); // Renamed

  // --- State for Dashboard Search/Filter ---
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSavedLeads = useCallback(async () => {
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
    const originalLeads = [...savedLeads];
    setSavedLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? { ...lead, user_status: newStatus, _isUpdating: true } : lead ));
    try {
      const response = await axios.put(`${API_BASE_URL}/api/leads/${leadId}`, { user_status: newStatus }, { withCredentials: true });
      // Update with the fresh data from the server, including updated_at
      setSavedLeads(prevLeads => prevLeads.map(lead => lead.id === leadId ? { ...response.data.lead, _isUpdating: false } : lead ));
      // Also update selectedLeadForDetail if it's the one being edited in the detail view
      if (selectedLeadForDetail && selectedLeadForDetail.id === leadId) {
        setSelectedLeadForDetail(prev => ({...prev, ...response.data.lead}));
      }
    } catch (err) {
      console.error("Error updating lead status:", err);
      setError(`Failed to update status for lead ID ${leadId}.`);
      setSavedLeads(originalLeads); // Revert on error
    }
  };

  // Renamed handlers for clarity
  const handleOpenDetailView = (lead) => {
    setSelectedLeadForDetail(lead);
    setIsDetailViewOpen(true);
  };

  const handleCloseDetailView = () => {
    setIsDetailViewOpen(false);
    // setSelectedLeadForDetail(null); // Keep selectedLeadForDetail for smoother transitions, or clear it
  };

  const handleUpdateLeadDetails = async (leadId, updates) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/leads/${leadId}`, updates, { withCredentials: true });
      if (response.data && response.data.lead) {
        const updatedLeadFromServer = response.data.lead;
        setSavedLeads(prevLeads => prevLeads.map(l => l.id === leadId ? updatedLeadFromServer : l));
        if (selectedLeadForDetail && selectedLeadForDetail.id === leadId) {
          setSelectedLeadForDetail(updatedLeadFromServer); // Update the state for the detail view
        }
        // alert("Lead details updated!"); // Or a more subtle notification
        return true; 
      }
    } catch (err) {
      console.error("Error updating lead from detail view:", err);
      alert(err.response?.data?.message || "Failed to update lead details.");
      return false;
    }
    return false;
  };

  const handleDeleteLead = async (leadId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/leads/${leadId}`, { withCredentials: true });
      setSavedLeads(prevLeads => prevLeads.filter(l => l.id !== leadId));
      handleCloseDetailView(); // Close detail view if the shown lead was deleted
      // alert("Lead deleted!");
      return true;
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert(err.response?.data?.message || "Failed to delete lead.");
      return false;
    }
    return false;
  };

  // Memoized filtered leads for dashboard search
  const filteredLeads = useMemo(() => {
    if (!searchTerm.trim()) return savedLeads;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return savedLeads.filter(lead => 
      (lead.name_at_save && lead.name_at_save.toLowerCase().includes(lowerSearchTerm)) ||
      (lead.address_at_save && lead.address_at_save.toLowerCase().includes(lowerSearchTerm)) ||
      (lead.user_notes && lead.user_notes.toLowerCase().includes(lowerSearchTerm))
    );
  }, [savedLeads, searchTerm]);

  if (isLoadingAuth || (!isLoggedIn && !isLoadingAuth) ) { 
    return <div className={styles.loadingPage}>Loading dashboard...</div>;
  }
  
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>My Saved Leads</h1>
        <p>Manage your prospects and track your outreach. ({filteredLeads.length} matching / {savedLeads.length} total)</p>
      </header>

      <div className={styles.filterControls}>
        <input
          type="text"
          placeholder="Search your saved leads (name, address, notes)..."
          className={styles.searchInputDashboard}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Add Status Filter Dropdown here later */}
      </div>

      {isLoadingLeads && <p className={styles.loadingMessage}>Fetching your leads...</p>}
      {error && <p className={styles.errorMessage}>{error}</p>}
      
      {!isLoadingLeads && !error && savedLeads.length === 0 && (
        <p className={styles.noLeadsMessage}>You haven't saved any leads yet. Start searching to build your list!</p>
      )}
      {!isLoadingLeads && !error && savedLeads.length > 0 && filteredLeads.length === 0 && searchTerm && (
        <p className={styles.noLeadsMessage}>No saved leads match your search term "{searchTerm}".</p>
      )}

      {!isLoadingLeads && filteredLeads.length > 0 && (
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
              {filteredLeads.map(lead => (
                <tr key={lead.id} className={lead._isUpdating ? styles.isUpdatingRow : ''}>
                  <td onClick={() => handleOpenDetailView(lead)} style={{cursor: 'pointer', color: 'var(--primary-color)'}}>{lead.name_at_save}</td>
                  <td onClick={() => handleOpenDetailView(lead)} style={{cursor: 'pointer'}}>{lead.address_at_save ? lead.address_at_save.split(',')[0] : 'N/A'}</td>
                  <td onClick={() => handleOpenDetailView(lead)} style={{cursor: 'pointer'}}>{new Date(lead.saved_at).toLocaleDateString()}</td>
                  <td>
                    <select 
                      value={lead.user_status} 
                      onChange={(e) => {
                        e.stopPropagation(); // Prevent row click when changing status
                        handleStatusChangeOnTable(lead.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()} // Also here, just in case
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
                      onClick={() => handleOpenDetailView(lead)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Use LeadDetailView and pass renamed state/handlers */}
      {isDetailViewOpen && selectedLeadForDetail && (
        <LeadDetailView
          lead={selectedLeadForDetail}
          // No need for isOpen prop as conditional rendering handles it
          onClose={handleCloseDetailView}
          onUpdateLead={handleUpdateLeadDetails} // Pass the renamed handler
          onDeleteLead={handleDeleteLead}       // Pass the renamed handler
        />
      )}
    </div>
  );
}

export default DashboardPage;