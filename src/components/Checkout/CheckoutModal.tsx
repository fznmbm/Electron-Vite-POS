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
    discount?: number,
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

  // Add to the receipt state variables (around line 41)
  const [receiptDiscount, setReceiptDiscount] = useState(0);
  const [receiptDiscountType, setReceiptDiscountType] = useState<string | null>(
    null
  );
  const [receiptDiscountValue, setReceiptDiscountValue] = useState<
    string | null
  >(null);

  // Cash tendered and change
  const [cashTendered, setCashTendered] = useState<string>("");
  const [changeAmount, setChangeAmount] = useState(0);
  const [cashTenderedError, setCashTenderedError] = useState<string | null>(
    null
  );

  // Discount state
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState("percentage"); // percentage or fixed
  const [discountValue, setDiscountValue] = useState<string>("0");
  const [discountError, setDiscountError] = useState<string | null>(null);

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

      // Reset discount state when modal opens
      setDiscountEnabled(false);
      setDiscountType("percentage");
      setDiscountValue("0");
      setDiscountError(null);

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

      // Also reset discount state when modal closes
      setDiscountEnabled(false);
      setDiscountType("percentage");
      setDiscountValue("0");
      setDiscountError(null);
    }
  }, [isOpen, paymentMethod, total]);

  // Add this effect after your other useEffect hooks
  useEffect(() => {
    // When discount is disabled and we're in cash payment mode, refocus on the cash input
    if (
      isOpen &&
      paymentMethod === "cash" &&
      !discountEnabled &&
      cashInputRef.current
    ) {
      // Use a small timeout to ensure the DOM has updated
      setTimeout(() => {
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      }, 10);
    }
  }, [discountEnabled, isOpen, paymentMethod]);

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

  // Add a calculateDiscount function after the calculateTax function (around line 195)
  function calculateDiscount() {
    if (!discountEnabled || !discountValue) {
      return 0;
    }

    const subtotal = calculateSubtotal();
    const numValue = parseFloat(discountValue);

    if (isNaN(numValue) || numValue <= 0) {
      return 0;
    }

    if (discountType === "percentage") {
      // Limit percentage to 100%
      const percentage = Math.min(numValue, 100);
      return subtotal * (percentage / 100);
    } else {
      // For fixed amount, don't allow discount greater than subtotal
      return Math.min(numValue, subtotal);
    }
  }

  function calculateTotal() {
    //return calculateSubtotal() + calculateTax();
    return calculateSubtotal() + calculateTax() - calculateDiscount();
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
    // Fix for floating point precision issues - use toFixed and then convert back to number
    const totalFixed = parseFloat(total.toFixed(2));
    const cashFixed = parseFloat(numValue.toFixed(2));

    // Validate amount is sufficient
    if (cashFixed < totalFixed) {
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

      const discount = calculateDiscount();
      // Store the current values for the receipt
      const subtotal = calculateSubtotal();
      const tax = calculateTax();
      const totalAmount = calculateTotal();

      // Save a copy of the cart items for the receipt
      setReceiptItems([...cartItems]);
      setReceiptSubtotal(subtotal);
      setReceiptTax(tax);
      setReceiptTotal(totalAmount);
      setReceiptDiscount(discount);
      setReceiptDiscountType(discountEnabled ? discountType : null);
      setReceiptDiscountValue(discountEnabled ? discountValue : null);

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
        discountEnabled ? calculateDiscount() : 0,
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
        discount={receiptDiscount}
        discountType={receiptDiscountType}
        discountValue={receiptDiscountValue}
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

            {/* Add discount to the summary in the JSX after the subtotal and  before tax (around line 265) */}
            {discountEnabled && calculateDiscount() > 0 && (
              <div className="summary-discount">
                <span>
                  Discount{" "}
                  {discountType === "percentage" ? `(${discountValue}%)` : ""}
                </span>
                <span>-{format(calculateDiscount())}</span>
              </div>
            )}

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

          {/* Discount Section */}
          <div className="discount-section">
            <div className="discount-header">
              <h3>Discount</h3>
              <div className="discount-toggle">
                <input
                  type="checkbox"
                  id="enable-discount"
                  checked={discountEnabled}
                  onChange={(e) => setDiscountEnabled(e.target.checked)}
                  disabled={processing}
                />
                <label htmlFor="enable-discount">Apply Discount</label>
              </div>
            </div>

            {discountEnabled && (
              <>
                <div className="discount-controls">
                  <div className="discount-type-select">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      disabled={processing}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div className="discount-value-input">
                    <div
                      className={`input-with-icon ${
                        discountType === "percentage" ? "right" : "left"
                      }`}
                    >
                      {discountType === "fixed" && (
                        <span className="input-icon">
                          {settings?.currencySymbol || "$"}
                        </span>
                      )}
                      <input
                        type="text"
                        value={discountValue}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^\d.]/g, "");
                          setDiscountValue(value);

                          const numValue = parseFloat(value);
                          if (isNaN(numValue)) {
                            setDiscountError("Please enter a valid number");
                          } else if (numValue < 0) {
                            setDiscountError("Discount cannot be negative");
                          } else if (
                            discountType === "percentage" &&
                            numValue > 100
                          ) {
                            setDiscountError("Percentage cannot exceed 100%");
                          } else if (
                            discountType === "fixed" &&
                            numValue > calculateSubtotal()
                          ) {
                            setDiscountError("Discount cannot exceed subtotal");
                          } else {
                            setDiscountError(null);
                          }
                        }}
                        placeholder={
                          discountType === "percentage" ? "10" : "5.00"
                        }
                        disabled={processing}
                      />
                      {discountType === "percentage" && (
                        <span className="input-icon">%</span>
                      )}
                    </div>
                    {discountError && (
                      <div className="discount-error-message">
                        {discountError}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
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
                    (!cashTendered ||
                      parseFloat(parseFloat(cashTendered).toFixed(2)) <
                        parseFloat(total.toFixed(2))))
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
