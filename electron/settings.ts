// electron/settings.ts
import databaseService from "./database";

export interface StoreSettings {
  // Business information
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website: string;

  // Regional settings
  currency: string;
  currencySymbol: string;
  language: string;

  // Tax settings
  taxEnabled: boolean;
  taxRate: number;
  taxInclusivePrice: boolean;

  // Receipt settings
  receiptHeader: string;
  receiptFooter: string;
  printReceiptAutomatically: boolean;

  // Display settings
  showProductImages: boolean;
  defaultCategory: string;

  // Security settings
  pinEnabled: boolean;
  pinCode: string;
}

// Default settings values
const defaultSettings: StoreSettings = {
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
  taxRate: 8.5, // Percentage
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
  pinCode: "",
};

class SettingsService {
  // Get all settings
  async getAll(): Promise<StoreSettings> {
    try {
      const settings = await databaseService.getSettings();
      return { ...defaultSettings, ...settings };
    } catch (error) {
      console.error("Error getting all settings:", error);
      return { ...defaultSettings };
    }
  }

  // Get a specific setting
  async get<K extends keyof StoreSettings>(key: K): Promise<StoreSettings[K]> {
    try {
      const value = await databaseService.getSetting(key as string);
      return value !== undefined ? value : defaultSettings[key];
    } catch (error) {
      console.error(`Error getting setting: ${key}`, error);
      return defaultSettings[key];
    }
  }

  // Set a specific setting
  async set<K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K]
  ): Promise<void> {
    try {
      // For PIN code, ensure it's stored as a string
      if (key === "pinCode") {
        await databaseService.setSetting(key as string, String(value));
      } else {
        await databaseService.setSetting(key as string, value);
      }
    } catch (error) {
      console.error(`Error setting setting: ${key}`, error);
    }
  }

  // Update multiple settings at once
  async update(settings: Partial<StoreSettings>): Promise<void> {
    try {
      await databaseService.updateSettings(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  }

  // Reset settings to defaults
  async reset(): Promise<void> {
    try {
      await databaseService.resetSettings(defaultSettings);
    } catch (error) {
      console.error("Error resetting settings:", error);
    }
  }

  // Initialize settings with defaults if they don't exist
  async initialize(): Promise<void> {
    try {
      const settings = await databaseService.getSettings();
      const keys = Object.keys(settings);

      if (keys.length === 0) {
        // No settings exist, initialize with defaults
        await this.update(defaultSettings);
      }
    } catch (error) {
      console.error("Error initializing settings:", error);
    }
  }
}

export default new SettingsService();
