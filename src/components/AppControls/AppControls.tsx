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
        <span className="close-button-text">×</span>
      </button>
    </div>
  );
};

export default AppControls;
