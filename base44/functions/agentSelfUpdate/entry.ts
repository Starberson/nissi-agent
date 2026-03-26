import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { device_id, current_version } = body;

    if (!device_id) return Response.json({ error: 'device_id required' }, { status: 400 });

    // Mock update availability check
    const latest_version = "2.1.0";
    const current = current_version || "2.0.0";
    const needs_update = latest_version > current;

    if (needs_update) {
      return Response.json({
        success: true,
        needs_update: true,
        current_version: current,
        latest_version,
        download_url: "https://nissi-releases.s3.amazonaws.com/nissi-agent-2.1.0.apk",
        changelog: "Security patches, improved detection engine, bug fixes",
        mandatory: true
      });
    }

    return Response.json({ success: true, needs_update: false, current_version: current });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});