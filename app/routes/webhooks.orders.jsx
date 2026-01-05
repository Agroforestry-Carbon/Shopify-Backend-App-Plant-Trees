// app/routes/webhooks.orders.jsx - UPDATED VERSION
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  try {
    // Authenticate the webhook
    const { admin } = await authenticate.webhook(request);
    
    // Get the order data from the webhook
    const order = await request.json();
    
    console.log('Order webhook received:', {
      orderId: order.id,
      orderName: order.name,
      lineItems: order.line_items?.length || 0,
      createdAt: order.created_at
    });
    
    // Dynamically import server functions
    const serverModule = await import("../shopify.server");
    const getAppMetafields = serverModule.getAppMetafields;
    const parseMetafields = serverModule.parseMetafields;
    const incrementUsage = serverModule.incrementUsage;
    const isUsageLimitReached = serverModule.isUsageLimitReached;
    const setAppMetafield = serverModule.setAppMetafield;
    
    // Get app metafields to find donation product
    const metafields = await getAppMetafields(admin);
    const parsedFields = parseMetafields(metafields);
    
    // Get donation product and variant IDs from tree_planting namespace
    const donationProductId = parsedFields.tree_planting?.donation_product_id || 
                             parsedFields.tree_planting?.product_id;
    const donationVariantId = parsedFields.tree_planting?.donation_variant_id;
    
    if (!donationProductId || !donationVariantId) {
      console.log('No donation product configured, skipping usage tracking');
      return new Response(null, { status: 200 });
    }
    
    // Extract numeric IDs for comparison
    const extractNumericId = (gid) => {
      if (!gid) return null;
      if (gid.toString().includes('gid://')) {
        return gid.split('/').pop();
      }
      return gid;
    };
    
    const numericProductId = extractNumericId(donationProductId);
    const numericVariantId = extractNumericId(donationVariantId);
    
    // Check if order contains the donation product
    let donationQuantity = 0;
    let donationFound = false;
    
    if (order.line_items && Array.isArray(order.line_items)) {
      for (const item of order.line_items) {
        // Check by variant ID
        if (item.variant_id == numericVariantId) {
          donationQuantity += item.quantity || 1;
          donationFound = true;
          console.log(`Found donation by variant ID: ${item.quantity} items`);
          break;
        }
        
        // Check by product ID
        if (item.product_id == numericProductId) {
          donationQuantity += item.quantity || 1;
          donationFound = true;
          console.log(`Found donation by product ID: ${item.quantity} items`);
          break;
        }
        
        // Check properties (for older donations)
        if (item.properties && Array.isArray(item.properties)) {
          const hasDonationProperty = item.properties.some(prop => 
            prop.name === '_tree_donation' && prop.value === 'true'
          );
          
          if (hasDonationProperty) {
            donationQuantity += item.quantity || 1;
            donationFound = true;
            console.log(`Found donation by property: ${item.quantity} items`);
            break;
          }
        }
      }
    }
    
    // If no donation found, return
    if (!donationFound) {
      console.log('No donation items found in order');
      return new Response(null, { status: 200 });
    }
    
    // Check if usage limit is reached for free plan
    const limitReached = await isUsageLimitReached(admin);
    if (limitReached) {
      console.log('Usage limit reached, not incrementing');
      // Log this for monitoring
      await setAppMetafield(admin, {
        namespace: 'tree_planting',
        key: `limit_exceeded_${new Date().toISOString().split('T')[0]}`,
        type: 'json',
        value: JSON.stringify({
          orderId: order.id,
          orderName: order.name,
          attemptedDonations: donationQuantity,
          timestamp: new Date().toISOString()
        }),
      });
    } else {
      // Increment usage count
      const newUsage = await incrementUsage(admin, donationQuantity);
      console.log(`Usage updated: ${newUsage} total donations`);
      
      // Store order reference for tracking
      const orderKey = `order_${order.id.replace('gid://shopify/Order/', '')}`;
      await setAppMetafield(admin, {
        namespace: 'tree_planting',
        key: orderKey,
        type: 'json',
        value: JSON.stringify({
          orderId: order.id,
          orderName: order.name,
          donationQuantity,
          trackedAt: new Date().toISOString(),
          amount: order.total_price ? (parseFloat(order.total_price) / 100).toFixed(2) : '0.00'
        }),
      });
    }
    
    return new Response(null, { status: 200 });
    
  } catch (error) {
    console.error('Error processing order webhook:', error);
    return new Response(null, { status: 500 });
  }
}