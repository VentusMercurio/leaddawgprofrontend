// src/pages/PaymentSuccessPage.jsx
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; // Added useLocation
import { useAuth } from '../context/AuthContext';
import styles from './PaymentStatusPage.module.css'; // Create a shared CSS module

function PaymentSuccessPage() {
  const { currentUser, isLoadingAuth } = useAuth();
  const location = useLocation();

  // Optional: You can get the session_id if Stripe redirects with it in the URL
  // And potentially verify it with your backend for extra confirmation,
  // but the webhook is the primary source of truth for fulfillment.
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');
    if (sessionId) {
      console.log("Stripe Checkout Session ID (from success URL):", sessionId);
      // You could make an API call here to your backend to confirm/log this session,
      // or trigger a user data refresh from AuthContext if needed.
    }
    // Typically, you might want to clear any 'intendedPlanId' from sessionStorage here
    sessionStorage.removeItem('intendedPlanId');
    sessionStorage.removeItem('intendedPlanName');
  }, [location.search]);

  if (isLoadingAuth) {
    return <div className={styles.statusContainer}>Loading user data...</div>;
  }

  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusBox}>
        <h2 className={styles.successTitle}>✓ Payment Successful!</h2>
        <p>Thank you for subscribing to LeadDawg Pro{currentUser ? `, ${currentUser.username}` : ''}!</p>
        <p>Your account has been upgraded. You can now access all premium features.</p>
        <Link to="/dashboard" className={styles.actionButton}>Go to My Dashboard</Link>
        <Link to="/" className={styles.secondaryLink}>Back to Homepage</Link>
      </div>
    </div>
  );
}
export default PaymentSuccessPage;