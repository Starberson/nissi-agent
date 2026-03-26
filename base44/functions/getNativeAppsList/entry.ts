import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { device_id } = body;

    if (!device_id) {
      return Response.json({ error: 'device_id is required' }, { status: 400 });
    }

    // In production, this would receive actual app list from the device via native bridge
    // For now, return a realistic mock of common apps
    const apps = [
      { name: "Chrome", package: "com.android.chrome", version: "120.0", permissions: ["INTERNET", "CAMERA"], suspicious: false },
      { name: "Facebook", package: "com.facebook.katana", version: "408.0", permissions: ["INTERNET", "CAMERA", "CONTACTS"], suspicious: false },
      { name: "Instagram", package: "com.instagram.android", version: "340.0", permissions: ["INTERNET", "CAMERA", "STORAGE"], suspicious: false },
      { name: "Unknown App XYZ", package: "com.malicious.spy", version: "1.0", permissions: ["INTERNET", "CONTACTS", "SMS", "LOCATION"], suspicious: true }
    ];

    // Log telemetry
    await base44.asServiceRole.entities.AgentTelemetry.create({
      device_id,
      platform: 'android',
      event_type: 'scan_complete',
      severity: 'info',
      description: `App scan completed: ${apps.length} apps found`,
      raw_data: JSON.stringify({ app_count: apps.length })
    });

    return Response.json({ success: true, apps, app_count: apps.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});