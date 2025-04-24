import React, { useRef } from "react";
import { CartItem } from "../Cart/Cart";
import { useSettings } from "../../hooks/useSettings";
import "./Receipt.css";

interface ReceiptProps {
  orderNumber: number;
  items: CartItem[];
  paymentMethod: string;
  subtotal: number;
  tax: number;
  total: number;
  onPrint: () => void;
  onClose: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({
  orderNumber,
  items,
  paymentMethod,
  subtotal,
  tax,
  total,
  onPrint,
  onClose,
}) => {
  const { settings } = useSettings();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Handle print
  const handlePrint = () => {
    onPrint();

    // In a real app, you would implement proper receipt printing
    // For now, we'll just use the browser's print functionality
    window.print();
  };

  return (
    <div className="receipt-modal-overlay">
      <div className="receipt-container">
        <div className="receipt-content" ref={receiptRef}>
          <div className="receipt-header">
            <h2>{settings?.companyName || "My POS Store"}</h2>
            <p>{settings?.address || "123 Main Street, City, State, ZIP"}</p>
            <p>Phone: {settings?.phone || "(123) 456-7890"}</p>
            <p>{settings?.email || "info@myposstore.com"}</p>
          </div>

          <div className="receipt-order-info">
            <p className="receipt-order-number">Order #{orderNumber}</p>
            <p className="receipt-date">{formatDate(new Date())}</p>
          </div>

          <div className="receipt-custom-header">
            {settings?.receiptHeader || "Thank you for your purchase!"}
          </div>

          <div className="receipt-items">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.product.name}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {settings?.currencySymbol || "$"}
                      {item.product.price.toFixed(2)}
                    </td>
                    <td>
                      {settings?.currencySymbol || "$"}
                      {(item.product.price * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="receipt-totals">
            <div className="receipt-total-row">
              <span>Subtotal:</span>
              <span>
                {settings?.currencySymbol || "$"}
                {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="receipt-total-row">
              <span>Tax ({settings?.taxRate || 0}%):</span>
              <span>
                {settings?.currencySymbol || "$"}
                {tax.toFixed(2)}
              </span>
            </div>
            <div className="receipt-total-row grand-total">
              <span>Total:</span>
              <span>
                {settings?.currencySymbol || "$"}
                {total.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="receipt-payment">
            <p>Payment Method: {paymentMethod}</p>
            <p>
              Amount Paid: {settings?.currencySymbol || "$"}
              {total.toFixed(2)}
            </p>
          </div>

          <div className="receipt-custom-footer">
            {settings?.receiptFooter || "Please come again!"}
          </div>
        </div>

        <div className="receipt-actions">
          <button onClick={handlePrint} className="btn-primary">
            Print Receipt
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
