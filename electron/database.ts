import { app } from "electron";
import * as sqlite3 from "sqlite3";
import * as path from "path";
import * as fs from "fs";

// Define types for database entities
export interface Product {
  id?: number;
  name: string;
  price: number;
  category_id: number;
  barcode?: string;
  image?: string;
  category?: string;
}

export interface Category {
  id?: number;
  name: string;
  display_order: number;
}

export interface Order {
  id?: number;
  total: number;
  tax: number;
  discount?: number; // Add this line
  payment_method: string;
  created_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id?: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  product_name?: string;
}

// Database class to manage all operations
class DatabaseService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath("userData");
    this.dbPath = path.join(userDataPath, "pos-database.db");

    // Ensure the directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    this.init();
  }

  // Initialize the database schema
  private init() {
    try {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
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

  private createTables() {
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
        discount REAL DEFAULT 0, /* Add this line */
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

       CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    `;

    this.db?.exec(sql, (err) => {
      if (err) {
        console.error("Error creating tables:", err);
      } else {
        console.log("Database tables created successfully");
        this.initSampleData();
      }
    });
  }

  // Initialize sample data if database is empty
  private initSampleData() {
    if (!this.db) return;

    // Check if categories table is empty
    this.db.get("SELECT COUNT(*) as count FROM categories", (err, row: any) => {
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

  private addSampleCategories() {
    if (!this.db) return;

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

  private addSampleProducts() {
    if (!this.db) return;

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

  // Category methods
  getCategories(): Promise<Category[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.all(
        "SELECT * FROM categories ORDER BY display_order, name",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getCategoryById(id: number): Promise<Category | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.get("SELECT * FROM categories WHERE id = ?", [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  addCategory(category: Category): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

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

  updateCategory(category: Category): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db || !category.id) {
        reject(new Error("Database not initialized or invalid category ID"));
        return;
      }

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

  deleteCategory(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.run("DELETE FROM categories WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  // Product methods
  getProducts(): Promise<Product[]> {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getProductsByCategory(categoryId: number): Promise<Product[]> {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  searchProducts(query: string): Promise<Product[]> {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getProductById(id: number): Promise<Product | undefined> {
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
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  addProduct(product: Product): Promise<number> {
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
          product.image || null,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  updateProduct(product: Product): Promise<boolean> {
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
          product.id,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  }

  deleteProduct(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  // Order methods
  getOrders(): Promise<Order[]> {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getOrderById(id: number): Promise<Order | undefined> {
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

  addOrder(order: Order): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const db = this.db; // Store reference to this.db to use in nested functions

      // Begin transaction
      db.run("BEGIN TRANSACTION", (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Insert the order
        db.run(
          "INSERT INTO orders (total, tax, discount, payment_method) VALUES (?, ?, ?,?)",
          [order.total, order.tax, order.discount || 0, order.payment_method],
          function (err) {
            if (err) {
              // Rollback on error
              db.run("ROLLBACK", () => {
                reject(err);
              });
              return;
            }

            const orderId = this.lastID;

            // If there are no items, commit and return
            if (!order.items || order.items.length === 0) {
              db.run("COMMIT", (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(orderId);
                }
              });
              return;
            }

            // Prepare a statement for inserting items
            let completed = 0;
            let hasError = false;
            const itemCount = order.items.length;

            // Function to check if all items are processed
            const checkComplete = () => {
              if (completed === itemCount) {
                if (hasError) {
                  db.run("ROLLBACK", () => {
                    reject(new Error("Error adding order items"));
                  });
                } else {
                  db.run("COMMIT", (err) => {
                    if (err) {
                      reject(err);
                    } else {
                      resolve(orderId);
                    }
                  });
                }
              }
            };

            // Insert each order item
            order.items.forEach((item) => {
              db.run(
                "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
                [orderId, item.product_id, item.quantity, item.price],
                (err) => {
                  completed++;
                  if (err) {
                    console.error("Error adding order item:", err);
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

  getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  deleteOrder(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.run("DELETE FROM orders WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  // Utility methods for reports and statistics
  getTopSellingProducts(limit: number = 10): Promise<any[]> {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getDailySales(days: number = 30): Promise<any[]> {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  getSalesByCategory(): Promise<any[]> {
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
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  // Settings methods
  // Settings methods
  getSettings(): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.all("SELECT key, value FROM settings", (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const settings: Record<string, any> = {};
        rows.forEach((row) => {
          try {
            settings[row.key] = JSON.parse(row.value);
          } catch (e) {
            settings[row.key] = row.value;
          }
        });

        resolve(settings);
      });
    });
  }

  getSetting(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.get(
        "SELECT value FROM settings WHERE key = ?",
        [key],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (!row) {
            resolve(undefined);
            return;
          }

          try {
            resolve(JSON.parse(row.value));
          } catch (e) {
            resolve(row.value);
          }
        }
      );
    });
  }

  setSetting(key: string, value: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const stringValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      this.db.run(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [key, stringValue],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  updateSettings(settings: Record<string, any>): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      try {
        this.db.run("BEGIN TRANSACTION");

        for (const [key, value] of Object.entries(settings)) {
          await this.setSetting(key, value);
        }

        this.db.run("COMMIT");
        resolve(true);
      } catch (err) {
        this.db.run("ROLLBACK");
        reject(err);
      }
    });
  }

  resetSettings(defaults: Record<string, any>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.run("DELETE FROM settings", async (err) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          if (defaults) {
            await this.updateSettings(defaults);
          }
          resolve(true);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // Close the database connection
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

export default new DatabaseService();
