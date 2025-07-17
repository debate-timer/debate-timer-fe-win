import { app, BrowserWindow, ipcMain } from 'electron';
import { UUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { DebateTableData } from './type';
import { getItem, getAllItems, deleteItem, patchItem, postItem } from './api';
import { OPEN_DEBATE_FINAL_ROUND, OPEN_DEBATE_MAIN_ROUND } from './constants';

// URL of Vite develop server (automatically set by vite-plugin-electron)
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

// Window setting
function createWindow() {
  // Set window specs
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 1080,
    minWidth: 1280,
    minHeight: 1080,
    icon: path.join(__dirname, '../renderer/icon.ico'), // Set the window icon
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'), // Path of preload script
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenu(null); // Hide menu (File, Edit, View, etc.)

  if (VITE_DEV_SERVER_URL) {
    // Development mode
    mainWindow.loadURL(VITE_DEV_SERVER_URL); // Load renderer from Vite development server
    mainWindow.webContents.openDevTools(); // And open F12 console
  } else {
    // Production mode
    const filePath = path.join(app.getAppPath(), 'dist/renderer/index.html');
    mainWindow.loadFile(filePath); // Load renderer from static html file
  }
}

// Database related codes
const dbPath = path.join(app.getPath('userData'), 'db.json');

// Initialize database
async function initDb() {
  try {
    // If JSON is already exists, open it.
    await fs.access(dbPath);
  } catch {
    // Else, create new one with prepared data.
    const INIT_DATA_MAIN_ROUND = OPEN_DEBATE_MAIN_ROUND;
    const INIT_DATA_FINAL_ROUND = OPEN_DEBATE_FINAL_ROUND;

    await fs.writeFile(dbPath, JSON.stringify([], null, 2));
    await postItem(dbPath, INIT_DATA_MAIN_ROUND);
    await postItem(dbPath, INIT_DATA_FINAL_ROUND);
  }
}

// IPC Handlers
// - Below are functions that CAN be exposed to the renderer(React)
// - And it means that you should explicitly specify functions
//   that you want to expose to the renderer(React)
//   in 'electron/preload.ts'.

// GET
ipcMain.handle(
  'db-get',
  async (_event, id: UUID): Promise<DebateTableData> => getItem(dbPath, id),
);

// GET ALL
ipcMain.handle('db-get-all', async () => getAllItems(dbPath));

// POST
ipcMain.handle('db-post', async (_event, item: DebateTableData) =>
  postItem(dbPath, item),
);

// DELETE
ipcMain.handle('db-delete', async (_event, id: UUID) => deleteItem(dbPath, id));

// PATCH
ipcMain.handle('db-patch', async (_event, item: DebateTableData) =>
  patchItem(dbPath, item),
);

// Launch app
app.whenReady().then(async () => {
  await initDb();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
