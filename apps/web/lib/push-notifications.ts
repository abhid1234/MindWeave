import { db } from './db/client';
import { devices } from './db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Send a push notification to all active devices for a user.
 * Uses FCM HTTP v1 API via google-auth-library for ADC.
 * No-op when FCM_PROJECT_ID is not set.
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string
): Promise<{ sent: number; failed: number }> {
  const projectId = process.env.FCM_PROJECT_ID;
  if (!projectId) {
    return { sent: 0, failed: 0 };
  }

  // Get active devices for user
  const userDevices = await db
    .select({ id: devices.id, token: devices.token })
    .from(devices)
    .where(and(eq(devices.userId, userId), eq(devices.isActive, true)));

  if (userDevices.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Get access token via ADC
  const { GoogleAuth } = await import('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  let sent = 0;
  let failed = 0;

  for (const device of userDevices) {
    try {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token: device.token,
              notification: { title, body },
            },
          }),
        }
      );

      if (response.ok) {
        sent++;
      } else if (response.status === 404) {
        // Token invalid — deactivate device
        await db
          .update(devices)
          .set({ isActive: false })
          .where(eq(devices.id, device.id));
        failed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { sent, failed };
}
