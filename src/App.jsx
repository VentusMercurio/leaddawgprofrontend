// src/App.jsx
import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage'; // Make sure this is imported
import PaymentSuccessPage from './pages/PaymentSuccessPage'; // << IMPORT THIS
import PaymentCancelPage from './pages/PaymentCancelPage';   // << IMPORT THIS (if you use a dedicated cancel page)
import NotFoundPage from './pages/NotFoundPage';
import { useAuth } from './context/AuthContext';
import './App.css';

function App() {
  const { isLoggedIn, currentUser, logout, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/'); 
  };

  if (isLoadingAuth) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: 'white', fontSize: '1.5rem'}}>Loading Application...</div>;
  }

  return (
    <>
      <nav className="app-navbar">
        <NavLink to="/" className="navbar-brand">LeadDawg Pro</NavLink>
        <div className="navbar-links">
          {isLoggedIn ? (
            <>
              <NavLink to="/dashboard" className="nav-link">My Leads</NavLink>
              <button onClick={handleLogout} className="nav-link-button">Logout ({currentUser?.username})</button>
            </>
          ) : (
            <>
              <NavLink to="/pricing" className="nav-link">Pricing</NavLink> {/* Added Pricing Link */}
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
          <Route path="/dashboard" element={<DashboardPage />} /> 
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} /> {/* << ADD THIS ROUTE */}
          <Route path="/payment-canceled" element={<PaymentCancelPage />} /> {/* << ADD THIS IF YOUR CANCEL URL IS THIS */}
          {/* Or if cancel URL is /pricing?canceled=true, PricingPage handles it */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;