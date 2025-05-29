// src/App.jsx
import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'; // Use NavLink for active class
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext'; // Import useAuth
import PricingPage from './pages/PricingPage'; // Import the new page
import './App.css';

function App() {
  const { isLoggedIn, currentUser, logout, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/'); // Redirect to home after logout
  };

  if (isLoadingAuth) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: 'white', fontSize: '1.5rem'}}>Loading Application...</div>; // Or a proper spinner component
  }

  return (
    <>
      <nav className="app-navbar">
        <NavLink to="/" className="navbar-brand">LeadDawg Pro</NavLink>
        <div className="navbar-links">
          {isLoggedIn ? (
            <>
              <NavLink to="/dashboard" className="nav-link">My Leads</NavLink>
              {/* <NavLink to="/profile" className="nav-link">Profile</NavLink> */}
              <button onClick={handleLogout} className="nav-link-button">Logout ({currentUser?.username})</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="nav-link">Login</NavLink>
              <NavLink to="/register" className="nav-link">Sign Up</NavLink>
            </>
          )}
        </div>
      </nav>

      <div className="main-app-content"> 
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Basic Dashboard route for now, will add protection later */}
          <Route path="/pricing" element={<PricingPage />} /> {/* ADD THIS ROUTE */}
          <Route path="/dashboard" element={<DashboardPage />} /> 
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;