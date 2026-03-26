import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { device_id, platform, queued_items } = body;

    if (!device_id) return Response.json({ error: 'device_id required' }, { status: 400 });

    // Process queued telemetry and commands from offline period
    let synced_count = 0;
    if (queued_items && Array.isArray(queued_items)) {
      for (const item of queued_items) {
        if (item.type === 'telemetry') {
          await base44.asServiceRole.entities.AgentTelemetry.create({
            device_id,
            platform,
            event_type: item.event_type,
            severity: item.severity,
            description: item.description,
            raw_data: JSON.stringify(item.data)
          });
          synced_count++;
        } else if (item.type === 'command_result') {
          const commands = await base44.asServiceRole.entities.AgentCommand.filter({ id: item.command_id });
          if (commands.length > 0) {
            await base44.asServiceRole.entities.AgentCommand.update(commands[0].id, {
              status: item.status,
              result: item.result,
              completed_at: new Date().toISOString()
            });
            synced_count++;
          }
        }
      }
    }

    return Response.json({ success: true, synced_items: synced_count, timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});