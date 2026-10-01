import { logoutAllDevices } from '@/lib/auth/user.service';
import { getAuthPayload } from '@/lib/auth/session';
import { clearAuthCookies, handleAuthError, jsonMessage } from '@/lib/auth/http';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const payload = await getAuthPayload();
    if (!payload) {
      return Response.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await logoutAllDevices(payload.userId);
    const response = jsonMessage('Logged out from all devices');
    return clearAuthCookies(response as NextResponse);
  } catch (error) {
    return handleAuthError(error);
  }
}
