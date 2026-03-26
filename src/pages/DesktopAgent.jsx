import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AgentEnrollment from "../components/agent/AgentEnrollment";
import AgentDashboard from "../components/agent/AgentDashboard";
import { detectPlatform } from "../components/agent/NativeBridge";

export default function DesktopAgent() {
  const [enrolled, setEnrolled] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [platform, setPlatform] = useState("windows");

  useEffect(() => {
    // Detect platform (Windows, macOS, Linux via Electron)
    setPlatform(detectPlatform());

    // Check if already enrolled (stored in localStorage)
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