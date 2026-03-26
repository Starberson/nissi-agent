import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function UpdateManager({ deviceInfo }) {
  const [updateStatus, setUpdateStatus] = useState(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const res = await base44.functions.invoke('agentSelfUpdate', {
        device_id: deviceInfo.device_id,
        current_version: deviceInfo.app_version || '1.0.0'
      });
      setUpdateStatus(res.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdate = async () => {
    setInstalling(true);
    try {
      // In production, download and install the update
      // For now, simulate the process
      await new Promise(r => setTimeout(r, 3000));
      setUpdateStatus({ needs_update: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setInstalling(false);
    }
  };

  if (!updateStatus) return <div>Checking for updates...</div>;

  return (
    <div className="bg-card rounded-lg p-4 space-y-3">
      {updateStatus.needs_update ? (
        <>
          <div className="flex items-start gap-3">
            <Download className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold">Update Available</h3>
              <p className="text-sm text-muted-foreground">{updateStatus.current_version} → {updateStatus.latest_version}</p>
              <p className="text-xs text-muted-foreground mt-1">{updateStatus.changelog}</p>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            disabled={installing}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-2 text-sm font-semibold flex items-center justify-center gap-2"
          >
            {installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {installing ? 'Installing...' : 'Install Update'}
          </button>
          {updateStatus.mandatory && (
            <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              ⚠️ This is a mandatory security update
            </p>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <div>
            <p className="font-semibold">Up to Date</p>
            <p className="text-sm">v{updateStatus.current_version}</p>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}