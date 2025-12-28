import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";

// In shopify.server.js - add these functions

const APP_METAFIELD_NAMESPACE = "tree_planting";

// In shopify.server.js - update getAppMetafields to fetch from currentAppInstallation
export async function getAppMetafields(admin) {
  try {
    console.log('Fetching app metafields from currentAppInstallation...');
    
    const response = await admin.graphql(
      `#graphql
      query {
        currentAppInstallation {
          id
          metafields(first: 50) {
            edges {
              node {
                id
                namespace
                key
                value
                type
              }
            }
          }
        }
      }`
    );
    
    const json = await response.json();
    const metafields = json.data?.currentAppInstallation?.metafields?.edges || [];
    
    console.log(`Found ${metafields.length} app metafields`);
    
    return metafields;
  } catch (error) {
    console.error('Error fetching app metafields:', error);
    return [];
  }
}
// Update the setAppMetafield function
export async function setAppMetafield(
  admin,
  {
    namespace = 'tree_planting',
    key,
    type,
    value,
    ownerId, // optional override, otherwise use currentAppInstallation
  },
) {
  try {
    // 1. If no ownerId provided, get the current app installation ID
    if (!ownerId) {
      const ownerIdResponse = await admin.graphql(
        `#graphql
        query CurrentAppInstallationId {
          currentAppInstallation {
            id
          }
        }`,
      );

      const ownerIdJson = await ownerIdResponse.json();
      ownerId = ownerIdJson?.data?.currentAppInstallation?.id;

      if (!ownerId) {
        throw new Error('Unable to resolve current app installation ID');
      }
    }

    // 2. Prepare the value based on type - CRITICAL FIX HERE
    let preparedValue;
    
    if (type === 'boolean') {
      // For boolean type, we must pass a string "true" or "false"
      // Convert boolean to string explicitly
      if (typeof value === 'boolean') {
        preparedValue = value ? 'true' : 'false';
      } else if (typeof value === 'string') {
        // Handle string "true"/"false" or "True"/"False"
        const lowerValue = value.toLowerCase();
        preparedValue = lowerValue === 'true' ? 'true' : 'false';
      } else {
        // For any other type, default to false
        preparedValue = 'false';
      }
    } else if (typeof value === 'object') {
      preparedValue = JSON.stringify(value);
    } else {
      preparedValue = String(value);
    }

    console.log(`Setting metafield ${namespace}.${key} as ${type} with value: ${preparedValue} (input value: ${value}, type: ${typeof value})`);

    // 3. Call metafieldsSet with a single MetafieldsSetInput
    const response = await admin.graphql(
      `#graphql
      mutation SetMetafield($input: MetafieldsSetInput!) {
        metafieldsSet(metafields: [$input]) {
          metafields {
            id
            namespace
            key
            value
            type
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        variables: {
          input: {
            namespace,
            key,
            type, // e.g. "boolean", "single_line_text_field", "json", etc.
            value: preparedValue,
            ownerId,
          },
        },
      },
    );

    const responseJson = await response.json();
    const result = responseJson?.data?.metafieldsSet;

    if (!result) {
      console.error('Unexpected metafieldsSet response:', responseJson);
      throw new Error('No metafieldsSet payload returned from API');
    }

    if (result.userErrors?.length) {
      console.error('MetafieldsSet errors:', result.userErrors);
      throw new Error(result.userErrors[0].message);
    }

    // metafields is an array because metafieldsSet is bulk
    const createdMetafield = result.metafields?.[0] ?? null;
    console.log(`✅ Metafield ${namespace}.${key} set successfully:`, createdMetafield);
    return createdMetafield;
  } catch (error) {
    console.error('Error setting metafield:', error);
    throw error;
  }
}
// Add to shopify.server.js
export async function getThemeAppExtensionConfig(admin) {
  try {
    const metafields = await getAppMetafields(admin);
    const parsedFields = parseMetafields(metafields);
    
    // Get the theme extension config or build it
    const themeConfig = parsedFields.theme_extension_config || parsedFields.tree_planting || {};
    
    return {
      donation_enabled: themeConfig.donation_enabled === true || themeConfig.donation_enabled === 'true',
      donation_amount: themeConfig.donation_amount || "5.00",
      donation_product_id: themeConfig.donation_product_id || themeConfig.product_id,
      donation_variant_id: themeConfig.donation_variant_id,
    };
  } catch (error) {
    console.error('Error getting theme app extension config:', error);
    return {
      donation_enabled: false,
      donation_amount: "5.00",
      donation_product_id: null,
      donation_variant_id: null,
    };
  }
}

export async function updateThemeAppExtensionConfig(admin, config) {
  try {
    // Update both namespaces for compatibility
    await setAppMetafield(admin, {
      namespace: 'tree_planting',
      key: 'donation_enabled',
      type: 'boolean',
      value: config.donation_enabled,
    });
    
    await setAppMetafield(admin, {
      namespace: 'tree_planting',
      key: 'donation_amount',
      type: 'single_line_text_field',
      value: config.donation_amount,
    });
    
    await setAppMetafield(admin, {
      namespace: 'tree_planting',
      key: 'donation_product_id',
      type: 'single_line_text_field',
      value: config.donation_product_id,
    });
    
    await setAppMetafield(admin, {
      namespace: 'tree_planting',
      key: 'donation_variant_id',
      type: 'single_line_text_field',
      value: config.donation_variant_id,
    });
    
    // Also store as JSON for easy access
    await setAppMetafield(admin, {
      key: 'theme_extension_config',
      type: 'json',
      value: config,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating theme app extension config:', error);
    return { success: false, error: error.message };
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

// Update the parseMetafields function
// Update the parseMetafields function for proper boolean handling
export function parseMetafields(metafields) {
  try {
    console.log('Parsing metafields array:', metafields);
    
    const parsed = {};
    
    if (!Array.isArray(metafields)) {
      console.error('Metafields is not an array:', metafields);
      return parsed;
    }
    
    metafields.forEach(edge => {
      const node = edge.node || edge;
      if (node && node.key && node.value !== undefined && node.value !== null) {
        // Handle different types
        if (node.type === 'json' || node.value.startsWith('{') || node.value.startsWith('[')) {
          try {
            parsed[node.key] = JSON.parse(node.value);
          } catch (e) {
            parsed[node.key] = node.value;
          }
        } else if (node.type === 'boolean') {
          // Handle boolean type correctly - convert string to boolean
          // Shopify stores booleans as strings "true"/"false"
          parsed[node.key] = node.value === 'true' || node.value === true;
          console.log(`📊 Parsed boolean metafield ${node.key}: ${node.value} -> ${parsed[node.key]}`);
        } else if (node.type === 'number_integer' || node.type === 'number_decimal') {
          parsed[node.key] = Number(node.value);
        } else {
          parsed[node.key] = node.value;
        }
        
        // Also store namespaced keys
        if (node.namespace) {
          if (!parsed[node.namespace]) {
            parsed[node.namespace] = {};
          }
          parsed[node.namespace][node.key] = parsed[node.key];
        }
      }
    });
    
    console.log('✅ Parsed metafields:', parsed);
    return parsed;
  } catch (error) {
    console.error('Error parsing metafields:', error);
    return {};
  }
}
// Add this function to get all metafields
export async function getAllAppMetafields(admin) {
  try {
    const response = await admin.graphql(
      `#graphql
      query {
        currentAppInstallation {
          metafields(first: 100) {
            edges {
              node {
                id
                namespace
                key
                value
                type
              }
            }
          }
        }
      }`
    );
    
    const json = await response.json();
    const edges = json.data?.currentAppInstallation?.metafields?.edges || [];
    
    console.log(`Found ${edges.length} total metafields`);
    
    return edges.map(edge => edge.node);
  } catch (error) {
    console.error('Error fetching all metafields:', error);
    return [];
  }
}

// Update the deleteAppMetafield function
export async function deleteAppMetafield(admin, key, namespace = 'tree_planting') {
  try {
    // Get current app installation ID
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
            id
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
          key: key,
          namespace: namespace,
          ownerId: ownerId,
        },
      ],
    };

    const response = await admin.graphql(mutation, { variables });
    const result = await response.json();
    
    console.log(`Deleted metafield ${namespace}.${key}:`, result.data?.metafieldsDelete);
    
    return result;
  } catch (error) {
    console.error(`Error deleting metafield ${namespace}.${key}:`, error);
    return { errors: [error.message] };
  }
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