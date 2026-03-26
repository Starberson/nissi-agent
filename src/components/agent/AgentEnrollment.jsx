import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, Smartphone, Apple, CheckCircle, Loader2, Lock } from "lucide-react";

export default function AgentEnrollment({ platform, onEnrolled }) {
  const [step, setStep] = useState(1);
  const [deviceName, setDeviceName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isIOS = platform === "ios";
  const PlatformIcon2 = isIOS ? Apple : Smartphone;

  const handleEnroll = async () => {
    if (!deviceName.trim() || !email.trim()) {
      setError("Device name and email are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ua = navigator.userAgent;
      const osVersion = isIOS
        ? (ua.match(/OS (\d+_\d+)/) || ["", "Unknown"])[1].replace("_", ".")
        : (ua.match(/Android (\d+\.?\d*)/) || ["", "Unknown"])[1];

      const res = await base44.functions.invoke("agentEnroll", {
        device_name: deviceName,
        platform,
        os_version: osVersion || "Unknown",
        app_version: "1.0.0",
        owner_email: email
      });

      const data = res.data;
      // Show org linking confirmation if linked
      if (data.org_name) setStep(2);
      onEnrolled(data);
    } catch (e) {
      setError("Enrollment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const PlatformIcon = isIOS ? Apple : Smartphone;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1117] via-[#0f1923] to-[#0d1117] flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-2xl">
          <Shield className="w-10 h-10 text-cyan-400" />
        </div>
        <h1 className="text-white text-2xl font-bold">NISSI Agent</h1>
        <p className="text-white/50 text-sm mt-1 flex items-center gap-1">
          <PlatformIcon className="w-4 h-4" />
          {isIOS ? "iOS" : "Mobile"} Endpoint Protection
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#1a2332] rounded-3xl p-6 shadow-2xl border border-white/10">
        {step === 2 && (
          <div className="space-y-4 text-center">
            <CheckCircle className="w-14 h-14 text-cyan-400 mx-auto" />
            <h2 className="text-white text-xl font-semibold">Device Enrolled!</h2>
            <p className="text-white/50 text-sm">Your device has been linked to your organization and is now protected.</p>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Lock className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
              <h2 className="text-white text-xl font-semibold">Activate Protection</h2>
              <p className="text-white/50 text-sm mt-1">Enroll this device in NISSI Security</p>
            </div>
            <div>
              <label className="text-white/60 text-xs font-medium uppercase tracking-wider block mb-1">Device Name</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                placeholder={`My ${isIOS ? "iPhone" : "Android"} Phone`}
                value={deviceName}
                onChange={e => setDeviceName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-white/60 text-xs font-medium uppercase tracking-wider block mb-1">Work Email</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-red-300 text-sm text-center">{error}</p>}
            <button
              onClick={handleEnroll}
              disabled={loading}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl py-3.5 font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 shadow-lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? "Enrolling..." : "Enroll & Protect Device"}
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="mt-8 w-full max-w-sm space-y-2">
        {["Real-time threat detection", "AI-powered analysis", "Remote security commands", "Encrypted telemetry"].map(f => (
          <div key={f} className="flex items-center gap-3 text-white/60 text-sm">
            <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}