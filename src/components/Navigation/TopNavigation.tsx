import React from "react";
import "./TopNavigation.css";

interface TopNavigationProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onNavigate,
  activePage,
}) => {
  return (
    <div className="top-navigation">
      <div className="nav-buttons">
        <button
          className={`nav-button ${activePage === "home" ? "active" : ""}`}
          onClick={() => onNavigate("home")}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>

        <button
          className={`nav-button ${activePage === "orders" ? "active" : ""}`}
          onClick={() => onNavigate("orders")}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">Orders</span>
        </button>

        <button
          className={`nav-button ${activePage === "products" ? "active" : ""}`}
          onClick={() => onNavigate("products")}
        >
          <span className="nav-icon">📦</span>
          <span className="nav-label">Products</span>
        </button>

        <button
          className={`nav-button ${
            activePage === "categories" ? "active" : ""
          }`}
          onClick={() => onNavigate("categories")}
        >
          <span className="nav-icon">🏷️</span>
          <span className="nav-label">Categories</span>
        </button>

        <button
          className={`nav-button ${activePage === "reports" ? "active" : ""}`}
          onClick={() => onNavigate("reports")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Reports</span>
        </button>

        <button
          className={`nav-button ${activePage === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default TopNavigation;
