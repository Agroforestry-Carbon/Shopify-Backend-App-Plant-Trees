// app/routes/app.orders.jsx
import React, { useState } from 'react';
import { useLoaderData } from 'react-router';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticate, getAppMetafields, parseMetafields } from '../shopify.server';

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Helper function to format time ago
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
};

// Loader function
export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    
    // Get app metafields
    const metafields = await getAppMetafields(admin);
    const parsedFields = parseMetafields(metafields);
    
    // Get orders data from metafields
    const ordersData = parsedFields.orders_data || [];
    
    // Transform orders data for display
    const orders = ordersData.map(order => ({
      id: order.id || order.orderId,
      orderNumber: `#${order.orderNumber || order.id?.slice(-6) || 'N/A'}`,
      date: order.createdAt || order.date,
      formattedDate: formatDate(order.createdAt || order.date),
      timeAgo: formatTimeAgo(order.createdAt || order.date),
      customer: order.customerName || order.customer || 'Customer',
      customerEmail: order.customerEmail || order.customer || '',
      amount: parseFloat(order.amount || 0),
      trees: parseFloat(order.trees || (order.amount / 30) || 0),
      status: order.status || 'paid',
      product: order.productName || 'Donation'
    })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by latest first
    
    // Calculate summary stats
    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalTrees = orders.reduce((sum, order) => sum + order.trees, 0);
    
    return {
      orders,
      stats: {
        totalOrders,
        totalAmount: totalAmount.toFixed(2),
        totalTrees: totalTrees.toFixed(2),
        averageDonation: totalOrders > 0 ? (totalAmount / totalOrders).toFixed(2) : '0.00'
      },
      hasError: false
    };
    
  } catch (error) {
    console.error('Error loading orders:', error);
    
    // Return sample data for development
    const sampleOrders = [
      {
        id: '1',
        orderNumber: '#1001',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        formattedDate: formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
        timeAgo: '2d ago',
        customer: 'John Doe',
        customerEmail: 'john@example.com',
        amount: 25.00,
        trees: 0.83,
        status: 'paid',
        product: 'Cotton T-Shirt'
      },
      {
        id: '2',
        orderNumber: '#1002',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        formattedDate: formatDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
        timeAgo: '1d ago',
        customer: 'Jane Smith',
        customerEmail: 'jane@example.com',
        amount: 15.00,
        trees: 0.50,
        status: 'paid',
        product: 'Organic Coffee'
      },
      {
        id: '3',
        orderNumber: '#1003',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        formattedDate: formatDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        timeAgo: '3d ago',
        customer: 'Bob Johnson',
        customerEmail: 'bob@example.com',
        amount: 10.00,
        trees: 0.33,
        status: 'refunded',
        product: 'Handmade Soap'
      },
      {
        id: '4',
        orderNumber: '#1004',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        formattedDate: formatDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        timeAgo: '5d ago',
        customer: 'Alice Brown',
        customerEmail: 'alice@example.com',
        amount: 30.00,
        trees: 1.00,
        status: 'paid',
        product: 'Ceramic Mug'
      },
      {
        id: '5',
        orderNumber: '#1005',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        formattedDate: formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        timeAgo: '1w ago',
        customer: 'Charlie Wilson',
        customerEmail: 'charlie@example.com',
        amount: 20.00,
        trees: 0.67,
        status: 'pending',
        product: 'Canvas Tote Bag'
      }
    ];
    
    const totalAmount = sampleOrders.reduce((sum, order) => sum + order.amount, 0);
    const totalTrees = sampleOrders.reduce((sum, order) => sum + order.trees, 0);
    
    return {
      orders: sampleOrders,
      stats: {
        totalOrders: sampleOrders.length,
        totalAmount: totalAmount.toFixed(2),
        totalTrees: totalTrees.toFixed(2),
        averageDonation: (totalAmount / sampleOrders.length).toFixed(2)
      },
      hasError: false
    };
  }
};

// Order Status Badge Component
const OrderStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      paid: { tone: 'success', icon: 'check', label: 'Paid' },
      pending: { tone: 'warning', icon: 'clock', label: 'Pending' },
      refunded: { tone: 'critical', icon: 'refresh', label: 'Refunded' },
      cancelled: { tone: 'subdued', icon: 'cancel', label: 'Cancelled' },
      completed: { tone: 'success', icon: 'check', label: 'Completed' },
      failed: { tone: 'critical', icon: 'cancel', label: 'Failed' }
    };
    
    return configs[status.toLowerCase()] || { tone: 'subdued', icon: 'help', label: status };
  };
  
  const config = getStatusConfig(status);
  
  return (
    <s-badge tone={config.tone} icon={config.icon}>
      {config.label}
    </s-badge>
  );
};

// Main Component
export default function OrdersPage() {
  const { orders, stats, hasError } = useLoaderData();
  const shopify = useAppBridge();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle export CSV
  const handleExportCSV = () => {
    shopify.toast.show('Preparing CSV export...');
    // TODO: Implement CSV export
    console.log('Exporting orders to CSV');
  };
  
  // Handle view order in Shopify
  const handleViewOrder = (orderId) => {
    shopify.intents.invoke?.("edit:shopify/Order", {
      value: orderId,
    });
  };
  
  if (hasError) {
    return (
      <s-page heading="Tree Planting Orders">
        <s-section>
          <s-banner status="critical">
            <s-paragraph>Error loading orders. Please try again.</s-paragraph>
          </s-banner>
        </s-section>
      </s-page>
    );
  }
  
  return (
    <s-page heading="Tree Planting Orders">
      {/* Primary Action */}
      <s-button 
        slot="primary-action" 
        variant="primary" 
        onClick={handleExportCSV}
        icon="download"
      >
        Export CSV
      </s-button>
      
    
    
         
            <s-heading level="h1">Donation Orders</s-heading>
            
      
      <br></br>
      {/* Stats Grid - Updated with proper grid system */}
      <s-section padding="none">
        <s-box padding="base">
          <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base">
            {/* Total Orders */}
            <s-grid-item gridColumn="span 3">
              <s-box padding="base" background="surface" borderRadius="base">
                <s-stack direction="block" gap="small">
                  <s-text tone="subdued" type="strong" variant="bodySm">Total Orders</s-text>
                  <s-text variant="headingLg" fontWeight="bold">{stats.totalOrders}</s-text>
                </s-stack>
              </s-box>
            </s-grid-item>
            
            {/* Total Contributed */}
            <s-grid-item gridColumn="span 3">
              <s-box padding="base" background="surface" borderRadius="base">
                <s-stack direction="block" gap="small">
                  <s-text tone="subdued" type="strong" variant="bodySm">Total Contributed</s-text>
                  <s-text variant="headingLg" fontWeight="bold">${stats.totalAmount}</s-text>
                </s-stack>
              </s-box>
            </s-grid-item>
            
            {/* Trees Planted */}
            <s-grid-item gridColumn="span 3">
              <s-box padding="base" background="surface" borderRadius="base">
                <s-stack direction="block" gap="small">
                  <s-text tone="subdued" type="strong" variant="bodySm">Trees Planted</s-text>
                  <s-text variant="headingLg" fontWeight="bold">{stats.totalTrees}</s-text>
                </s-stack>
              </s-box>
            </s-grid-item>
            
            {/* Average Donation */}
            <s-grid-item gridColumn="span 3">
              <s-box padding="base" background="surface" borderRadius="base">
                <s-stack direction="block" gap="small">
                  <s-text tone="subdued" type="strong" variant="bodySm">Avg Donation</s-text>
                  <s-text variant="headingLg" fontWeight="bold">${stats.averageDonation}</s-text>
                </s-stack>
              </s-box>
            </s-grid-item>
          </s-grid>
        </s-box>
      </s-section>
   
      
      {/* Orders Table Section */}
      <s-section padding="none">
        <s-box padding="base">
          <s-stack direction="block" gap="400">
             <s-stack direction="inline" gap="large-100">
                  {/* Status Filter */}
                
                  
                  {/* Search */}
                  <s-text-field
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    clearButton
                    onClearButtonClick={() => setSearchTerm('')}
                  />
                </s-stack>
                <br></br>
            {/* Filters Grid */}
            <s-grid gridTemplateColumns="repeat(12, 1fr)" gap="base" alignItems="end">
              {/* Title */}
              <s-grid-item gridColumn="span 6">
                <s-heading level="h3">Recent Orders</s-heading>
              </s-grid-item>
              
              {/* Filters */}
              <s-grid-item gridColumn="span 6">
               
              </s-grid-item>
            </s-grid>
            
            {/* Orders Table - Full width */}
          
              <s-section >
                <s-table>
                  <s-table-header-row>
                    <s-table-header listSlot="primary">Order Details</s-table-header>
                    <s-table-header listSlot="inline">Customer</s-table-header>
                    <s-table-header listSlot="inline">Donation</s-table-header>
                    <s-table-header listSlot="inline">Trees</s-table-header>
                    <s-table-header listSlot="secondary" format="numeric">Status</s-table-header>
                    <s-table-header listSlot="inline">Actions</s-table-header>
                  </s-table-header-row>
                  
                  <s-table-body>
                    {filteredOrders.map((order) => (
                      <s-table-row key={order.id}>
                        {/* Order Details */}
                        <s-table-cell>
                          <s-stack direction="block" gap="50">
                            <s-text fontWeight="medium">{order.orderNumber}</s-text>
                            <s-text tone="subdued" variant="bodySm">
                              {order.formattedDate} • {order.timeAgo}
                            </s-text>
                            <s-text tone="subdued" variant="bodySm">
                              {order.product}
                            </s-text>
                          </s-stack>
                        </s-table-cell>
                        
                        {/* Customer */}
                        <s-table-cell>
                          <s-stack direction="block" gap="50">
                            <s-text>{order.customer}</s-text>
                            <s-text tone="subdued" variant="bodySm">
                              {order.customerEmail}
                            </s-text>
                          </s-stack>
                        </s-table-cell>
                        
                        {/* Donation Amount */}
                        <s-table-cell>
                          <s-text fontWeight="bold" variant="headingSm">
                            ${order.amount.toFixed(2)}
                          </s-text>
                        </s-table-cell>
                        
                        {/* Trees Planted */}
                        <s-table-cell>
                          <s-badge tone="success">
                            {order.trees.toFixed(2)} trees
                          </s-badge>
                        </s-table-cell>
                        
                        {/* Status */}
                        <s-table-cell>
                          <OrderStatusBadge status={order.status} />
                        </s-table-cell>
                        
                        {/* Actions */}
                        <s-table-cell>
                          <s-stack direction="inline" gap="100">
                            <s-button
                              variant="tertiary"
                              size="small"
                              onClick={() => handleViewOrder(order.id)}
                              icon="external"
                            >
                              View
                            </s-button>
                          </s-stack>
                        </s-table-cell>
                      </s-table-row>
                    ))}
                  </s-table-body>
                </s-table>
                
                {/* Empty State - Full width */}
                <s-grid-item gridColumn="span 12">
                  {filteredOrders.length === 0 && (
                    <s-box padding="800" textAlign="center">
                      <s-stack direction="block" gap="200" alignItems="center">
                        <s-icon source="receipt" tone="subdued" size="large" />
                        <s-text tone="subdued" variant="bodyLg">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'No orders match your filters'
                            : 'No donation orders yet'
                          }
                        </s-text>
                        {(searchTerm || statusFilter !== 'all') && (
                          <s-button
                            variant="tertiary"
                            onClick={() => {
                              setSearchTerm('');
                              setStatusFilter('all');
                            }}
                          >
                            Clear filters
                          </s-button>
                        )}
                      </s-stack>
                    </s-box>
                  )}
                </s-grid-item>
              </s-section>
          
          </s-stack>
        </s-box>
      </s-section>
      
    
     
    </s-page>
  );
}