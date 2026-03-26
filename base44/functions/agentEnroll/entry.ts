import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { device_name, platform, os_version, app_version, owner_email, ip_address } = body;

  if (!platform || !['android', 'ios'].includes(platform)) {
    return Response.json({ error: 'platform must be "android" or "ios"' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Generate unique device ID and API key
  const device_id = `NISSI-${platform.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const api_key = `nsk_${Math.random().toString(36).substr(2, 32)}${Math.random().toString(36).substr(2, 10)}`;

  // Resolve organization by email domain
  let org_id = null;
  let org_name = null;
  if (owner_email && owner_email.includes('@')) {
    const domain = owner_email.split('@')[1].toLowerCase();
    const orgs = await base44.asServiceRole.entities.Organization.filter({ email_domain: domain });
    if (orgs.length > 0) {
      org_id = orgs[0].id;
      org_name = orgs[0].name;
    }
  }

  const device = await base44.asServiceRole.entities.AgentDevice.create({
    device_id,
    device_name: device_name || `${platform === 'android' ? 'Android' : 'iOS'} Device`,
    platform,
    os_version: os_version || 'Unknown',
    app_version: app_version || '1.0.0',
    api_key,
    status: 'active',
    security_score: 100,
    last_heartbeat: now,
    ip_address,
    owner_email,
    enrolled_at: now,
    threats_blocked: 0,
    network_isolation: false,
    remote_wipe_requested: false,
    org_id: org_id || null,
    org_name: org_name || null
  });

  // Log enrollment telemetry
  await base44.asServiceRole.entities.AgentTelemetry.create({
    device_id,
    platform,
    event_type: 'heartbeat',
    severity: 'info',
    description: `Device enrolled: ${device_name || device_id}`
  });

  return Response.json({
    success: true,
    device_id,
    api_key,
    device_name: device.device_name,
    platform,
    enrolled_at: now,
    org_id,
    org_name,
    os_version: device.os_version,
    app_version: device.app_version,
    owner_email,
    nissi_endpoint: 'https://agent.nissi.systems/api',
    heartbeat_interval: 30,
    message: org_name
      ? `Device enrolled in NISSI — linked to ${org_name}`
      : 'Device enrolled in NISSI protection'
  });
});