import { app } from "electron";
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// Types for our database entities
export interface Product {
  id?: number;
  name: string;
  price: number;
  category_id: number;
  barcode?: string;
  image?: string;
  category?: string; // For joining with categories
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
  product_name?: string; // For joining with products
}

// Database class to manage all operations
class DatabaseService {
  private db: Database.Database;
  private initialized: boolean = false;

  constructor() {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "pos-database.db");

    // Ensure the directory exists
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.init();
  }

  // Initialize the database schema
  private init() {
    if (this.initialized) return;

    // Set pragmas for better performance
    this.db.pragma("journal_mode = WAL");

    // Create tables if they don't exist
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
  }

  // Category methods
  getCategories(): Category[] {
    const stmt = this.db.prepare(
      "SELECT * FROM categories ORDER BY display_order, name"
    );
    return stmt.all();
  }

  getCategoryById(id: number): Category | undefined {
    const stmt = this.db.prepare("SELECT * FROM categories WHERE id = ?");
    return stmt.get(id);
  }

  addCategory(category: Category): number {
    const stmt = this.db.prepare(
      "INSERT INTO categories (name, display_order) VALUES (?, ?)"
    );
    const result = stmt.run(category.name, category.display_order);
    return result.lastInsertRowid as number;
  }

  updateCategory(category: Category): boolean {
    const stmt = this.db.prepare(
      "UPDATE categories SET name = ?, display_order = ? WHERE id = ?"
    );
    const result = stmt.run(category.name, category.display_order, category.id);
    return result.changes > 0;
  }

  deleteCategory(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM categories WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Product methods
  getProducts(): Product[] {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    return stmt.all();
  }

  getProductsByCategory(categoryId: number): Product[] {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ?
      ORDER BY p.name
    `);
    return stmt.all(categoryId);
  }

  searchProducts(query: string): Product[] {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.name LIKE ? OR p.barcode LIKE ?
      ORDER BY p.name
    `);
    const searchQuery = `%${query}%`;
    return stmt.all(searchQuery, searchQuery);
  }

  getProductById(id: number): Product | undefined {
    const stmt = this.db.prepare(`
      SELECT p.*, c.name as category 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `);
    return stmt.get(id);
  }

  addProduct(product: Product): number {
    const stmt = this.db.prepare(`
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
    return result.lastInsertRowid as number;
  }

  updateProduct(product: Product): boolean {
    const stmt = this.db.prepare(`
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

  deleteProduct(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM products WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Order methods
  getOrders(): Order[] {
    const stmt = this.db.prepare(`
      SELECT * FROM orders
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  getOrderById(id: number): Order | undefined {
    const stmt = this.db.prepare("SELECT * FROM orders WHERE id = ?");
    const order = stmt.get(id) as Order | undefined;

    if (order) {
      const itemsStmt = this.db.prepare(`
        SELECT oi.*, p.name as product_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `);
      order.items = itemsStmt.all(id);
    }

    return order;
  }

  addOrder(order: Order): number {
    // Begin transaction
    const transaction = this.db.transaction((order: Order) => {
      // Insert order
      const orderStmt = this.db.prepare(`
        INSERT INTO orders (total, tax, payment_method) 
        VALUES (?, ?, ?)
      `);
      const orderResult = orderStmt.run(
        order.total,
        order.tax,
        order.payment_method
      );
      const orderId = orderResult.lastInsertRowid as number;

      // Insert order items
      if (order.items && order.items.length > 0) {
        const itemStmt = this.db.prepare(`
          INSERT INTO order_items (order_id, product_id, quantity, price) 
          VALUES (?, ?, ?, ?)
        `);

        for (const item of order.items) {
          itemStmt.run(orderId, item.product_id, item.quantity, item.price);
        }
      }

      return orderId;
    });

    // Execute transaction
    return transaction(order);
  }

  getOrdersByDateRange(startDate: string, endDate: string): Order[] {
    const stmt = this.db.prepare(`
      SELECT * FROM orders
      WHERE created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
    `);
    return stmt.all(startDate, endDate);
  }

  deleteOrder(id: number): boolean {
    const stmt = this.db.prepare("DELETE FROM orders WHERE id = ?");
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Utility methods for reports and statistics
  getTopSellingProducts(limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT p.id, p.name, SUM(oi.quantity) as total_quantity
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id
      ORDER BY total_quantity DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  getDailySales(days: number = 30): any[] {
    const stmt = this.db.prepare(`
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

  getSalesByCategory(): any[] {
    const stmt = this.db.prepare(`
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
    this.db.close();
  }
}

export default new DatabaseService();
