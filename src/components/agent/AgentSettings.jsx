import React, { useState } from "react";
import { Shield, Smartphone, Apple, Copy, LogOut, Bell, Lock, RefreshCw, CheckCircle } from "lucide-react";

export default function AgentSettings({ deviceInfo, agentStatus, onUnenroll, platform }) {
  const [copied, setCopied] = useState(false);
  const [showConfirmUnenroll, setShowConfirmUnenroll] = useState(false);
  const isIOS = platform === "ios";
  const PlatformIcon = isIOS ? Apple : Smartphone;

  const copyDeviceId = () => {
    navigator.clipboard.writeText(deviceInfo.device_id || "").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-white font-semibold text-lg">Settings</h2>

      {/* Device Info */}
      <div className="bg-[#1a2332] rounded-2xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center gap-3 pb-2 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <PlatformIcon className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{deviceInfo.device_name || "My Device"}</p>
            <p className="text-white/50 text-xs capitalize">{platform} · v{deviceInfo.app_version || "1.0.0"}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Device ID</span>
            <button onClick={copyDeviceId} className="flex items-center gap-1.5 text-white/80 text-xs hover:text-white transition-colors">
              <span className="font-mono">{deviceInfo.device_id?.slice(-16) || "..."}</span>
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Owner</span>
            <span className="text-white/80 text-sm">{deviceInfo.owner_email || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">Enrolled</span>
            <span className="text-white/80 text-sm">{deviceInfo.enrolled_at ? new Date(deviceInfo.enrolled_at).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-sm">OS Version</span>
            <span className="text-white/80 text-sm">{deviceInfo.os_version || "Unknown"}</span>
          </div>
        </div>
      </div>

      {/* Protection Status */}
      <div className="bg-[#1a2332] rounded-2xl p-4 border border-white/10 space-y-3">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Protection</p>
        {[
          { label: "Real-time Protection", value: true },
          { label: "Encrypted Telemetry", value: true },
          { label: "Network Monitoring", value: true },
          { label: "Network Isolation", value: agentStatus.network_isolation || false }
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-white/70 text-sm">{item.label}</span>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${item.value ? "text-green-400" : "text-white/30"}`}>
              <div className={`w-2 h-2 rounded-full ${item.value ? "bg-green-400" : "bg-white/20"}`} />
              {item.value ? "Active" : "Off"}
            </div>
          </div>
        ))}
      </div>

      {/* Heartbeat Info */}
      <div className="bg-[#1a2332] rounded-2xl p-4 border border-white/10">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-cyan-400" />
          <div>
            <p className="text-white/80 text-sm font-medium">Heartbeat Interval</p>
            <p className="text-white/40 text-xs">Reports to NISSI every 30 seconds</p>
          </div>
        </div>
      </div>

      {/* Unenroll */}
      <div className="pb-4">
        {!showConfirmUnenroll ? (
          <button
            onClick={() => setShowConfirmUnenroll(true)}
            className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl py-3.5 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Unenroll Device
          </button>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-3">
            <p className="text-red-300 text-sm font-semibold text-center">Confirm Unenrollment</p>
            <p className="text-red-400/70 text-xs text-center">This device will no longer be protected by NISSI.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmUnenroll(false)} className="flex-1 bg-white/10 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-white/20 transition-all">
                Cancel
              </button>
              <button onClick={onUnenroll} className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-500 transition-all">
                Unenroll
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}