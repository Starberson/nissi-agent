import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AgentEnrollment from "../components/agent/AgentEnrollment";
import AgentDashboard from "../components/agent/AgentDashboard";
import { detectPlatform, getPushToken } from "../components/agent/NativeBridge";

export default function MobileAgent() {
  const [enrolled, setEnrolled] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [platform, setPlatform] = useState("android");

  useEffect(() => {
    // Detect platform via NativeBridge (Capacitor-aware)
    setPlatform(detectPlatform());

    // Check if already enrolled (stored locally)
    const stored = localStorage.getItem("nissi_device");
    if (stored) {
      try {
        const info = JSON.parse(stored);
        setDeviceInfo(info);
        setEnrolled(true);
      } catch (e) {
        localStorage.removeItem("nissi_device");
      }
    }
  }, []);

  const handleEnrolled = async (info) => {
    localStorage.setItem("nissi_device", JSON.stringify(info));
    setDeviceInfo(info);
    setEnrolled(true);
    // Register push token in background after enrollment
    try {
      const token = await getPushToken();
      if (token) {
        await base44.functions.invoke("agentRegisterPushToken", {
          device_id: info.device_id,
          fcm_token: token
        });
      }
    } catch (e) {
      console.warn("Push token registration failed:", e);
    }
  };

  const handleUnenroll = () => {
    localStorage.removeItem("nissi_device");
    setDeviceInfo(null);
    setEnrolled(false);
  };

  if (!enrolled || !deviceInfo) {
    return <AgentEnrollment platform={platform} onEnrolled={handleEnrolled} />;
  }

  return <AgentDashboard deviceInfo={deviceInfo} platform={platform} onUnenroll={handleUnenroll} />;
}