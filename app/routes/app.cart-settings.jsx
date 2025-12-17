// app/routes/app.cart-settings.jsx
import React, { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { useAppBridge } from '@shopify/app-bridge-react';

export const loader = async ({ request }) => {
  return {
    cartEnabled: false,
    donationAmount: 5.00,
  };
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const enabled = formData.get('enabled') === 'true';
  
  // TODO: Update cart settings in your backend
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return { success: true, enabled };
};

export default function CartSettingsPage() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [isEnabled, setIsEnabled] = useState(false);
  const donationAmount = 5.00;

  const handleToggle = () => {
    const newValue = !isEnabled;
    fetcher.submit(
      { enabled: newValue.toString() },
      { method: 'POST' }
    );
  };

  useEffect(() => {
    if (fetcher.data?.success) {
      setIsEnabled(fetcher.data.enabled);
      shopify.toast.show({
        content: `Donation option ${fetcher.data.enabled ? 'enabled' : 'disabled'}`,
        tone: 'success'
      });
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="Cart Settings" inlineSize="base">
      <s-text as="p" tone="subdued" style={{ marginBottom: '32px' }}>
        Control how tree planting donations appear in your cart
      </s-text>

      <s-stack direction="block" gap="500">
        {/* Status Card */}
        <s-card>
          <s-stack direction="block" gap="400">
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <div>
                <s-heading level="h3">Donation Option</s-heading>
                <s-text tone="subdued" variant="bodySm">
                  Add a checkbox for customers to donate ${donationAmount.toFixed(2)} per tree
                </s-text>
              </div>
              <s-badge 
                size="large" 
                tone={isEnabled ? "success" : "subdued"}
                icon={isEnabled ? "check" : "cancel"}
              >
                {isEnabled ? 'Active' : 'Inactive'}
              </s-badge>
            </s-stack>

            <s-divider />

            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <s-stack direction="block" gap="100">
                <s-text fontWeight="medium">Enable Cart Donations</s-text>
                <s-text tone="subdued" variant="bodySm">
                  {isEnabled 
                    ? 'Customers can add donations to their orders' 
                    : 'Donation option is currently hidden'
                  }
                </s-text>
              </s-stack>
              
              <button
                onClick={handleToggle}
                disabled={fetcher.state === 'submitting'}
                style={{
                  width: '60px',
                  height: '30px',
                  borderRadius: '15px',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: isEnabled ? '#008060' : '#E1E3E5',
                  padding: '3px',
                  outline: 'none'
                }}
                aria-label={`${isEnabled ? 'Disable' : 'Enable'} donation option`}
                role='switch'
                type='button'
                aria-checked={isEnabled}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    transition: 'transform 0.3s ease',
                    transform: isEnabled ? 'translateX(30px)' : 'translateX(0)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                />
              </button>
            </s-stack>
          </s-stack>
        </s-card>

        {/* Preview */}
        <s-card>
          <s-stack direction="block" gap="400">
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <s-heading level="h3">Preview</s-heading>
              <s-text tone="subdued" variant="bodySm">
                {isEnabled ? 'Live preview' : 'Disabled state'}
              </s-text>
            </s-stack>

            <div style={{
              padding: '24px',
              backgroundColor: isEnabled ? '#F0FAF7' : '#F9F9FA',
              borderRadius: '8px',
              border: isEnabled ? '1px solid #CDFEE1' : '1px solid #E1E3E5',
              transition: 'all 0.3s ease'
            }}>
              <s-stack direction="block" gap="300">
                {/* Cart Header */}
                <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                  <s-text fontWeight="medium" variant="headingSm">Cart Item</s-text>
                  <s-text fontWeight="bold">$29.99</s-text>
                </s-stack>
                
                {/* Donation Option */}
                <s-stack direction="inline" gap="200" alignItems="center">
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '4px',
                    border: isEnabled ? '2px solid #008060' : '1px solid #8C9196',
                    backgroundColor: isEnabled ? '#008060' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}>
                    {isEnabled && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M11.6666 3.5L5.24998 9.91667L2.33331 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <s-stack direction="block" gap="50">
                    <s-text 
                      fontWeight="medium"
                      style={{ color: isEnabled ? '#172117' : '#6D7175' }}
                    >
                      Add ${donationAmount.toFixed(2)} to plant a tree
                    </s-text>
                    <s-text 
                      tone="subdued" 
                      variant="bodySm"
                      style={{ color: isEnabled ? '#5B5F62' : '#8C9196' }}
                    >
                      Support reforestation with your purchase
                    </s-text>
                  </s-stack>
                </s-stack>

                {/* Total */}
                <s-divider />
                <s-stack direction="inline" justifyContent="space-between">
                  <s-text fontWeight="bold">Total</s-text>
                  <s-text variant="headingMd" fontWeight="bold">
                    ${isEnabled ? '34.99' : '29.99'}
                  </s-text>
                </s-stack>
              </s-stack>
            </div>

            <s-text tone="subdued" variant="bodySm" align="center">
              This is how the donation option appears in your cart
            </s-text>
          </s-stack>
        </s-card>

        {/* Quick Info */}
        <s-card tone="info">
          <s-stack direction="inline" gap="300" alignItems="center">
            <s-icon source="info" tone="info" />
            <s-stack direction="block" gap="100">
              <s-text fontWeight="medium">
                {isEnabled ? 'Donations are active ✓' : 'Ready to enable donations'}
              </s-text>
              <s-text variant="bodySm">
                {isEnabled 
                  ? 'Customers can now add tree planting donations to their orders.'
                  : 'Enable to allow customers to support reforestation.'
                }
              </s-text>
            </s-stack>
          </s-stack>
        </s-card>
      </s-stack>
    </s-page>
  );
}