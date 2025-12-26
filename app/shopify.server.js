import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// In shopify.server.js - add these functions

const APP_METAFIELD_NAMESPACE = "tree_planting_donation";

export async function getAppMetafields(admin) {
  try {
    const response = await admin.graphql(`
      query {
        currentAppInstallation {
          metafields(first: 50, namespace: "${APP_METAFIELD_NAMESPACE}") {
            nodes {
              namespace
              key
              value
              type
            }
          }
        }
      }
    `);

    const data = await response.json();
    return data?.data?.currentAppInstallation?.metafields?.nodes || [];
  } catch (error) {
    console.error('Error fetching app metafields:', error);
    return [];
  }
}

export async function setAppMetafield(admin, { key, type, value }) {
  try {
    // Get app installation ID
    const getID = await admin.graphql(`
      query {
        currentAppInstallation {
          id
        }
      }
    `);

    const renderId = await getID.json();
    const ownerId = renderId.data.currentAppInstallation.id;

    const mutation = `
      mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafieldsSetInput) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      metafieldsSetInput: [
        {
          namespace: APP_METAFIELD_NAMESPACE,
          key,
          type,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          ownerId,
        },
      ],
    };

    const response = await admin.graphql(mutation, { variables });
    return await response.json();
  } catch (error) {
    console.error('Error setting app metafield:', error);
    return { errors: [error.message] };
  }
}

export async function deleteAppMetafield(admin, key) {
  try {
    const getID = await admin.graphql(`
      query {
        currentAppInstallation {
          id
        }
      }
    `);

    const renderId = await getID.json();
    const ownerId = renderId.data.currentAppInstallation.id;

    const mutation = `
      mutation metafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields {
            ownerId
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      metafields: [
        {
          key,
          namespace: APP_METAFIELD_NAMESPACE,
          ownerId,
        },
      ],
    };

    const response = await admin.graphql(mutation, { variables });
    return await response.json();
  } catch (error) {
    console.error('Error deleting app metafield:', error);
    return { errors: [error.message] };
  }
}

// Helper to parse metafields
export function parseMetafields(metafields) {
  const result = {};
  metafields.forEach(field => {
    try {
      result[field.key] = field.type === 'json' ? JSON.parse(field.value) : field.value;
    } catch {
      result[field.key] = field.value;
    }
  });
  return result;
}

// shopify.server.js - Add this function
export async function getShopDomain(admin) {
  try {
    const shopResponse = await admin.graphql(`
      #graphql
      query {
        shop {
          myshopifyDomain
        }
      }
    `);
    
    const shopData = await shopResponse.json();
    return shopData?.data?.shop?.myshopifyDomain || null;
  } catch (error) {
    console.error('Error fetching shop domain:', error);
    return null;
  }
}
// Helper to get specific metafield value

// shopify.server.js - Add these functions after the parseMetafields function

// Helper to update cart attributes
export async function updateCartAttributes(admin, session) {
  try {
    // Get app metafields
    const metafields = await getAppMetafields(admin);
    const parsedFields = parseMetafields(metafields);
    
    // Get donation product info
    const productId = parsedFields.product_id;
    const donationAmount = parsedFields.donation_amount || "5.00";
    const cartEnabled = parsedFields.cart_enabled === 'true' || parsedFields.cart_enabled === true;
    
    if (!productId || !cartEnabled) {
      return null;
    }
    
    // Get product variant
    const productResponse = await admin.graphql(
      `#graphql
      query GetProduct($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
      }`,
      { variables: { id: productId } }
    );
    
    const productJson = await productResponse.json();
    const variantId = productJson.data?.product?.variants?.edges[0]?.node?.id;
    
    // Return cart attributes configuration
    return {
      donation_enabled: cartEnabled.toString(),
      donation_amount: donationAmount,
      donation_product_id: productId,
      donation_variant_id: variantId
    };
  } catch (error) {
    console.error('Error getting cart attributes:', error);
    return null;
  }
}

// Function to sync cart attributes to app metafields for theme app extension
export async function syncCartAttributes(admin) {
  try {
    const metafields = await getAppMetafields(admin);
    const parsedFields = parseMetafields(metafields);
    
    // Get donation product info
    const productId = parsedFields.product_id;
    const donationAmount = parsedFields.donation_amount || "5.00";
    const cartEnabled = parsedFields.cart_enabled === 'true' || parsedFields.cart_enabled === true;
    
    if (!productId || !cartEnabled) {
      return { success: false, error: "Product not created or cart not enabled" };
    }
    
    // Get product variant
    const productResponse = await admin.graphql(
      `#graphql
      query GetProduct($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
      }`,
      { variables: { id: productId } }
    );
    
    const productJson = await productResponse.json();
    const variantId = productJson.data?.product?.variants?.edges[0]?.node?.id;
    
    if (!variantId) {
      return { success: false, error: "Product variant not found" };
    }
    
    // Store cart attributes in app metafields for theme app extension
    await setAppMetafield(admin, {
      key: 'cart_attributes',
      type: 'json',
      value: {
        donation_enabled: cartEnabled.toString(),
        donation_amount: donationAmount,
        donation_product_id: productId,
        donation_variant_id: variantId,
        last_updated: new Date().toISOString()
      }
    });
    
    return { 
      success: true, 
      cartAttributes: {
        donation_enabled: cartEnabled.toString(),
        donation_amount: donationAmount,
        donation_product_id: productId,
        donation_variant_id: variantId
      }
    };
  } catch (error) {
    console.error('Error syncing cart attributes:', error);
    return { success: false, error: error.message };
  }
}

// Create app proxy endpoint for theme app extension
export async function createAppProxyEndpoint(admin, session) {
  try {
    const { shop } = session;
    
    // Get app metafields
    const metafields = await getAppMetafields(admin);
    const parsedFields = parseMetafields(metafields);
    
    // Get donation settings
    const productId = parsedFields.product_id;
    const donationAmount = parsedFields.donation_amount || "5.00";
    const cartEnabled = parsedFields.cart_enabled === 'true' || parsedFields.cart_enabled === true;
    
    if (!productId || !cartEnabled) {
      return {
        enabled: false,
        message: "Tree planting donation is not configured. Please enable it in the app settings."
      };
    }
    
    // Get product variant
    const productResponse = await admin.graphql(
      `#graphql
      query GetProduct($id: ID!) {
        product(id: $id) {
          title
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
        }
      }`,
      { variables: { id: productId } }
    );
    
    const productJson = await productResponse.json();
    const variantId = productJson.data?.product?.variants?.edges[0]?.node?.id;
    
    return {
      enabled: true,
      shop: shop,
      donation_amount: donationAmount,
      product_id: productId,
      variant_id: variantId,
      product_title: productJson.data?.product?.title || "Support Tree Planting"
    };
  } catch (error) {
    console.error('Error creating app proxy endpoint:', error);
    return {
      enabled: false,
      error: error.message
    };
  }
}


export function getMetafieldValue(metafields, key) {
  const field = metafields.find(f => f.key === key);
  if (!field) return null;
  
  try {
    return field.type === 'json' ? JSON.parse(field.value) : field.value;
  } catch {
    return field.value;
  }
}

// shopify.server.js - Add this function
export async function syncCartAttributes(admin, session) {
  try {
    // Get app metafields
    const metafields = await getAppMetafields(admin);
    const parsedFields = parseMetafields(metafields);
    
    // Get donation product info
    const productId = parsedFields.product_id;
    const donationAmount = parsedFields.donation_amount || "5.00";
    const cartEnabled = parsedFields.cart_enabled === 'true' || parsedFields.cart_enabled === true;
    
    if (!productId) {
      return null;
    }
    
    // Get product variant
    const productResponse = await admin.graphql(
      `#graphql
      query GetProduct($id: ID!) {
        product(id: $id) {
          variants(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }`,
      { variables: { id: productId } }
    );
    
    const productJson = await productResponse.json();
    const variantId = productJson.data?.product?.variants?.edges[0]?.node?.id;
    
    // Return cart attributes configuration
    return {
      donation_enabled: cartEnabled.toString(),
      donation_amount: donationAmount,
      donation_product_id: productId,
      donation_variant_id: variantId
    };
  } catch (error) {
    console.error('Error syncing cart attributes:', error);
    return null;
  }
}
const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;