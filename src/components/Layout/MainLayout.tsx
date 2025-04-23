import React from "react";
import "./MainLayout.css";
//import AppControls from "../components/AppControls/AppControls";
import AppControls from "../AppControls/AppControls";

interface MainLayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  sidebar,
  content,
  footer,
}) => {
  return (
    <div className="pos-layout">
      <div className="pos-content">{content}</div>
      <div className="pos-sidebar">{sidebar}</div>
      {footer && <div className="pos-footer">{footer}</div>}
    </div>
  );
};

export default MainLayout;
