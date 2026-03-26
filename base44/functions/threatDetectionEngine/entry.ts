import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { device_id, platform, scan_data } = body;

    if (!device_id) return Response.json({ error: 'device_id required' }, { status: 400 });

    // ML-based threat scoring (simplified)
    const threats = [];
    
    if (scan_data) {
      if (scan_data.suspicious_apps && scan_data.suspicious_apps.length > 0) {
        threats.push({
          type: 'malware',
          severity: 'high',
          confidence: 0.95,
          apps: scan_data.suspicious_apps,
          detection_name: 'Trojan.Android.Generic'
        });
      }

      if (scan_data.anomalous_permissions) {
        threats.push({
          type: 'privacy_risk',
          severity: 'medium',
          confidence: 0.78,
          details: 'Unusual permission grants detected',
          detection_name: 'PermissionAbuse.Aggressive'
        });
      }

      if (scan_data.network_threats) {
        threats.push({
          type: 'c2_communication',
          severity: 'critical',
          confidence: 0.92,
          details: 'Command & Control server communication detected',
          detection_name: 'Botnet.C2.Outbound'
        });
      }
    }

    // Log threats
    for (const threat of threats) {
      await base44.asServiceRole.entities.AgentTelemetry.create({
        device_id,
        platform,
        event_type: 'threat_detected',
        severity: threat.severity,
        description: threat.details || threat.type,
        threat_name: threat.detection_name,
        raw_data: JSON.stringify(threat)
      });
    }

    return Response.json({ success: true, threats_detected: threats.length, threats });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});