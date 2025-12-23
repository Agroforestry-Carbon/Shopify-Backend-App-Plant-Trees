// app/routes/app.stats.jsx
import React, { useState, useEffect } from 'react';
import { useLoaderData, Link, useNavigate } from 'react-router';
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticate, getAppMetafields, parseMetafields } from '../shopify.server';

// Client-only Sparkline component
const ClientSparkline = ({ data }) => {
  const [ChartComponent, setChartComponent] = useState(null);

  useEffect(() => {
    // Dynamically import on client side only
    import('@shopify/polaris-viz').then((module) => {
      setChartComponent(() => module.SparkLineChart);
    });
  }, []);

  if (!ChartComponent) {
    // Render a placeholder on server and during loading
    return (
      <div style={{ 
        height: '40px', 
        width: '100%', 
        marginTop: '8px',
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'loading 1.5s infinite',
        borderRadius: '4px'
      }} />
    );
  }

  return (
    <ChartComponent 
      data={[{ data: data.map((value, index) => ({ key: index, value })) }]}
      offsetLeft={0}
      offsetRight={0}
      theme="Light"
    />
  );
};

// Add CSS for loading animation
const loadingStyles = `
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

// Sparkline StatBox Component
const SparklineStatBox = ({ title, value, data = [], percentageChange, href = null }) => {
  const [isClient, setIsClient] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasData = data && data.length;
  const isPositive = percentageChange > 0;
  const isNegative = percentageChange < 0;

  const content = (
    <s-grid gap="small-300">
      <s-heading level="h4">{title}</s-heading>
      <s-stack direction="inline" gap="small-200" alignItems="center">
        <s-text as="p" variant="headingMd" fontWeight="bold">
          {value}
        </s-text>
        {percentageChange !== undefined && (
          <s-badge 
            tone={isPositive ? "success" : isNegative ? "critical" : "warning"}
            icon={isPositive ? "arrow-up" : isNegative ? "arrow-down" : undefined}
          >
            {isPositive ? '+' : ''}{percentageChange}%
          </s-badge>
        )}
      </s-stack>
      {hasData && isClient && (
        <div style={{ height: '40px', width: '100%', marginTop: '8px' }}>
          <ClientSparkline data={data} />
        </div>
      )}
    </s-grid>
  );

  if (href) {
    return (
      <s-clickable
        onClick={() => navigate(href)}
        paddingBlock="small-400"
        paddingInline="small-100"
        borderRadius="base"
        background="surface"
        hoverable
        style={{ cursor: 'pointer' }}
      >
        {content}
      </s-clickable>
    );
  }

  return (
    <s-box
      paddingBlock="small-400"
      paddingInline="small-100"
      borderRadius="base"
      background="surface"
    >
      {content}
    </s-box>
  );
};

// Metrics Grid Component
const MetricsGrid = ({ metrics }) => {
  return (
    <s-section padding="base">
      <s-grid
        gridTemplateColumns="1fr auto 1fr auto 1fr"
        gap="small"
      >
        {metrics.map((metric, index) => (
          <React.Fragment key={metric.id}>
            <SparklineStatBox
              title={metric.title}
              value={metric.value}
              data={metric.data}
              percentageChange={metric.percentageChange}
              href={metric.href}
            />
            {index < metrics.length - 1 && <s-divider direction="block" />}
          </React.Fragment>
        ))}
      </s-grid>
    </s-section>
  );
};

// Dashboard Card Component
const DashboardCard = ({ title, children, action = null }) => (
  <s-card>
    <s-stack direction="block" gap="400">
      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
        <s-heading level="h3">{title}</s-heading>
        {action && (
          <s-button variant="tertiary" size="small" onClick={action.onClick}>
            {action.content}
          </s-button>
        )}
      </s-stack>
      {children}
    </s-stack>
  </s-card>
);

// Helper function to calculate metrics from orders
const calculateMetrics = (orders) => {
  const totalAmount = orders.reduce((sum, order) => sum + parseFloat(order.amount || 0), 0);
  const treesPlanted = totalAmount / 30; // $30 per tree
  
  return {
    orders: orders.length,
    contributed: totalAmount,
    trees: {
      integer: Math.floor(treesPlanted),
      decimal: parseFloat(treesPlanted.toFixed(2))
    },
    averageDonation: orders.length > 0 ? totalAmount / orders.length : 0
  };
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
    const statistics = parsedFields.statistics || {};
    
    // Calculate current month (if not stored)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter orders for current and previous month
    const currentMonthOrders = ordersData.filter(order => {
      try {
        const orderDate = new Date(order.createdAt || order.date);
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      } catch {
        return false;
      }
    });
    
    const previousMonthOrders = ordersData.filter(order => {
      try {
        const orderDate = new Date(order.createdAt || order.date);
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return orderDate.getMonth() === prevMonth && orderDate.getFullYear() === prevYear;
      } catch {
        return false;
      }
    });
    
    // Calculate metrics
    const currentMonthMetrics = calculateMetrics(currentMonthOrders);
    const previousMonthMetrics = calculateMetrics(previousMonthOrders);
    const allTimeMetrics = calculateMetrics(ordersData);
    
    // Get recent orders (last 5)
    const recentOrders = ordersData
      .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
      .slice(0, 5)
      .map(order => ({
        ...order,
        date: formatRelativeTime(new Date(order.createdAt || order.date))
      }));
    
    // Calculate conversion rate (orders with donation / total orders - would need webhook data)
    const conversionRate = ordersData.length > 0 ? 
      Math.min(100, (ordersData.length / 100) * 100) : 0; // Simplified
    
    // Calculate growth rate
    const growthRate = previousMonthMetrics.orders > 0 ?
      Math.round(((currentMonthMetrics.orders - previousMonthMetrics.orders) / previousMonthMetrics.orders) * 100) : 100;
    
    return {
      currentMonth: {
        ...currentMonthMetrics,
        conversionRate: conversionRate,
        growthRate: growthRate
      },
      previousMonth: previousMonthMetrics,
      allTime: {
        ...allTimeMetrics,
        customers: new Set(ordersData.map(order => order.customerEmail || order.customer)).size,
        averageDonation: allTimeMetrics.averageDonation
      },
      weeklyTrends: statistics.weeklyTrends || generateWeeklyTrends(ordersData),
      recentOrders: recentOrders.length > 0 ? recentOrders : getSampleRecentOrders()
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Return sample data for development
    return getSampleData();
  }
};

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

// Helper function to generate weekly trends from orders
function generateWeeklyTrends(orders) {
  // Generate last 7 days of data
  const trends = {
    orders: Array(7).fill(0),
    contributed: Array(7).fill(0),
    trees: Array(7).fill(0),
    conversion: Array(7).fill(0),
    currentMonth: Array(7).fill(0),
    previousMonth: Array(7).fill(0),
    allTime: Array(7).fill(0)
  };
  
  // Populate with actual order data
  orders.forEach(order => {
    const orderDate = new Date(order.createdAt || order.date);
    const daysAgo = Math.floor((new Date() - orderDate) / (1000 * 60 * 60 * 24));
    
    if (daysAgo >= 0 && daysAgo < 7) {
      const index = 6 - daysAgo; // Reverse order: most recent on the right
      trends.orders[index] += 1;
      trends.contributed[index] += parseFloat(order.amount || 0);
      trends.trees[index] += parseFloat(order.amount || 0) / 30;
    }
  });
  
  // Fill in conversion and other arrays
  for (let i = 0; i < 7; i++) {
    trends.conversion[i] = trends.orders[i] > 0 ? Math.min(100, trends.orders[i] * 5) : 0;
    trends.currentMonth[i] = trends.contributed[i];
    trends.previousMonth[i] = Math.max(0, trends.contributed[i] * 0.8);
    trends.allTime[i] = trends.contributed.slice(0, i + 1).reduce((a, b) => a + b, 0);
  }
  
  return trends;
}

// Sample data functions
function getSampleRecentOrders() {
  return [
    { 
      id: '1', 
      customer: 'john@example.com', 
      customerEmail: 'john@example.com',
      product: 'Cotton T-Shirt',
      amount: 25.00, 
      trees: 0.83, 
      date: '2 hours ago',
      status: 'Completed',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    { 
      id: '2', 
      customer: 'jane@example.com',
      customerEmail: 'jane@example.com',
      product: 'Organic Coffee',
      amount: 10.00, 
      trees: 0.33, 
      date: '4 hours ago',
      status: 'Completed',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    { 
      id: '3', 
      customer: 'bob@example.com',
      customerEmail: 'bob@example.com',
      product: 'Handmade Soap',
      amount: 5.00, 
      trees: 0.17, 
      date: '1 day ago',
      status: 'Completed',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    { 
      id: '4', 
      customer: 'alice@example.com',
      customerEmail: 'alice@example.com',
      product: 'Ceramic Mug',
      amount: 15.00, 
      trees: 0.50, 
      date: '2 days ago',
      status: 'Completed',
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    },
    { 
      id: '5', 
      customer: 'charlie@example.com',
      customerEmail: 'charlie@example.com',
      product: 'Canvas Tote Bag',
      amount: 20.00, 
      trees: 0.67, 
      date: '3 days ago',
      status: 'Completed',
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    }
  ];
}

function getSampleData() {
  const recentOrders = getSampleRecentOrders();
  const weeklyTrends = generateWeeklyTrends(recentOrders);
  const allOrders = [...recentOrders];
  
  const currentMonthMetrics = calculateMetrics(allOrders.filter(o => 
    new Date(o.createdAt).getMonth() === new Date().getMonth()
  ));
  
  const previousMonthMetrics = calculateMetrics(allOrders.filter(o => {
    const date = new Date(o.createdAt);
    const prevMonth = new Date().getMonth() === 0 ? 11 : new Date().getMonth() - 1;
    return date.getMonth() === prevMonth;
  }));
  
  const allTimeMetrics = calculateMetrics(allOrders);
  
  return {
    currentMonth: {
      ...currentMonthMetrics,
      conversionRate: 8.4,
      growthRate: 20
    },
    previousMonth: previousMonthMetrics,
    allTime: {
      ...allTimeMetrics,
      customers: 187,
      averageDonation: 5.00
    },
    weeklyTrends: weeklyTrends,
    recentOrders: recentOrders
  };
}

// Main Dashboard Component
export default function DashboardPage() {
  const data = useLoaderData();
  const shopify = useAppBridge();
  const navigate = useNavigate();

  // Calculate percentage changes
  const currentMonthPercentage = data.previousMonth.orders > 0 
    ? Math.round(((data.currentMonth.orders - data.previousMonth.orders) / data.previousMonth.orders) * 100)
    : (data.currentMonth.orders > 0 ? 100 : 0);

  const allTimePercentage = data.previousMonth.orders > 0
    ? Math.round(((data.allTime.orders - data.previousMonth.orders) / data.previousMonth.orders) * 100)
    : (data.allTime.orders > 0 ? 100 : 0);

  // Handle export data function
  const handleExportData = () => {
    shopify.toast.show('Exporting dashboard data...');
    // TODO: Implement actual export functionality
    console.log('Exporting dashboard data...');
  };

  // Handle refresh data function
  const handleRefreshData = () => {
    shopify.toast.show('Refreshing dashboard data...');
    // Trigger a refetch by navigating to the same page
    navigate('.', { replace: true });
  };

  // Handle view reports function
  const handleViewReports = () => {
    shopify.toast.show('Opening detailed reports...');
    // Navigate to orders page
    navigate('/app/orders');
  };

  // Main metrics for the top grid
  const mainMetrics = [
    {
      id: 'orders',
      title: 'Orders with Donation',
      value: data.currentMonth.orders,
      data: data.weeklyTrends.orders,
      percentageChange: Math.min(100, Math.max(-100, currentMonthPercentage)),
      href: '/app/orders'
    },
    {
      id: 'contributed',
      title: 'Total Contributed',
      value: `$${data.currentMonth.contributed.toFixed(2)}`,
      data: data.weeklyTrends.contributed,
      percentageChange: 15
    },
    {
      id: 'trees',
      title: 'Trees Planted',
      value: data.currentMonth.trees.integer,
      data: data.weeklyTrends.trees,
      percentageChange: 25
    }
  ];

  // Time period metrics
  const timePeriodMetrics = [
    {
      id: 'current-month',
      title: 'Current Month',
      value: `$${data.currentMonth.contributed.toFixed(2)}`,
      data: data.weeklyTrends.currentMonth,
      percentageChange: currentMonthPercentage,
      href: '/app/orders?period=current-month'
    },
    {
      id: 'previous-month',
      title: 'Previous Month',
      value: `$${data.previousMonth.contributed.toFixed(2)}`,
      data: data.weeklyTrends.previousMonth,
      percentageChange: -5,
      href: '/app/orders?period=previous-month'
    },
    {
      id: 'all-time',
      title: 'All Time',
      value: `$${data.allTime.contributed.toFixed(2)}`,
      data: data.weeklyTrends.allTime,
      percentageChange: allTimePercentage,
      href: '/app/orders?period=all-time'
    }
  ];

  // Conversion metrics
  const conversionMetrics = [
    {
      id: 'conversion',
      title: 'Conversion Rate',
      value: `${data.currentMonth.conversionRate.toFixed(1)}%`,
      data: data.weeklyTrends.conversion,
      percentageChange: 12
    },
    {
      id: 'growth',
      title: 'Month-over-Month Growth',
      value: `${data.currentMonth.growthRate}%`,
      data: [10, 12, 15, 18, 20, 22, 20],
      percentageChange: data.currentMonth.growthRate
    },
    {
      id: 'average',
      title: 'Average Donation',
      value: `$${data.allTime.averageDonation.toFixed(2)}`,
      data: [4.5, 4.8, 5.0, 5.2, 5.1, 5.0, 5.0],
      percentageChange: 0
    }
  ];

  return (
    <s-page 
      heading="Tree Planting Dashboard" 
      inlineSize="large"
      fullWidth
    >
      {/* Add loading animation styles */}
      <style>{loadingStyles}</style>
      
      {/* Secondary Actions */}
      <s-button 
        slot="secondary-actions" 
        variant="secondary"
        onClick={handleRefreshData}
        icon="refresh"
      >
        Refresh
      </s-button>
      <s-button 
        slot="secondary-actions" 
        variant="secondary"
        onClick={handleViewReports}
        icon="analytics"
      >
        View Reports
      </s-button>
      
      {/* Primary Action */}
      <s-button 
        slot="primary-action" 
        variant="primary"
        onClick={handleExportData}
        icon="download"
      >
        Export Data
      </s-button>

      <s-stack direction="block" gap="600">
        {/* Main Metrics Grid */}
        <MetricsGrid metrics={mainMetrics} />
        <br />

        {/* Time Period Metrics Grid */}
        <MetricsGrid metrics={timePeriodMetrics} />
        <br />

        {/* Conversion Metrics Grid */}
        <MetricsGrid metrics={conversionMetrics} />
        <br />

        {/* Recent Orders */}
        <DashboardCard 
          title="Recent Orders with Donations"
          action={{ 
            content: 'View All Orders', 
            onClick: () => navigate('/app/orders') 
          }}
        >
          <s-section padding="none">
            <s-table>
              <s-table-header-row>
                <s-table-header listSlot="primary">Customer / Product</s-table-header>
                <s-table-header listSlot="labeled">Donation Amount</s-table-header>
                <s-table-header listSlot="labeled">Trees Planted</s-table-header>
                <s-table-header listSlot="inline">Date</s-table-header>
                <s-table-header listSlot="inline">Status</s-table-header>
              </s-table-header-row>
              <s-table-body>
                {data.recentOrders.map((order) => (
                  <s-table-row key={order.id}>
                    <s-table-cell>
                      <s-stack direction="block" gap="none">
                        <s-text fontWeight="medium">{order.customer}</s-text>
                        <s-text tone="subdued" variant="bodySm">{order.product}</s-text>
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text fontWeight="bold">${order.amount.toFixed(2)}</s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone="success">{order.trees.toFixed(2)} trees</s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text tone="subdued">{order.date}</s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone="success">{order.status}</s-badge>
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </s-table>
          </s-section>
        </DashboardCard>
      </s-stack>
    </s-page>
  );
}