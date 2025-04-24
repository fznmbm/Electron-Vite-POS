"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(
      channel,
      (event, ...args2) => listener(event, ...args2)
    );
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("electron", {
  appControls: {
    close: () => electron.ipcRenderer.send("app:close"),
    minimize: () => electron.ipcRenderer.send("app:minimize"),
    maximize: () => electron.ipcRenderer.send("app:maximize"),
    toggleFullscreen: () => electron.ipcRenderer.send("app:toggleFullscreen")
  }
});
electron.contextBridge.exposeInMainWorld("db", {
  // Categories
  getCategories: () => electron.ipcRenderer.invoke("db:getCategories"),
  getCategoryById: (id) => electron.ipcRenderer.invoke("db:getCategoryById", id),
  addCategory: (category) => electron.ipcRenderer.invoke("db:addCategory", category),
  updateCategory: (category) => electron.ipcRenderer.invoke("db:updateCategory", category),
  deleteCategory: (id) => electron.ipcRenderer.invoke("db:deleteCategory", id),
  // Products
  getProducts: () => electron.ipcRenderer.invoke("db:getProducts"),
  getProductsByCategory: (categoryId) => electron.ipcRenderer.invoke("db:getProductsByCategory", categoryId),
  searchProducts: (query) => electron.ipcRenderer.invoke("db:searchProducts", query),
  getProductById: (id) => electron.ipcRenderer.invoke("db:getProductById", id),
  addProduct: (product) => electron.ipcRenderer.invoke("db:addProduct", product),
  updateProduct: (product) => electron.ipcRenderer.invoke("db:updateProduct", product),
  deleteProduct: (id) => electron.ipcRenderer.invoke("db:deleteProduct", id),
  // Orders
  getOrders: () => electron.ipcRenderer.invoke("db:getOrders"),
  getOrderById: (id) => electron.ipcRenderer.invoke("db:getOrderById", id),
  addOrder: (order) => electron.ipcRenderer.invoke("db:addOrder", order),
  getOrdersByDateRange: (startDate, endDate) => electron.ipcRenderer.invoke("db:getOrdersByDateRange", startDate, endDate),
  deleteOrder: (id) => electron.ipcRenderer.invoke("db:deleteOrder", id),
  // Reports
  getTopSellingProducts: (limit = 10) => electron.ipcRenderer.invoke("db:getTopSellingProducts", limit),
  getDailySales: (days = 30) => electron.ipcRenderer.invoke("db:getDailySales", days),
  getSalesByCategory: () => electron.ipcRenderer.invoke("db:getSalesByCategory")
});
electron.contextBridge.exposeInMainWorld("settings", {
  getAll: () => electron.ipcRenderer.invoke("settings:getAll"),
  get: (key) => electron.ipcRenderer.invoke("settings:get", key),
  set: (key, value) => electron.ipcRenderer.invoke("settings:set", key, value),
  update: (settings) => electron.ipcRenderer.invoke("settings:update", settings),
  reset: () => electron.ipcRenderer.invoke("settings:reset")
});
