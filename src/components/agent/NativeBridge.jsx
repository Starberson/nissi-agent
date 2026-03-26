/**
 * NISSI Native Bridge
 * -------------------
 * Abstracts native device APIs so the same React code works:
 *   1. In-browser (fallback values)
 *   2. Wrapped in Capacitor (real native APIs)
 *   3. Wrapped in a custom WebView (postMessage protocol)
 *
 * When Capacitor plugins are available (window.Capacitor),
 * real values are returned. Otherwise safe mock values are used
 * so the UI still renders correctly during web preview.
 */

// ─── Capacitor plugin helpers ────────────────────────────────────────────────

function getCapacitor() {
  return typeof window !== "undefined" && window.Capacitor ? window.Capacitor : null;
}

async function capacitorCall(pluginName, method, options = {}) {
  const cap = getCapacitor();
  if (!cap) return null;
  try {
    const plugin = cap.Plugins[pluginName];
    if (!plugin) return null;
    return await plugin[method](options);
  } catch {
    return null;
  }
}

// ─── Platform Detection ───────────────────────────────────────────────────────

export function detectPlatform() {
  const cap = getCapacitor();
  if (cap) {
    const plat = cap.getPlatform();           // "ios" | "android" | "web"
    if (plat === "ios" || plat === "android") return plat;
  }

  // Check Electron (desktop wrapper)
  if (typeof window !== "undefined" && window.__NISSI_PLATFORM__) {
    return window.__NISSI_PLATFORM__; // "windows" | "macos" | "linux"
  }

  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/win/.test(ua)) return "windows";
  if (/mac os x/.test(ua)) return "macos";
  if (/linux/.test(ua)) return "linux";
  return "android";
}

export function isNative() {
  const cap = getCapacitor();
  return !!(cap && cap.isNativePlatform && cap.isNativePlatform());
}

// ─── Device Info ──────────────────────────────────────────────────────────────

export async function getDeviceInfo() {
  // Try Capacitor @capacitor/device plugin
  const info = await capacitorCall("Device", "getInfo");
  if (info) {
    return {
      model: info.model || "Unknown",
      platform: info.platform || detectPlatform(),
      osVersion: info.osVersion || info.operatingSystem || "Unknown",
      manufacturer: info.manufacturer || "Unknown",
      isVirtual: info.isVirtual || false,
      webViewVersion: info.webViewVersion || "Unknown",
    };
  }

  // Fallback: parse from UA
  const ua = navigator.userAgent;
  const platform = detectPlatform();
  let osVersion = "Unknown";
  if (platform === "ios") {
    osVersion = (ua.match(/OS (\d+_\d+)/) || ["", "Unknown"])[1].replace("_", ".");
  } else if (platform === "android") {
    osVersion = (ua.match(/Android (\d+\.?\d*)/) || ["", "Unknown"])[1] || "Unknown";
  } else if (platform === "windows") {
    osVersion = (ua.match(/Windows NT ([\d.]+)/) || ["", "Unknown"])[1];
  } else if (platform === "macos") {
    osVersion = (ua.match(/Mac OS X ([\d_]+)/) || ["", "Unknown"])[1].replace(/_/g, ".");
  } else if (platform === "linux") {
    osVersion = "Linux";
  }

  return {
    model: "Unknown",
    platform,
    osVersion,
    manufacturer: "Unknown",
    isVirtual: false,
    webViewVersion: "Unknown",
  };
}

// ─── Battery ─────────────────────────────────────────────────────────────────

export async function getBatteryInfo() {
  // Try Capacitor @capacitor/device plugin
  const info = await capacitorCall("Device", "getBatteryInfo");
  if (info) {
    return {
      batteryLevel: Math.round((info.batteryLevel || 0.8) * 100),
      isCharging: info.isCharging || false,
    };
  }

  // Try Web Battery API (Chrome on Android)
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      return {
        batteryLevel: Math.round(battery.level * 100),
        isCharging: battery.charging,
      };
    } catch {
      // ignore
    }
  }

  // Fallback
  return { batteryLevel: 80, isCharging: false };
}

// ─── Network ─────────────────────────────────────────────────────────────────

export async function getNetworkInfo() {
  // Try Capacitor @capacitor/network
  const info = await capacitorCall("Network", "getStatus");
  if (info) {
    return {
      connected: info.connected,
      connectionType: info.connectionType || "unknown",
    };
  }

  // Web fallback
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    connected: navigator.onLine,
    connectionType: conn ? conn.effectiveType || conn.type || "wifi" : navigator.onLine ? "wifi" : "none",
  };
}

// ─── Geolocation ─────────────────────────────────────────────────────────────

export async function getLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

// ─── Root / Jailbreak Detection ───────────────────────────────────────────────

export async function checkRootStatus() {
  // In production, implement via a native Capacitor plugin or a WebView postMessage
  // that calls native root-detection SDKs (e.g. RootBeer on Android, DTTJailbreakDetection on iOS)
  // For now, return safe default.
  const bridge = window.__NISSI_NATIVE__;
  if (bridge && typeof bridge.isRooted === "function") {
    try { return await bridge.isRooted(); } catch { /* ignore */ }
  }
  return false;
}

// ─── Push Notification Token ─────────────────────────────────────────────────

export async function getPushToken() {
  // Try Capacitor @capacitor/push-notifications
  const result = await capacitorCall("PushNotifications", "requestPermissions");
  if (result && result.receive === "granted") {
    const reg = await capacitorCall("PushNotifications", "register");
    if (reg && reg.value) return reg.value;
  }
  return null;
}

// ─── Haptic Feedback ─────────────────────────────────────────────────────────

export async function vibrate(style = "light") {
  // Capacitor @capacitor/haptics
  const styleMap = { light: "LIGHT", medium: "MEDIUM", heavy: "HEAVY" };
  const res = await capacitorCall("Haptics", "impact", { style: styleMap[style] || "LIGHT" });
  if (!res && navigator.vibrate) {
    navigator.vibrate(style === "heavy" ? 100 : style === "medium" ? 50 : 20);
  }
}

// ─── Safe Area Insets ────────────────────────────────────────────────────────

export function getSafeAreaInsets() {
  // CSS env() variables set by Capacitor/WebKit for notch-aware layouts
  const style = getComputedStyle(document.documentElement);
  const get = (v) => parseInt(style.getPropertyValue(v) || "0", 10) || 0;
  return {
    top: get("--safe-area-inset-top") || (detectPlatform() === "ios" ? 44 : ["windows","macos","linux"].includes(detectPlatform()) ? 0 : 24),
    bottom: get("--safe-area-inset-bottom") || (detectPlatform() === "ios" ? 34 : 0),
    left: get("--safe-area-inset-left") || 0,
    right: get("--safe-area-inset-right") || 0,
  };
}