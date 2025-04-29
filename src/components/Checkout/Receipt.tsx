import React, { useRef, useEffect, useState } from "react";
import { CartItem } from "../Cart/Cart";
import { useSettings } from "../../hooks/useSettings";
import "./Receipt.css";
import { useCurrencyFormatter } from "../../utils/formatCurrency";

interface ReceiptProps {
  orderNumber: number;
  items: CartItem[];
  paymentMethod: string;
  subtotal: number;
  tax: number;
  total: number;
  cashTendered?: number;
  changeAmount?: number;
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
  cashTendered,
  changeAmount,
  onPrint,
  onClose,
}) => {
  const { settings, loading, error, fetchSettings } = useSettings();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [receiptHeader, setReceiptHeader] = useState<string>(
    "Thank you for your purchase!"
  );
  const [receiptFooter, setReceiptFooter] =
    useState<string>("Please come again!");
  const { format } = useCurrencyFormatter();

  // Make sure we have the latest settings
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update header and footer when settings change
  useEffect(() => {
    if (settings) {
      console.log("Receipt settings loaded:", {
        header: settings.receiptHeader,
        footer: settings.receiptFooter,
      });

      // Set header from settings or use default
      setReceiptHeader(
        settings.receiptHeader || "Thank you for your purchase!"
      );

      console.log("Receipt header set to:", settings.receiptHeader);
      console.log("Receipt footer set to:", settings.receiptFooter);

      // Set footer from settings or use default
      setReceiptFooter(settings.receiptFooter || "Please come again!");
    }
  }, [settings]);

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

  if (loading) {
    return <div className="loading">Loading receipt information...</div>;
  }

  if (error) {
    console.error("Error loading settings for receipt:", error);
  }

  // Determine if we should show the tax section
  const showTax = settings?.taxEnabled && tax > 0;

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

          <div className="receipt-custom-header">{receiptHeader}</div>

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
                    <td>{format(item.product.price)}</td>
                    <td>{format(item.product.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="receipt-totals">
            <div className="receipt-total-row">
              <span>Subtotal:</span>
              <span>{format(subtotal)}</span>
            </div>
            {showTax && (
              <div className="receipt-total-row">
                <span>Tax ({settings.taxRate}%):</span>
                <span>{format(tax)}</span>
              </div>
            )}
            <div className="receipt-total-row grand-total">
              <span>Total:</span>
              <span>{format(total)}</span>
            </div>
          </div>

          <div className="receipt-payment">
            <div className="payment-detail-row">
              <span>Payment Method:</span>
              <span className="payment-value">{paymentMethod}</span>
            </div>
            {paymentMethod === "cash" && cashTendered !== undefined && (
              <>
                <div className="payment-detail-row">
                  <span>Cash Tendered:</span>
                  <span className="payment-value">{format(cashTendered)}</span>
                </div>
                {changeAmount !== undefined && (
                  <div className="payment-detail-row">
                    <span>Change:</span>
                    <span className="payment-value">
                      {format(changeAmount)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="receipt-custom-footer">{receiptFooter}</div>
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
