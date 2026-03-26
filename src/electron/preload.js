const { contextBridge, ipcMain } = require('electron');
const os = require('os');

// Detect platform and inject into React app
const platformMap = {
  'win32': 'windows',
  'darwin': 'macos',
  'linux': 'linux'
};

contextBridge.exposeInMainWorld('__NISSI_PLATFORM__', platformMap[process.platform]);

// Expose safe native APIs to React via context bridge
contextBridge.exposeInMainWorld('__NISSI_NATIVE__', {
  getDeviceInfo: () => ipcMain.invoke('get-device-info'),
  getProcesses: () => ipcMain.invoke('get-running-processes'),
  getNetworkInfo: () => ipcMain.invoke('get-network-info'),
  
  // Security: root/admin check
  isAdmin: () => {
    try {
      const whoamiOutput = require('child_process').execSync('whoami').toString().trim();
      return whoamiOutput === 'root' || whoamiOutput.includes('admin');
    } catch {
      return false;
    }
  },
  
  // Security: Check for tamper detection
  isTampered: () => {
    // Check for suspicious files or processes
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'win32') {
        execSync('tasklist | findstr /i hook');
      } else {
        execSync("ps aux | grep -i hook");
      }
      return true; // Suspicious hooks found
    } catch {
      return false; // Clean
    }
  },
  
  // Secure storage using Electron's safeStorage
  secureStore: {
    set: (key, value) => {
      try {
        const { safeStorage } = require('electron');
        const encrypted = safeStorage.encryptString(JSON.stringify(value));
        require('fs').writeFileSync(`~/.nissi/${key}.encrypted`, encrypted);
        return true;
      } catch (error) {
        console.error('Secure store error:', error);
        return false;
      }
    },
    get: (key) => {
      try {
        const { safeStorage } = require('electron');
        const encrypted = require('fs').readFileSync(`~/.nissi/${key}.encrypted`);
        return JSON.parse(safeStorage.decryptString(encrypted));
      } catch {
        return null;
      }
    }
  }
});

// Log preload initialization
console.log(`[NISSI Preload] Platform: ${platformMap[process.platform]}, Admin: ${__NISSI_NATIVE__.isAdmin()}`);