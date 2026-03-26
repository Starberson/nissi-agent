import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { device_id, platform } = body;

    if (!device_id) return Response.json({ error: 'device_id required' }, { status: 400 });

    // Mock root/jailbreak detection checks
    const checks = {
      su_binary: false,
      magisk: false,
      xposed: false,
      cydia: false,
      suspicious_props: false
    };

    const isRooted = Object.values(checks).some(v => v);

    if (isRooted) {
      await base44.asServiceRole.entities.AgentTelemetry.create({
        device_id,
        platform,
        event_type: 'rooted_jailbroken',
        severity: 'critical',
        description: `Device ${platform} detected as rooted/jailbroken`,
        is_rooted: true,
        raw_data: JSON.stringify(checks)
      });

      // Update device security score
      const devices = await base44.asServiceRole.entities.AgentDevice.filter({ device_id });
      if (devices.length > 0) {
        await base44.asServiceRole.entities.AgentDevice.update(devices[0].id, { security_score: 20 });
      }
    }

    return Response.json({ success: true, is_rooted: isRooted, checks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});