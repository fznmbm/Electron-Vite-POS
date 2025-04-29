import React, { useState, useEffect, useRef } from "react";
import { CartItem } from "../Cart/Cart";
import Receipt from "./Receipt";
import { useSettings } from "../../hooks/useSettings";
import "./CheckoutModal.css";
import { useCurrencyFormatter } from "../../utils/formatCurrency";
import { useRefresh } from "../../contexts/RefreshContext";

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
  const [receiptCashTendered, setReceiptCashTendered] = useState<
    number | undefined
  >(undefined);
  const [receiptChangeAmount, setReceiptChangeAmount] = useState<
    number | undefined
  >(undefined);

  // Cash tendered and change
  const [cashTendered, setCashTendered] = useState<string>("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [cashTenderedError, setCashTenderedError] = useState<string | null>(
    null
  );

  // Add this new ref
  const hasRefreshedRef = useRef(false);

  // Reference to the cash input for focus management
  const cashInputRef = useRef<HTMLInputElement>(null);
  const modalOpenedRef = useRef(false);

  const { settings, fetchSettings } = useSettings();
  const { refreshData } = useRefresh();
  const { format } = useCurrencyFormatter();

  // Effect to refresh settings when modal opens
  useEffect(() => {
    if (isOpen && !hasRefreshedRef.current) {
      // Only refresh once when the modal opens
      hasRefreshedRef.current = true;

      refreshData(); // Trigger global refresh
      fetchSettings(); // Specifically fetch settings
    } else if (!isOpen) {
      // Reset the refresh flag when the modal closes
      hasRefreshedRef.current = false;
    }
  }, [isOpen, refreshData, fetchSettings]);

  // Calculate total when cart items change
  const total = calculateTotal();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Effect to update cash tendered default when total changes
  useEffect(() => {
    if (
      isOpen &&
      paymentMethod === "cash" &&
      (!cashTendered || parseFloat(cashTendered) < total)
    ) {
      setCashTendered(total.toFixed(2));
    }
  }, [total, paymentMethod, isOpen]);

  // Effect to calculate change amount
  useEffect(() => {
    const cashAmount = cashTendered ? parseFloat(cashTendered) : 0;
    const change = cashAmount - total;
    setChangeAmount(change > 0 ? change : 0);
  }, [cashTendered, total]);

  // Effect to handle modal opening and auto-focus
  useEffect(() => {
    if (isOpen && !modalOpenedRef.current) {
      modalOpenedRef.current = true;

      // Set initial cash tendered value
      if (paymentMethod === "cash") {
        setCashTendered(total.toFixed(2));
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
      setCashTendered(total.toFixed(2));

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
    // Only calculate tax if it's enabled in settings
    if (!settings?.taxEnabled) {
      return 0;
    }

    const subtotal = calculateSubtotal();
    const taxRate = settings.taxRate / 100;
    return subtotal * taxRate;
  }

  function calculateTotal() {
    return calculateSubtotal() + calculateTax();
  }

  const handleCashTenderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty input for backspacing
    if (value === "") {
      setCashTendered("");
      setCashTenderedError("Please enter the amount received");
      return;
    }

    // First remove any non-numeric characters (except decimal point)
    const cleanValue = value.replace(/[^\d.]/g, "");

    // Ensure we have only one decimal point
    const parts = cleanValue.split(".");
    const formattedValue =
      parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : cleanValue;

    // Check if valid number
    const numValue = parseFloat(formattedValue);
    if (isNaN(numValue)) {
      setCashTenderedError("Please enter a valid amount");
      return;
    }

    // Update the value
    setCashTendered(formattedValue);

    // Validate amount is sufficient
    if (numValue < total) {
      setCashTenderedError("Amount is less than the total");
    } else {
      setCashTenderedError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null); // Clear any previous errors

    // Validate cash payment
    if (paymentMethod === "cash") {
      const cashAmount = cashTendered ? parseFloat(cashTendered) : 0;
      if (cashAmount < total) {
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

      // Calculate and store the cash and change amounts for the receipt
      if (paymentMethod === "cash" && cashTendered) {
        const cashAmount = parseFloat(cashTendered);
        setReceiptCashTendered(cashAmount);

        // Calculate change as the difference between cash tendered and total
        const calculatedChange = cashAmount - totalAmount;
        const roundedChange = Math.max(
          0,
          parseFloat(calculatedChange.toFixed(2))
        );
        setReceiptChangeAmount(roundedChange);
      } else {
        setReceiptCashTendered(undefined);
        setReceiptChangeAmount(undefined);
      }

      // Call the onCompleteCheckout function with payment details
      const cashAmount = cashTendered ? parseFloat(cashTendered) : 0;
      const calculatedChange = cashAmount - total;
      const roundedChange = Math.max(
        0,
        parseFloat(calculatedChange.toFixed(2))
      );

      const newOrderId = await onCompleteCheckout(
        paymentMethod,
        paymentMethod === "cash" ? cashAmount : undefined,
        paymentMethod === "cash" ? roundedChange : undefined
      );

      // Set the order number and show the receipt
      setOrderNumber(newOrderId);
      setShowReceipt(true);
      setProcessing(false);
    } catch (error) {
      console.error("Error processing payment:", error);
      setErrorMessage(
        "An error occurred while processing your payment. Please try again."
      );
      setProcessing(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    onClose();
  };

  // Determine if we should show the tax row
  const showTax = settings?.taxEnabled || false;

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
        cashTendered={receiptCashTendered}
        changeAmount={receiptChangeAmount}
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
          {errorMessage && (
            <div className="checkout-error-message">{errorMessage}</div>
          )}
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
            {showTax && (
              <div className="summary-tax">
                <span>Tax ({settings?.taxRate || 0}%)</span>
                <span>{format(calculateTax())}</span>
              </div>
            )}
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
                    <span className="currency-symbol">
                      {settings?.currencySymbol || "$"}
                    </span>
                    <input
                      ref={cashInputRef}
                      id="cash-tendered"
                      type="text"
                      value={cashTendered}
                      onChange={handleCashTenderedChange}
                      onFocus={(e) => e.target.select()}
                      className={cashTenderedError ? "error" : ""}
                      disabled={processing}
                      inputMode="decimal"
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
                  <span className="change-value">
                    {format(
                      cashTendered && parseFloat(cashTendered) > total
                        ? parseFloat(
                            (parseFloat(cashTendered) - total).toFixed(2)
                          )
                        : 0
                    )}
                  </span>
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
                  (paymentMethod === "cash" &&
                    (!cashTendered || parseFloat(cashTendered) < total))
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
