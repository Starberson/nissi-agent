import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function DesktopUpdateManager() {
  const [updateStatus, setUpdateStatus] = useState('idle'); // idle, checking, available, downloading, ready
  const [updateInfo, setUpdateInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen for update events from main process
    const handleUpdateAvailable = () => setUpdateStatus('available');
    const handleUpdateNotAvailable = () => setUpdateStatus('idle');
    const handleUpdateDownloaded = () => setUpdateStatus('ready');

    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('update-available', handleUpdateAvailable);
      window.electron.ipcRenderer.on('update-not-available', handleUpdateNotAvailable);
      window.electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded);

      return () => {
        window.electron.ipcRenderer.off('update-available', handleUpdateAvailable);
        window.electron.ipcRenderer.off('update-not-available', handleUpdateNotAvailable);
        window.electron.ipcRenderer.off('update-downloaded', handleUpdateDownloaded);
      };
    }
  }, []);

  const checkForUpdates = async () => {
    setUpdateStatus('checking');
    setError(null);
    try {
      if (window.electron?.ipcRenderer) {
        const result = await window.electron.ipcRenderer.invoke('check-for-updates');
        if (result.hasUpdate) {
          setUpdateInfo(result);
          setUpdateStatus('available');
        } else {
          setUpdateStatus('idle');
        }
      }
    } catch (err) {
      setError(err.message);
      setUpdateStatus('idle');
    }
  };

  const downloadUpdate = async () => {
    setUpdateStatus('downloading');
    try {
      if (window.electron?.ipcRenderer) {
        const result = await window.electron.ipcRenderer.invoke('download-update');
        if (!result.success) {
          setError(result.error);
          setUpdateStatus('available');
        }
      }
    } catch (err) {
      setError(err.message);
      setUpdateStatus('available');
    }
  };

  const installUpdate = async () => {
    try {
      if (window.electron?.ipcRenderer) {
        await window.electron.ipcRenderer.invoke('install-update');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (updateStatus === 'idle') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-slate-200 p-4 max-w-sm z-50">
      {updateStatus === 'checking' && (
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
          <div>
            <p className="font-semibold text-slate-900">Checking for updates...</p>
            <p className="text-xs text-slate-600">Please wait</p>
          </div>
        </div>
      )}

      {updateStatus === 'available' && updateInfo && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Update Available</p>
              <p className="text-xs text-slate-600 mt-1">Version {updateInfo.version}</p>
              {updateInfo.changelog && (
                <p className="text-xs text-slate-600 mt-1">{updateInfo.changelog}</p>
              )}
            </div>
          </div>
          <button
            onClick={downloadUpdate}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded px-3 py-2 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Update
          </button>
        </div>
      )}

      {updateStatus === 'downloading' && (
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-cyan-500 animate-spin" />
          <div>
            <p className="font-semibold text-slate-900">Downloading update...</p>
            <p className="text-xs text-slate-600">Please don't close the app</p>
          </div>
        </div>
      )}

      {updateStatus === 'ready' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Update Ready</p>
              <p className="text-xs text-slate-600 mt-1">The application will restart to install the update</p>
            </div>
          </div>
          <button
            onClick={installUpdate}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded px-3 py-2 text-sm font-medium"
          >
            Install & Restart
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Update Error</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}