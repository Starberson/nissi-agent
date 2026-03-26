import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { device_id, platform, event_type, severity, description, threat_name, apps_flagged, raw_data, battery_level, cpu_usage, memory_usage, network_type } = body;

  if (!device_id || !platform || !event_type) {
    return Response.json({ error: 'device_id, platform, and event_type are required' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Log the telemetry event
  const telemetry = await base44.asServiceRole.entities.AgentTelemetry.create({
    device_id,
    platform,
    event_type,
    severity: severity || 'info',
    description,
    threat_name,
    apps_flagged: apps_flagged || [],
    raw_data: raw_data ? JSON.stringify(raw_data) : null,
    battery_level,
    cpu_usage,
    memory_usage,
    network_type,
    remediated: false
  });

  // Update device stats if it's a threat
  if (['threat_detected', 'network_anomaly', 'rooted_jailbroken'].includes(event_type)) {
    const devices = await base44.asServiceRole.entities.AgentDevice.filter({ device_id });
    if (devices.length > 0) {
      const dev = devices[0];
      let scoreReduction = 0;
      if (severity === 'critical') scoreReduction = 20;
      else if (severity === 'high') scoreReduction = 15;
      else if (severity === 'medium') scoreReduction = 10;
      else if (severity === 'low') scoreReduction = 5;

      const newScore = Math.max(0, (dev.security_score || 100) - scoreReduction);
      await base44.asServiceRole.entities.AgentDevice.update(dev.id, {
        security_score: newScore,
        last_heartbeat: now,
        threats_blocked: (dev.threats_blocked || 0) + 1
      });
    }
  }

  // Auto-remediation for certain events
  let remediation = null;
  if (event_type === 'threat_detected' && severity === 'critical') {
    remediation = { action: 'quarantine_app', message: 'Threat quarantined automatically by NISSI AI' };
  } else if (event_type === 'network_anomaly' && severity === 'high') {
    remediation = { action: 'block_connection', message: 'Malicious connection blocked by NISSI AI' };
  }

  return Response.json({
    success: true,
    telemetry_id: telemetry.id,
    remediation,
    timestamp: now
  });
});