import React, { useState, useEffect } from "react";
import { useOrders } from "../../hooks/useDatabase";
import { useSettings } from "../../hooks/useSettings";
import { Order } from "../../../electron/database";
import "./OrdersPage.css";
import { useCurrencyFormatter } from "../../utils/formatCurrency";

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
  const { format } = useCurrencyFormatter();

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    //start: new Date(new Date().setDate(new Date().getDate() - 30))
    start: new Date().toISOString().split("T")[0], // today

    end: new Date().toISOString().split("T")[0], // today
  });

  // State for delete confirmation modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  // State for error message modal
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Load order details when an order is selected
  const loadOrderDetails = async (orderId: number) => {
    try {
      const order = await getOrderById(orderId);
      setSelectedOrder(order || null);
    } catch (error) {
      console.error("Error loading order details:", error);
      setErrorMessage("Failed to load order details. Please try again.");
      setShowErrorModal(true);
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  // Apply date filter
  const applyDateFilter = async () => {
    try {
      await getOrdersByDateRange(dateFilter.start, dateFilter.end);
    } catch (error) {
      console.error("Error applying date filter:", error);
      setErrorMessage("Failed to filter orders. Please try again.");
      setShowErrorModal(true);
    }
  };

  // Reset filter and load all orders
  const resetFilter = () => {
    setDateFilter({
      // start: new Date(new Date().setDate(new Date().getDate() - 30))
      start: new Date().toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    });
    try {
      fetchOrders();
    } catch (error) {
      console.error("Error fetching orders:", error);
      setErrorMessage("Failed to reset filter. Please try again.");
      setShowErrorModal(true);
    }
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

  // Initiate order deletion process - show confirmation dialog
  const confirmDeleteOrder = (orderId: number) => {
    console.log("Confirming delete for order ID:", orderId);
    setOrderToDelete(orderId);
    setShowConfirmDelete(true);
  };

  // Handle order deletion
  const handleDeleteOrder = async () => {
    if (orderToDelete === null) return;

    console.log("Deleting order ID:", orderToDelete);

    try {
      const success = await deleteOrder(orderToDelete);
      console.log("Order deletion result:", success);

      if (selectedOrder?.id === orderToDelete) {
        setSelectedOrder(null);
      }

      setShowConfirmDelete(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      setShowConfirmDelete(false);
      setErrorMessage("Failed to delete order. Please try again.");
      setShowErrorModal(true);
    }
  };

  // Close error modal
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage(null);
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
                      {/*   {settings?.currencySymbol || "$"} */}
                      {format(order.total)}
                    </div>
                    <div className="order-payment-method">
                      {order.payment_method}
                    </div>
                  </div>
                  <button
                    className="btn-delete order-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      order.id && confirmDeleteOrder(order.id);
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
                          <td>{format(item.price)}</td>
                          <td>{format(item.price * item.quantity)}</td>
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
                  <span>{format(selectedOrder.total - selectedOrder.tax)}</span>
                </div>
                <div className="total-row">
                  <span>Tax ({settings?.taxRate || 0}%):</span>
                  <span>{format(selectedOrder.tax)}</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total:</span>
                  <span>{format(selectedOrder.total)}</span>
                </div>
              </div>

              <div className="order-actions">
                <button className="btn-primary" onClick={() => window.print()}>
                  Print Receipt
                </button>
                <button
                  className="btn-delete"
                  onClick={() =>
                    selectedOrder.id && confirmDeleteOrder(selectedOrder.id)
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

      {/* Delete confirmation modal */}
      {showConfirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete this order? This action cannot be
              undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeleteOrder} className="btn-delete">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error modal */}
      {showErrorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Error</h3>
            <p>{errorMessage}</p>
            <div className="modal-actions">
              <button onClick={closeErrorModal} className="btn-primary">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
