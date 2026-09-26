const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { readBackendOverride } = require('./backend-config.cjs');

app.setName('Real Iron');
const userDataPath = path.join(app.getPath('appData'), 'Real Iron');
fs.mkdirSync(userDataPath, { recursive: true });
app.setPath('userData', userDataPath);
const devUrl = !app.isPackaged ? process.env.VITE_DEV_SERVER_URL : undefined;
const entryFile = path.join(__dirname, '../dist/index.html');
const entryUrl = pathToFileURL(entryFile).href;
let backendUrl;

function isAppPage(url) {
  try {
    const parsed = new URL(url);
    return devUrl ? parsed.origin === new URL(devUrl).origin : parsed.href.split('#')[0] === entryUrl;
  } catch {
    return false;
  }
}

// Register once; macOS may create another window after closing the first one.
for (const action of ['minimize', 'maximize', 'fullscreen', 'close']) {
  ipcMain.on(`window:${action}`, (event) => {
    if (event.senderFrame !== event.sender.mainFrame || !isAppPage(event.senderFrame.url)) return;
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return;
    if (action === 'maximize') window.isMaximized() ? window.unmaximize() : window.maximize();
    else if (action === 'fullscreen') window.setFullScreen(!window.isFullScreen());
    else window[action]();
  });
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      additionalArguments: backendUrl ? [`--real-iron-api-url=${encodeURIComponent(backendUrl)}`] : [],
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAppPage(url)) event.preventDefault();
  });
  mainWindow.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  if (devUrl) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(entryFile);
  }
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown' || input.isAutoRepeat) return;
    if (input.key === 'F11') {
      event.preventDefault();
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
    } else if (input.key === 'Escape' && mainWindow.isFullScreen()) {
      event.preventDefault();
      mainWindow.setFullScreen(false);
    }
  });
}

app.whenReady().then(() => {
  const configPath = path.join(app.getPath('userData'), 'backend.json');
  try {
    backendUrl = readBackendOverride(configPath);
  } catch {
    dialog.showErrorBox('백엔드 설정 오류', `${configPath}\napiBaseUrl에 올바른 HTTP(S) API 주소를 입력한 뒤 다시 실행하세요. REAL_IRON_API_BASE_URL 환경변수도 확인하세요.`);
    app.quit();
    return;
  }
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
