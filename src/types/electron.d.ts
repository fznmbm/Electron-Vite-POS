/// <reference types="vite/client" />

// Import the types from our database service
import { Product, Category, Order, OrderItem } from "../../electron/database";
import { StoreSettings } from "../../electron/settings";

// Declare global interfaces for TypeScript
interface Window {
  ipcRenderer: {
    on(channel: string, listener: (...args: any[]) => void): void;
    off(channel: string, listener: (...args: any[]) => void): void;
    send(channel: string, ...args: any[]): void;
    invoke(channel: string, ...args: any[]): Promise<any>;
  };

  electron: {
    appControls: {
      close(): void;
      minimize(): void;
      maximize(): void;
      toggleFullscreen(): void;
    };
  };

  db: {
    // Categories
    getCategories(): Promise<Category[]>;
    getCategoryById(id: number): Promise<Category | undefined>;
    addCategory(category: Category): Promise<number>;
    updateCategory(category: Category): Promise<boolean>;
    deleteCategory(id: number): Promise<boolean>;

    // Products
    getProducts(): Promise<Product[]>;
    getProductsByCategory(categoryId: number): Promise<Product[]>;
    searchProducts(query: string): Promise<Product[]>;
    getProductById(id: number): Promise<Product | undefined>;
    addProduct(product: Product): Promise<number>;
    updateProduct(product: Product): Promise<boolean>;
    deleteProduct(id: number): Promise<boolean>;

    // Orders
    getOrders(): Promise<Order[]>;
    getOrderById(id: number): Promise<Order | undefined>;
    addOrder(order: Order): Promise<number>;
    getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]>;
    deleteOrder(id: number): Promise<boolean>;

    // Reports
    getTopSellingProducts(limit?: number): Promise<any[]>;
    getDailySales(days?: number): Promise<any[]>;
    getSalesByCategory(): Promise<any[]>;
  };

  settings: {
    getAll(): Promise<StoreSettings>;
    get<K extends keyof StoreSettings>(key: K): Promise<StoreSettings[K]>;
    set<K extends keyof StoreSettings>(
      key: K,
      value: StoreSettings[K]
    ): Promise<boolean>;
    update(settings: Partial<StoreSettings>): Promise<boolean>;
    reset(): Promise<boolean>;
  };
}
