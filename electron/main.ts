// electron/main.ts
import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import path from "path";
import { setupIPCHandlers } from "./ipc-handlers";
// We'll use a different approach for database initialization
// to avoid ES module imports
import database from "./database";
import settingsService from "./settings";

//
//const database = require(path.join(__dirname, "database.ts"));

// Use standard Node.js path functions (avoid ES Module-specific functions)
const isDevelopment = process.env.NODE_ENV !== "production";
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

// Global reference to prevent garbage collection
let mainWindow = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // Note: .js not .mjs
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the appropriate URL
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    //mainWindow.webContents.openDevTools();
  } else {
    // In production, load the bundled HTML file
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  // Set up window events
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send(
      "main-process-message",
      new Date().toLocaleString()
    );
  });

  // Set up IPC handlers
  setupWindowControls();
  setupIPCHandlers();

  return mainWindow;
}

// Set up window control IPC handlers
function setupWindowControls() {
  ipcMain.on("app:close", () => {
    app.quit();
  });

  ipcMain.on("app:minimize", () => {
    const activeWin = BrowserWindow.getFocusedWindow();
    if (activeWin) activeWin.minimize();
  });

  ipcMain.on("app:maximize", () => {
    const activeWin = BrowserWindow.getFocusedWindow();
    if (activeWin) {
      if (activeWin.isMaximized()) {
        activeWin.unmaximize();
      } else {
        activeWin.maximize();
      }
    }
  });
}

// Quit when all windows are closed, except on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    mainWindow = null;
  }
});

// Re-create window on macOS when dock icon is clicked
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("app:navigate", (_, page) => {
  // Send message to renderer to navigate
  mainWindow.webContents.send("navigate", page);
});

// App initialization
app.whenReady().then(async () => {
  try {
    // Initialize settings with defaults
    await settingsService.initialize();
    // Create the main window
    createWindow();

    // Register keyboard shortcuts
    registerShortcuts();
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});

// Register keyboard shortcuts
function registerShortcuts() {
  // ESC to exit fullscreen
  globalShortcut.register("Escape", () => {
    const activeWin = BrowserWindow.getFocusedWindow();
    if (activeWin && activeWin.isFullScreen()) {
      activeWin.setFullScreen(false);
    }
  });

  // Ctrl+Q to quit
  globalShortcut.register("CommandOrControl+Q", () => {
    app.quit();
  });
}

// Clean up on app quit
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
