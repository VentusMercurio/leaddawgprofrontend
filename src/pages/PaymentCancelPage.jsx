// src/pages/PaymentCancelPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PaymentStatusPage.module.css'; // Reuse the same CSS module

function PaymentCancelPage() {
  // Clear any stored intent if payment is canceled
  useEffect(() => {
    sessionStorage.removeItem('intendedPlanId');
    sessionStorage.removeItem('intendedPlanName');
  }, []);

  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusBox}>
        <h2 className={styles.cancelTitle}>Payment Canceled</h2>
        <p>Your subscription process was not completed.</p>
        <p>Your card has not been charged. You can try subscribing again anytime.</p>
        <Link to="/pricing" className={styles.actionButton}>View Pricing Plans</Link>
        <Link to="/" className={styles.secondaryLink}>Back to Homepage</Link>
      </div>
    </div>
  );
}
export default PaymentCancelPage;