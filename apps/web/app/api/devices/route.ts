import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db/client';
import { devices } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for device registration
const registerDeviceSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  platform: z.enum(['ios', 'android', 'web']),
});

/**
 * POST /api/devices
 * Register or update a device for push notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const result = registerDeviceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { token, platform } = result.data;
    const userId = session.user.id;

    // Check if device already exists for this user
    const existingDevice = await db.query.devices.findFirst({
      where: and(eq(devices.userId, userId), eq(devices.token, token)),
    });

    if (existingDevice) {
      // Update existing device
      const [updatedDevice] = await db
        .update(devices)
        .set({
          platform,
          isActive: true,
          lastUsed: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(devices.id, existingDevice.id))
        .returning();

      return NextResponse.json({
        message: 'Device updated',
        device: {
          id: updatedDevice.id,
          platform: updatedDevice.platform,
        },
      });
    }

    // Create new device registration
    const [newDevice] = await db
      .insert(devices)
      .values({
        userId,
        token,
        platform,
        isActive: true,
        lastUsed: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Device registered',
        device: {
          id: newDevice.id,
          platform: newDevice.platform,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/devices
 * Unregister a device (disable push notifications for this device)
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const token = body.token;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Deactivate the device (soft delete)
    const [updatedDevice] = await db
      .update(devices)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(and(eq(devices.userId, userId), eq(devices.token, token)))
      .returning();

    if (!updatedDevice) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Device unregistered',
    });
  } catch (error) {
    console.error('Error unregistering device:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/devices
 * List all registered devices for the current user
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all active devices for the user
    const userDevices = await db.query.devices.findMany({
      where: and(eq(devices.userId, userId), eq(devices.isActive, true)),
      columns: {
        id: true,
        platform: true,
        lastUsed: true,
        createdAt: true,
      },
      orderBy: (devices, { desc }) => [desc(devices.lastUsed)],
    });

    return NextResponse.json({
      devices: userDevices,
    });
  } catch (error) {
    console.error('Error listing devices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
