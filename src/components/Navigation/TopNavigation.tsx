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
          Home
        </button>
        <button
          className={`nav-button ${activePage === "orders" ? "active" : ""}`}
          onClick={() => onNavigate("orders")}
        >
          <span className="nav-icon">📋</span>
          Past Orders
        </button>
        <button
          className={`nav-button ${activePage === "settings" ? "active" : ""}`}
          onClick={() => onNavigate("settings")}
        >
          <span className="nav-icon">⚙️</span>
          Settings
        </button>
      </div>
    </div>
  );
};

export default TopNavigation;
