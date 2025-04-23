import React, { useState } from "react";
import { CartItem } from "../Cart/Cart";
import "./CheckoutModal.css";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onCompleteCheckout: (paymentMethod: string) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onCompleteCheckout,
}) => {
  const [paymentMethod, setPaymentMethod] = useState("cash");

  if (!isOpen) return null;

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteCheckout(paymentMethod);
  };

  return (
    <div className="modal-overlay">
      <div className="checkout-modal">
        <div className="modal-header">
          <h2>Checkout</h2>
          <button className="close-button" onClick={onClose}>
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
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
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
                  />
                  Card
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="complete-button">
                Complete Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
