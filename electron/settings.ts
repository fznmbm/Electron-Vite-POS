import Store from "electron-store";

// Define the shape of our settings
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

// Create settings store with default values
const settingsStore = new Store<StoreSettings>({
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
  },
});

class SettingsService {
  // Get all settings
  getAll(): StoreSettings {
    return settingsStore.store;
  }

  // Get a specific setting
  get<K extends keyof StoreSettings>(key: K): StoreSettings[K] {
    return settingsStore.get(key);
  }

  // Set a specific setting
  set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]): void {
    settingsStore.set(key, value);
  }

  // Update multiple settings at once
  update(settings: Partial<StoreSettings>): void {
    for (const [key, value] of Object.entries(settings)) {
      settingsStore.set(key as keyof StoreSettings, value);
    }
  }

  // Reset settings to defaults
  reset(): void {
    settingsStore.clear();
  }
}

export default new SettingsService();
