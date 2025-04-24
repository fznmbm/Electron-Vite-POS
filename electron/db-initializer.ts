import { app } from "electron";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

// Sample categories for initialization
const defaultCategories = [
  { name: "Drinks", display_order: 1 },
  { name: "Food", display_order: 2 },
  { name: "Desserts", display_order: 3 },
  { name: "Sides", display_order: 4 },
];

// Sample products for initialization
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
  { name: "Onion Rings", price: 2.75, category_id: 4, barcode: "123456780" },
];

// Initialize database with default data if it's empty
export function initializeDatabase() {
  const userDataPath = app.getPath("userData");
  const dbPath = path.join(userDataPath, "pos-database.db");

  // Ensure the directory exists
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  try {
    const db = new Database(dbPath);

    // Create tables if they don't exist
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

    // Check if the categories table is empty
    const categoryCount = db
      .prepare("SELECT COUNT(*) as count FROM categories")
      .get();
    if (categoryCount.count === 0) {
      console.log("Initializing database with default categories");
      const insertCategory = db.prepare(
        "INSERT INTO categories (name, display_order) VALUES (?, ?)"
      );

      for (const category of defaultCategories) {
        insertCategory.run(category.name, category.display_order);
      }
    }

    // Check if the products table is empty
    const productCount = db
      .prepare("SELECT COUNT(*) as count FROM products")
      .get();
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

    // Sample orders for demonstration
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get();
    if (orderCount.count === 0) {
      console.log("Initializing database with sample orders");

      // Create sample orders
      const today = new Date();

      // Create orders for the past 30 days
      for (let i = 0; i < 30; i++) {
        const orderDate = new Date(today);
        orderDate.setDate(today.getDate() - i);

        // Add 1-3 orders per day
        const ordersPerDay = Math.floor(Math.random() * 3) + 1;

        for (let j = 0; j < ordersPerDay; j++) {
          // Create order
          const orderTotal = Math.random() * 50 + 10; // Random total between $10 and $60
          const taxRate = 0.085; // 8.5% tax rate
          const taxAmount = orderTotal * taxRate;
          const paymentMethods = ["cash", "card"];
          const paymentMethod =
            paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

          // Insert order with custom date
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

          const orderId = result.lastInsertRowid as number;

          // Add 1-5 random items to the order
          const itemCount = Math.floor(Math.random() * 5) + 1;
          const insertOrderItem = db.prepare(`
            INSERT INTO order_items (order_id, product_id, quantity, price) 
            VALUES (?, ?, ?, ?)
          `);

          for (let k = 0; k < itemCount; k++) {
            const productId =
              Math.floor(Math.random() * defaultProducts.length) + 1;
            const quantity = Math.floor(Math.random() * 3) + 1;
            const product = defaultProducts[productId - 1];

            insertOrderItem.run(orderId, productId, quantity, product.price);
          }
        }
      }
    }

    // Close database
    db.close();
    console.log("Database initialization completed");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}
