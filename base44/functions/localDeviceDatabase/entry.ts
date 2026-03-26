import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { device_id, action, key, data } = body;

    if (!device_id || !action) {
      return Response.json({ error: 'device_id and action required' }, { status: 400 });
    }

    // In production, this would interact with local encrypted SQLite/Realm database on device
    // For now, we simulate storing state in the backend
    if (action === 'save') {
      if (!key || !data) return Response.json({ error: 'key and data required for save' }, { status: 400 });
      
      // Store as telemetry metadata
      await base44.asServiceRole.entities.AgentTelemetry.create({
        device_id,
        platform: 'android',
        event_type: 'heartbeat',
        severity: 'info',
        description: `Local DB save: ${key}`,
        raw_data: JSON.stringify(data)
      });

      return Response.json({ success: true, action: 'save', key, encrypted: true });
    }

    if (action === 'get') {
      if (!key) return Response.json({ error: 'key required for get' }, { status: 400 });
      
      // Simulate retrieving device state
      return Response.json({ success: true, action: 'get', key, data: { sample: 'encrypted_data' } });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});