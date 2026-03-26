import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { device_id, platform } = body;

    if (!device_id) return Response.json({ error: 'device_id required' }, { status: 400 });

    // Mock network connections detected
    const connections = [
      { app: "Chrome", ip: "142.251.41.14", port: 443, domain: "google.com", suspicious: false },
      { app: "System", ip: "8.8.8.8", port: 53, domain: "dns.google", suspicious: false },
      { app: "Unknown", ip: "192.168.1.100", port: 4444, domain: "suspicious.cc", suspicious: true }
    ];

    await base44.asServiceRole.entities.AgentTelemetry.create({
      device_id,
      platform,
      event_type: 'network_anomaly',
      severity: 'medium',
      description: 'Suspicious network connection detected',
      raw_data: JSON.stringify(connections),
      threat_name: 'Network.Anomaly.C2'
    });

    return Response.json({ success: true, connections, suspicious_count: connections.filter(c => c.suspicious).length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});