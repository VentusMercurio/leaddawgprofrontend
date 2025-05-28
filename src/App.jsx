// src/App.jsx
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import './App.css'; // Ensure this is imported to apply your navbar styles

function App() {
  // No more inline style objects needed for the navbar if they are in App.css
  // const navStyle = { ... };
  // const linkStyle = { ... };

  return (
    <> {/* React Fragment to avoid unnecessary div wrapper for the whole app */}
      <nav className="app-navbar"> {/* Apply the class from App.css */}
        <Link to="/" className="navbar-brand"> {/* Apply class for branding */}
          LeadDawg Pro
        </Link>
        <div className="navbar-links"> {/* Apply class for the links container */}
          <Link to="/dashboard" className="nav-link">My Leads</Link>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link">Sign Up</Link>
        </div>
      </nav>

      {/* This div can be used for global content styling, like max-width and centering */}
      <div className="main-app-content"> 
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* 
            Future: Implement ProtectedRoute for dashboard 
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} /> 
          */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;