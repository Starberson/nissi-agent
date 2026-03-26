# NISSI Agent - Electron Desktop Setup

## Overview

This document outlines the complete Electron setup for NISSI Agent on Windows, macOS, and Linux platforms with auto-update support and multi-platform distribution.

## Architecture

### Components

1. **Desktop Agent Entry Point** (`pages/DesktopAgent.jsx`)
   - Handles enrollment and device registration
   - Manages agent lifecycle on desktop

2. **Electron Main Process** (`electron/main.js`)
   - Window management
   - IPC handlers for native APIs
   - Auto-update orchestration
   - Code signature verification

3. **Preload Script** (`electron/preload.js`)
   - Secure bridge between renderer and main process
   - Exposes safe native APIs

4. **Electron Builder** (`electron/electron-builder.config.js`)
   - Cross-platform build configuration
   - Installer creation for Windows, macOS, Linux

5. **GitHub Actions Workflows** (`.github/workflows/`)
   - Automated builds for all platforms
   - Release creation on version tags

## Installation & Dependencies

### Required npm packages

```bash
npm install electron electron-updater electron-log electron-is-dev
npm install -D electron-builder
```

### Configuration Files

#### `electron-builder.config.js`

Already configured for:
- **Windows**: NSIS installer + portable .zip
- **macOS**: DMG installer (Intel + Apple Silicon)
- **Linux**: AppImage + DEB package

#### `main.js`

Enhanced with:
- Auto-update support via `electron-updater`
- Update event listeners
- IPC handlers for update checking/installation
- Code signature verification (production only)

#### `preload.js`

Provides secure access to:
- Device information (OS, CPU, memory)
- Network interfaces
- Secure storage (encrypted with Electron's `safeStorage`)
- System utilities

## Build & Distribution

### Local Building

**Windows:**
```bash
npm run build:win
```

**macOS:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

### GitHub Actions Workflow

Automated on push to `main` or `develop`:

1. Builds for all platforms
2. Creates `.exe`, `.dmg`, `.AppImage` installers
3. Publishes to GitHub Releases

**Triggering a Release:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the workflow and creates GitHub Release with installers.

## Auto-Update Configuration

### How It Works

1. **Startup Check**: On launch, agent checks for updates (GitHub Releases)
2. **Notification**: If update available, notifies via `DesktopUpdateManager`
3. **Download**: User initiates download through UI
4. **Install**: After download, user confirms installation → app restarts

### Update Server

Currently configured for **GitHub Releases**. In production, you can use:
- **S3**: Update `electron-builder.config.js` publish settings
- **Custom Server**: Implement `electron-updater` custom provider
- **Electron Release Server**: Self-hosted open-source option

### Configuration in `electron-builder.config.js`

```javascript
publish: {
  provider: "github",
  owner: "nissi-security",
  repo: "agent"
}
```

## Code Signing

### For Production Deployment

**Windows:**
- Requires Authenticode certificate (from Sectigo, DigiCert, etc.)
- Cost: ~$300-500/year
- Update `electron-builder.config.js`:
```javascript
win: {
  certificateFile: "/path/to/cert.pfx",
  certificatePassword: process.env.WIN_CSC_KEY_PASSWORD
}
```

**macOS:**
- Requires Apple Developer account ($99/year)
- Certificate from Apple Developer Portal
- Update `electron-builder.config.js`:
```javascript
mac: {
  identity: "Your Name (TEAM_ID)",
  entitlements: "./electron/entitlements.mac.plist"
}
```

**Linux:**
- No code signing needed (open source convention)
- AppImage can be signed but not required

## Pages & Routing

### New Routes Added

- `/desktop-agent` - Desktop agent enrollment and dashboard
- `/downloads` - Public downloads page for all platforms

### Downloads Page

Professional distribution page with:
- Platform-specific download links
- Installation instructions
- Feature overview
- Support contact information

## IPC API Reference

### From Frontend to Main Process

```javascript
// Check for updates
const result = await window.electron.ipcRenderer.invoke('check-for-updates');
// Returns: { hasUpdate: bool, version: string, releaseDate: string, changelog: string }

// Download update
await window.electron.ipcRenderer.invoke('download-update');

// Install update
await window.electron.ipcRenderer.invoke('install-update');

// Get device info
const info = await window.electron.ipcRenderer.invoke('get-device-info');

// Get running processes
const procs = await window.electron.ipcRenderer.invoke('get-running-processes');

// Get network info
const nets = await window.electron.ipcRenderer.invoke('get-network-info');
```

### From Main Process to Frontend

```javascript
// Update available
window.electron.ipcRenderer.on('update-available', () => {});

// Update not available
window.electron.ipcRenderer.on('update-not-available', () => {});

// Update downloaded and ready to install
window.electron.ipcRenderer.on('update-downloaded', () => {});
```

## Platform-Specific Considerations

### Windows

- Supports Windows 10/11 and Windows Server 2019+
- NSIS installer includes uninstaller
- Portable version requires no installation
- Code signing recommended for enterprise trust

### macOS

- Universal binary supports Intel and Apple Silicon
- DMG installer with drag-and-drop setup
- Requires notarization for distribution outside App Store
- Gatekeeper warnings without valid signature

### Linux

- AppImage: Single executable, works on most distributions
- DEB: Standard Debian package, installs to `/opt/nissi-agent`
- Supports Ubuntu 20.04+, Debian 11+, Fedora 34+, etc.

## Security Considerations

1. **Code Signature Verification**
   - Production builds verify digital signatures on startup
   - Prevents tampering with executable

2. **Secure IPC**
   - Preload script provides sandboxed access
   - Context isolation enabled
   - Node integration disabled

3. **Secure Storage**
   - Sensitive data stored with OS-level encryption
   - Windows: Data Protection API (DPAPI)
   - macOS: Keychain
   - Linux: Basic encryption with local key

## Troubleshooting

### Updates Not Detected

1. Ensure `main` or `develop` branch has version bump in `package.json`
2. Tag must match format: `v1.0.0`
3. Check GitHub Releases are published

### Signature Verification Failed

- Development builds skip verification
- Production builds require valid code signatures
- Check certificate files and paths in `electron-builder.config.js`

### AppImage Won't Execute

```bash
chmod +x NISSI-Agent-1.0.0-x86_64.AppImage
./NISSI-Agent-1.0.0-x86_64.AppImage
```

## Next Steps

1. **Code Signing Certificates**
   - Purchase Windows Authenticode cert (optional)
   - Enroll in Apple Developer Program (optional)
   - Update `electron-builder.config.js`

2. **Custom Update Server**
   - Consider self-hosted Electron Release Server for production
   - Update `electron-updater` provider configuration

3. **Testing**
   - Test installers on clean VMs for each platform
   - Verify auto-update flow end-to-end
   - Test uninstall/reinstall

4. **Documentation**
   - Create IT deployment guide for organizations
   - Document command-line installation for IT teams
   - Provide troubleshooting guides