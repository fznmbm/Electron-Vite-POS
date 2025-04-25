// src/components/Security/PinLogin.tsx
import React, { useState } from "react";
import "./PinLogin.css";

interface PinLoginProps {
  correctPin: string;
  onSuccess: () => void;
}

const PinLogin: React.FC<PinLoginProps> = ({ correctPin, onSuccess }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (String(pin) === String(correctPin)) {
      onSuccess();
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
    }
  };

  return (
    <div className="pin-login-overlay">
      <div className="pin-login-container">
        <h2>Enter PIN</h2>
        <p>Please enter your 4-digit PIN to access the application</p>

        {error && <div className="pin-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={handlePinChange}
            placeholder="Enter 4-digit PIN"
            className="pin-input"
            maxLength={4}
            autoFocus
          />

          <button
            type="submit"
            className="pin-submit-button"
            disabled={pin.length !== 4}
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default PinLogin;
