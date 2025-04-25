import React, { useState } from "react";
import { useSettings } from "../../hooks/useSettings";
import { StoreSettings } from "../../../electron/settings";
import "./SettingsPage.css";

const SettingsPage: React.FC = () => {
  const { settings, loading, error, updateSettings, resetSettings } =
    useSettings();
  const [formState, setFormState] = useState<Partial<StoreSettings>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize form state when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormState(settings);
    }
  }, [settings]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Handle different input types
    let parsedValue: any = value;
    if (type === "checkbox") {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === "number") {
      parsedValue = parseFloat(value);
    }

    setFormState((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(formState);
      setSuccessMessage("Settings saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  const handleReset = async () => {
    const confirm = window.confirm(
      "Are you sure you want to reset all settings to default values?"
    );
    if (confirm) {
      try {
        await resetSettings();
        setSuccessMessage("Settings reset to defaults!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        console.error("Error resetting settings:", err);
      }
    }
  };

  if (loading)
    return <div className="settings-loading">Loading settings...</div>;
  if (error) return <div className="settings-error">Error: {error}</div>;
  if (!settings)
    return <div className="settings-error">No settings available.</div>;

  return (
    <div className="settings-page">
      <h1>Settings</h1>

      {successMessage && (
        <div className="settings-success-message">{successMessage}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="settings-section">
          <h2>Business Information</h2>

          <div className="form-group">
            <label htmlFor="companyName">Company Name</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formState.companyName || ""}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <textarea
              id="address"
              name="address"
              value={formState.address || ""}
              onChange={handleInputChange}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formState.phone || ""}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formState.email || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formState.website || ""}
              onChange={handleInputChange}
            />
          </div>
        </div>
        <div className="settings-section">
          <h2>Regional Settings</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={formState.currency || "USD"}
                onChange={handleInputChange}
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="JPY">Japanese Yen (JPY)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
                <option value="INR">Indian Rupee (INR)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="currencySymbol">Currency Symbol</label>
              <input
                type="text"
                id="currencySymbol"
                name="currencySymbol"
                value={formState.currencySymbol || "$"}
                onChange={handleInputChange}
                maxLength={3}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select
              id="language"
              name="language"
              value={formState.language || "en"}
              onChange={handleInputChange}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>
        </div>
        <div className="settings-section">
          <h2>Tax Settings</h2>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="taxEnabled"
              name="taxEnabled"
              checked={formState.taxEnabled || false}
              onChange={handleInputChange}
            />
            <label htmlFor="taxEnabled">Enable Tax</label>
          </div>

          <div className="form-group">
            <label htmlFor="taxRate">Tax Rate (%)</label>
            <input
              type="number"
              id="taxRate"
              name="taxRate"
              value={formState.taxRate || 0}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.01"
              disabled={!formState.taxEnabled}
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="taxInclusivePrice"
              name="taxInclusivePrice"
              checked={formState.taxInclusivePrice || false}
              onChange={handleInputChange}
              disabled={!formState.taxEnabled}
            />
            <label htmlFor="taxInclusivePrice">Prices include tax</label>
          </div>
        </div>
        <div className="settings-section">
          <h2>Receipt Settings</h2>

          <div className="form-group">
            <label htmlFor="receiptHeader">Receipt Header</label>
            <textarea
              id="receiptHeader"
              name="receiptHeader"
              value={formState.receiptHeader || ""}
              onChange={handleInputChange}
              rows={2}
            />
          </div>

          <div className="form-group">
            <label htmlFor="receiptFooter">Receipt Footer</label>
            <textarea
              id="receiptFooter"
              name="receiptFooter"
              value={formState.receiptFooter || ""}
              onChange={handleInputChange}
              rows={2}
            />
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="printReceiptAutomatically"
              name="printReceiptAutomatically"
              checked={formState.printReceiptAutomatically || false}
              onChange={handleInputChange}
            />
            <label htmlFor="printReceiptAutomatically">
              Print receipt automatically after sale
            </label>
          </div>
        </div>
        <div className="settings-section">
          <h2>Display Settings</h2>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="showProductImages"
              name="showProductImages"
              checked={formState.showProductImages || false}
              onChange={handleInputChange}
            />
            <label htmlFor="showProductImages">Show product images</label>
          </div>

          <div className="form-group">
            <label htmlFor="defaultCategory">Default Category</label>
            <select
              id="defaultCategory"
              name="defaultCategory"
              value={formState.defaultCategory || "all"}
              onChange={handleInputChange}
            >
              <option value="all">All Products</option>
              {/* We would fetch and map actual categories here */}
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h2>Security Settings</h2>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="pinEnabled"
              name="pinEnabled"
              checked={formState.pinEnabled || false}
              onChange={handleInputChange}
            />
            <label htmlFor="pinEnabled">Enable PIN Protection</label>
          </div>

          {formState.pinEnabled && (
            <div className="form-group">
              <label htmlFor="pinCode">PIN Code (4 digits)</label>
              <input
                type="password"
                id="pinCode"
                name="pinCode"
                pattern="[0-9]{4}"
                maxLength={4}
                value={formState.pinCode || ""}
                onChange={handleInputChange}
                placeholder="Enter 4-digit PIN"
                required={formState.pinEnabled}
              />
              <small className="form-hint">
                Please remember this PIN. It will be required to access the
                application.
              </small>
            </div>
          )}
        </div>

        <div className="settings-actions">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button type="submit" className="btn-primary">
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
