"use strict";
const electron = require("electron");
const path = require("path");
const Store = require("electron-store");
const settingsStore = new Store({
  name: "pos-settings",
  defaults: {
    // Business information
    companyName: "My POS Store",
    address: "123 Main Street, City, State, ZIP",
    phone: "(123) 456-7890",
    email: "info@myposstore.com",
    website: "www.myposstore.com",
    // Regional settings
    currency: "USD",
    currencySymbol: "$",
    language: "en",
    // Tax settings
    taxEnabled: true,
    taxRate: 8.5,
    // Percentage
    taxInclusivePrice: false,
    // Receipt settings
    receiptHeader: "Thank you for your purchase!",
    receiptFooter: "Please come again!",
    printReceiptAutomatically: true,
    // Display settings
    showProductImages: true,
    defaultCategory: "all"
  }
});
class SettingsService {
  // Get all settings
  getAll() {
    return settingsStore.store;
  }
  // Get a specific setting
  get(key) {
    return settingsStore.get(key);
  }
  // Set a specific setting
  set(key, value) {
    settingsStore.set(key, value);
  }
  // Update multiple settings at once
  update(settings) {
    for (const [key, value] of Object.entries(settings)) {
      settingsStore.set(key, value);
    }
  }
  // Reset settings to defaults
  reset() {
    settingsStore.clear();
  }
}
const settingsService = new SettingsService();
const databaseService = require("./mock-database");
function setupIPCHandlers() {
  try {
    console.log("Setting up IPC handlers...");
    electron.ipcMain.handle("db:getCategories", async () => {
      try {
        return await databaseService.getCategories();
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:getCategoryById", async (_, id) => {
      try {
        return await databaseService.getCategoryById(id);
      } catch (error) {
        console.error("Error fetching category by ID:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:addCategory", async (_, category) => {
      try {
        return await databaseService.addCategory(category);
      } catch (error) {
        console.error("Error adding category:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:updateCategory", async (_, category) => {
      try {
        return await databaseService.updateCategory(category);
      } catch (error) {
        console.error("Error updating category:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:deleteCategory", async (_, id) => {
      try {
        return await databaseService.deleteCategory(id);
      } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:getProducts", async () => {
      try {
        return await databaseService.getProducts();
      } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
      }
    });
    electron.ipcMain.handle(
      "db:getProductsByCategory",
      async (_, categoryId) => {
        try {
          return await databaseService.getProductsByCategory(categoryId);
        } catch (error) {
          console.error("Error fetching products by category:", error);
          throw error;
        }
      }
    );
    electron.ipcMain.handle("db:searchProducts", async (_, query) => {
      try {
        return await databaseService.searchProducts(query);
      } catch (error) {
        console.error("Error searching products:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:getProductById", async (_, id) => {
      try {
        return await databaseService.getProductById(id);
      } catch (error) {
        console.error("Error fetching product by ID:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:addProduct", async (_, product) => {
      try {
        return await databaseService.addProduct(product);
      } catch (error) {
        console.error("Error adding product:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:updateProduct", async (_, product) => {
      try {
        return await databaseService.updateProduct(product);
      } catch (error) {
        console.error("Error updating product:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:deleteProduct", async (_, id) => {
      try {
        return await databaseService.deleteProduct(id);
      } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:getOrders", async () => {
      try {
        return await databaseService.getOrders();
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:getOrderById", async (_, id) => {
      try {
        return await databaseService.getOrderById(id);
      } catch (error) {
        console.error("Error fetching order by ID:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:addOrder", async (_, order) => {
      try {
        return await databaseService.addOrder(order);
      } catch (error) {
        console.error("Error adding order:", error);
        throw error;
      }
    });
    electron.ipcMain.handle(
      "db:getOrdersByDateRange",
      async (_, startDate, endDate) => {
        try {
          return await databaseService.getOrdersByDateRange(startDate, endDate);
        } catch (error) {
          console.error("Error fetching orders by date range:", error);
          throw error;
        }
      }
    );
    electron.ipcMain.handle("db:deleteOrder", async (_, id) => {
      try {
        return await databaseService.deleteOrder(id);
      } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:getTopSellingProducts", async (_, limit) => {
      try {
        return await databaseService.getTopSellingProducts(limit);
      } catch (error) {
        console.error("Error fetching top selling products:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:getDailySales", async (_, days) => {
      try {
        return await databaseService.getDailySales(days);
      } catch (error) {
        console.error("Error fetching daily sales:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("db:getSalesByCategory", async () => {
      try {
        return await databaseService.getSalesByCategory();
      } catch (error) {
        console.error("Error fetching sales by category:", error);
        throw error;
      }
    });
    electron.ipcMain.handle("settings:getAll", () => {
      return settingsService.getAll();
    });
    electron.ipcMain.handle("settings:get", (_, key) => {
      return settingsService.get(key);
    });
    electron.ipcMain.handle("settings:set", (_, key, value) => {
      settingsService.set(key, value);
      return true;
    });
    electron.ipcMain.handle("settings:update", (_, settings) => {
      settingsService.update(settings);
      return true;
    });
    electron.ipcMain.handle("settings:reset", () => {
      settingsService.reset();
      return true;
    });
    console.log("IPC handlers set up successfully");
  } catch (error) {
    console.error("Error setting up IPC handlers:", error);
  }
}
require(path.join(__dirname, "mock-database.js"));
process.env.NODE_ENV !== "production";
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
let mainWindow = null;
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      // Note: .js not .mjs
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow == null ? void 0 : mainWindow.webContents.send(
      "main-process-message",
      (/* @__PURE__ */ new Date()).toLocaleString()
    );
  });
  setupWindowControls();
  setupIPCHandlers();
  return mainWindow;
}
function setupWindowControls() {
  electron.ipcMain.on("app:close", () => {
    electron.app.quit();
  });
  electron.ipcMain.on("app:minimize", () => {
    const activeWin = electron.BrowserWindow.getFocusedWindow();
    if (activeWin)
      activeWin.minimize();
  });
  electron.ipcMain.on("app:maximize", () => {
    const activeWin = electron.BrowserWindow.getFocusedWindow();
    if (activeWin) {
      if (activeWin.isMaximized()) {
        activeWin.unmaximize();
      } else {
        activeWin.maximize();
      }
    }
  });
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    mainWindow = null;
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.whenReady().then(() => {
  try {
    createWindow();
    registerShortcuts();
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});
function registerShortcuts() {
  electron.globalShortcut.register("Escape", () => {
    const activeWin = electron.BrowserWindow.getFocusedWindow();
    if (activeWin && activeWin.isFullScreen()) {
      activeWin.setFullScreen(false);
    }
  });
  electron.globalShortcut.register("CommandOrControl+Q", () => {
    electron.app.quit();
  });
}
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
