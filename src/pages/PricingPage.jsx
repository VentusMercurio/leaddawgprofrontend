// src/pages/PricingPage.jsx
import React from 'react';
import styles from './PricingPage.module.css'; // We'll create this CSS file
import { Link } from 'react-router-dom'; // For linking to signup/contact

function PricingPage() {
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
      ctaText: 'Get Started Free',
      ctaLink: '/register', // Link to your registration page
      isFeatured: false,
    },
    {
      name: 'Pro',
      price: '$12.99',
      priceSuffix: '/ month',
      features: [
        'Unlimited searches',
        'Save unlimited leads',
        'Full lead details (including website, phone)',
        'Advanced filtering & sorting',
        'Export leads to CSV (coming soon)',
        'Priority email support',
      ],
      ctaText: 'Go Pro',
      ctaLink: '/register?plan=pro', // Example: Link to register with a plan query
      isFeatured: true, // Make this the highlighted plan
    },
    {
      name: 'Agency',
      price: '$29.99',
      priceSuffix: '/ month',
      features: [
        'All Pro features',
        'Team member access (up to 3 users)',
        'Shared lead lists (coming soon)',
        'API access (coming soon)',
        'Dedicated account manager',
      ],
      ctaText: 'Contact Sales',
      ctaLink: 'mailto:sales@leaddawgpro.com', // Or a contact form page
      isFeatured: false,
    },
  ];

  return (
    <div className={styles.pricingPageContainer}>
      <header className={styles.pricingHeader}>
        <h1>Find the Perfect Plan for Your Needs</h1>
        <p>Unlock powerful lead generation and management tools with LeadDawg Pro.</p>
      </header>

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
            {tier.ctaLink.startsWith('mailto:') ? (
                <a href={tier.ctaLink} className={styles.ctaButton}>{tier.ctaText}</a>
            ) : (
                <Link to={tier.ctaLink} className={styles.ctaButton}>{tier.ctaText}</Link>
            )}
          </div>
        ))}
      </div>

      <footer className={styles.pricingFooter}>
        <p>All prices are in USD. You can upgrade, downgrade, or cancel at any time.</p>
        {/* Add links to ToS, Privacy Policy if needed */}
      </footer>
    </div>
  );
}

export default PricingPage;