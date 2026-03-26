import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { device_id, title, message, data } = body;

    if (!device_id || !title || !message) {
      return Response.json({ error: 'device_id, title, and message are required' }, { status: 400 });
    }

    // Get device
    const devices = await base44.asServiceRole.entities.AgentDevice.filter({ device_id });
    if (devices.length === 0) return Response.json({ error: 'Device not found' }, { status: 404 });

    const device = devices[0];
    const fcm_token = device.fcm_token;
    const platform = device.platform;

    if (!fcm_token) {
      return Response.json({ 
        success: false, 
        message: 'Device has no push token registered. The agent app must call registerForPushNotifications() first.' 
      });
    }

    // Get org FCM key
    let fcm_server_key = null;
    if (device.owner_email && device.owner_email.includes('@')) {
      const domain = device.owner_email.split('@')[1];
      const orgs = await base44.asServiceRole.entities.Organization.filter({ email_domain: domain });
      if (orgs.length > 0) fcm_server_key = orgs[0].firebase_server_key;
    }

    if (!fcm_server_key) {
      return Response.json({ success: false, message: 'No Firebase server key configured for this organization.' });
    }

    // Send via FCM (works for both Android and iOS with Firebase)
    const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcm_server_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: fcm_token,
        notification: { title, body: message },
        data: data || {},
        priority: 'high'
      })
    });

    const fcmData = await fcmRes.json();

    return Response.json({ 
      success: fcmData.success === 1, 
      fcm_response: fcmData,
      platform,
      device_id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});