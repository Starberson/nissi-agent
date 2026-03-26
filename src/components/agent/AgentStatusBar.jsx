import React from "react";
import { Shield, Wifi, Battery, Cpu, Database, Clock, AlertTriangle, CheckCircle } from "lucide-react";

export default function AgentStatusBar({ deviceInfo, agentStatus, lastHeartbeat, batteryLevel, isCharging, cpuUsage, memUsage, networkType, connected, platform, threats }) {
  const isIOS = platform === "ios";
  const scoreColor = (agentStatus.security_score || 100) >= 80 ? "text-green-400" : (agentStatus.security_score || 100) >= 60 ? "text-yellow-400" : "text-red-400";
  const ringColor = (agentStatus.security_score || 100) >= 80 ? "#22c55e" : (agentStatus.security_score || 100) >= 60 ? "#eab308" : "#ef4444";
  const score = agentStatus.security_score || 100;

  const metrics = [
    { label: "Battery", value: `${batteryLevel}%${isCharging ? " ⚡" : ""}`, icon: Battery, color: batteryLevel > 20 ? "text-green-400" : "text-red-400" },
    { label: "CPU", value: `${cpuUsage}%`, icon: Cpu, color: cpuUsage < 70 ? "text-blue-400" : "text-orange-400" },
    { label: "Memory", value: `${memUsage}%`, icon: Database, color: memUsage < 80 ? "text-purple-400" : "text-orange-400" },
    { label: "Network", value: connected ? (networkType || "wifi") : "Offline", icon: Wifi, color: connected ? "text-green-400" : "text-red-400" }
  ];

  return (
    <div className="space-y-4 pt-2">
      {/* Security Score Ring */}
      <div className="bg-[#1a2332] rounded-3xl p-6 flex flex-col items-center border border-white/10">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke={ringColor}
              strokeWidth="10"
              strokeDasharray={`${(score / 100) * 314} 314`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-white/50 text-xs">Security Score</span>
          </div>
        </div>
        <p className="text-white font-semibold mt-3 text-lg">
          {score >= 80 ? "Excellent Protection" : score >= 60 ? "Needs Attention" : "At Risk"}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {score >= 80
            ? <><CheckCircle className="w-4 h-4 text-green-400" /><span className="text-green-400 text-sm">Device is secure</span></>
            : <><AlertTriangle className="w-4 h-4 text-yellow-400" /><span className="text-yellow-400 text-sm">Threats detected</span></>
          }
        </div>
      </div>

      {/* Device Metrics */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(m => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-[#1a2332] rounded-2xl p-4 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-white/50 text-xs">{m.label}</span>
              </div>
              <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
            </div>
          );
        })}
      </div>

      {/* Agent Status */}
      <div className="bg-[#1a2332] rounded-2xl p-4 border border-white/10 space-y-3">
        <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider">Agent Status</h3>
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Last Heartbeat</span>
          <span className="text-white text-sm">{lastHeartbeat ? lastHeartbeat.toLocaleTimeString() : "Connecting..."}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Device ID</span>
          <span className="text-white/80 text-xs font-mono">{deviceInfo.device_id?.slice(-12) || "..."}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Platform</span>
          <span className="text-white text-sm capitalize">{platform}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Network Isolation</span>
          <span className={`text-sm font-medium ${agentStatus.network_isolation ? "text-red-400" : "text-green-400"}`}>
            {agentStatus.network_isolation ? "Active" : "Off"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">Threats Blocked</span>
          <span className="text-white text-sm">{threats.filter(t => t.type !== 'scan_complete').length}</span>
        </div>
      </div>

      {/* Isolation Warning */}
      {agentStatus.network_isolation && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 font-semibold text-sm">Network Isolation Active</p>
              <p className="text-red-400/70 text-xs mt-1">This device has been isolated by your security team. Contact your admin to restore access.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}