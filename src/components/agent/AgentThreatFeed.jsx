import React from "react";
import { AlertTriangle, Wifi, Smartphone, Lock, Info, CheckCircle, Zap } from "lucide-react";

const severityConfig = {
  critical: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", label: "CRITICAL" },
  high: { color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30", label: "HIGH" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30", label: "MEDIUM" },
  low: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", label: "LOW" },
  info: { color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", label: "INFO" }
};

const typeIcon = {
  network_anomaly: Wifi,
  threat_detected: AlertTriangle,
  permission_change: Lock,
  scan_complete: CheckCircle,
  heartbeat: Info
};

export default function AgentThreatFeed({ threats, onSimulateThreat, platform }) {
  const btnColor = "bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300";

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Threat Feed</h2>
        <span className="text-white/40 text-xs">{threats.length} events</span>
      </div>

      {/* Simulate Threats (for demo/testing) */}
      <div className="bg-[#1a2332] rounded-2xl p-4 border border-white/10">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-3">Simulate Threat Event</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onSimulateThreat("network")} className={`${btnColor} text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1`}>
            <Wifi className="w-3 h-3" /> Network
          </button>
          <button onClick={() => onSimulateThreat("app")} className={`${btnColor} text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1`}>
            <Smartphone className="w-3 h-3" /> App Threat
          </button>
          <button onClick={() => onSimulateThreat("permission")} className={`${btnColor} text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1`}>
            <Lock className="w-3 h-3" /> Permission
          </button>
        </div>
      </div>

      {/* Threat List */}
      {threats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mb-3" />
          <p className="text-white font-semibold">No Threats Detected</p>
          <p className="text-white/40 text-sm mt-1">Your device is clean</p>
        </div>
      ) : (
        <div className="space-y-3">
          {threats.map(threat => {
            const cfg = severityConfig[threat.severity] || severityConfig.info;
            const Icon = typeIcon[threat.type] || AlertTriangle;
            return (
              <div key={threat.id} className={`rounded-2xl p-4 border ${cfg.bg}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${cfg.bg} flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-white/30 text-xs">{threat.time}</span>
                    </div>
                    {threat.name && <p className="text-white/80 text-xs font-mono mt-0.5">{threat.name}</p>}
                    <p className="text-white/60 text-xs mt-1 leading-relaxed">{threat.message}</p>
                    {threat.remediation && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs">{threat.remediation.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}