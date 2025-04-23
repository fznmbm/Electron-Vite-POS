import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require2 = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    width: 1920,
    height: 1080,
    fullscreen: true,
    // This makes the app launch in fullscreen mode
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  ipcMain.on("app:close", () => {
    app.quit();
  });
  ipcMain.on("app:minimize", () => {
    const win2 = BrowserWindow.getFocusedWindow();
    if (win2) win2.minimize();
  });
  ipcMain.on("app:maximize", () => {
    const win2 = BrowserWindow.getFocusedWindow();
    if (win2) {
      if (win2.isMaximized()) {
        win2.unmaximize();
      } else {
        win2.maximize();
      }
    }
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
const { globalShortcut } = require2("electron");
app.whenReady().then(() => {
  createWindow();
  globalShortcut.register("ESC", () => {
    const win2 = BrowserWindow.getFocusedWindow();
    if (win2 && win2.isFullScreen()) {
      win2.setFullScreen(false);
    }
  });
  globalShortcut.register("CommandOrControl+Q", () => {
    app.quit();
  });
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
