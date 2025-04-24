import React, { useState, useEffect } from "react";
import { useOrders } from "../../hooks/useDatabase";
import { useSettings } from "../../hooks/useSettings";
import { Order } from "../../../electron/database";
import "./OrdersPage.css";

const OrdersPage: React.FC = () => {
  const {
    orders,
    loading,
    error,
    fetchOrders,
    getOrderById,
    deleteOrder,
    getOrdersByDateRange,
  } = useOrders();

  const { settings } = useSettings();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0], // 30 days ago
    end: new Date().toISOString().split("T")[0], // today
  });

  // Load order details when an order is selected
  const loadOrderDetails = async (orderId: number) => {
    try {
      const order = await getOrderById(orderId);
      setSelectedOrder(order || null);
    } catch (error) {
      console.error("Error loading order details:", error);
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  // Apply date filter
  const applyDateFilter = async () => {
    await getOrdersByDateRange(dateFilter.start, dateFilter.end);
  };

  // Reset filter and load all orders
  const resetFilter = () => {
    setDateFilter({
      start: new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    });
    fetchOrders();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Handle order deletion
  const handleDeleteOrder = async (orderId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this order? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteOrder(orderId);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order. Please try again.");
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="orders-page">
      <h2>Orders History</h2>

      <div className="filter-section">
        <h3>Filter Orders</h3>
        <div className="date-filter">
          <div className="filter-group">
            <label htmlFor="start">Start Date</label>
            <input
              type="date"
              id="start"
              name="start"
              value={dateFilter.start}
              onChange={handleDateFilterChange}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="end">End Date</label>
            <input
              type="date"
              id="end"
              name="end"
              value={dateFilter.end}
              onChange={handleDateFilterChange}
            />
          </div>
          <div className="filter-actions">
            <button onClick={applyDateFilter} className="btn-primary">
              Apply Filter
            </button>
            <button onClick={resetFilter} className="btn-secondary">
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="orders-grid">
        <div className="orders-list">
          <h3>Orders ({orders.length})</h3>

          {orders.length === 0 ? (
            <div className="empty-state">
              No orders found for the selected period.
            </div>
          ) : (
            <div className="order-items">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`order-item ${
                    selectedOrder?.id === order.id ? "selected" : ""
                  }`}
                  onClick={() => order.id && loadOrderDetails(order.id)}
                >
                  <div className="order-basic-info">
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-date">
                      {formatDate(order.created_at || "")}
                    </div>
                  </div>
                  <div className="order-details">
                    <div className="order-amount">
                      {settings?.currencySymbol || "$"}
                      {order.total.toFixed(2)}
                    </div>
                    <div className="order-payment-method">
                      {order.payment_method}
                    </div>
                  </div>
                  <button
                    className="btn-delete order-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      order.id && handleDeleteOrder(order.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="order-detail-panel">
          {selectedOrder ? (
            <div className="order-details-container">
              <h3>Order Details</h3>

              <div className="order-summary">
                <div className="order-info-row">
                  <span>Order ID:</span>
                  <span>#{selectedOrder.id}</span>
                </div>
                <div className="order-info-row">
                  <span>Date:</span>
                  <span>{formatDate(selectedOrder.created_at || "")}</span>
                </div>
                <div className="order-info-row">
                  <span>Payment Method:</span>
                  <span>{selectedOrder.payment_method}</span>
                </div>
              </div>

              <div className="order-items-list">
                <h4>Items</h4>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>{item.quantity}</td>
                          <td>
                            {settings?.currencySymbol || "$"}
                            {item.price.toFixed(2)}
                          </td>
                          <td>
                            {settings?.currencySymbol || "$"}
                            {(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No items found in this order.</p>
                )}
              </div>

              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>
                    {settings?.currencySymbol || "$"}
                    {(selectedOrder.total - selectedOrder.tax).toFixed(2)}
                  </span>
                </div>
                <div className="total-row">
                  <span>Tax ({settings?.taxRate || 0}%):</span>
                  <span>
                    {settings?.currencySymbol || "$"}
                    {selectedOrder.tax.toFixed(2)}
                  </span>
                </div>
                <div className="total-row grand-total">
                  <span>Total:</span>
                  <span>
                    {settings?.currencySymbol || "$"}
                    {selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="order-actions">
                <button className="btn-primary" onClick={() => window.print()}>
                  Print Receipt
                </button>
                <button
                  className="btn-delete"
                  onClick={() =>
                    selectedOrder.id && handleDeleteOrder(selectedOrder.id)
                  }
                >
                  Delete Order
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-details">
              <p>Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
