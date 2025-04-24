import React, { useState } from "react";
import { CartItem } from "../Cart/Cart";
import Receipt from "./Receipt";
import { useSettings } from "../../hooks/useSettings";
import "./CheckoutModal.css";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onCompleteCheckout: (paymentMethod: string) => Promise<number>;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onCompleteCheckout,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  const { settings } = useSettings();

  if (!isOpen) return null;

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = settings?.taxEnabled ? settings.taxRate / 100 : 0;
    return subtotal * taxRate;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setProcessing(true);
      // Call the onCompleteCheckout function which will add the order to the database
      const newOrderId = await onCompleteCheckout(paymentMethod);

      // Set the order number and show the receipt
      setOrderNumber(newOrderId);
      setShowReceipt(true);
      setProcessing(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      alert(
        "An error occurred while processing your payment. Please try again."
      );
      setProcessing(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    onClose();
  };

  // If showing receipt, render the Receipt component
  if (showReceipt && orderNumber !== null) {
    return (
      <Receipt
        orderNumber={orderNumber}
        items={cartItems}
        paymentMethod={paymentMethod}
        subtotal={calculateSubtotal()}
        tax={calculateTax()}
        total={calculateTotal()}
        onPrint={() => console.log("Printing receipt...")}
        onClose={handleCloseReceipt}
      />
    );
  }

  return (
    <div className="modal-overlay">
      <div className="checkout-modal">
        <div className="modal-header">
          <h2>Checkout</h2>
          <button
            className="close-button"
            onClick={onClose}
            disabled={processing}
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="order-summary">
            <h3>Order Summary</h3>
            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.product.id} className="summary-item">
                  <span>
                    {item.quantity} × {item.product.name}
                  </span>
                  <span>
                    {settings?.currencySymbol || "$"}
                    {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-subtotal">
              <span>Subtotal</span>
              <span>
                {settings?.currencySymbol || "$"}
                {calculateSubtotal().toFixed(2)}
              </span>
            </div>
            <div className="summary-tax">
              <span>Tax ({settings?.taxRate || 0}%)</span>
              <span>
                {settings?.currencySymbol || "$"}
                {calculateTax().toFixed(2)}
              </span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>
                {settings?.currencySymbol || "$"}
                {calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="payment-methods">
              <h3>Payment Method</h3>
              <div className="payment-options">
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    disabled={processing}
                  />
                  Cash
                </label>
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    disabled={processing}
                  />
                  Card
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`complete-button ${processing ? "processing" : ""}`}
                disabled={processing}
              >
                {processing ? "Processing..." : "Complete Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
