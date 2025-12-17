// app/routes/app.dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useLoaderData, Link } from 'react-router';
import { useAppBridge } from '@shopify/app-bridge-react';

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
        href={href}
        paddingBlock="small-400"
        paddingInline="small-100"
        borderRadius="base"
        background="surface"
        hoverable
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
        gridTemplateColumns="@container (inline-size <= 400px) 1fr, 1fr auto 1fr auto 1fr"
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
          <s-button variant="tertiary" size="small" {...action.props}>
            {action.content}
          </s-button>
        )}
      </s-stack>
      {children}
    </s-stack>
  </s-card>
);

// Loader
export const loader = async ({ request }) => {
  // TODO: Fetch dashboard data from your backend
  return {
    // Current week time series data (last 7 days)
    weeklyTrends: {
      orders: [13, 20, 18, 5, 8, 15, 23],
      contributed: [50, 60, 55, 40, 45, 70, 65],
      trees: [1, 2, 1, 1, 2, 3, 2],
      conversion: [5.2, 6.1, 5.8, 4.5, 5.0, 6.5, 7.2],
      currentMonth: [50, 60, 55, 40, 45, 70, 65],
      previousMonth: [40, 45, 50, 35, 40, 55, 50],
      allTime: [150, 160, 155, 140, 145, 170, 165]
    },
    // Current month totals
    currentMonth: {
      orders: 42,
      contributed: 210.50,
      trees: 7,
      conversionRate: 8.4,
      growthRate: 20
    },
    // Previous month totals
    previousMonth: {
      orders: 35,
      contributed: 175.00,
      trees: 5
    },
    // All-time totals
    allTime: {
      orders: 210,
      contributed: 1050.75,
      trees: 35,
      customers: 187,
      averageDonation: 5.00
    },
    // Recent orders with product details
    recentOrders: [
      { 
        id: 1, 
        customer: 'john@example.com', 
        product: 'Cotton T-Shirt',
        amount: 25.00, 
        trees: 0.83, 
        date: '2 hours ago',
        status: 'Completed'
      },
      { 
        id: 2, 
        customer: 'jane@example.com', 
        product: 'Organic Coffee',
        amount: 10.00, 
        trees: 0.33, 
        date: '4 hours ago',
        status: 'Completed'
      },
      { 
        id: 3, 
        customer: 'bob@example.com', 
        product: 'Handmade Soap',
        amount: 5.00, 
        trees: 0.17, 
        date: '1 day ago',
        status: 'Completed'
      },
      { 
        id: 4, 
        customer: 'alice@example.com', 
        product: 'Ceramic Mug',
        amount: 15.00, 
        trees: 0.50, 
        date: '2 days ago',
        status: 'Completed'
      },
      { 
        id: 5, 
        customer: 'charlie@example.com', 
        product: 'Canvas Tote Bag',
        amount: 20.00, 
        trees: 0.67, 
        date: '3 days ago',
        status: 'Completed'
      }
    ]
  };
};

// Main Dashboard Component
export default function DashboardPage() {
  const data = useLoaderData();
  const shopify = useAppBridge();

  // Calculate percentage changes for time periods
  const currentMonthChange = data.currentMonth.orders - data.previousMonth.orders;
  const currentMonthPercentage = data.previousMonth.orders > 0 
    ? Math.round((currentMonthChange / data.previousMonth.orders) * 100)
    : 100;

  const allTimeChange = data.allTime.orders - data.previousMonth.orders;
  const allTimePercentage = data.previousMonth.orders > 0
    ? Math.round((allTimeChange / data.previousMonth.orders) * 100)
    : 100;

  // Handle export data function
  const handleExportData = () => {
    shopify.toast.show('Exporting dashboard data...');
    // TODO: Implement actual export functionality
    console.log('Exporting dashboard data...');
  };

  // Handle refresh data function
  const handleRefreshData = () => {
    shopify.toast.show('Refreshing dashboard data...');
    // TODO: Implement actual refresh functionality
    console.log('Refreshing dashboard data...');
    // This would typically trigger a refetch of the loader data
  };

  // Handle view reports function
  const handleViewReports = () => {
    shopify.toast.show('Opening detailed reports...');
    // TODO: Implement navigation to reports page
    console.log('Opening detailed reports...');
  };

  // Main metrics for the top grid
  const mainMetrics = [
    {
      id: 'orders',
      title: 'Orders with Donation',
      value: data.currentMonth.orders,
      data: data.weeklyTrends.orders,
      percentageChange: 20,
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
      value: data.currentMonth.trees,
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
      percentageChange: -5, // Example percentage change
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
      value: `${data.currentMonth.conversionRate}%`,
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

        {/* Detailed Stats Grid */}
       
        {/* Recent Orders */}
        <DashboardCard 
          title="Recent Orders with Donations"
          action={{ content: 'View All Orders', props: { as: Link, to: '/app/orders' } }}
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

        {/* Quick Actions */}

      </s-stack>
    </s-page>
  );
}