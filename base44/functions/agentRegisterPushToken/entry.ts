import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const body = await req.json();
  const { device_id, fcm_token } = body;

  if (!device_id || !fcm_token) {
    return Response.json({ error: 'device_id and fcm_token are required' }, { status: 400 });
  }

  const devices = await base44.asServiceRole.entities.AgentDevice.filter({ device_id });
  if (devices.length === 0) {
    return Response.json({ error: 'Device not found' }, { status: 404 });
  }

  await base44.asServiceRole.entities.AgentDevice.update(devices[0].id, { fcm_token });

  return Response.json({ success: true, device_id });
});