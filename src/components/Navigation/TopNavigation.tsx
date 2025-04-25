import React from "react";
import "./TopNavigation.css";
import { useRefresh } from "../../contexts/RefreshContext";

interface TopNavigationProps {
  onNavigate: (page: string) => void;
  activePage: string;
}

const TopNavigation: React.FC<TopNavigationProps> = ({
  onNavigate,
  activePage,
}) => {
  const { refreshData } = useRefresh();

  const handleNavigate = (page: string) => {
    refreshData(); // Refresh data when navigating
    onNavigate(page);
  };

  return (
    <div className="top-navigation">
      <div className="nav-buttons">
        <button
          className={`nav-button ${activePage === "home" ? "active" : ""}`}
          onClick={() => handleNavigate("home")}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </button>

        <button
          className={`nav-button ${activePage === "orders" ? "active" : ""}`}
          onClick={() => handleNavigate("orders")}
        >
          <span className="nav-icon">📋</span>
          <span className="nav-label">Orders</span>
        </button>

        <button
          className={`nav-button ${activePage === "products" ? "active" : ""}`}
          onClick={() => handleNavigate("products")}
        >
          <span className="nav-icon">📦</span>
          <span className="nav-label">Products</span>
        </button>

        <button
          className={`nav-button ${
            activePage === "categories" ? "active" : ""
          }`}
          onClick={() => handleNavigate("categories")}
        >
          <span className="nav-icon">🏷️</span>
          <span className="nav-label">Categories</span>
        </button>

        <button
          className={`nav-button ${activePage === "reports" ? "active" : ""}`}
          onClick={() => handleNavigate("reports")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Reports</span>
        </button>

        <button
          className={`nav-button ${activePage === "settings" ? "active" : ""}`}
          onClick={() => handleNavigate("settings")}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default TopNavigation;
