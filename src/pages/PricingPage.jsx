// src/pages/PricingPage.jsx
import React, { useState, useEffect } from 'react'; // Added useEffect for the PaymentCancelPage example
import styles from './PricingPage.module.css';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
if (!STRIPE_PUBLISHABLE_KEY) {
  console.error("Stripe Publishable Key is not set (VITE_STRIPE_PUBLISHABLE_KEY).");
}
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002';

function PricingPage() {
  const { isLoggedIn, currentUser } // Added currentUser for potential use later
    = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // To check for query params like ?canceled=true
  const [error, setError] = useState('');
  const [loadingPriceId, setLoadingPriceId] = useState(null);

  // Display a message if payment was canceled
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('canceled') === 'true') {
      setError('Your payment process was canceled. You can try subscribing again.');
      // Optionally remove the query param from URL to prevent message on refresh
      // navigate('/pricing', { replace: true }); 
    }
  }, [location.search, navigate]);

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      priceSuffix: '/ month',
      features: [
        'Up to 20 searches per day',
        'Save up to 10 leads',
        'Basic lead information',
        'Community support',
      ],
      ctaText: 'Get Started',
      ctaAction: () => navigate(isLoggedIn ? '/dashboard' : '/register'), // Go to dashboard if logged in, else register
      isFeatured: false,
    },
    {
      name: 'Pro',
      price: '$12.99',
      priceSuffix: '/ month',
      // !!! REPLACE WITH YOUR ACTUAL STRIPE TEST PRICE ID for Pro Plan !!!
      priceId: "price_1RUWknDAXk8e47meYuxRiQjD", 
      features: [
        'Unlimited searches',
        'Save unlimited leads',
        'Full lead details (including website, phone)',
        'Advanced filtering & sorting',
        'Export leads to CSV (coming soon)',
        'Priority email support',
      ],
      ctaText: 'Go Pro',
      isFeatured: true,
    },
    {
      name: 'Agency',
      price: '$29.99',
      priceSuffix: '/ month',
      // !!! REPLACE WITH YOUR ACTUAL STRIPE TEST PRICE ID for Agency Plan !!!
      priceId: "price_1RUWmtDAXk8e47mej8TDaepg", 
      features: [
        'All Pro features',
        'Team member access (up to 3 users)',
        'Shared lead lists (coming soon)',
        'API access (coming soon)',
        'Dedicated account manager',
      ],
      ctaText: 'Choose Agency',
      isFeatured: false,
    },
  ];

  const handleSubscription = async (tier) => {
    if (!STRIPE_PUBLISHABLE_KEY || !stripePromise) {
        setError("Payment system is not configured correctly. Please contact support or try again later.");
        return;
    }
    if (!tier.priceId || tier.priceId.startsWith("prod_")) { // Also check if it looks like a product ID
        setError(`Configuration error for ${tier.name} plan. Please contact support.`);
        console.error("Attempting to use invalid or Product ID as Price ID:", tier.priceId);
        return;
    }

    if (!isLoggedIn) {
      sessionStorage.setItem('intendedPlanId', tier.priceId);
      sessionStorage.setItem('intendedPlanName', tier.name);
      navigate('/login', { state: { from: '/pricing', message: `Please login to subscribe to the ${tier.name} plan.` } });
      return;
    }

    setLoadingPriceId(tier.priceId);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/payments/create-checkout-session`, 
        { priceId: tier.priceId }, // Send the correct Price ID
        { withCredentials: true }
      );
      const session = response.data;

      if (!session || !session.id) {
        throw new Error("Failed to create a checkout session ID from backend.");
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe.js failed to load.");
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (stripeError) {
        console.error("Stripe redirect error:", stripeError);
        setError(stripeError.message || "Failed to redirect to payment page. Please try again.");
      }
    } catch (err) {
      console.error("Subscription initiation error:", err);
      setError(err.response?.data?.error?.message || err.message || "Could not initiate subscription process. Please ensure you are logged in.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  // The rest of your JSX for rendering the page:
  return (
    <div className={styles.pricingPageContainer}>
      <header className={styles.pricingHeader}>
        <h1>Find the Perfect Plan for Your Needs</h1>
        <p>Unlock powerful lead generation and management tools with LeadDawg Pro.</p>
      </header>

      {error && <p className={`${styles.pageError} ${styles.errorMessage}`}>{error}</p>} 

      <div className={styles.tiersContainer}>
        {tiers.map((tier) => (
          <div key={tier.name} className={`${styles.tierCard} ${tier.isFeatured ? styles.featuredTier : ''}`}>
            {tier.isFeatured && <div className={styles.featuredBadge}>Most Popular</div>}
            <h3 className={styles.tierName}>{tier.name}</h3>
            <div className={styles.tierPrice}>
              {tier.price}
              <span className={styles.priceSuffix}>{tier.priceSuffix}</span>
            </div>
            <ul className={styles.featuresList}>
              {tier.features.map((feature, index) => (
                <li key={index} className={styles.featureItem}>{feature}</li>
              ))}
            </ul>
            {tier.priceId ? ( 
              <button 
                onClick={() => handleSubscription(tier)} 
                className={styles.ctaButton}
                disabled={loadingPriceId === tier.priceId || !stripePromise} // Disable if Stripe not loaded
              >
                {loadingPriceId === tier.priceId ? 'Processing...' : tier.ctaText}
              </button>
            ) : tier.ctaAction ? ( 
                <button onClick={tier.ctaAction} className={styles.ctaButton}>{tier.ctaText}</button>
            ) : tier.ctaLink && tier.ctaLink.startsWith('mailto:') ? ( 
                <a href={tier.ctaLink} className={styles.ctaButton}>{tier.ctaText}</a>
            ) : ( 
                <Link to={tier.ctaLink || '/register'} className={styles.ctaButton}>{tier.ctaText}</Link>
            )}
          </div>
        ))}
      </div>

      <footer className={styles.pricingFooter}>
        <p>All prices are in USD. You can upgrade, downgrade, or cancel at any time (once feature is implemented).</p>
      </footer>
    </div>
  );
}

export default PricingPage;