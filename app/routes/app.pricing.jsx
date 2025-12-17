// app/routes/app.pricing.jsx
import React from 'react';
import { useNavigate } from "react-router";

// PricingCard Component (using new pattern)
const PricingCard = ({
  title,
  description,
  price,
  features,
  featuredText,
  button,
  frequency,
  isCurrentPlan = false,
}) => {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '15.6rem',
        boxShadow: featuredText ? '0px 0px 15px 4px #CDFEE1' : isCurrentPlan ? '0px 0px 15px 4px #e3f2ff' : 'none',
        borderRadius: '.75rem',
        position: 'relative',
        backgroundColor: '#FFFFFF',
        padding: '24px',
        zIndex: '0',
        gap: '16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        border: isCurrentPlan ? '2px solid #0B69FF' : featuredText ? '2px solid #CDFEE1' : '1px solid #E1E3E5',
      }}
    >
      {/* Featured Badge */}
      {featuredText && (
        <div style={{ 
          position: 'absolute', 
          top: '-15px', 
          right: '6px', 
          zIndex: '100' 
        }}>
          <s-badge size="large" tone="success">
            {featuredText}
          </s-badge>
        </div>
      )}
      
      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div style={{ 
          position: 'absolute', 
          top: '-15px', 
          left: '6px', 
          zIndex: '100' 
        }}>
          <s-badge size="large" tone="info">
            Current Plan
          </s-badge>
        </div>
      )}

    
        <s-stack direction="block" gap="large">
          {/* Title & Description */}
          <s-stack direction="block" gap="base" alignItems="start">
            <h1 style={{ 
              fontSize: "20px", 
              fontWeight: "bold",
              margin: 0 
            }}>
              {title}
            </h1>
            {description && (
              <s-text tone="subdued">
                {description}
              </s-text>
            )}
          </s-stack>

          {/* Price */}
          <s-stack direction="inline" gap="small-400" alignItems="baseline">
            <h2 style={{ 
              fontSize: "28px", 
              fontWeight: "bold",
              margin: 0 
            }}>
              {price}
            </h2>
            {frequency && (
              <s-text tone="subdued">
                / {frequency}
              </s-text>
            )}
          </s-stack>

          {/* Features */}
          <s-stack direction="block" gap="small-400">
            {features?.map((feature, id) => (
              <s-stack direction="inline" gap="200" key={id}>
                <div style={{ 
                  width: '20px', 
                  flexShrink: 0, 
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <s-icon 
                    source="check" 
                    tone={isCurrentPlan ? "primary" : "success"}
                  />
                </div>
                <s-text tone={isCurrentPlan ? "default" : "subdued"}>
                  {feature}
                </s-text>
              </s-stack>
            ))}
          </s-stack>

          {/* Button */}
   
        </s-stack>
               <s-stack alignItems="start" marginTop="large">
            <s-button 
              {...button.props}
              variant={button.variant}
              disabled={button.disabled}
              loading={button.loading}
              style={{ width: '100%' }}
            >
              {button.content}
            </s-button>
          </s-stack>
      
    </div>
  );
};

// Knob Component for Toggle (if needed elsewhere)
const Knob = ({ selected, onClick, ariaLabel }) => {
  return (
    <button
      style={{
        width: '52px',
        height: '32px',
        borderRadius: '16px',
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        backgroundColor: selected ? '#008060' : '#8C9196',
        padding: '4px'
      }}
      aria-label={ariaLabel}
      role='switch'
      type='button'
      aria-checked={selected}
      onClick={onClick}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: 'white',
          transition: 'transform 0.2s',
          transform: selected ? 'translateX(20px)' : 'translateX(0)'
        }}
      />
    </button>
  );
};





// -----------------------------
// MAIN PAGE: Pricing
// -----------------------------
export default function PricingPage() {
  const navigate = useNavigate();

  // Static/dummy data for the UI
  const currentPlan = 'free';
  const currentViews = 1250;
  const usageData = {
    views: [1000, 1200, 1100, 900, 1150, 1250, 1300],
    conversion: [5, 6, 4, 3, 7, 8, 9]
  };
  
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
        'Basic analytics',
        'Community support'
      ],
      button: {
        content: currentPlan === 'free' ? 'Current Plan' : 'Select Free',
        props: {
          onClick: () => console.log('Select Free Plan'),
          variant: 'secondary',
          disabled: currentPlan === 'free',
        },
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
        'Priority email support'
      ],
      button: {
        content: currentPlan === 'essential' ? 'Current Plan' : 'Upgrade to Essential',
        props: {
          onClick: () => navigate('/app/billing/essential'),
          variant: 'primary',
          disabled: currentPlan === 'essential',
        },
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
        'Priority phone support',
        'Custom integrations',
        'Advanced analytics dashboard',
        'A/B testing',
        'Custom API access',
        'Dedicated account manager'
      ],
      button: {
        content: currentPlan === 'professional' ? 'Current Plan' : 'Upgrade to Professional',
        props: {
          onClick: () => navigate('/app/billing/professional'),
          variant: 'secondary',
          disabled: currentPlan === 'professional',
        },
      },
    },
  ];

  return (
    <s-page heading="Plant Trees" inlineSize="base" >
      <s-button 
        slot="primary-action" 
        variant="tertiary" 
        onClick={() => navigate('/app')}
      >
        Back
      </s-button>
      
    

      <s-stack direction="block" gap="600">
        {/* Success Banner (example - can be conditionally shown) */}
        {false && (
          <s-banner tone="success">
            <s-text>
              Your subscription has been updated successfully!
            </s-text>
          </s-banner>
        )}

        {/* Error Banner (example - can be conditionally shown) */}
        {false && (
          <s-banner tone="critical">
            <s-text>
              There was an error loading your subscription data. Please refresh the page.
            </s-text>
          </s-banner>
        )}

<s-box  padding="base"
    background="base"
    borderRadius="base"
    borderWidth="base"
    borderColor="base">
  <s-stack direction="block" gap="base">
    <s-heading level="h3">Current Plan</s-heading>

    <s-stack gap="base">
      {/* PRIMARY STATUS BOX */}
      <s-box
        accessibilityRole="status"
       
      
        borderRadius="base"
      >
        <s-stack direction="block">
          <s-text tone="subdued">Active subscription</s-text>

          <s-stack direction="inline" gap="200" alignItems="center">
            <s-heading level="h2">
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan
            </s-heading>
            <s-badge tone="info">Active</s-badge>
          </s-stack>

          <s-text tone="subdued">
            {currentPlan === 'free'
              ? `${currentViews.toLocaleString()} of 5,000 views used this month`
              : `${currentViews.toLocaleString()} views this month`}
          </s-text>
        </s-stack>
      </s-box>

      {/* SECONDARY INFO BOX */}
      {/* <s-box
        accessibilityVisibility="exclusive"
        padding="base"
        borderRadius="base"
      >
        <s-stack direction="inline" gap="200" justifyContent="space-between">
          <s-text tone="subdued">
            Remaining allowance
          </s-text>

          <s-text>
            {currentPlan === 'free'
              ? `${(5000 - currentViews).toLocaleString()} views`
              : 'Unlimited'}
          </s-text>
        </s-stack>
      </s-box> */}
    </s-stack>
  </s-stack>
</s-box>
<br></br>


        {/* Pricing Cards */}
        <s-box>
          <s-stack direction="block" gap="large-100">
           
           
            
            <s-stack direction="inline" gap="large-100" wrap justifyContent="center">
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
          </s-stack>
        </s-box>

    
      </s-stack>
    </s-page>
  );
}