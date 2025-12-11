import { useState, useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

// Fixed price options
const PRICE_OPTIONS = [
  { value: "5.00", label: "$5.00" },
  { value: "10.00", label: "$10.00" },
  { value: "15.00", label: "$15.00" },
  { value: "20.00", label: "$20.00" },
  { value: "25.00", label: "$25.00" },
];

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    let shopifyProduct = null;
    let exists = false;

    const response = await admin.graphql(
      `#graphql
      query {
        products(first: 5, query: "title:'Support Tree Planting'") {
          edges {
            node {
              id
              title
              handle
              status
            }
          }
        }
      }`
    );
    const responseJson = await response.json();
    shopifyProduct = responseJson.data.products.edges[0]?.node || null;
    exists = !!shopifyProduct;

    return { shopifyProduct, exists, hasError: false };
  } catch (error) {
    return {
      shopifyProduct: null,
      exists: false,
      hasError: true,
      errorMessage: error.message,
    };
  }
};

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();
    const selectedPrice = formData.get("price");

    const productResponse = await admin.graphql(
      `#graphql
      mutation createTreePlantingProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product { id title handle status variants(first: 10) { edges { node { id price }}}}
        }
      }`,
      {
        variables: {
          product: { title: "Support Tree Planting" },
        },
      }
    );

    const productJson = await productResponse.json();
    const product = productJson.data.productCreate.product;
    const variantId = product.variants.edges[0].node.id;

    const variantResponse = await admin.graphql(
      `#graphql
        mutation updateVariantPrice($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            productVariants { id price }
          }
        }`,
      {
        variables: {
          productId: product.id,
          variants: [{ id: variantId, price: selectedPrice }],
        },
      }
    );

    const variantJson = await variantResponse.json();

    return {
      product,
      variant: variantJson.data.productVariantsBulkUpdate.productVariants,
      success: true,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default function HomeProductCreation() {
  const fetcher = useFetcher();
  const loaderData = useLoaderData();
  const shopify = useAppBridge();

  const [selectedPrice, setSelectedPrice] = useState(PRICE_OPTIONS[0].value);
  const [productExists, setProductExists] = useState(loaderData.exists);

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  const hasActionError = fetcher.data?.success === false;

  useEffect(() => {
    if (fetcher.data?.success) {
      setProductExists(true);
      shopify.toast.show("Support Tree Planting product created");
    } else if (hasActionError) {
      shopify.toast.show(fetcher.data.error, { error: true });
    }
  }, [fetcher.data, hasActionError, shopify]);

  const handleCreate = () => {
    fetcher.submit({ price: selectedPrice }, { method: "POST" });
  };

  if (loaderData.hasError) {
    return (
      <s-page heading="Tree Planting Product Manager">
        <s-section>
          <s-banner status="critical">
            <s-paragraph>{loaderData.errorMessage}</s-paragraph>
          </s-banner>
        </s-section>
      </s-page>
    );
  }

  return (
    <s-page heading="Tree Planting Product Manager">
      {/* Primary action */}
      {!productExists && (
        <s-button slot="primary-action" onClick={handleCreate} {...(isLoading ? { loading: true } : {})}>
          Create Product
        </s-button>
      )}

      <s-section heading="Create Support Tree Planting Product">
         <s-heading>Help your customers give back</s-heading>
        
        <s-paragraph>
          Create a special “Support Tree Planting” product that allows customers
          to donate towards planting trees.
        </s-paragraph>

        <s-stack direction="block" gap="base">
          {/* Price selector */}
          <label>
            <s-text>Select Donation Amount</s-text>
            <select
              value={selectedPrice}
              onChange={(e) => setSelectedPrice(e.target.value)}
              disabled={productExists}
              style={{ marginTop: "8px", padding: "8px", width: "200px" }}
            >
              {PRICE_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {productExists && (
            <s-banner status="info">
              <s-paragraph>
                This product already exists. Delete it in Shopify to recreate.
              </s-paragraph>
              <s-button
                variant="tertiary"
                onClick={() =>
                  shopify.intents.invoke?.("edit:shopify/Product", {
                    value: loaderData.shopifyProduct.id,
                  })
                }
              >
                View Product in Shopify
              </s-button>
            </s-banner>
          )}

          {hasActionError && (
            <s-banner status="critical">
              <s-paragraph>{fetcher.data?.error}</s-paragraph>
            </s-banner>
          )}
        </s-stack>
      </s-section>

      {fetcher.data?.success && (
        <s-section heading="Product Created">
          <s-banner status="success">
            <s-paragraph>Product successfully created in Shopify.</s-paragraph>
          </s-banner>

          <s-stack direction="inline" gap="base">
            <s-button
              variant="tertiary"
              onClick={() =>
                shopify.intents.invoke?.("edit:shopify/Product", {
                  value: fetcher.data.product.id,
                })
              }
            >
              Edit in Shopify
            </s-button>

            <s-button
              variant="tertiary"
              onClick={() =>
                shopify.intents.invoke?.("preview:shopify/Product", {
                  value: fetcher.data.product.id,
                })
              }
            >
              Preview Product
            </s-button>
          </s-stack>

          <s-divider />

          <s-box padding="base" borderWidth="base" borderRadius="base" background="subdued">
            <pre style={{ margin: 0 }}>
              <code>{JSON.stringify(fetcher.data.product, null, 2)}</code>
            </pre>
          </s-box>
        </s-section>
      )}

      <s-section slot="aside" heading="How it works">
        <s-unordered-list>
          <s-list-item>Creates “Support Tree Planting” product</s-list-item>
          <s-list-item>Sets fixed donation price</s-list-item>
          <s-list-item>Can only be recreated if deleted in Shopify</s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}
