// app/routes/app.cart-settings.jsx
import React, { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { useAppBridge } from '@shopify/app-bridge-react';

// Knob Component
const Knob = ({ ariaLabel, selected, onClick }) => {
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

export const loader = async ({ request }) => {
  // TODO: Fetch cart settings from your backend
  return {
    cartEnabled: false,
    productExists: false,
    shopDomain: "example.myshopify.com" // Replace with actual shop domain
  };
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const enabled = formData.get('enabled') === 'true';
  
  // TODO: Update cart settings in your backend
  return { success: true, enabled };
};

export default function CartSettingsPage() {
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const [isEnabled, setIsEnabled] = useState(false);

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
      shopify.toast.show(
        `Cart display ${fetcher.data.enabled ? 'enabled' : 'disabled'}`
      );
    }
  }, [fetcher.data, shopify]);

  return (
    <s-page heading="Cart Display Settings">
      <s-text as="p" tone="subdued" style={{ marginBottom: '24px' }}>
        Manage the display of the tree planting donation checkbox in the cart.
      </s-text>

      <s-card>
        <s-stack direction="block" gap="400">
          <s-heading level="h3">Cart Checkbox</s-heading>

          <s-stack direction="inline" gap="400" alignItems="center" justifyContent="space-between">
            <s-stack direction="inline" gap="400" alignItems="center">
              <s-text as="p">
                {isEnabled ? 'Enabled' : 'Disabled'}
              </s-text>
              <s-badge tone={isEnabled ? 'success' : 'caution'}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </s-badge>
            </s-stack>
            <Knob
              selected={isEnabled}
              ariaLabel='Toggle cart checkbox'
              onClick={handleToggle}
            />
          </s-stack>

          <s-banner status="info">
            <s-text as="p">
              When enabled, customers will see a checkbox in their cart to add a tree planting donation.
            </s-text>
          </s-banner>

          <s-divider />

          <s-heading level="h4">Preview</s-heading>
          <s-card>
            <s-stack direction="block" gap="200">
              <s-stack direction="inline" gap="200" alignItems="center">
                <s-checkbox checked={isEnabled} />
                <s-text as="span">
                  Add $5.00 to plant a tree
                </s-text>
              </s-stack>
              <s-text as="p" variant="bodySm" tone="subdued">
                Support reforestation with your purchase
              </s-text>
            </s-stack>
          </s-card>
        </s-stack>
      </s-card>
    </s-page>
  );
}