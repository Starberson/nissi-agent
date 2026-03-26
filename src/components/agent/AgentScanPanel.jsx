import React, { useState } from "react";
import { Scan, CheckCircle, Loader2, Shield, FileSearch, Wifi, Smartphone, Lock } from "lucide-react";

const SCAN_STEPS = [
  { label: "Checking installed apps", icon: Smartphone, duration: 600 },
  { label: "Analyzing network connections", icon: Wifi, duration: 700 },
  { label: "Scanning file system", icon: FileSearch, duration: 800 },
  { label: "Checking permissions", icon: Lock, duration: 500 },
  { label: "Verifying device integrity", icon: Shield, duration: 600 }
];

export default function AgentScanPanel({ onScan, scanning, platform, deviceInfo }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completed, setCompleted] = useState(false);
  const [localScanning, setLocalScanning] = useState(false);
  const btnColor = "bg-cyan-500 hover:bg-cyan-400";

  const handleScan = async () => {
    setLocalScanning(true);
    setCompleted(false);
    setProgress(0);
    setCurrentStep(0);

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setCurrentStep(i);
      await new Promise(r => setTimeout(r, SCAN_STEPS[i].duration));
      setProgress(Math.round(((i + 1) / SCAN_STEPS.length) * 100));
    }

    await onScan();
    setCurrentStep(-1);
    setLocalScanning(false);
    setCompleted(true);
  };

  const isRunning = scanning || localScanning;

  return (
    <div className="space-y-4 pt-2">
      <h2 className="text-white font-semibold text-lg">Device Scan</h2>

      {/* Scan Card */}
      <div className="bg-[#1a2332] rounded-3xl p-6 border border-white/10 flex flex-col items-center">
        {/* Scanner Visual */}
        <div className="relative w-36 h-36 mb-6">
          <div className={`absolute inset-0 rounded-full border-4 ${isRunning ? "border-green-500/30 animate-pulse" : "border-white/10"}`} />
          <div className={`absolute inset-4 rounded-full border-2 ${isRunning ? "border-green-400/50" : "border-white/10"}`} />
          <div className="absolute inset-0 flex items-center justify-center">
            {isRunning ? (
              <Loader2 className="w-10 h-10 text-green-400 animate-spin" />
            ) : completed ? (
              <CheckCircle className="w-10 h-10 text-green-400" />
            ) : (
              <Scan className="w-10 h-10 text-white/40" />
            )}
          </div>
          {isRunning && (
            <div className="absolute -inset-2 rounded-full border border-green-500/20 animate-ping" />
          )}
        </div>

        {isRunning && (
          <>
            <div className="w-full bg-white/10 rounded-full h-2 mb-3">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-white/60 text-sm text-center">
              {currentStep >= 0 && currentStep < SCAN_STEPS.length ? SCAN_STEPS[currentStep].label : "Finalizing..."}
            </p>
            <p className="text-white/30 text-xs mt-1">{progress}% complete</p>
          </>
        )}

        {completed && !isRunning && (
          <div className="text-center">
            <p className="text-green-400 font-semibold">Scan Complete</p>
            <p className="text-white/40 text-sm mt-1">No threats found on this device</p>
          </div>
        )}

        {!isRunning && !completed && (
          <div className="text-center">
            <p className="text-white font-semibold">Ready to Scan</p>
            <p className="text-white/40 text-sm mt-1">Run a full security scan on your device</p>
          </div>
        )}
      </div>

      {!isRunning && (
        <button
          onClick={handleScan}
          className={`w-full ${btnColor} text-white rounded-2xl py-4 font-semibold transition-all flex items-center justify-center gap-2 shadow-lg`}
        >
          <Scan className="w-5 h-5" />
          Start Full Scan
        </button>
      )}

      {/* Scan Coverage */}
      <div className="bg-[#1a2332] rounded-2xl p-4 border border-white/10 space-y-3">
        <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Scan Coverage</p>
        {SCAN_STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = isRunning ? i < currentStep : completed;
          const active = isRunning && i === currentStep;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${done ? "bg-green-500/20" : active ? "bg-yellow-500/20" : "bg-white/10"}`}>
                <Icon className={`w-4 h-4 ${done ? "text-green-400" : active ? "text-yellow-400" : "text-white/40"}`} />
              </div>
              <span className={`text-sm flex-1 ${done ? "text-white/80" : active ? "text-yellow-300" : "text-white/40"}`}>{step.label}</span>
              {done && <CheckCircle className="w-4 h-4 text-green-400" />}
              {active && <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}