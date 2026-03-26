import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { device_id, platform } = body;

    if (!device_id) return Response.json({ error: 'device_id required' }, { status: 400 });

    // Mock file scan results
    const findings = [
      { path: "/system/app/chrome.apk", type: "suspicious_binary", severity: "medium" },
      { path: "/data/data/unknown.spy/classes.dex", type: "malware_signature", severity: "critical" },
      { path: "/cache/temp_payload.bin", type: "trojan", severity: "high" }
    ];

    for (const finding of findings) {
      await base44.asServiceRole.entities.AgentTelemetry.create({
        device_id,
        platform,
        event_type: 'threat_detected',
        severity: finding.severity,
        description: `${finding.type} detected at ${finding.path}`,
        threat_name: finding.type.toUpperCase(),
        raw_data: JSON.stringify(finding)
      });
    }

    return Response.json({ success: true, findings_count: findings.length, findings });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});