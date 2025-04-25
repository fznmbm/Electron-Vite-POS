import React from "react";
import { Product } from "../Products/ProductGrid";
import "./Cart.css";
import { useCurrencyFormatter } from "../../utils/formatCurrency";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartProps {
  items: CartItem[];
  onIncreaseQuantity: (productId: number) => void;
  onDecreaseQuantity: (productId: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onClose?: () => void; // Add an optional close handler
}

const Cart: React.FC<CartProps> = ({
  items,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onClose, // Receive the close handler
}) => {
  const { format } = useCurrencyFormatter();

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  return (
    <div className="cart-container">
      {/* Only render close button if onClose is provided */}
      {onClose && (
        <button className="cart-close-button" onClick={onClose}>
          ×
        </button>
      )}

      <div className="cart">
        <div className="cart-header">
          <h2>Current Order</h2>
          {items.length > 0 && (
            <button className="btn-clear" onClick={onClearCart}>
              Clear
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.product.id} className="cart-item">
                  <div className="cart-item-info">
                    <h3>{item.product.name}</h3>
                    <p>{format(item.product.price)}</p>
                  </div>
                  <div className="cart-item-actions">
                    <button onClick={() => onDecreaseQuantity(item.product.id)}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onIncreaseQuantity(item.product.id)}>
                      +
                    </button>
                  </div>
                  <div className="cart-item-total">
                    {/*<p>${(item.product.price * item.quantity).toFixed(2)}</p>*/}
                    <p>{format(item.product.price * item.quantity)}</p>

                    <button
                      className="btn-remove"
                      onClick={() => onRemoveItem(item.product.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="cart-total">
                <span>Total:</span>
                <span>{format(calculateTotal())}</span>
              </div>
              <button className="btn-checkout" onClick={onCheckout}>
                Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;
