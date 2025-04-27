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
  const [isSelectingMultiple, setIsSelectingMultiple] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({
    start: new Date().toISOString().split("T")[0], // today
    end: new Date().toISOString().split("T")[0], // today
  });

  // State for order selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // State for delete confirmation modal
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

  // State for batch delete confirmation modal
  const [showConfirmBatchDelete, setShowConfirmBatchDelete] = useState(false);

  // State for error message modal
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  // State for success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Effect to handle "Select All" checkbox
  useEffect(() => {
    if (selectAll) {
      // Select all order IDs
      const allOrderIds = orders
        .map((order) => order.id || 0)
        .filter((id) => id !== 0);
      setSelectedOrderIds(allOrderIds);
    } else if (selectedOrderIds.length === orders.length && orders.length > 0) {
      // This means we had all selected and now we're deselecting
      setSelectedOrderIds([]);
    }
  }, [selectAll, orders]);

  // Effect to update selectAll state when selections change
  useEffect(() => {
    // If all orders are selected, but selectAll is false, update it
    if (selectedOrderIds.length === orders.length && orders.length > 0) {
      setSelectAll(true);
    }
    // If not all orders are selected, but selectAll is true, update it
    else if (selectedOrderIds.length < orders.length && selectAll) {
      setSelectAll(false);
    }
  }, [selectedOrderIds, orders, selectAll]);

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

  // Handle selecting/deselecting a single order
  const toggleOrderSelection = (orderId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the row click
    // Set flag to prevent unnecessary re-renders
    setIsSelectingMultiple(true);

    setSelectedOrderIds((prevSelected) => {
      const newSelection = prevSelected.includes(orderId)
        ? prevSelected.filter((id) => id !== orderId)
        : [...prevSelected, orderId];

      // Update selectAll state based on new selection
      if (newSelection.length === orders.length && orders.length > 0) {
        setSelectAll(true);
      } else if (selectAll) {
        setSelectAll(false);
      }

      return newSelection;
    });
    // Reset flag after a small delay
    setTimeout(() => setIsSelectingMultiple(false), 50);
  };

  // Handle selecting/deselecting all orders
  const toggleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectAll(event.target.checked);
  };

  // Handle date filter change
  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  // Apply date filter
  const applyDateFilter = async () => {
    try {
      // Clear any selections when filtering
      setSelectedOrderIds([]);
      setSelectAll(false);
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
      start: new Date().toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    });

    // Clear selections when resetting filter
    setSelectedOrderIds([]);
    setSelectAll(false);

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
  const confirmDeleteOrder = (orderId: number, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    console.log("Confirming delete for order ID:", orderId);
    setOrderToDelete(orderId);
    setShowConfirmDelete(true);
  };

  // Initiate batch delete process - show confirmation dialog
  const confirmDeleteSelected = () => {
    if (selectedOrderIds.length === 0) {
      setErrorMessage("Please select at least one order to delete.");
      setShowErrorModal(true);
      return;
    }

    setShowConfirmBatchDelete(true);
  };

  // Handle single order deletion
  const handleDeleteOrder = async () => {
    if (orderToDelete === null) return;

    console.log("Deleting order ID:", orderToDelete);

    try {
      const success = await deleteOrder(orderToDelete);
      console.log("Order deletion result:", success);

      if (selectedOrder?.id === orderToDelete) {
        setSelectedOrder(null);
      }

      // Remove from selected orders if it was selected
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderToDelete));

      setShowConfirmDelete(false);
      setOrderToDelete(null);

      // Show success message
      setSuccessMessage("Order deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error deleting order:", error);
      setShowConfirmDelete(false);
      setErrorMessage("Failed to delete order. Please try again.");
      setShowErrorModal(true);
    }
  };

  // Handle batch delete of selected orders
  const handleDeleteSelected = async () => {
    console.log("Deleting selected orders:", selectedOrderIds);

    try {
      // We'll track successful and failed deletions
      let successCount = 0;
      let failCount = 0;

      // Delete each selected order
      for (const orderId of selectedOrderIds) {
        try {
          await deleteOrder(orderId);
          successCount++;

          // If the deleted order is the currently viewed one, clear it
          if (selectedOrder?.id === orderId) {
            setSelectedOrder(null);
          }
        } catch (e) {
          console.error(`Error deleting order ${orderId}:`, e);
          failCount++;
        }
      }

      // Clear selections
      setSelectedOrderIds([]);
      setSelectAll(false);

      // Close the confirmation modal
      setShowConfirmBatchDelete(false);

      // Show appropriate success/error message
      if (failCount === 0) {
        setSuccessMessage(`Successfully deleted ${successCount} orders`);
      } else {
        setErrorMessage(
          `Deleted ${successCount} orders, but failed to delete ${failCount} orders`
        );
        setShowErrorModal(true);
      }

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error in batch delete process:", error);
      setShowConfirmBatchDelete(false);
      setErrorMessage("An error occurred during the batch delete process.");
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

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

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
          <div className="orders-list-header">
            <h3>Orders ({orders.length})</h3>
          </div>

          <div className="orders-list-toolbar">
            <div className="toolbar-left">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => {
                    // Set flag first to prevent flickering
                    setIsSelectingMultiple(true);
                    setSelectAll(e.target.checked);

                    // Use a single state update for all IDs
                    if (e.target.checked) {
                      const allOrderIds = orders
                        .map((order) => order.id || 0)
                        .filter((id) => id !== 0);
                      setSelectedOrderIds(allOrderIds);
                    } else {
                      setSelectedOrderIds([]);
                    }

                    // Reset flag after a small delay
                    setTimeout(() => setIsSelectingMultiple(false), 50);
                  }}
                />
                <span>Select All</span>
              </label>
            </div>

            <div className="toolbar-right">
              {selectedOrderIds.length > 0 && (
                <button
                  className="btn-delete batch-delete-btn"
                  onClick={confirmDeleteSelected}
                >
                  Delete Selected ({selectedOrderIds.length})
                </button>
              )}
            </div>
          </div>

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
                  } ${
                    selectedOrderIds.includes(order.id || 0)
                      ? "selected-for-action"
                      : ""
                  }`}
                  onClick={() => order.id && loadOrderDetails(order.id)}
                >
                  <div className="order-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.includes(order.id || 0)}
                      onChange={(e) => {}} // Required for React controlled components
                      onClick={(e) =>
                        order.id && toggleOrderSelection(order.id, e)
                      }
                    />
                  </div>
                  <div className="order-basic-info">
                    <div className="order-id">Order #{order.id}</div>
                    <div className="order-date">
                      {formatDate(order.created_at || "")}
                    </div>
                  </div>
                  <div className="order-details">
                    <div className="order-amount">{format(order.total)}</div>
                    <div className="order-payment-method">
                      {order.payment_method}
                    </div>
                  </div>
                  <button
                    className="btn-delete order-delete"
                    onClick={(e) => order.id && confirmDeleteOrder(order.id, e)}
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

      {/* Single order delete confirmation modal */}
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

      {/* Batch delete confirmation modal */}
      {showConfirmBatchDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Batch Delete</h3>
            <p>
              Are you sure you want to delete {selectedOrderIds.length} selected
              orders? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmBatchDelete(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleDeleteSelected} className="btn-delete">
                Delete {selectedOrderIds.length} Orders
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
