// This file should be placed in dist-electron/mock-database.js
const { app } = require("electron");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Create class with all the database operations
class DatabaseService {
  constructor() {
    this.db = null;
    const userDataPath = app.getPath("userData");
    this.dbPath = path.join(userDataPath, "pos-database.db");

    // Ensure directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    this.init();
  }

  init() {
    try {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error("Error opening database:", err);
          return;
        }

        console.log("Database connection established");

        // Create tables
        this.createTables();
      });
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  createTables() {
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

    this.db.exec(sql, (err) => {
      if (err) {
        console.error("Error creating tables:", err);
      } else {
        console.log("Database tables created successfully");
        this.initSampleData();
      }
    });
  }

  initSampleData() {
    // Check if we need to add sample data
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
    const categories = [
      { name: "Drinks", display_order: 1 },
      { name: "Food", display_order: 2 },
      { name: "Desserts", display_order: 3 },
      { name: "Sides", display_order: 4 },
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
    const products = [
      { name: "Coffee", price: 3.5, category_id: 1, barcode: "123456789" },
      { name: "Tea", price: 2.5, category_id: 1, barcode: "223456789" },
      { name: "Water", price: 1.5, category_id: 1, barcode: "323456789" },
      { name: "Sandwich", price: 5.99, category_id: 2, barcode: "523456789" },
      { name: "Cake", price: 3.25, category_id: 3, barcode: "823456789" },
      { name: "Fries", price: 2.5, category_id: 4, barcode: "113456789" },
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

  // Database methods with Promise wrappers
  getCategories() {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT * FROM categories ORDER BY display_order, name",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getCategoryById(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM categories WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  addCategory(category) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO categories (name, display_order) VALUES (?, ?)",
        [category.name, category.display_order || 0],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  updateCategory(category) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE categories SET name = ?, display_order = ? WHERE id = ?",
        [category.name, category.display_order || 0, category.id],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  deleteCategory(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM categories WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  getProducts() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT p.*, c.name as category 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.name
      `,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getProductsByCategory(categoryId) {
    return new Promise((resolve, reject) => {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  searchProducts(query) {
    return new Promise((resolve, reject) => {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getProductById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `
        SELECT p.*, c.name as category 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  addProduct(product) {
    return new Promise((resolve, reject) => {
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
          product.image || null,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  updateProduct(product) {
    return new Promise((resolve, reject) => {
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
          product.id,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  deleteProduct(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  getOrders() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT * FROM orders
        ORDER BY created_at DESC
      `,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getOrderById(id) {
    return new Promise((resolve, reject) => {
      this.db.get("SELECT * FROM orders WHERE id = ?", [id], (err, order) => {
        if (err) {
          reject(err);
          return;
        }

        if (!order) {
          resolve(undefined);
          return;
        }

        // Get order items
        this.db.all(
          `
            SELECT oi.*, p.name as product_name
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = ?
          `,
          [id],
          (err, items) => {
            if (err) {
              reject(err);
              return;
            }

            const result = {
              ...order,
              items: items || [],
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

      this.db.serialize(() => {
        this.db.run("BEGIN TRANSACTION");

        this.db.run(
          "INSERT INTO orders (total, tax, payment_method) VALUES (?, ?, ?)",
          [order.total, order.tax, order.payment_method],
          function (err) {
            if (err) {
              this.db.run("ROLLBACK");
              reject(err);
              return;
            }

            const orderId = this.lastID;

            // Add order items
            if (order.items && order.items.length > 0) {
              const stmt = this.db.prepare(`
                INSERT INTO order_items (order_id, product_id, quantity, price) 
                VALUES (?, ?, ?, ?)
              `);

              let hasError = false;

              order.items.forEach((item) => {
                stmt.run(
                  [orderId, item.product_id, item.quantity, item.price],
                  (err) => {
                    if (err) {
                      hasError = true;
                      console.error("Error adding order item:", err);
                    }
                  }
                );
              });

              stmt.finalize((err) => {
                if (err || hasError) {
                  this.db.run("ROLLBACK");
                  reject(err || new Error("Error adding order items"));
                } else {
                  this.db.run("COMMIT");
                  resolve(orderId);
                }
              });
            } else {
              this.db.run("COMMIT");
              resolve(orderId);
            }
          }
        );
      });
    });
  }

  getOrdersByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT * FROM orders
        WHERE created_at BETWEEN ? AND ?
        ORDER BY created_at DESC
      `,
        [startDate, endDate],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  deleteOrder(id) {
    return new Promise((resolve, reject) => {
      this.db.run("DELETE FROM orders WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  getTopSellingProducts(limit = 10) {
    return new Promise((resolve, reject) => {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getDailySales(days = 30) {
    return new Promise((resolve, reject) => {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getSalesByCategory() {
    return new Promise((resolve, reject) => {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) console.error("Error closing database:", err);
        else console.log("Database connection closed");
      });
      this.db = null;
    }
  }
}

// Export the database service instance
module.exports = new DatabaseService();
