import { ipcMain } from "electron";
//import databaseService from "./database";
const databaseService = require("./mock-database");
import settingsService from "./settings";

// Set up all IPC handlers for database operations
export function setupIPCHandlers() {
  try {
    // Category handlers

    console.log("Setting up IPC handlers...");

    ipcMain.handle("db:getCategories", async () => {
      try {
        return await databaseService.getCategories();
      } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
    });

    ipcMain.handle("db:getCategoryById", async (_, id: number) => {
      try {
        return await databaseService.getCategoryById(id);
      } catch (error) {
        console.error("Error fetching category by ID:", error);
        throw error;
      }
    });

    ipcMain.handle("db:addCategory", async (_, category) => {
      try {
        return await databaseService.addCategory(category);
      } catch (error) {
        console.error("Error adding category:", error);
        throw error;
      }
    });

    ipcMain.handle("db:updateCategory", async (_, category) => {
      try {
        return await databaseService.updateCategory(category);
      } catch (error) {
        console.error("Error updating category:", error);
        throw error;
      }
    });

    ipcMain.handle("db:deleteCategory", async (_, id: number) => {
      try {
        return await databaseService.deleteCategory(id);
      } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
      }
    });

    // Product handlers
    ipcMain.handle("db:getProducts", async () => {
      try {
        return await databaseService.getProducts();
      } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
      }
    });

    ipcMain.handle(
      "db:getProductsByCategory",
      async (_, categoryId: number) => {
        try {
          return await databaseService.getProductsByCategory(categoryId);
        } catch (error) {
          console.error("Error fetching products by category:", error);
          throw error;
        }
      }
    );

    ipcMain.handle("db:searchProducts", async (_, query: string) => {
      try {
        return await databaseService.searchProducts(query);
      } catch (error) {
        console.error("Error searching products:", error);
        throw error;
      }
    });

    ipcMain.handle("db:getProductById", async (_, id: number) => {
      try {
        return await databaseService.getProductById(id);
      } catch (error) {
        console.error("Error fetching product by ID:", error);
        throw error;
      }
    });

    ipcMain.handle("db:addProduct", async (_, product) => {
      try {
        return await databaseService.addProduct(product);
      } catch (error) {
        console.error("Error adding product:", error);
        throw error;
      }
    });

    ipcMain.handle("db:updateProduct", async (_, product) => {
      try {
        return await databaseService.updateProduct(product);
      } catch (error) {
        console.error("Error updating product:", error);
        throw error;
      }
    });

    ipcMain.handle("db:deleteProduct", async (_, id: number) => {
      try {
        return await databaseService.deleteProduct(id);
      } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
      }
    });

    // Order handlers
    ipcMain.handle("db:getOrders", async () => {
      try {
        return await databaseService.getOrders();
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
    });

    ipcMain.handle("db:getOrderById", async (_, id: number) => {
      try {
        return await databaseService.getOrderById(id);
      } catch (error) {
        console.error("Error fetching order by ID:", error);
        throw error;
      }
    });

    ipcMain.handle("db:addOrder", async (_, order) => {
      try {
        return await databaseService.addOrder(order);
      } catch (error) {
        console.error("Error adding order:", error);
        throw error;
      }
    });

    ipcMain.handle(
      "db:getOrdersByDateRange",
      async (_, startDate: string, endDate: string) => {
        try {
          return await databaseService.getOrdersByDateRange(startDate, endDate);
        } catch (error) {
          console.error("Error fetching orders by date range:", error);
          throw error;
        }
      }
    );

    ipcMain.handle("db:deleteOrder", async (_, id: number) => {
      try {
        return await databaseService.deleteOrder(id);
      } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
      }
    });

    // Report handlers
    ipcMain.handle("db:getTopSellingProducts", async (_, limit: number) => {
      try {
        return await databaseService.getTopSellingProducts(limit);
      } catch (error) {
        console.error("Error fetching top selling products:", error);
        throw error;
      }
    });

    ipcMain.handle("db:getDailySales", async (_, days: number) => {
      try {
        return await databaseService.getDailySales(days);
      } catch (error) {
        console.error("Error fetching daily sales:", error);
        throw error;
      }
    });

    ipcMain.handle("db:getSalesByCategory", async () => {
      try {
        return await databaseService.getSalesByCategory();
      } catch (error) {
        console.error("Error fetching sales by category:", error);
        throw error;
      }
    });

    // Settings handlers
    ipcMain.handle("settings:getAll", () => {
      return settingsService.getAll();
    });

    ipcMain.handle("settings:get", (_, key: string) => {
      return settingsService.get(key);
    });

    ipcMain.handle("settings:set", (_, key: string, value: any) => {
      settingsService.set(key, value);
      return true;
    });

    ipcMain.handle("settings:update", (_, settings: any) => {
      settingsService.update(settings);
      return true;
    });

    ipcMain.handle("settings:reset", () => {
      settingsService.reset();
      return true;
    });

    console.log("IPC handlers set up successfully");
  } catch (error) {
    console.error("Error setting up IPC handlers:", error);
  }
}
