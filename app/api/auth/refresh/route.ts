import { cookies } from 'next/headers';
import { refreshTokens } from '@/lib/auth/user.service';
import {
  clearAuthCookies,
  handleAuthError,
  jsonMessage,
  setAuthCookies,
} from '@/lib/auth/http';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const oldRefreshToken = cookies().get('refreshToken')?.value;
    if (!oldRefreshToken) {
      return Response.json(
        { success: false, message: 'Refresh token is required' },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken } = await refreshTokens(oldRefreshToken);
    const response = jsonMessage('Tokens refreshed successfully');
    return setAuthCookies(response as NextResponse, accessToken, refreshToken);
  } catch (error) {
    const errResponse = handleAuthError(error);
    clearAuthCookies(errResponse as NextResponse);
    return errResponse;
  }
}
