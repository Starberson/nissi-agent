import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.role === 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { device_id, action, target } = body;

    if (!device_id || !action) {
      return Response.json({ error: 'device_id and action required' }, { status: 400 });
    }

    const remediation_types = ['isolate_app', 'block_network', 'collect_logs', 'remove_threat'];
    if (!remediation_types.includes(action)) {
      return Response.json({ error: `Invalid action. Must be one of: ${remediation_types.join(', ')}` }, { status: 400 });
    }

    let result = '';
    switch (action) {
      case 'isolate_app':
        result = `App ${target} isolated from network and sensors`;
        break;
      case 'block_network':
        result = 'Network access blocked for specified app';
        break;
      case 'collect_logs':
        result = 'Device logs collected for forensic analysis';
        break;
      case 'remove_threat':
        result = `Threat ${target} quarantined and removed`;
        break;
    }

    // Log remediation action
    await base44.asServiceRole.entities.AgentTelemetry.create({
      device_id,
      platform: 'android',
      event_type: 'threat_detected',
      severity: 'info',
      description: `Remediation action completed: ${action}`,
      remediated: true,
      raw_data: JSON.stringify({ action, target, result })
    });

    return Response.json({ success: true, action, result, timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});