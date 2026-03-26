import React, { useState, useEffect } from "react";
import { Download, Apple, Monitor, Smartphone, CheckCircle, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Downloads() {
  const [latestVersion, setLatestVersion] = useState("1.0.0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest version from GitHub releases or your API
    fetchLatestVersion();
  }, []);

  const fetchLatestVersion = async () => {
    try {
      // In production, fetch from your release API
      // const res = await fetch('https://api.nissi.systems/releases/latest');
      // const data = await res.json();
      // setLatestVersion(data.version);
      setLatestVersion("1.0.0");
    } finally {
      setLoading(false);
    }
  };

  const downloads = [
    {
      platform: "Windows",
      icon: Monitor,
      versions: [
        { name: "Windows Installer (.exe)", url: "https://github.com/nissi-security/agent/releases/download/v1.0.0/NISSI-Agent-1.0.0-Setup.exe", file: "NISSI-Agent-1.0.0-Setup.exe" },
        { name: "Windows Portable (.zip)", url: "https://github.com/nissi-security/agent/releases/download/v1.0.0/NISSI-Agent-1.0.0-Portable.zip", file: "NISSI-Agent-1.0.0-Portable.zip" }
      ],
      description: "For Windows 10/11 and Windows Server"
    },
    {
      platform: "macOS",
      icon: Apple,
      versions: [
        { name: "macOS Intel (.dmg)", url: "https://github.com/nissi-security/agent/releases/download/v1.0.0/NISSI-Agent-1.0.0-x64.dmg", file: "NISSI-Agent-1.0.0-x64.dmg" },
        { name: "macOS Apple Silicon (.dmg)", url: "https://github.com/nissi-security/agent/releases/download/v1.0.0/NISSI-Agent-1.0.0-arm64.dmg", file: "NISSI-Agent-1.0.0-arm64.dmg" }
      ],
      description: "For macOS 11 (Big Sur) and later"
    },
    {
      platform: "Linux",
      icon: Shield,
      versions: [
        { name: "Linux AppImage", url: "https://github.com/nissi-security/agent/releases/download/v1.0.0/NISSI-Agent-1.0.0-x86_64.AppImage", file: "NISSI-Agent-1.0.0-x86_64.AppImage" },
        { name: "Linux Debian (.deb)", url: "https://github.com/nissi-security/agent/releases/download/v1.0.0/nissi-agent_1.0.0_amd64.deb", file: "nissi-agent_1.0.0_amd64.deb" }
      ],
      description: "For Ubuntu, Debian, Fedora, and other Linux distributions"
    },
    {
      platform: "Mobile",
      icon: Smartphone,
      versions: [
        { name: "iOS App Store", url: "https://apps.apple.com/app/nissi-agent", file: "App Store" },
        { name: "Google Play Store", url: "https://play.google.com/store/apps/details?id=com.nissi.agent", file: "Play Store" }
      ],
      description: "iOS and Android mobile protection"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold">NISSI Agent Downloads</h1>
          </div>
          <p className="text-slate-300 text-lg">Secure endpoint protection for Windows, macOS, Linux, iOS, and Android</p>
          <p className="text-slate-400 text-sm mt-2">Latest version: <span className="font-mono text-cyan-400">{latestVersion}</span></p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <Zap className="w-6 h-6 text-cyan-500 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Fast Installation</h3>
            <p className="text-slate-600 text-sm">Download, install, and enroll in minutes with automated setup</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <Shield className="w-6 h-6 text-cyan-500 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Real-time Protection</h3>
            <p className="text-slate-600 text-sm">Continuous threat detection and automated remediation</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <CheckCircle className="w-6 h-6 text-cyan-500 mb-3" />
            <h3 className="font-semibold text-lg mb-2">Auto-Updates</h3>
            <p className="text-slate-600 text-sm">Automatic security updates without user intervention</p>
          </div>
        </div>

        {/* Download Sections */}
        <div className="space-y-8">
          {downloads.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.platform} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200 flex items-center gap-4">
                  <Icon className="w-8 h-8 text-slate-700" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{section.platform}</h2>
                    <p className="text-slate-600 text-sm">{section.description}</p>
                  </div>
                </div>

                <div className="p-8 space-y-3">
                  {section.versions.map((version) => (
                    <a
                      key={version.file}
                      href={version.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-slate-600 group-hover:text-cyan-500 transition-colors" />
                        <div>
                          <p className="font-medium text-slate-900">{version.name}</p>
                          <p className="text-xs text-slate-500">{version.file}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-cyan-600 group-hover:text-cyan-700">Download</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Installation Instructions */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-blue-900 mb-4">Installation & Enrollment</h3>
          <ol className="space-y-3 text-blue-900">
            <li className="flex gap-3">
              <span className="font-bold">1.</span>
              <span>Download the appropriate installer for your operating system</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">2.</span>
              <span>Run the installer and follow the setup wizard</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">3.</span>
              <span>Launch NISSI Agent and enter your work email to enroll</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold">4.</span>
              <span>Your device will automatically link to your organization</span>
            </li>
          </ol>
        </div>

        {/* Support */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">Need help with installation or enrollment?</p>
          <a href="mailto:support@nissi.systems" className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}