import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const body = await req.json();
  const { command_id, device_id, status, result } = body;

  if (!command_id || !device_id || !status) {
    return Response.json({ error: 'command_id, device_id, and status are required' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Find the command
  const commands = await base44.asServiceRole.entities.AgentCommand.filter({ device_id });
  const command = commands.find(c => c.id === command_id);

  if (!command) {
    return Response.json({ error: 'Command not found' }, { status: 404 });
  }

  const updateData = { status, result: result || null };
  if (status === 'completed' || status === 'failed') {
    updateData.completed_at = now;
  } else if (status === 'acknowledged' || status === 'executing') {
    // no completed_at yet
  }

  await base44.asServiceRole.entities.AgentCommand.update(command_id, updateData);

  // Update device state based on completed command
  if (status === 'completed') {
    const devices = await base44.asServiceRole.entities.AgentDevice.filter({ device_id });
    if (devices.length > 0) {
      const deviceId = devices[0].id;
      if (command.command === 'isolate_network') {
        await base44.asServiceRole.entities.AgentDevice.update(deviceId, { network_isolation: true, status: 'quarantined' });
      } else if (command.command === 'restore_network') {
        await base44.asServiceRole.entities.AgentDevice.update(deviceId, { network_isolation: false, status: 'active' });
      } else if (command.command === 'remote_wipe') {
        await base44.asServiceRole.entities.AgentDevice.update(deviceId, { remote_wipe_requested: true, status: 'quarantined' });
      } else if (command.command === 'remote_lock') {
        await base44.asServiceRole.entities.AgentDevice.update(deviceId, { status: 'quarantined' });
      }
    }
  }

  return Response.json({ success: true, command_id, new_status: status });
});