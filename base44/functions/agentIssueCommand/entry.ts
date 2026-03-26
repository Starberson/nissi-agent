import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const VALID_COMMANDS = ['scan', 'isolate_network', 'restore_network', 'remote_lock', 'remote_wipe', 'collect_logs', 'update_agent', 'reboot'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });

    const body = await req.json();
    const { device_id, command, parameters } = body;

    if (!device_id || !command) {
      return Response.json({ error: 'device_id and command are required' }, { status: 400 });
    }
    if (!VALID_COMMANDS.includes(command)) {
      return Response.json({ error: `Invalid command. Valid: ${VALID_COMMANDS.join(', ')}` }, { status: 400 });
    }

    // Verify device exists
    const devices = await base44.asServiceRole.entities.AgentDevice.filter({ device_id });
    if (devices.length === 0) {
      return Response.json({ error: 'Device not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    const cmd = await base44.asServiceRole.entities.AgentCommand.create({
      device_id,
      command,
      status: 'pending',
      issued_by: user.email,
      issued_at: now,
      parameters: parameters ? JSON.stringify(parameters) : null
    });

    return Response.json({ success: true, command_id: cmd.id, command, device_id, status: 'pending', issued_at: now });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});