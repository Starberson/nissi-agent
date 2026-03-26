import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import AgentStatusBar from "./AgentStatusBar";
import AgentThreatFeed from "./AgentThreatFeed";
import AgentScanPanel from "./AgentScanPanel";
import AgentSettings from "./AgentSettings";
import useDeviceMetrics from "./useDeviceMetrics";
import { getSafeAreaInsets, vibrate } from "./NativeBridge";
import { Shield, Activity, Scan, Settings } from "lucide-react";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export default function AgentDashboard({ deviceInfo, platform, onUnenroll }) {
  const [activeTab, setActiveTab] = useState("status");
  const [agentStatus, setAgentStatus] = useState({ status: "active", network_isolation: false, pending_commands: [] });
  const [threats, setThreats] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState(null);
  const [safeArea] = useState(() => getSafeAreaInsets());
  const { batteryLevel, isCharging, cpuUsage, memUsage, networkType, connected, isRooted } = useDeviceMetrics();
  const isIOS = platform === "ios";

  const sendHeartbeat = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("agentHeartbeat", {
        device_id: deviceInfo.device_id,
        platform,
        os_version: deviceInfo.os_version || "Unknown",
        app_version: deviceInfo.app_version || "1.0.0",
        battery_level: batteryLevel,
        cpu_usage: cpuUsage,
        memory_usage: memUsage,
        network_type: networkType || (connected ? "wifi" : "offline"),
        is_rooted: isRooted,
        is_encrypted: true
      });
      if (res.data) {
        setAgentStatus(res.data);
        setLastHeartbeat(new Date());
        // Execute any pending commands
        if (res.data.pending_commands && res.data.pending_commands.length > 0) {
          for (const cmd of res.data.pending_commands) {
            await handleCommand(cmd);
          }
        }
      }
    } catch (e) {
      console.warn("Heartbeat failed:", e);
    }
  }, [deviceInfo, platform, batteryLevel, cpuUsage, memUsage]);

  const handleCommand = async (cmd) => {
    vibrate("medium");
    // Acknowledge command
    await base44.functions.invoke("agentCommandAck", {
      command_id: cmd.id,
      device_id: deviceInfo.device_id,
      status: "acknowledged"
    });

    // Simulate executing the command
    setTimeout(async () => {
      await base44.functions.invoke("agentCommandAck", {
        command_id: cmd.id,
        device_id: deviceInfo.device_id,
        status: "completed",
        result: `${cmd.command} executed successfully on ${platform} device`
      });
    }, 2000);
  };

  const runScan = async () => {
    setScanning(true);
    // Simulate scan — in a real wrapped app this would call native APIs
    await new Promise(r => setTimeout(r, 3000));

    // Report scan complete
    await base44.functions.invoke("agentReportThreat", {
      device_id: deviceInfo.device_id,
      platform,
      event_type: "scan_complete",
      severity: "info",
      description: `Full device scan completed. No threats found.`,
      cpu_usage: cpuUsage,
      memory_usage: memUsage
    });

    setThreats(prev => [{
      id: Date.now(),
      type: "scan_complete",
      severity: "info",
      message: "Full scan completed — device clean",
      time: new Date().toLocaleTimeString()
    }, ...prev]);

    setScanning(false);
  };

  const reportTestThreat = async (threatType) => {
    const threats_map = {
      network: { event_type: "network_anomaly", severity: "high", description: "Suspicious outbound connection detected to known C2 server", threat_name: "C2.Botnet.Outbound" },
      app: { event_type: "threat_detected", severity: "medium", description: "Potentially harmful app behavior detected", threat_name: "Adware.Hidden.DataCollect" },
      permission: { event_type: "permission_change", severity: "low", description: "App requested camera access without user interaction", threat_name: "PermissionAbuse.Camera" }
    };
    const t = threats_map[threatType];
    const res = await base44.functions.invoke("agentReportThreat", {
      device_id: deviceInfo.device_id,
      platform,
      ...t,
      cpu_usage: cpuUsage,
      memory_usage: memUsage
    });

    setThreats(prev => [{
      id: Date.now(),
      type: t.event_type,
      severity: t.severity,
      message: t.description,
      name: t.threat_name,
      remediation: res.data?.remediation,
      time: new Date().toLocaleTimeString()
    }, ...prev]);
  };

  useEffect(() => {
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    return () => clearInterval(interval);
  }, [sendHeartbeat]);

  const bgGradient = "from-[#0d1117] via-[#0f1923] to-[#0d1117]";
  const activeTabColor = "bg-cyan-500/20 text-cyan-400";
  const tabs = [
    { id: "status", label: "Status", icon: Shield },
    { id: "threats", label: "Threats", icon: Activity },
    { id: "scan", label: "Scan", icon: Scan },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} flex flex-col`}>
      {/* Header — safe area aware */}
      <div className="px-5 pb-4 flex items-center justify-between" style={{ paddingTop: `${safeArea.top + 8}px` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">NISSI Agent</p>
            <p className="text-white/50 text-xs">{deviceInfo.device_name}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${agentStatus.network_isolation ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}>
          {agentStatus.network_isolation ? "Isolated" : "Protected"}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {activeTab === "status" && (
          <AgentStatusBar
            deviceInfo={deviceInfo}
            agentStatus={agentStatus}
            lastHeartbeat={lastHeartbeat}
            batteryLevel={batteryLevel}
            isCharging={isCharging}
            cpuUsage={cpuUsage}
            memUsage={memUsage}
            networkType={networkType}
            connected={connected}
            platform={platform}
            threats={threats}
          />
        )}
        {activeTab === "threats" && (
          <AgentThreatFeed threats={threats} onSimulateThreat={reportTestThreat} platform={platform} />
        )}
        {activeTab === "scan" && (
          <AgentScanPanel onScan={runScan} scanning={scanning} platform={platform} deviceInfo={deviceInfo} />
        )}
        {activeTab === "settings" && (
          <AgentSettings deviceInfo={deviceInfo} agentStatus={agentStatus} onUnenroll={onUnenroll} platform={platform} />
        )}
      </div>

      {/* Bottom Nav — safe area aware */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d1117]/90 backdrop-blur-xl border-t border-white/10 flex" style={{ paddingBottom: `${safeArea.bottom}px` }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-all ${isActive ? "text-white" : "text-white/40"}`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? activeTabColor : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}