"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const electron = require("electron");
const path = require("path");
const sqlite3 = require("sqlite3");
const fs = require("fs");
const Store = require("electron-store");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const path__namespace = /* @__PURE__ */ _interopNamespaceDefault(path);
const sqlite3__namespace = /* @__PURE__ */ _interopNamespaceDefault(sqlite3);
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
class DatabaseService {
  constructor() {
    __publicField(this, "db", null);
    __publicField(this, "dbPath");
    const userDataPath = electron.app.getPath("userData");
    this.dbPath = path__namespace.join(userDataPath, "pos-database.db");
    if (!fs__namespace.existsSync(userDataPath)) {
      fs__namespace.mkdirSync(userDataPath, { recursive: true });
    }
    this.init();
  }
  // Initialize the database schema
  init() {
    try {
      this.db = new sqlite3__namespace.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          return;
        }
        console.log("Database connection established");
        this.createTables();
      });
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
  createTables() {
    var _a;
    const sql = `
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category_id INTEGER,
        barcode TEXT,
        image TEXT,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total REAL NOT NULL,
        tax REAL NOT NULL,
        payment_method TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `;
    (_a = this.db) == null ? void 0 : _a.exec(sql, (err) => {
      if (err) {
        console.error("Error creating tables:", err);
      } else {
        console.log("Database tables created successfully");
        this.initSampleData();
      }
    });
  }
  // Initialize sample data if database is empty
  initSampleData() {
    if (!this.db)
      return;
    this.db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
      if (err) {
        console.error("Error checking categories:", err);
        return;
      }
      if (row && row.count === 0) {
        console.log("Adding sample data...");
        this.addSampleCategories();
      }
    });
  }
  addSampleCategories() {
    if (!this.db)
      return;
    const categories = [
      { name: "Drinks", display_order: 1 },
      { name: "Food", display_order: 2 },
      { name: "Desserts", display_order: 3 },
      { name: "Sides", display_order: 4 }
    ];
    const stmt = this.db.prepare(
      "INSERT INTO categories (name, display_order) VALUES (?, ?)"
    );
    categories.forEach((cat) => {
      stmt.run(cat.name, cat.display_order);
    });
    stmt.finalize(() => {
      console.log("Sample categories added");
      this.addSampleProducts();
    });
  }
  addSampleProducts() {
    if (!this.db)
      return;
    const products = [
      { name: "Coffee", price: 3.5, category_id: 1, barcode: "123456789" },
      { name: "Tea", price: 2.5, category_id: 1, barcode: "223456789" },
      { name: "Water", price: 1.5, category_id: 1, barcode: "323456789" },
      { name: "Sandwich", price: 5.99, category_id: 2, barcode: "523456789" },
      { name: "Cake", price: 3.25, category_id: 3, barcode: "823456789" },
      { name: "Fries", price: 2.5, category_id: 4, barcode: "113456789" }
    ];
    const stmt = this.db.prepare(
      "INSERT INTO products (name, price, category_id, barcode) VALUES (?, ?, ?, ?)"
    );
    products.forEach((prod) => {
      stmt.run(prod.name, prod.price, prod.category_id, prod.barcode);
    });
    stmt.finalize(() => {
      console.log("Sample products added");
    });
  }
  // Category methods
  getCategories() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.all(
        "SELECT * FROM categories ORDER BY display_order, name",
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  getCategoryById(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.get("SELECT * FROM categories WHERE id = ?", [id], (err, row) => {
        if (err)
          reject(err);
        else
          resolve(row);
      });
    });
  }
  addCategory(category) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.run(
        "INSERT INTO categories (name, display_order) VALUES (?, ?)",
        [category.name, category.display_order || 0],
        function(err) {
          if (err)
            reject(err);
          else
            resolve(this.lastID);
        }
      );
    });
  }
  updateCategory(category) {
    return new Promise((resolve, reject) => {
      if (!this.db || !category.id) {
        reject(new Error("Database not initialized or invalid category ID"));
        return;
      }
      this.db.run(
        "UPDATE categories SET name = ?, display_order = ? WHERE id = ?",
        [category.name, category.display_order || 0, category.id],
        function(err) {
          if (err)
            reject(err);
          else
            resolve(this.changes > 0);
        }
      );
    });
  }
  deleteCategory(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.run("DELETE FROM categories WHERE id = ?", [id], function(err) {
        if (err)
          reject(err);
        else
          resolve(this.changes > 0);
      });
    });
  }
  // Product methods
  getProducts() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.all(
        `
        SELECT p.*, c.name as category 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name
      `,
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  getProductsByCategory(categoryId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.all(
        `
        SELECT p.*, c.name as category 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.category_id = ?
        ORDER BY p.name
      `,
        [categoryId],
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  searchProducts(query) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const searchTerm = `%${query}%`;
      this.db.all(
        `
        SELECT p.*, c.name as category 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.name LIKE ? OR p.barcode LIKE ?
        ORDER BY p.name
      `,
        [searchTerm, searchTerm],
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  getProductById(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.get(
        `
        SELECT p.*, c.name as category 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
        [id],
        (err, row) => {
          if (err)
            reject(err);
          else
            resolve(row);
        }
      );
    });
  }
  addProduct(product) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.run(
        `
        INSERT INTO products (name, price, category_id, barcode, image) 
        VALUES (?, ?, ?, ?, ?)
      `,
        [
          product.name,
          product.price,
          product.category_id,
          product.barcode || null,
          product.image || null
        ],
        function(err) {
          if (err)
            reject(err);
          else
            resolve(this.lastID);
        }
      );
    });
  }
  updateProduct(product) {
    return new Promise((resolve, reject) => {
      if (!this.db || !product.id) {
        reject(new Error("Database not initialized or invalid product ID"));
        return;
      }
      this.db.run(
        `
        UPDATE products 
        SET name = ?, price = ?, category_id = ?, barcode = ?, image = ?
        WHERE id = ?
      `,
        [
          product.name,
          product.price,
          product.category_id,
          product.barcode || null,
          product.image || null,
          product.id
        ],
        function(err) {
          if (err)
            reject(err);
          else
            resolve(this.changes > 0);
        }
      );
    });
  }
  deleteProduct(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.run("DELETE FROM products WHERE id = ?", [id], function(err) {
        if (err)
          reject(err);
        else
          resolve(this.changes > 0);
      });
    });
  }
  // Order methods
  getOrders() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.all(
        `
        SELECT * FROM orders
        ORDER BY created_at DESC
      `,
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  getOrderById(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.get("SELECT * FROM orders WHERE id = ?", [id], (err, order) => {
        if (err) {
          reject(err);
          return;
        }
        if (!order) {
          resolve(void 0);
          return;
        }
        this.db.all(
          `
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
          `,
          [id],
          (err2, items) => {
            if (err2) {
              reject(err2);
              return;
            }
            const result = {
              ...order,
              items: items || []
            };
            resolve(result);
          }
        );
      });
    });
  }
  addOrder(order) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      const db = this.db;
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) {
          reject(err);
          return;
        }
        db.run(
          "INSERT INTO orders (total, tax, payment_method) VALUES (?, ?, ?)",
          [order.total, order.tax, order.payment_method],
          function(err2) {
            if (err2) {
              db.run("ROLLBACK", () => {
                reject(err2);
              });
              return;
            }
            const orderId = this.lastID;
            if (!order.items || order.items.length === 0) {
              db.run("COMMIT", (err3) => {
                if (err3) {
                  reject(err3);
                } else {
                  resolve(orderId);
                }
              });
              return;
            }
            let completed = 0;
            let hasError = false;
            const itemCount = order.items.length;
            const checkComplete = () => {
              if (completed === itemCount) {
                if (hasError) {
                  db.run("ROLLBACK", () => {
                    reject(new Error("Error adding order items"));
                  });
                } else {
                  db.run("COMMIT", (err3) => {
                    if (err3) {
                      reject(err3);
                    } else {
                      resolve(orderId);
                    }
                  });
                }
              }
            };
            order.items.forEach((item) => {
              db.run(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [orderId, item.product_id, item.quantity, item.price],
                (err3) => {
                  completed++;
                  if (err3) {
                    console.error("Error adding order item:", err3);
                    hasError = true;
                  }
                  checkComplete();
                }
              );
            });
          }
        );
      });
    });
  }
  getOrdersByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.all(
        `
        SELECT * FROM orders
        WHERE created_at BETWEEN ? AND ?
        ORDER BY created_at DESC
      `,
        [startDate, endDate],
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  deleteOrder(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.run("DELETE FROM orders WHERE id = ?", [id], function(err) {
        if (err)
          reject(err);
        else
          resolve(this.changes > 0);
      });
    });
  }
  // Utility methods for reports and statistics
  getTopSellingProducts(limit = 10) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.all(
        `
        SELECT p.id, p.name, SUM(oi.quantity) as total_quantity
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        GROUP BY p.id
        ORDER BY total_quantity DESC
        LIMIT ?
      `,
        [limit],
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  getDailySales(days = 30) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.all(
        `
        SELECT 
          date(created_at) as date, 
          SUM(total) as total_sales,
          COUNT(*) as order_count
        FROM orders
        WHERE created_at >= date('now', '-' || ? || ' days')
        GROUP BY date(created_at)
        ORDER BY date(created_at)
      `,
        [days],
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  getSalesByCategory() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }
      this.db.all(
        `
        SELECT 
          c.name as category, 
          SUM(oi.quantity * oi.price) as total_sales
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN categories c ON p.category_id = c.id
        GROUP BY c.id
        ORDER BY total_sales DESC
      `,
        (err, rows) => {
          if (err)
            reject(err);
          else
            resolve(rows || []);
        }
      );
    });
  }
  // Close the database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err)
          console.error("Error closing database:", err);
        else
          console.log("Database connection closed");
      });
      this.db = null;
    }
  }
}
const databaseService = new DatabaseService();
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
    defaultCategory: "all",
    // Security settings
    pinEnabled: false,
    pinCode: ""
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
