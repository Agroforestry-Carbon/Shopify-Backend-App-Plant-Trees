// app/routes/app.orders.jsx
import React, { useState } from 'react';
import { useLoaderData } from 'react-router';

export const loader = async ({ request }) => {
  // TODO: Fetch orders from your backend
  return {
    orders: [
      {
        id: '1',
        orderNumber: '#1001',
        date: '2024-01-15',
        customer: 'john@example.com',
        amount: 5.00,
        status: 'paid',
        trees: 0.17
      },
      {
        id: '2',
        orderNumber: '#1002',
        date: '2024-01-14',
        customer: 'jane@example.com',
        amount: 10.00,
        status: 'paid',
        trees: 0.33
      },
      {
        id: '3',
        orderNumber: '#1003',
        date: '2024-01-13',
        customer: 'bob@example.com',
        amount: 25.00,
        status: 'refunded',
        trees: 0.83
      }
    ]
  };
};

export default function OrdersPage() {
  const { orders } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const tones = {
      paid: 'success',
      pending: 'warning',
      refunded: 'critical',
      cancelled: 'subdued'
    };
    return <s-badge tone={tones[status] || 'subdued'}>{status}</s-badge>;
  };

  return (
    <s-page heading="Tree Planting Orders">
      <s-button slot="primary-action" variant="primary" onClick={() => {}}>
        Export CSV
      </s-button>

      <s-text as="p" variant="bodyMd" tone="subdued" style={{ marginBottom: '24px' }}>
        Orders containing tree planting donations
      </s-text>

      <s-card>
        <s-stack direction="block" gap="400">
          <s-stack direction="inline" gap="400" justifyContent="spaceBetween">
            <s-heading level="h3">Recent Orders</s-heading>
            <s-text-field
              label="Search orders"
              labelHidden
              placeholder="Search by order # or email"
              value={searchTerm}
              onChange={(value) => setSearchTerm(value)}
            />
          </s-stack>

          <s-table>
            <thead>
              <tr>
                <th><s-text as="span" variant="bodySm" fontWeight="bold">Order #</s-text></th>
                <th><s-text as="span" variant="bodySm" fontWeight="bold">Date</s-text></th>
                <th><s-text as="span" variant="bodySm" fontWeight="bold">Customer</s-text></th>
                <th><s-text as="span" variant="bodySm" fontWeight="bold">Amount</s-text></th>
                <th><s-text as="span" variant="bodySm" fontWeight="bold">Trees</s-text></th>
                <th><s-text as="span" variant="bodySm" fontWeight="bold">Status</s-text></th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <s-text as="p" variant="bodyMd">{order.orderNumber}</s-text>
                  </td>
                  <td>
                    <s-text as="p" variant="bodyMd">{order.date}</s-text>
                  </td>
                  <td>
                    <s-text as="p" variant="bodyMd">{order.customer}</s-text>
                  </td>
                  <td>
                    <s-text as="p" variant="bodyMd">${order.amount.toFixed(2)}</s-text>
                  </td>
                  <td>
                    <s-text as="p" variant="bodyMd">{order.trees.toFixed(2)}</s-text>
                  </td>
                  <td>
                    {getStatusBadge(order.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </s-table>

          {filteredOrders.length === 0 && (
            <s-box padding="600" textAlign="center">
              <s-text as="p" variant="bodyMd" tone="subdued">
                No orders found
              </s-text>
            </s-box>
          )}
        </s-stack>
      </s-card>
    </s-page>
  );
}