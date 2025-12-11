// app/routes/app.pricing.jsx
import React from 'react';
// import { useNavigate } from '@remix-run/react';
import { useNavigate } from "react-router";
// -----------------------------
// COMPONENT: Pricing Card
// -----------------------------
const PricingCard = ({
  title,
  description,
  price,
  features,
  featuredText,
  button,
  frequency,
  isCurrentPlan = false,
}) => (
  <div
    style={{
      width: '100%',
      maxWidth: '300px',
      height: '500px',
      boxShadow: featuredText ? '0px 0px 15px 4px #CDFEE1' : 'none',
      borderRadius: '12px',
      position: 'relative',
      zIndex: 0,
      border: featuredText
        ? '2px solid #CDFEE1'
        : isCurrentPlan
        ? '2px solid #0B69FF'
        : '1px solid #E1E3E5',
    }}
  >
    {featuredText && (
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
        }}
      >
        <s-badge size="large" tone="success">
          {featuredText}
        </s-badge>
      </div>
    )}
    {isCurrentPlan && (
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
        }}
      >
        <s-badge size="large" tone="info">
          Current Plan
        </s-badge>
      </div>
    )}
    <div style={{
      padding: '16px',
      paddingTop: featuredText || isCurrentPlan ? '32px' : '32px',
      height: '100%',
      backgroundColor: '#FFFFFF',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <s-stack direction="block" gap="400">
          <s-stack direction="block" gap="200">
            <s-heading level="h3">{title}</s-heading>
            {description && (
              <s-text as="p" variant="bodySm" tone="subdued">
                {description}
              </s-text>
            )}
          </s-stack>

          <s-stack direction="inline" gap="100">
            <s-heading level="h2">{price}</s-heading>
            {frequency && (
              <s-box padding="0 0 200 0">
                <s-text as="p" variant="bodySm" tone="subdued">
                  / {frequency}
                </s-text>
              </s-box>
            )}
          </s-stack>

          <s-stack direction="block" gap="200">
            {features.map((feature, id) => (
              <s-stack direction="inline" gap="200" key={id}>
                <div style={{ width: '20px', flexShrink: 0, marginTop: '4px' }}>
                  <s-icon source="check" tone="success"></s-icon>
                </div>
                <s-text tone="subdued" as="p" variant="bodyMd">
                  {feature}
                </s-text>
              </s-stack>
            ))}
          </s-stack>
        </s-stack>

        <s-box padding="300 0 0 0">
          <s-button-group>
            <s-button
              onClick={button.onClick}
              variant={button.variant}
              disabled={button.disabled}
              loading={button.loading}
              style={{ width: '100%' }}
            >
              {button.content}
            </s-button>
          </s-button-group>
        </s-box>
      </div>
    </div>
  </div>
);

// -----------------------------
// MAIN PAGE: Pricing
// -----------------------------
export default function PricingPage() {
  const navigate = useNavigate();

  // Static/dummy data for the UI
  const currentPlan = 'free';
  const currentViews = 1250;
  
  const getCurrentPlanViewsText = () =>
    currentPlan === 'free'
      ? `(${currentViews} / 5000 monthly views)`
      : `(${currentViews} views this month)`;

  const plans = [
    {
      id: 'free',
      title: 'Free Plan',
      description: 'Up to 5000 monthly views',
      price: 'Free',
      frequency: '',
      features: [
        'One product page banner with 3 icons',
        'Unlimited product payment icons',
        '5000 monthly badge views included',
      ],
      button: {
        content: currentPlan === 'free' ? 'Current Plan' : 'Select Free',
        onClick: () => console.log('Select Free Plan'),
        variant: 'secondary',
        disabled: currentPlan === 'free',
      },
    },
    {
      id: 'essential',
      title: 'Essential',
      description: 'Everything you need to grow',
      price: '$6.99',
      frequency: 'month',
      featuredText: 'Most Popular',
      features: [
        'Everything in Free',
        'Unlimited product page blocks',
        'Unlimited cart page blocks',
        'Upload your own icons',
        'Geolocation targeting',
        'Translations',
        'Unlimited badge views',
      ],
      button: {
        content: currentPlan === 'essential' ? 'Current Plan' : 'Upgrade to Essential',
        onClick: () => navigate('/app/billing/essential'),
        variant: 'primary',
        disabled: currentPlan === 'essential',
      },
    },
    {
      id: 'professional',
      title: 'Professional',
      description: 'For high-volume stores',
      price: '$29.99',
      frequency: 'month',
      features: [
        'Everything in Essential',
        'Advanced targeting options',
        'Priority support',
        'Custom integrations',
        'Analytics dashboard',
        'Unlimited badge views',
      ],
      button: {
        content: currentPlan === 'professional' ? 'Current Plan' : 'Upgrade to Professional',
        onClick: () => navigate('/app/billing/professional'),
        variant: 'secondary',
        disabled: currentPlan === 'professional',
      },
    },
  ];

  return (
    <s-page heading="Progus Trust Badges">
      <s-button 
        slot="primary-action" 
        variant="tertiary" 
        onClick={() => navigate('/app')}
      >
        Back
      </s-button>
      
      <s-text 
        as="p" 
        variant="bodyMd" 
        tone="subdued" 
        style={{ marginBottom: '24px' }}
      >
        Pricing plans
      </s-text>

      <s-stack direction="block" gap="600">
        {/* Success Banner (example - can be conditionally shown) */}
        {false && (
          <s-banner tone="success">
            <s-text as="p" variant="bodyMd">
              Your subscription has been updated successfully!
            </s-text>
          </s-banner>
        )}

        {/* Error Banner (example - can be conditionally shown) */}
        {false && (
          <s-banner tone="critical">
            <s-text as="p" variant="bodyMd">
              There was an error loading your subscription data. Please refresh the page.
            </s-text>
          </s-banner>
        )}

        {/* Current Plan Card */}
        <s-card>
          <s-stack direction="block" gap="200">
            <s-text as="p" variant="bodyMd">
              You're currently on{' '}
              <s-text as="span" variant="bodyMd" fontWeight="bold">
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </s-text>{' '}
              {getCurrentPlanViewsText()}.
            </s-text>
          </s-stack>
        </s-card>

        {/* Pricing Cards */}
        <s-box padding="400 0 0 0">
          <s-stack direction="inline" gap="400" wrap>
            {plans.map((plan) => (
              <PricingCard
                key={plan.id}
                title={plan.title}
                description={plan.description}
                price={plan.price}
                frequency={plan.frequency}
                features={plan.features}
                featuredText={plan.featuredText}
                button={plan.button}
                isCurrentPlan={currentPlan === plan.id}
              />
            ))}
          </s-stack>
        </s-box>
      </s-stack>
    </s-page>
  );
}