import React, { useState, useEffect, useRef } from "react";

import { CartItem } from "../Cart/Cart";

import Receipt from "./Receipt";

import { useSettings } from "../../hooks/useSettings";

import "./CheckoutModal.css";

import { useCurrencyFormatter } from "../../utils/formatCurrency";

interface CheckoutModalProps {
  isOpen: boolean;

  onClose: () => void;

  cartItems: CartItem[];

  onCompleteCheckout: (
    paymentMethod: string,

    cashTendered?: number,

    changeAmount?: number
  ) => Promise<number>;
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

  // Receipt data

  const [receiptItems, setReceiptItems] = useState<CartItem[]>([]);

  const [receiptSubtotal, setReceiptSubtotal] = useState(0);

  const [receiptTax, setReceiptTax] = useState(0);

  const [receiptTotal, setReceiptTotal] = useState(0);

  // Cash tendered and change

  const [cashTendered, setCashTendered] = useState<number>(0);

  const [changeAmount, setChangeAmount] = useState(0);

  const [cashTenderedError, setCashTenderedError] = useState<string | null>(
    null
  );

  // Reference to the cash input for focus management

  const cashInputRef = useRef<HTMLInputElement>(null);

  const modalOpenedRef = useRef(false);

  const { settings } = useSettings();

  const { format } = useCurrencyFormatter();

  // Calculate total when cart items change

  const total = calculateTotal();

  // Effect to update cash tendered default when total changes

  useEffect(() => {
    if (paymentMethod === "cash" && cashTendered < total) {
      setCashTendered(Math.ceil(total)); // Round up to nearest whole number
      setCashTendered(total);
    }
  }, [total, paymentMethod, cashTendered]);

  // Effect to calculate change amount

  useEffect(() => {
    const change = cashTendered - total;

    setChangeAmount(change > 0 ? change : 0);
  }, [cashTendered, total]);

  // Effect to handle modal opening and auto-focus

  useEffect(() => {
    if (isOpen && !modalOpenedRef.current) {
      modalOpenedRef.current = true;

      // Set initial cash tendered value

      if (paymentMethod === "cash") {
        //setCashTendered(Math.ceil(total));
        setCashTendered(total);
      }

      // Auto-focus the cash input after modal renders

      setTimeout(() => {
        if (cashInputRef.current && paymentMethod === "cash") {
          cashInputRef.current.focus();

          cashInputRef.current.select();
        }
      }, 100);
    } else if (!isOpen) {
      // Reset the ref when modal is closed

      modalOpenedRef.current = false;
    }
  }, [isOpen, paymentMethod, total]);

  // Handle payment method change

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);

    if (method === "cash") {
      //setCashTendered(Math.ceil(total));
      setCashTendered(total);

      // Focus the cash input field when switching to cash

      setTimeout(() => {
        if (cashInputRef.current) {
          cashInputRef.current.focus();

          cashInputRef.current.select();
        }
      }, 100);
    }

    setCashTenderedError(null);
  };

  if (!isOpen) return null;

  function calculateSubtotal() {
    return cartItems.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  }

  function calculateTax() {
    const subtotal = calculateSubtotal();

    const taxRate = settings?.taxEnabled ? settings.taxRate / 100 : 0;

    return subtotal * taxRate;
  }

  function calculateTotal() {
    return calculateSubtotal() + calculateTax();
  }

  const handleCashTenderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input for backspacing

    if (value === "") {
      setCashTendered(0);

      return;
    }

    // First remove any non-numeric characters (except decimal point)

    const cleanValue = value.replace(/[^\d.]/g, "");

    const numValue = parseFloat(cleanValue);

    // Handle empty input

    if (cleanValue === "") {
      setCashTenderedError("Please enter the amount received");

      setCashTendered(0);

      return;
    }

    // Handle invalid numbers

    if (isNaN(numValue)) {
      return;
    }

    // Only update if it's a valid number

    if (!isNaN(numValue)) {
      setCashTendered(numValue);
    }

    // Validate that cash tendered is sufficient

    if (numValue < total) {
      setCashTenderedError("Amount is less than the total");
    } else {
      setCashTenderedError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate cash payment

    if (paymentMethod === "cash") {
      if (cashTendered < total) {
        setCashTenderedError("Amount is less than the total");

        return;
      }
    }

    try {
      setProcessing(true);

      // Store the current values for the receipt

      const subtotal = calculateSubtotal();

      const tax = calculateTax();

      const totalAmount = calculateTotal();

      // Save a copy of the cart items for the receipt

      setReceiptItems([...cartItems]);

      setReceiptSubtotal(subtotal);

      setReceiptTax(tax);

      setReceiptTotal(totalAmount);

      // Call the onCompleteCheckout function with payment details

      const newOrderId = await onCompleteCheckout(
        paymentMethod,

        paymentMethod === "cash" ? cashTendered : undefined,

        changeAmount > 0 ? changeAmount : undefined
      );

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

  // If showing receipt, render the Receipt component with the saved items

  if (showReceipt && orderNumber !== null) {
    return (
      <Receipt
        orderNumber={orderNumber}
        items={receiptItems}
        paymentMethod={paymentMethod}
        subtotal={receiptSubtotal}
        tax={receiptTax}
        total={receiptTotal}
        cashTendered={paymentMethod === "cash" ? cashTendered : undefined}
        changeAmount={changeAmount > 0 ? changeAmount : undefined}
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

                  <span>{format(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="summary-subtotal">
              <span>Subtotal</span>

              <span>{format(calculateSubtotal())}</span>
            </div>

            <div className="summary-tax">
              <span>Tax ({settings?.taxRate || 0}%)</span>

              <span>{format(calculateTax())}</span>
            </div>

            <div className="summary-total">
              <span>Total</span>

              <span>{format(calculateTotal())}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="payment-methods">
              <h3>Payment Method</h3>

              <div className="payment-options">
                <label>
                  <input
                    autoFocus={paymentMethod === "cash"}
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => handlePaymentMethodChange("cash")}
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
                    onChange={() => handlePaymentMethodChange("card")}
                    disabled={processing}
                  />
                  Card
                </label>
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="cash-payment-details">
                <div className="cash-tendered-group">
                  <label htmlFor="cash-tendered">Cash Tendered:</label>

                  <div className="cash-input-wrapper">
                    {/* <span className="currency-symbol">

                      {settings?.currencySymbol || "Rs."}

                    </span> */}

                    <input
                      ref={cashInputRef}
                      id="cash-tendered"
                      type="text"
                      value={cashTendered === 0 ? "" : format(cashTendered)}
                      onChange={handleCashTenderedChange}
                      className={cashTenderedError ? "error" : ""}
                      disabled={processing}
                      inputMode="decimal"
                      autoFocus={paymentMethod === "cash"}
                    />
                  </div>

                  {cashTenderedError && (
                    <div className="cash-error-message">
                      {cashTenderedError}
                    </div>
                  )}
                </div>

                <div className="change-amount-display">
                  <span>Change:</span>

                  <span className="change-value">{format(changeAmount)}</span>
                </div>
              </div>
            )}

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
                disabled={
                  processing ||
                  (paymentMethod === "cash" && cashTendered < total)
                }
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
