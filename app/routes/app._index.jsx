// app/routes/app._index.jsx
import { useState, useEffect } from "react";
import { useFetcher, useLoaderData, Link, useNavigate } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate, getAppMetafields, setAppMetafield, parseMetafields } from "../shopify.server";

// SetupGuide Component
const SetupGuide = ({ onDismiss, onStepComplete, items }) => {
  const [expanded, setExpanded] = useState(items.findIndex((item) => !item.complete));
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const completedItemsLength = items.filter((item) => item.complete).length;

  return (
    <>
      <s-section padding="none">
        <s-box padding="base" paddingBlockEnd="none">
          <s-stack direction="block" gap="none">
            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
              <s-heading level="h3">
                Setup Guide
              </s-heading>
              <s-stack direction="inline" gap="extra-tight" wrap={false}>
                <s-button
                  variant="tertiary"
                  icon="menu-horizontal"
                  onClick={() => onDismiss()}
                />
                <s-button
                  variant="tertiary"
                  icon={isGuideOpen ? "chevron-up" : "chevron-down"}
                  onClick={() => {
                    setIsGuideOpen((prev) => {
                      if (!prev) setExpanded(items.findIndex((item) => !item.complete));
                      return !prev;
                    });
                  }}
                />
              </s-stack>
            </s-stack>
            <s-text>
              Use this personalized guide to get your app up and running.
            </s-text>
            <div style={{ marginTop: '.8rem' }}>
              <s-stack direction="inline" alignItems="center" gap="small-300" paddingBlockEnd={!isGuideOpen ? 'small' : 'none'}>
                {completedItemsLength === items.length ? (
                  <s-stack direction="inline" wrap={false} gap="extra-small">
                    <s-icon
                      source="check"
                      tone="subdued"
                    />
                    <s-text tone="subdued">
                      Done
                    </s-text>
                  </s-stack>
                ) : (
                  <s-text tone="subdued">
                    {`${completedItemsLength} / ${items.length} completed`}
                  </s-text>
                )}

                {completedItemsLength !== items.length ? (
                  <div style={{ width: '100px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: 'var(--p-color-border-secondary)',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          width: `${(items.filter((item) => item.complete).length / items.length) * 100}%`,
                          height: '100%',
                          backgroundColor: 'var(--p-color-bg-inverse)',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease-in-out'
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </s-stack>
            </div>
          </s-stack>
        </s-box>
        <div
          style={{
            display: 'grid',
            gridTemplateRows: isGuideOpen ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.1s ease-out',
            paddingBlockStart: isGuideOpen ? '20px' : '0px'
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <s-box padding="small-300">
              <s-stack direction="block" gap="small-400">
                {items.map((item) => (
                  <SetupItem
                    key={item.id}
                    expanded={expanded === item.id}
                    setExpanded={() => setExpanded(item.id)}
                    onComplete={onStepComplete}
                    {...item}
                  />
                ))}
              </s-stack>
            </s-box>
          </div>
        </div>
        {completedItemsLength === items.length ? (
          <s-box
            background="subdued"
            borderBlockStartWidth="small"
            borderColor="border-secondary"
            padding="base"
          >
            <s-stack direction="inline" justifyContent="end">
              <s-button onClick={onDismiss}>Dismiss Guide</s-button>
            </s-stack>
          </s-box>
        ) : null}
      </s-section>
      <br></br>
    </>
  );
};

const SetupItem = ({
  complete,
  onComplete,
  expanded,
  setExpanded,
  title,
  description,
  primaryButton,
  secondaryButton,
  id
}) => {
  const [loading, setLoading] = useState(false);

  const completeItem = async () => {
    setLoading(true);
    await onComplete(id);
    setLoading(false);
  };

  const outlineSvg = (
    <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M10.5334 2.10692C11.0126 2.03643 11.5024 2 12 2C12.4976 2 12.9874 2.03643 13.4666 2.10692C14.013 2.18729 14.3908 2.6954 14.3104 3.2418C14.23 3.78821 13.7219 4.166 13.1755 4.08563C12.7924 4.02927 12.3999 4 12 4C11.6001 4 11.2076 4.02927 10.8245 4.08563C10.2781 4.166 9.76995 3.78821 9.68958 3.2418C9.6092 2.6954 9.987 2.18729 10.5334 2.10692ZM7.44122 4.17428C7.77056 4.61763 7.67814 5.24401 7.23479 5.57335C6.603 6.04267 6.04267 6.603 5.57335 7.23479C5.24401 7.67814 4.61763 7.77056 4.17428 7.44122C3.73094 7.11188 3.63852 6.4855 3.96785 6.04216C4.55386 5.25329 5.25329 4.55386 6.04216 3.96785C6.4855 3.63852 7.11188 3.73094 7.44122 4.17428ZM16.5588 4.17428C16.8881 3.73094 17.5145 3.63852 17.9578 3.96785C18.7467 4.55386 19.4461 5.25329 20.0321 6.04216C20.3615 6.4855 20.2691 7.11188 19.8257 7.44122C19.3824 7.77056 18.756 7.67814 18.4267 7.23479C17.9573 6.603 17.397 6.04267 16.7652 5.57335C16.3219 5.24401 16.2294 4.61763 16.5588 4.17428ZM3.2418 9.68958C3.78821 9.76995 4.166 10.2781 4.08563 10.8245C4.02927 11.2076 4 11.6001 4 12C4 12.3999 4.02927 12.7924 4.08563 13.1755C4.166 13.7219 3.78821 14.23 3.2418 14.3104C2.6954 14.3908 2.18729 14.013 2.10692 13.4666C2.03643 12.9874 2 12.4976 2 12C2 11.5024 2.03643 11.0126 2.10692 10.5334C2.18729 9.987 2.6954 9.6092 3.2418 9.68958ZM20.7582 9.68958C21.3046 9.6092 21.8127 9.987 21.8931 10.5334C21.9636 11.0126 22 11.5024 22 12C22 12.4976 21.9636 12.9874 21.8931 13.4666C21.8127 14.013 21.3046 14.3908 20.7582 14.3104C20.2118 14.23 19.834 13.7219 19.9144 13.1755C19.9707 12.7924 20 12.3999 20 12C20 11.6001 19.9707 11.2076 19.9144 10.8245C19.834 10.2781 20.2118 9.76995 20.7582 9.68958ZM4.17428 16.5588C4.61763 16.2294 5.24401 16.3219 5.57335 16.7652C6.04267 17.397 6.603 17.9573 7.23479 18.4267C7.67814 18.756 7.77056 19.3824 7.44122 19.8257C7.11188 20.2691 6.4855 20.3615 6.04216 20.0321C5.25329 19.4461 4.55386 18.7467 3.96785 17.9578C3.63852 17.5145 3.73094 16.8881 4.17428 16.5588ZM19.8257 16.5588C20.2691 16.8881 20.3615 17.5145 20.0321 17.9578C19.4461 18.7467 18.7467 19.4461 17.9578 20.0321C17.5145 20.3615 16.8881 20.2691 16.5588 19.8257C16.2294 19.3824 16.3219 18.756 16.7652 18.4267C17.397 17.9573 17.9573 17.397 18.4267 16.7652C18.756 16.3219 19.3824 16.2294 19.8257 16.5588ZM9.68958 20.7582C9.76995 20.2118 10.2781 19.834 10.8245 19.9144C11.2076 19.9707 11.6001 20 12 20C12.3999 20 12.7924 19.9707 13.1755 19.9144C13.7219 19.834 14.23 20.2118 14.3104 20.7582C14.3908 21.3046 14.013 21.8127 13.4666 21.8931C12.9874 21.9636 12.4976 22 12 22C11.5024 22 11.0126 21.9636 10.5334 21.8931C9.987 21.8127 9.6092 21.3046 9.68958 20.7582Z'
        fill='#8A8A8A'
      />
    </svg>
  );

  const checkSvg = (
    <svg xmlns="http://www.w3.org/2000/svg" height="12" width="12" viewBox="0 0 16 16">
      <path fillRule="evenodd" d="M13.71 3.156a.75.75 0 0 1 .128 1.053l-6.929 8.846-.01.013c-.045.057-.104.134-.163.197a1 1 0 0 1-.382.263 1 1 0 0 1-.714-.005 1 1 0 0 1-.38-.268 6 6 0 0 1-.17-.212l-2.932-3.84a.75.75 0 1 1 1.193-.91l2.657 3.48 6.65-8.489a.75.75 0 0 1 1.052-.128"></path>
    </svg>
  );

  return (
    <s-clickable borderRadius='small'>
      <s-box borderRadius="small" background={expanded ? 'subdued' : undefined} paddingBlockStart="small-400" paddingInline="small-300" paddingBlockEnd="small-400">
        <s-grid gridTemplateColumns='auto 1fr' alignItems='start' columnGap='small'>
          <s-grid-item>
            <s-tooltip>
              {complete ? 'Mark as not done' : 'Mark as done'}
            </s-tooltip>
            <s-clickable onClick={completeItem}>
              <div style={{ width: '1.5rem', height: '1.5rem' }}>
                {loading ? (
                  <s-spinner size="small" />
                ) : complete ? (
                  <div style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    borderRadius: '100%',
                    background: '#303030',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fill: '#fff',
                    color: "#fff",
                  }}>
                    {checkSvg}
                  </div>
                ) : (
                  outlineSvg
                )}
              </div>
            </s-clickable>
          </s-grid-item>
          <s-grid-item>
            <div
              onClick={expanded ? () => null : setExpanded}
              style={{
                cursor: expanded ? 'default' : 'pointer',
                paddingBlockStart: '2px'
              }}
            >
              <s-stack direction="block">
                {
                  expanded ? (
                    <s-heading level="h4">
                      {title}
                    </s-heading>
                  ) : (
                    <s-text>
                      {title}
                    </s-text>
                  )
                }
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: expanded ? '1fr' : '0fr',
                    transition: 'grid-template-rows 0.1s ease-out',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <s-box paddingBlockStart="small" paddingBlockEnd="small">
                      <s-stack direction="block" gap="large">
                        <s-text>
                          {description}
                        </s-text>
                        {primaryButton || secondaryButton ? (
                          <s-stack direction="inline" gap="base">
                            {primaryButton ? (
                              <s-button variant="primary" {...primaryButton.props}>
                                {primaryButton.content}
                              </s-button>
                            ) : null}
                            {secondaryButton ? (
                              <s-button variant="tertiary" {...secondaryButton.props}>
                                {secondaryButton.content}
                              </s-button>
                            ) : null}
                          </s-stack>
                        ) : null}
                      </s-stack>
                    </s-box>
                  </div>
                </div>
              </s-stack>
            </div>
          </s-grid-item>
        </s-grid>
      </s-box>
    </s-clickable>
  );
};

// Setup items data
const SETUP_ITEMS = [
  {
    id: 0,
    title: "Create Tree Planting Product",
    description: "Set up a special product that allows customers to donate towards planting trees.",
    complete: false,
  },
  {
    id: 1,
    title: "Configure Cart Settings",
    description: "Enable the tree planting donation checkbox in the cart for your customers.",
    complete: false,
  },
  {
    id: 2,
    title: "Set Up Pricing Plan",
    description: "Choose a pricing plan that fits your store's needs and volume.",
    complete: false,
  },
];

// Loader function
export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    // Get all app metafields
    const metafields = await getAppMetafields(admin);
    const parsedFields = parseMetafields(metafields);
    
    console.log('Loaded metafields:', parsedFields);

    let shopifyProduct = null;
    let exists = false;
    let productId = parsedFields.product_id;
    
    // Check if product exists in Shopify
    if (productId) {
      try {
        const response = await admin.graphql(
          `#graphql
          query GetProduct($id: ID!) {
            product(id: $id) {
              id
              title
              handle
              status
              variants(first: 10) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
          }`,
          {
            variables: { id: productId }
          }
        );
        const responseJson = await response.json();
        
        if (responseJson.data?.product) {
          shopifyProduct = responseJson.data.product;
          exists = true;
          
          // Update donation amount from product price
          const currentPrice = shopifyProduct.variants.edges[0]?.node?.price || "0.00";
          if (parsedFields.donation_amount !== currentPrice) {
            // Update metafield with current price
            await setAppMetafield(admin, {
              key: 'donation_amount',
              type: 'string',
              value: currentPrice,
            });
            parsedFields.donation_amount = currentPrice;
          }
        } else {
          // Product not found in Shopify, clear stored ID
          await setAppMetafield(admin, {
            key: 'product_id',
            type: 'string',
            value: "",
          });
        }
      } catch (error) {
        console.error('Error fetching product by ID:', error);
      }
    }
    
    // If no product found by ID, search by title
    if (!shopifyProduct) {
      try {
        const response = await admin.graphql(
          `#graphql
          query {
            products(first: 10, query: "title:'Support Tree Planting'") {
              edges {
                node {
                  id
                  title
                  handle
                  status
                  variants(first: 10) {
                    edges {
                      node {
                        id
                        price
                      }
                    }
                  }
                }
              }
            }
          }`
        );
        const responseJson = await response.json();
        const products = responseJson.data.products.edges;
        
        if (products && products.length > 0) {
          shopifyProduct = products[0].node;
          exists = true;
          
          // Store product ID in metafields
          await setAppMetafield(admin, {
            key: 'product_id',
            type: 'string',
            value: shopifyProduct.id,
          });
          
          // Store donation amount
          const productPrice = shopifyProduct.variants.edges[0]?.node?.price || "0.00";
          await setAppMetafield(admin, {
            key: 'donation_amount',
            type: 'string',
            value: productPrice,
          });
          parsedFields.donation_amount = productPrice;
        }
      } catch (error) {
        console.error('Error searching product by title:', error);
      }
    }

    // Check cart enabled status
    const cartEnabled = parsedFields.cart_enabled === 'true' || parsedFields.cart_enabled === true;
    
    return { 
      shopifyProduct, 
      exists, 
      hasError: false,
      donationAmount: parsedFields.donation_amount || "0.00",
      cartEnabled: cartEnabled,
      productData: parsedFields.product_data || null,
      metafields: parsedFields
    };
  } catch (error) {
    console.error('Loader error:', error);
    return {
      shopifyProduct: null,
      exists: false,
      hasError: true,
      errorMessage: error.message || 'Failed to load app data',
      donationAmount: "0.00",
      cartEnabled: false,
    };
  }
};

// Action function - Simplified: No price selection needed
export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const actionType = formData.get("actionType") || "create";

    if (actionType === "create") {
      // Check if product already exists in metafields
      const metafields = await getAppMetafields(admin);
      const parsedFields = parseMetafields(metafields);
      
      if (parsedFields.product_id) {
        try {
          const checkResponse = await admin.graphql(
            `#graphql
            query GetProduct($id: ID!) {
              product(id: $id) {
                id
                title
                status
              }
            }`,
            { variables: { id: parsedFields.product_id } }
          );
          const checkJson = await checkResponse.json();
          if (checkJson.data?.product && checkJson.data.product.status !== 'ARCHIVED') {
            return { 
              success: false, 
              error: "Product already exists. Please delete it in Shopify first.",
              productId: parsedFields.product_id
            };
          }
        } catch (error) {
          // Product not found, continue with creation
        }
      }

      // Create product with $0.00 price - merchant will set price in Shopify
      const productResponse = await admin.graphql(
        `#graphql
        mutation createTreePlantingProduct($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              handle
              status
              variants(first: 10) {
                edges {
                  node {
                    id
                    price
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }`,
        {
          variables: {
            input: {
              title: "Support Tree Planting",
              productType: "Donation",
              vendor: "Tree Planting",
              descriptionHtml: "<p>Support tree planting with your purchase. Every donation helps plant trees and restore our environment.</p>",
              tags: ["donation", "tree-planting", "charity"],
              status: "ACTIVE"
            },
          },
        }
      );

      const productJson = await productResponse.json();
      
      console.log('Product creation response:', productJson);
      
      if (productJson.data.productCreate.userErrors?.length > 0) {
        return { 
          success: false, 
          error: productJson.data.productCreate.userErrors[0].message 
        };
      }

      const product = productJson.data.productCreate.product;
      const variantId = product.variants.edges[0]?.node?.id;
      const currentPrice = product.variants.edges[0]?.node?.price || "0.00";

      // Store in app metafields
      await setAppMetafield(admin, {
        key: 'product_id',
        type: 'string',
        value: product.id,
      });

      await setAppMetafield(admin, {
        key: 'donation_amount',
        type: 'string',
        value: currentPrice,
      });

      await setAppMetafield(admin, {
        key: 'product_data',
        type: 'json',
        value: {
          productId: product.id,
          title: product.title,
          handle: product.handle,
          price: currentPrice,
          variantId: variantId,
          createdAt: new Date().toISOString(),
          status: product.status,
        },
      });

      // Initialize cart settings to false
      await setAppMetafield(admin, {
        key: 'cart_enabled',
        type: 'boolean',
        value: "false",
      });

      return {
        product,
        success: true,
      };
    }

    return { success: false, error: "Invalid action type" };
  } catch (error) {
    console.error('Action error:', error);
    return { 
      success: false, 
      error: error.message || "Failed to create product. Please try again." 
    };
  }
};

// Main Component - Simplified: No price dropdown
export default function HomeProductCreation() {
  const fetcher = useFetcher();
  const loaderData = useLoaderData();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  const [productExists, setProductExists] = useState(loaderData.exists);
  const [showGuide, setShowGuide] = useState(true);
  const [items, setItems] = useState(SETUP_ITEMS);

  // Update setup items based on actual state
  useEffect(() => {
    const updatedItems = SETUP_ITEMS.map(item => {
      if (item.id === 0) {
        return { 
          ...item, 
          complete: productExists,
          primaryButton: productExists ? undefined : {
            content: "Create Product",
            props: {
              onClick: () => {
                fetcher.submit(
                  { 
                    actionType: "create" 
                  }, 
                  { method: "POST" }
                );
              },
              disabled: fetcher.state === 'submitting'
            }
          }
        };
      }
      if (item.id === 1) {
        return { 
          ...item, 
          complete: loaderData.cartEnabled || false,
          primaryButton: productExists ? {
            content: "Configure",
            props: {
              onClick: () => navigate('/app/cart-settings'),
            }
          } : undefined,
          description: !productExists 
            ? "Please create the Tree Planting product first to configure cart settings."
            : "Enable the tree planting donation checkbox in the cart for your customers."
        };
      }
      if (item.id === 2) {
        return { 
          ...item,
          primaryButton: {
            content: "View Plans",
            props: {
              onClick: () => navigate('/app/pricing'),
            }
          }
        };
      }
      return item;
    });
    setItems(updatedItems);
  }, [productExists, loaderData.cartEnabled, fetcher.state, navigate]);

  const isLoading = ["loading", "submitting"].includes(fetcher.state) && fetcher.formMethod === "POST";
  const hasActionError = fetcher.data?.success === false;

  useEffect(() => {
    if (fetcher.data?.success) {
      if (fetcher.data.product) {
        setProductExists(true);
        shopify.toast.show("Support Tree Planting product created successfully!");
      }
    } else if (hasActionError) {
      shopify.toast.show(fetcher.data?.error || "An error occurred", { error: true });
    }
  }, [fetcher.data, hasActionError, shopify]);

  const handleCreate = () => {
    fetcher.submit(
      { 
        actionType: "create" 
      }, 
      { method: "POST" }
    );
  };

  const onStepComplete = async (id) => {
    try {
      // Simulate API call
      await new Promise((res) => setTimeout(() => res(), 1000));
      
      // Update the specific item's completion status
      setItems((prev) => prev.map((item) => 
        item.id === id ? { ...item, complete: !item.complete } : item
      ));
      
      // If it's the product creation step, mark it as complete if product exists
      if (id === 0 && productExists) {
        shopify.toast.show("Product setup complete!");
      }
    } catch (e) {
      console.error(e);
      shopify.toast.show("Failed to update step", { error: true });
    }
  };

  if (loaderData.hasError) {
    return (
      <s-page heading="Tree Planting Product Manager">
        <s-section>
          <s-banner status="critical">
            <s-paragraph>Error loading app data: {loaderData.errorMessage}</s-paragraph>
            <s-button
              variant="tertiary"
              onClick={() => window.location.reload()}
              style={{ marginTop: '8px' }}
            >
              Retry
            </s-button>
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Tree Planting Product Manager">
      {/* Primary action */}
      {!productExists && (
        <s-button 
          slot="primary-action" 
          onClick={handleCreate} 
          loading={isLoading}
          disabled={isLoading}
        >
          Create Product
        </s-button>
      )}

      <s-stack direction="block" gap="600">
        {/* Setup Guide */}
        {showGuide ? (
          <SetupGuide
            onDismiss={() => setShowGuide(false)}
            onStepComplete={onStepComplete}
            items={items}
          />
        ) : (
          <s-button onClick={() => setShowGuide(true)} variant="secondary">
            Show Setup Guide
          </s-button>
        )}

        {/* Product Creation Section */}
        <s-section heading="Tree Planting Product">
          <s-heading level="h3">Help your customers give back</s-heading>
          
          <s-paragraph>
            {productExists 
              ? "Your tree planting donation product is ready! Customers can now add donations to their cart."
              : "Create a special 'Support Tree Planting' product that allows customers to donate towards planting trees."
            }
          </s-paragraph>

          <s-stack direction="block" gap="base">
            {productExists ? (
              <>
                <s-banner status="success">
                  <s-stack direction="block" gap="small">
                    <s-paragraph>
                      <s-icon source="check" tone="success" /> Product is active!
                    </s-paragraph>
                    <s-paragraph tone="subdued" variant="bodySm">
                      {loaderData.donationAmount === "0.00" ? (
                        "Please set the donation price in Shopify by editing the product."
                      ) : (
                        `Current donation amount: $${parseFloat(loaderData.donationAmount || "0.00").toFixed(2)} per tree`
                      )}
                    </s-paragraph>
                    <s-stack direction="inline" gap="small">
                      <s-button
                        variant="primary"
                        onClick={() =>
                          shopify.intents.invoke?.("edit:shopify/Product", {
                            value: loaderData.shopifyProduct.id,
                          })
                        }
                      >
                        Edit Price in Shopify
                      </s-button>
                      <s-button
                        variant="tertiary"
                        onClick={() =>
                          shopify.intents.invoke?.("preview:shopify/Product", {
                            value: loaderData.shopifyProduct.id,
                          })
                        }
                      >
                        View Product
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-banner>

                {/* Product Details */}
                {loaderData.shopifyProduct && (
                  <s-box 
                    padding="base" 
                    borderWidth="base" 
                    borderRadius="base" 
                    background="subdued"
                  >
                    <s-stack direction="block" gap="small">
                      <s-text fontWeight="medium">Product Details:</s-text>
                      <s-stack direction="block" gap="extra-small">
                        <s-stack direction="inline" justifyContent="space-between">
                          <s-text tone="subdued">Title:</s-text>
                          <s-text>{loaderData.shopifyProduct.title}</s-text>
                        </s-stack>
                        <s-stack direction="inline" justifyContent="space-between">
                          <s-text tone="subdued">Status:</s-text>
                          <s-badge tone={loaderData.shopifyProduct.status === 'ACTIVE' ? 'success' : 'warning'}>
                            {loaderData.shopifyProduct.status}
                          </s-badge>
                        </s-stack>
                        <s-stack direction="inline" justifyContent="space-between">
                          <s-text tone="subdued">Current Price:</s-text>
                          <s-text>
                            ${parseFloat(loaderData.donationAmount || "0.00").toFixed(2)}
                            {loaderData.donationAmount === "0.00" && (
                              <s-text tone="critical" variant="bodySm"> (Please set price)</s-text>
                            )}
                          </s-text>
                        </s-stack>
                      </s-stack>
                    </s-stack>
                  </s-box>
                )}
              </>
            ) : (
              <s-banner status="info">
                <s-paragraph>
                  Click "Create Product" to add a "Support Tree Planting" product to your Shopify store.
                  You can then set the donation amount directly in Shopify.
                </s-paragraph>
              </s-banner>
            )}

            {hasActionError && (
              <s-banner status="critical">
                <s-paragraph>{fetcher.data?.error}</s-paragraph>
              </s-banner>
            )}

            {/* Next Steps */}
            {productExists && (
              <>
                <s-divider />
                <s-stack direction="block" gap="small">
                  <s-heading level="h4">Continue Setup</s-heading>
                  <s-stack direction="inline" gap="base">
                    <s-button
                      variant="primary"
                      onClick={() => navigate('/app/cart-settings')}
                    >
                      Configure Cart Settings
                    </s-button>
                    <s-button
                      variant="secondary"
                      onClick={() => navigate('/app/pricing')}
                    >
                      View Pricing Plans
                    </s-button>
                  </s-stack>
                </s-stack>
              </>
            )}
          </s-stack>
        </s-section>

        {/* Success Message for New Product */}
        {fetcher.data?.success && fetcher.data?.product && (
          <s-section heading="Product Created Successfully">
            <s-banner status="success">
              <s-stack direction="block" gap="small">
                <s-paragraph fontWeight="bold">
                  ✓ "Support Tree Planting" product has been created in your Shopify store.
                </s-paragraph>
                <s-paragraph>
                  Please set the donation amount by editing the product in Shopify.
                  The current price is set to $0.00.
                </s-paragraph>
              </s-stack>
            </s-banner>

            <s-stack direction="inline" gap="base" style={{ marginTop: '16px' }}>
              <s-button
                variant="primary"
                onClick={() =>
                  shopify.intents.invoke?.("edit:shopify/Product", {
                    value: fetcher.data.product.id,
                  })
                }
              >
                Set Price in Shopify
              </s-button>
              <s-button
                variant="secondary"
                onClick={() => navigate('/app/cart-settings')}
              >
                Configure Cart Settings
              </s-button>
            </s-stack>
          </s-section>
        )}
      </s-stack>
    </s-page>
  );
}