import { cookies } from 'next/headers';
import { logoutUser } from '@/lib/auth/user.service';
import { clearAuthCookies, jsonMessage } from '@/lib/auth/http';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const rawRefreshToken = cookies().get('refreshToken')?.value;
  if (rawRefreshToken) {
    await logoutUser(rawRefreshToken);
  }

  const response = jsonMessage('Logged out successfully');
  return clearAuthCookies(response as NextResponse);
}
