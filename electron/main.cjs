import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { setupIPCHandlers } from "./ipc-handlers";
import "./database"; // Import to initialize the database
import { initializeDatabase } from "./db-initializer";

// For ES modules in Electron
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win = null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1920,
    height: 1080,
    fullscreen: true, // This makes the app launch in fullscreen mode
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }

  // Handle IPC messages for window controls
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

  // Set up database and settings IPC handlers
  setupIPCHandlers();
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  try {
    // Initialize database with default data
    initializeDatabase();

    createWindow();

    // Register ESC key to exit fullscreen (but not close the app)
    globalShortcut.register("ESC", () => {
      const activeWin = BrowserWindow.getFocusedWindow();
      if (activeWin && activeWin.isFullScreen()) {
        activeWin.setFullScreen(false);
      }
    });

    // Register a shortcut to quit the app (e.g., Alt+F4 or Ctrl+Q)
    globalShortcut.register("CommandOrControl+Q", () => {
      app.quit();
    });
  } catch (error) {
    console.error("Error during app initialization:", error);
  }
});

// Clean up shortcuts when app is quitting
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
