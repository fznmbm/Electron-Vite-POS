"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
const electron = require("electron");
const node_url = require("node:url");
const path = require("node:path");
const Database = require("better-sqlite3");
const fs = require("node:fs");
const Store = require("electron-store");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
class DatabaseService {
  constructor() {
    __publicField(this, "db", null);
    __publicField(this, "initialized", false);
    __publicField(this, "dbPath");
    const userDataPath = electron.app.getPath("userData");
    this.dbPath = path.join(userDataPath, "pos-database.db");
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.init();
  }
  // Initialize the database schema
  init() {
    if (this.initialized)
      return;
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma("journal_mode = WAL");
      this.db.exec(`
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
      `);
      this.initialized = true;
      console.log("Database initialized successfully");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }
  // Ensure database connection is available
  ensureConnection() {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      this.db.pragma("journal_mode = WAL");
    }
    return this.db;
  }
  // Category methods
  getCategories() {
    const db = this.ensureConnection();
    const stmt = db.prepare(
      "SELECT * FROM categories ORDER BY display_order, name"
    );
    return stmt.all();
  }
  getCategoryById(id) {
    const db = this.ensureConnection();
    const stmt = db.prepare("SELECT * FROM categories WHERE id = ?");
    return stmt.get(id);
  }
  addCategory(category) {
    const db = this.ensureConnection();
    const stmt = db.prepare(
      "INSERT INTO categories (name, display_order) VALUES (?, ?)"
    );
    const result = stmt.run(category.name, category.display_order);
    return result.lastInsertRowid;
  }
  updateCategory(category) {
    const db = this.ensureConnection();
    const stmt = db.prepare(
      "UPDATE categories SET name = ?, display_order = ? WHERE id = ?"
    );
    const result = stmt.run(category.name, category.display_order, category.id);
    return result.changes > 0;
  }
  deleteCategory(id) {
    const db = this.ensureConnection();
    const stmt = db.prepare("DELETE FROM categories WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
  // Product methods
  getProducts() {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT p.*, c.name as category 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    return stmt.all();
  }
  getProductsByCategory(categoryId) {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT p.*, c.name as category 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ?
      ORDER BY p.name
    `);
    return stmt.all(categoryId);
  }
  searchProducts(query) {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT p.*, c.name as category 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.name LIKE ? OR p.barcode LIKE ?
      ORDER BY p.name
    `);
    const searchQuery = `%${query}%`;
    return stmt.all(searchQuery, searchQuery);
  }
  getProductById(id) {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT p.*, c.name as category 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `);
    return stmt.get(id);
  }
  addProduct(product) {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      INSERT INTO products (name, price, category_id, barcode, image) 
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      product.name,
      product.price,
      product.category_id,
      product.barcode || null,
      product.image || null
    );
    return result.lastInsertRowid;
  }
  updateProduct(product) {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, price = ?, category_id = ?, barcode = ?, image = ?
      WHERE id = ?
    `);
    const result = stmt.run(
      product.name,
      product.price,
      product.category_id,
      product.barcode || null,
      product.image || null,
      product.id
    );
    return result.changes > 0;
  }
  deleteProduct(id) {
    const db = this.ensureConnection();
    const stmt = db.prepare("DELETE FROM products WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
  // Order methods
  getOrders() {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT * FROM orders
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }
  getOrderById(id) {
    const db = this.ensureConnection();
    const stmt = db.prepare("SELECT * FROM orders WHERE id = ?");
    const order = stmt.get(id);
    if (order) {
      const itemsStmt = db.prepare(`
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `);
      order.items = itemsStmt.all(id);
    }
    return order;
  }
  addOrder(order) {
    const db = this.ensureConnection();
    const transaction = db.transaction((order2) => {
      const orderStmt = db.prepare(`
        INSERT INTO orders (total, tax, payment_method) 
        VALUES (?, ?, ?)
      `);
      const orderResult = orderStmt.run(
        order2.total,
        order2.tax,
        order2.payment_method
      );
      const orderId = orderResult.lastInsertRowid;
      if (order2.items && order2.items.length > 0) {
        const itemStmt = db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, price) 
          VALUES (?, ?, ?, ?)
        `);
        for (const item of order2.items) {
          itemStmt.run(orderId, item.product_id, item.quantity, item.price);
        }
      }
      return orderId;
    });
    return transaction(order);
  }
  getOrdersByDateRange(startDate, endDate) {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT * FROM orders
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `);
    return stmt.all(startDate, endDate);
  }
  deleteOrder(id) {
    const db = this.ensureConnection();
    const stmt = db.prepare("DELETE FROM orders WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }
  // Utility methods for reports and statistics
  getTopSellingProducts(limit = 10) {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT p.id, p.name, SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
  getDailySales(days = 30) {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT 
        date(created_at) as date, 
        SUM(total) as total_sales,
        COUNT(*) as order_count
      FROM orders
      WHERE created_at >= date('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date(created_at)
    `);
    return stmt.all(days);
  }
  getSalesByCategory() {
    const db = this.ensureConnection();
    const stmt = db.prepare(`
      SELECT 
        c.name as category, 
        SUM(oi.quantity * oi.price) as total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY total_sales DESC
    `);
    return stmt.all();
  }
  // Close the database connection
  close() {
    if (this.db) {
      this.db.close();
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
function setupIPCHandlers() {
  try {
    electron.ipcMain.handle("db:getCategories", () => {
      return databaseService.getCategories();
    });
    electron.ipcMain.handle("db:getCategoryById", (_, id) => {
      return databaseService.getCategoryById(id);
    });
    electron.ipcMain.handle("db:addCategory", (_, category) => {
      return databaseService.addCategory(category);
    });
    electron.ipcMain.handle("db:updateCategory", (_, category) => {
      return databaseService.updateCategory(category);
    });
    electron.ipcMain.handle("db:deleteCategory", (_, id) => {
      return databaseService.deleteCategory(id);
    });
    electron.ipcMain.handle("db:getProducts", () => {
      return databaseService.getProducts();
    });
    electron.ipcMain.handle("db:getProductsByCategory", (_, categoryId) => {
      return databaseService.getProductsByCategory(categoryId);
    });
    electron.ipcMain.handle("db:searchProducts", (_, query) => {
      return databaseService.searchProducts(query);
    });
    electron.ipcMain.handle("db:getProductById", (_, id) => {
      return databaseService.getProductById(id);
    });
    electron.ipcMain.handle("db:addProduct", (_, product) => {
      return databaseService.addProduct(product);
    });
    electron.ipcMain.handle("db:updateProduct", (_, product) => {
      return databaseService.updateProduct(product);
    });
    electron.ipcMain.handle("db:deleteProduct", (_, id) => {
      return databaseService.deleteProduct(id);
    });
    electron.ipcMain.handle("db:getOrders", () => {
      return databaseService.getOrders();
    });
    electron.ipcMain.handle("db:getOrderById", (_, id) => {
      return databaseService.getOrderById(id);
    });
    electron.ipcMain.handle("db:addOrder", (_, order) => {
      return databaseService.addOrder(order);
    });
    electron.ipcMain.handle(
      "db:getOrdersByDateRange",
      (_, startDate, endDate) => {
        return databaseService.getOrdersByDateRange(startDate, endDate);
      }
    );
    electron.ipcMain.handle("db:deleteOrder", (_, id) => {
      return databaseService.deleteOrder(id);
    });
    electron.ipcMain.handle("db:getTopSellingProducts", (_, limit) => {
      return databaseService.getTopSellingProducts(limit);
    });
    electron.ipcMain.handle("db:getDailySales", (_, days) => {
      return databaseService.getDailySales(days);
    });
    electron.ipcMain.handle("db:getSalesByCategory", () => {
      return databaseService.getSalesByCategory();
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
const defaultCategories = [
  { name: "Drinks", display_order: 1 },
  { name: "Food", display_order: 2 },
  { name: "Desserts", display_order: 3 },
  { name: "Sides", display_order: 4 }
];
const defaultProducts = [
  { name: "Coffee", price: 3.5, category_id: 1, barcode: "123456789" },
  { name: "Tea", price: 2.5, category_id: 1, barcode: "223456789" },
  { name: "Water", price: 1.5, category_id: 1, barcode: "323456789" },
  { name: "Soda", price: 1.99, category_id: 1, barcode: "423456789" },
  { name: "Sandwich", price: 5.99, category_id: 2, barcode: "523456789" },
  { name: "Burger", price: 6.5, category_id: 2, barcode: "623456789" },
  { name: "Pizza Slice", price: 4.5, category_id: 2, barcode: "723456789" },
  { name: "Cake", price: 3.25, category_id: 3, barcode: "823456789" },
  { name: "Ice Cream", price: 3.99, category_id: 3, barcode: "923456789" },
  { name: "Muffin", price: 2.75, category_id: 3, barcode: "103456789" },
  { name: "Fries", price: 2.5, category_id: 4, barcode: "113456789" },
  { name: "Onion Rings", price: 2.75, category_id: 4, barcode: "123456780" }
];
function initializeDatabase() {
  const userDataPath = electron.app.getPath("userData");
  const dbPath = path.join(userDataPath, "pos-database.db");
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  try {
    const db = new Database(dbPath);
    db.exec(`
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
    `);
    const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get();
    if (categoryCount.count === 0) {
      console.log("Initializing database with default categories");
      const insertCategory = db.prepare(
        "INSERT INTO categories (name, display_order) VALUES (?, ?)"
      );
      for (const category of defaultCategories) {
        insertCategory.run(category.name, category.display_order);
      }
    }
    const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get();
    if (productCount.count === 0) {
      console.log("Initializing database with default products");
      const insertProduct = db.prepare(`
        INSERT INTO products (name, price, category_id, barcode) 
        VALUES (?, ?, ?, ?)
      `);
      for (const product of defaultProducts) {
        insertProduct.run(
          product.name,
          product.price,
          product.category_id,
          product.barcode
        );
      }
    }
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get();
    if (orderCount.count === 0) {
      console.log("Initializing database with sample orders");
      const today = /* @__PURE__ */ new Date();
      for (let i = 0; i < 30; i++) {
        const orderDate = new Date(today);
        orderDate.setDate(today.getDate() - i);
        const ordersPerDay = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < ordersPerDay; j++) {
          const orderTotal = Math.random() * 50 + 10;
          const taxRate = 0.085;
          const taxAmount = orderTotal * taxRate;
          const paymentMethods = ["cash", "card"];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          const insertOrder = db.prepare(`
            INSERT INTO orders (total, tax, payment_method, created_at) 
            VALUES (?, ?, ?, datetime(?))
          `);
          const result = insertOrder.run(
            orderTotal,
            taxAmount,
            paymentMethod,
            orderDate.toISOString()
          );
          const orderId = result.lastInsertRowid;
          const itemCount = Math.floor(Math.random() * 5) + 1;
          const insertOrderItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, quantity, price) 
            VALUES (?, ?, ?, ?)
          `);
          for (let k = 0; k < itemCount; k++) {
            const productId = Math.floor(Math.random() * defaultProducts.length) + 1;
            const quantity = Math.floor(Math.random() * 3) + 1;
            const product = defaultProducts[productId - 1];
            insertOrderItem.run(orderId, productId, quantity, product.price);
          }
        }
      }
    }
    db.close();
    console.log("Database initialization completed");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}
const __filename$1 = node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href);
const __dirname$1 = path.dirname(__filename$1);
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win = null;
function createWindow() {
  win = new electron.BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1920,
    height: 1080,
    fullscreen: true,
    // This makes the app launch in fullscreen mode
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
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
  setupIPCHandlers();
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    win = null;
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
electron.app.whenReady().then(() => {
  try {
    initializeDatabase();
    createWindow();
    electron.globalShortcut.register("ESC", () => {
      const activeWin = electron.BrowserWindow.getFocusedWindow();
      if (activeWin && activeWin.isFullScreen()) {
        activeWin.setFullScreen(false);
      }
    });
    electron.globalShortcut.register("CommandOrControl+Q", () => {
      electron.app.quit();
    });
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});
electron.app.on("will-quit", () => {
  electron.globalShortcut.unregisterAll();
});
