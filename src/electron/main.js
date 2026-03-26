const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { execSync } = require('child_process');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

let mainWindow;

// Configure auto-updater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Security: Code signing verification (Windows/macOS)
if (!isDev && process.platform !== 'linux') {
  const verifySignature = () => {
    try {
      if (process.platform === 'win32') {
        execSync(`certUtil -verify "${app.getAppPath()}"`, { stdio: 'ignore' });
      } else if (process.platform === 'darwin') {
        execSync(`codesign -v "${app.getAppPath()}"`, { stdio: 'ignore' });
      }
      return true;
    } catch {
      return false;
    }
  };
  
  if (!verifySignature()) {
    console.error('CODE SIGNATURE VERIFICATION FAILED');
    app.quit();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
      webSecurity: true
    }
  });

  const startUrl = isDev
    ? 'http://localhost:5173' // Vite dev server
    : `file://${path.join(__dirname, '../dist/index.html')}`; // Production build

  mainWindow.loadURL(startUrl);

  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => (mainWindow = null));
}

// IPC handlers for native APIs
ipcMain.handle('get-device-info', () => {
  const os = require('os');
  return {
    platform: process.platform,
    arch: process.arch,
    cpus: os.cpus().length,
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    hostname: os.hostname(),
    userInfo: os.userInfo()
  };
});

ipcMain.handle('get-running-processes', () => {
  try {
    const { execSync } = require('child_process');
    if (process.platform === 'win32') {
      const output = execSync('tasklist /fo csv /nh').toString();
      return output.split('\n').filter(l => l).map(l => l.split(',')[0].replace(/"/g, ''));
    } else if (process.platform === 'darwin') {
      const output = execSync("ps aux | awk '{print $11}'").toString();
      return output.split('\n').filter(l => l && !l.includes('ps'));
    } else {
      const output = execSync("ps aux | awk '{print $11}'").toString();
      return output.split('\n').filter(l => l && !l.includes('ps'));
    }
  } catch (error) {
    console.error('Failed to get processes:', error);
    return [];
  }
});

ipcMain.handle('get-network-info', () => {
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    return Object.entries(interfaces).map(([name, addrs]) => ({
      name,
      addresses: addrs.map(a => ({ address: a.address, family: a.family }))
    }));
  } catch (error) {
    console.error('Failed to get network info:', error);
    return [];
  }
});

// Auto-update handlers
ipcMain.handle('check-for-updates', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      hasUpdate: result.updateInfo.version !== app.getVersion(),
      version: result.updateInfo.version,
      releaseDate: result.updateInfo.releaseDate,
      changelog: result.updateInfo.releaseNotes
    };
  } catch (error) {
    log.error('Update check failed:', error);
    return { hasUpdate: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    log.error('Download failed:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
  return { success: true };
});

// Auto-update event listeners
autoUpdater.on('update-available', () => {
  mainWindow?.webContents.send('update-available');
});

autoUpdater.on('update-not-available', () => {
  mainWindow?.webContents.send('update-not-available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow?.webContents.send('update-downloaded');
});

app.on('ready', () => {
  createWindow();
  // Check for updates on startup (only in production)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// Security: Disable navigation to external sites
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== 'http://localhost:5173' && !isDev) {
      event.preventDefault();
    }
  });
  
  // Disable new window creation
  contents.setWindowOpenHandler(({ url }) => {
    return { action: 'deny' };
  });
});

module.exports = { mainWindow };