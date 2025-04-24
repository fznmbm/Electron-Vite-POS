import React, { useState, useEffect, useRef } from "react";
import { useProducts } from "../../hooks/useDatabase";
import { Product } from "../../../electron/database";
import "./BarcodeScanner.css";

interface BarcodeScannerProps {
  onProductScanned: (product: Product) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onProductScanned,
}) => {
  const [barcode, setBarcode] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { products, searchProducts } = useProducts();

  // Focus the input when the component becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  // Clear the message after a timeout
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle barcode input
  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!barcode.trim()) {
      setMessage("Please enter a barcode");
      setMessageType("error");
      return;
    }

    try {
      // Search for the product by barcode
      await searchProducts(barcode);

      // Find the product with matching barcode
      const product = products.find((p) => p.barcode === barcode);

      if (product) {
        // Add the product to the cart
        onProductScanned(product);
        setMessage(`Added: ${product.name}`);
        setMessageType("success");
        setBarcode("");
      } else {
        setMessage("Product not found");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error searching for product:", error);
      setMessage("Error searching for product");
      setMessageType("error");
    }
  };

  // Toggle the scanner
  const toggleScanner = () => {
    setIsActive(!isActive);
    if (!isActive && inputRef.current) {
      // Focus the input when activating
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className={`barcode-scanner ${isActive ? "active" : ""}`}>
      <button
        className="toggle-scanner"
        onClick={toggleScanner}
        title={isActive ? "Close Scanner" : "Open Barcode Scanner"}
      >
        <span className="scanner-icon">📲</span>
      </button>

      {isActive && (
        <div className="scanner-panel">
          <h3>Barcode Scanner</h3>

          <form onSubmit={handleSubmit} className="scanner-form">
            <input
              ref={inputRef}
              type="text"
              value={barcode}
              onChange={handleBarcodeChange}
              placeholder="Scan or enter barcode..."
              className="scanner-input"
              autoFocus
            />
            <button type="submit" className="scan-button">
              Add
            </button>
          </form>

          {message && (
            <div className={`scanner-message ${messageType}`}>{message}</div>
          )}

          <div className="scanner-instructions">
            <p>Scan a product barcode or enter it manually and press Enter</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
