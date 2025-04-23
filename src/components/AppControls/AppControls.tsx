// src/components/AppControls/AppControls.tsx
import React from "react";
import "./AppControls.css";

const AppControls: React.FC = () => {
  const handleClose = () => {
    if (window.electron?.appControls) {
      window.electron.appControls.close();
    } else {
      console.log("Close button clicked, but not in Electron context");
      window.close();
    }
  };

  return (
    <div className="app-controls">
      <button
        className="app-control-button close-button"
        onClick={handleClose}
        title="Close Application"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.5 3.5L3.5 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M3.5 3.5L12.5 12.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default AppControls;
