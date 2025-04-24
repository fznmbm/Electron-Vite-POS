import { ipcRenderer, contextBridge } from "electron";

// --------- Expose IPC API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on: (channel: string, listener: (...args: any[]) => void) => {
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off: (channel: string, listener: (...args: any[]) => void) => {
    return ipcRenderer.off(channel, listener);
  },
  send: (channel: string, ...args: any[]) => {
    return ipcRenderer.send(channel, ...args);
  },
  invoke: (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
});

// --------- Expose electron API for app controls ---------
contextBridge.exposeInMainWorld("electron", {
  appControls: {
    close: () => ipcRenderer.send("app:close"),
    minimize: () => ipcRenderer.send("app:minimize"),
    maximize: () => ipcRenderer.send("app:maximize"),
    toggleFullscreen: () => ipcRenderer.send("app:toggleFullscreen"),
  },
});

// --------- Expose database API ---------
contextBridge.exposeInMainWorld("db", {
  // Categories
  getCategories: () => ipcRenderer.invoke("db:getCategories"),
  getCategoryById: (id: number) => ipcRenderer.invoke("db:getCategoryById", id),
  addCategory: (category: any) =>
    ipcRenderer.invoke("db:addCategory", category),
  updateCategory: (category: any) =>
    ipcRenderer.invoke("db:updateCategory", category),
  deleteCategory: (id: number) => ipcRenderer.invoke("db:deleteCategory", id),

  // Products
  getProducts: () => ipcRenderer.invoke("db:getProducts"),
  getProductsByCategory: (categoryId: number) =>
    ipcRenderer.invoke("db:getProductsByCategory", categoryId),
  searchProducts: (query: string) =>
    ipcRenderer.invoke("db:searchProducts", query),
  getProductById: (id: number) => ipcRenderer.invoke("db:getProductById", id),
  addProduct: (product: any) => ipcRenderer.invoke("db:addProduct", product),
  updateProduct: (product: any) =>
    ipcRenderer.invoke("db:updateProduct", product),
  deleteProduct: (id: number) => ipcRenderer.invoke("db:deleteProduct", id),

  // Orders
  getOrders: () => ipcRenderer.invoke("db:getOrders"),
  getOrderById: (id: number) => ipcRenderer.invoke("db:getOrderById", id),
  addOrder: (order: any) => ipcRenderer.invoke("db:addOrder", order),
  getOrdersByDateRange: (startDate: string, endDate: string) =>
    ipcRenderer.invoke("db:getOrdersByDateRange", startDate, endDate),
  deleteOrder: (id: number) => ipcRenderer.invoke("db:deleteOrder", id),

  // Reports
  getTopSellingProducts: (limit: number = 10) =>
    ipcRenderer.invoke("db:getTopSellingProducts", limit),
  getDailySales: (days: number = 30) =>
    ipcRenderer.invoke("db:getDailySales", days),
  getSalesByCategory: () => ipcRenderer.invoke("db:getSalesByCategory"),
});

// --------- Expose settings API ---------
contextBridge.exposeInMainWorld("settings", {
  getAll: () => ipcRenderer.invoke("settings:getAll"),
  get: (key: string) => ipcRenderer.invoke("settings:get", key),
  set: (key: string, value: any) =>
    ipcRenderer.invoke("settings:set", key, value),
  update: (settings: any) => ipcRenderer.invoke("settings:update", settings),
  reset: () => ipcRenderer.invoke("settings:reset"),
});

console.log("Preload script executed successfully");
