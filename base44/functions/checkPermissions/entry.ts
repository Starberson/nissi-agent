import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { device_id, platform } = body;

    if (!device_id) return Response.json({ error: 'device_id required' }, { status: 400 });

    // Mock dangerous permission grants
    const grants = [
      { app: "Chrome", permission: "CAMERA", granted: true, risk: "low" },
      { app: "Facebook", permission: "LOCATION", granted: true, risk: "medium" },
      { app: "Unknown App", permission: "SMS", granted: true, risk: "high" },
      { app: "System", permission: "STORAGE", granted: true, risk: "low" }
    ];

    const dangerous = grants.filter(g => g.risk === 'high' || g.risk === 'medium');

    if (dangerous.length > 0) {
      await base44.asServiceRole.entities.AgentTelemetry.create({
        device_id,
        platform,
        event_type: 'permission_change',
        severity: dangerous.some(d => d.risk === 'high') ? 'high' : 'medium',
        description: `${dangerous.length} dangerous permission(s) detected`,
        raw_data: JSON.stringify(dangerous)
      });
    }

    return Response.json({ success: true, grants, dangerous_count: dangerous.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});