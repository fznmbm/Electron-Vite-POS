// src/contexts/RefreshContext.tsx
import React, { createContext, useContext, useState } from "react";

interface RefreshContextType {
  refreshTrigger: number;
  refreshData: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshTrigger: 0,
  refreshData: () => {},
});

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <RefreshContext.Provider value={{ refreshTrigger, refreshData }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
