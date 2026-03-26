/**
 * Capacitor Plugin Configuration
 * Initializes native capabilities for iOS/Android
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Device } from '@capacitor/device';
import { Filesystem } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';

export async function initializeCapacitor() {
  if (!Capacitor.isNativePlatform()) {
    console.log('[Capacitor] Not on native platform, using web fallbacks');
    return;
  }

  console.log('[Capacitor] Initializing on platform:', Capacitor.getPlatform());

  // Initialize plugins
  try {
    const deviceInfo = await Device.getInfo();
    console.log('[Device] Initialized:', deviceInfo);

    const appInfo = await App.getInfo();
    console.log('[App] Version:', appInfo.version);

    // Verify filesystem access (for logs, database)
    await Filesystem.getUri({ path: '.', directory: 'Documents' });
    console.log('[Filesystem] Documents access verified');

    // Initialize secure storage
    await Storage.configure({ group: 'com.nissi.agent' });
    console.log('[Storage] Secure storage initialized');

    return true;
  } catch (error) {
    console.error('[Capacitor] Initialization error:', error);
    return false;
  }
}

// Plugin helpers
export async function getPluginInfo() {
  return {
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform(),
    pluginsAvailable: {
      device: !!Capacitor.Plugins.Device,
      storage: !!Capacitor.Plugins.Storage,
      filesystem: !!Capacitor.Plugins.Filesystem,
      network: !!Capacitor.Plugins.Network,
      geolocation: !!Capacitor.Plugins.Geolocation
    }
  };
}

// Secure encrypted storage on device
export async function secureWrite(key, data) {
  try {
    await Storage.set({
      key,
      value: JSON.stringify(data)
    });
    return true;
  } catch (error) {
    console.error('[Storage] Write error:', error);
    return false;
  }
}

export async function secureRead(key) {
  try {
    const { value } = await Storage.get({ key });
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('[Storage] Read error:', error);
    return null;
  }
}

// Log file management
export async function writeLogs(filename, content) {
  try {
    await Filesystem.writeFile({
      path: `Logs/${filename}`,
      data: content,
      directory: 'Documents',
      recursive: true
    });
    return true;
  } catch (error) {
    console.error('[Filesystem] Write logs error:', error);
    return false;
  }
}

export async function readLogs(filename) {
  try {
    const { data } = await Filesystem.readFile({
      path: `Logs/${filename}`,
      directory: 'Documents'
    });
    return data;
  } catch (error) {
    console.error('[Filesystem] Read logs error:', error);
    return null;
  }
}