import { ipcMain } from "electron";
import databaseService from "./database";
import settingsService from "./settings";

// Set up all IPC handlers for database operations
export function setupIPCHandlers() {
  // Category handlers
  ipcMain.handle("db:getCategories", () => {
    return databaseService.getCategories();
  });

  ipcMain.handle("db:getCategoryById", (_, id: number) => {
    return databaseService.getCategoryById(id);
  });

  ipcMain.handle("db:addCategory", (_, category) => {
    return databaseService.addCategory(category);
  });

  ipcMain.handle("db:updateCategory", (_, category) => {
    return databaseService.updateCategory(category);
  });

  ipcMain.handle("db:deleteCategory", (_, id: number) => {
    return databaseService.deleteCategory(id);
  });

  // Product handlers
  ipcMain.handle("db:getProducts", () => {
    return databaseService.getProducts();
  });

  ipcMain.handle("db:getProductsByCategory", (_, categoryId: number) => {
    return databaseService.getProductsByCategory(categoryId);
  });

  ipcMain.handle("db:searchProducts", (_, query: string) => {
    return databaseService.searchProducts(query);
  });

  ipcMain.handle("db:getProductById", (_, id: number) => {
    return databaseService.getProductById(id);
  });

  ipcMain.handle("db:addProduct", (_, product) => {
    return databaseService.addProduct(product);
  });

  ipcMain.handle("db:updateProduct", (_, product) => {
    return databaseService.updateProduct(product);
  });

  ipcMain.handle("db:deleteProduct", (_, id: number) => {
    return databaseService.deleteProduct(id);
  });

  // Order handlers
  ipcMain.handle("db:getOrders", () => {
    return databaseService.getOrders();
  });

  ipcMain.handle("db:getOrderById", (_, id: number) => {
    return databaseService.getOrderById(id);
  });

  ipcMain.handle("db:addOrder", (_, order) => {
    return databaseService.addOrder(order);
  });

  ipcMain.handle(
    "db:getOrdersByDateRange",
    (_, startDate: string, endDate: string) => {
      return databaseService.getOrdersByDateRange(startDate, endDate);
    }
  );

  ipcMain.handle("db:deleteOrder", (_, id: number) => {
    return databaseService.deleteOrder(id);
  });

  // Report handlers
  ipcMain.handle("db:getTopSellingProducts", (_, limit: number) => {
    return databaseService.getTopSellingProducts(limit);
  });

  ipcMain.handle("db:getDailySales", (_, days: number) => {
    return databaseService.getDailySales(days);
  });

  ipcMain.handle("db:getSalesByCategory", () => {
    return databaseService.getSalesByCategory();
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
}
