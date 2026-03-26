import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { device_id, platform, os_version, app_version, battery_level, cpu_usage, memory_usage, network_type, is_rooted, is_encrypted, ip_address, location } = body;

  if (!device_id || !platform) {
    return Response.json({ error: 'device_id and platform are required' }, { status: 400 });
  }

  // Find existing device or create it
  const devices = await base44.asServiceRole.entities.AgentDevice.filter({ device_id });
  const now = new Date().toISOString();

  let device;
  if (devices.length > 0) {
    device = await base44.asServiceRole.entities.AgentDevice.update(devices[0].id, {
      last_heartbeat: now,
      status: 'active',
      ip_address: ip_address || devices[0].ip_address,
      os_version: os_version || devices[0].os_version,
      app_version: app_version || devices[0].app_version,
      location: location || devices[0].location
    });
  } else {
    // Auto-register new device
    device = await base44.asServiceRole.entities.AgentDevice.create({
      device_id,
      platform,
      os_version,
      app_version,
      last_heartbeat: now,
      status: 'active',
      ip_address,
      location,
      enrolled_at: now,
      threats_blocked: 0,
      security_score: 100
    });
  }

  // Log heartbeat telemetry
  await base44.asServiceRole.entities.AgentTelemetry.create({
    device_id,
    platform,
    event_type: 'heartbeat',
    severity: 'info',
    description: `Heartbeat from ${platform} device`,
    battery_level,
    cpu_usage,
    memory_usage,
    network_type,
    is_rooted: is_rooted || false,
    is_encrypted: is_encrypted !== false
  });

  // Check for pending commands
  const commands = await base44.asServiceRole.entities.AgentCommand.filter({ device_id, status: 'pending' });

  // If device is rooted/jailbroken, flag it
  if (is_rooted) {
    await base44.asServiceRole.entities.AgentTelemetry.create({
      device_id,
      platform,
      event_type: 'rooted_jailbroken',
      severity: 'critical',
      description: `Device ${device_id} detected as rooted/jailbroken`,
      is_rooted: true
    });
    await base44.asServiceRole.entities.AgentDevice.update(device.id, { security_score: 30 });
  }

  return Response.json({
    success: true,
    device_id,
    status: device.status || 'active',
    network_isolation: device.network_isolation || false,
    remote_wipe_requested: device.remote_wipe_requested || false,
    pending_commands: commands.map(c => ({ id: c.id, command: c.command, parameters: c.parameters })),
    server_time: now
  });
});