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
