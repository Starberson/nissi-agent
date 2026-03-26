import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Scan, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export default function AdvancedScanManager({ deviceInfo, platform }) {
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [error, setError] = useState(null);

  const runFullScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      // Parallel execution of all scans
      const [apps, network, permissions, fileSystem, rootStatus, threats] = await Promise.all([
        base44.functions.invoke('getNativeAppsList', { device_id: deviceInfo.device_id }),
        base44.functions.invoke('monitorNetworkActivity', { device_id: deviceInfo.device_id, platform }),
        base44.functions.invoke('checkPermissions', { device_id: deviceInfo.device_id, platform }),
        base44.functions.invoke('scanFileSystem', { device_id: deviceInfo.device_id, platform }),
        base44.functions.invoke('detectRootJailbreak', { device_id: deviceInfo.device_id, platform }),
        base44.functions.invoke('threatDetectionEngine', { 
          device_id: deviceInfo.device_id, 
          platform,
          scan_data: { 
            suspicious_apps: true, 
            anomalous_permissions: true, 
            network_threats: true 
          }
        })
      ]);

      const results = {
        timestamp: new Date().toISOString(),
        apps: apps.data,
        network: network.data,
        permissions: permissions.data,
        fileSystem: fileSystem.data,
        rootStatus: rootStatus.data,
        threats: threats.data,
        summary: {
          total_issues: (apps.data?.app_count || 0) + (threats.data?.threats_detected || 0),
          critical_threats: threats.data?.threats?.filter(t => t.severity === 'critical').length || 0
        }
      };

      setScanResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }, [deviceInfo.device_id, platform]);

  return (
    <div className="space-y-4">
      <button
        onClick={runFullScan}
        disabled={scanning}
        className="w-full bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
        {scanning ? 'Scanning...' : 'Run Full System Scan'}
      </button>

      {scanResults && (
        <div className="bg-card rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Scan Results</h3>
            <span className="text-sm text-muted-foreground">{scanResults.timestamp}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Apps Scanned: {scanResults.apps?.app_count || 0}</div>
            <div>Network Connections: {scanResults.network?.connections?.length || 0}</div>
            <div>Permissions Checked: {scanResults.permissions?.grants?.length || 0}</div>
            <div className="text-red-500 font-semibold">Threats: {scanResults.summary.total_issues}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}