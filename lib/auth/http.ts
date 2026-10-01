import { NextResponse } from 'next/server';
import { AppError } from './errors';
import {
  accessTokenCookieOptions,
  clearCookieOptions,
  refreshTokenCookieOptions,
} from './cookie';

export function jsonSuccess<T>(data: T, status = 200, message?: string) {
  return NextResponse.json(
    { success: true, ...(message ? { message } : {}), data },
    { status }
  );
}

export function jsonMessage(message: string, status = 200) {
  return NextResponse.json({ success: true, message }, { status });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

export function handleAuthError(error: unknown) {
  if (error instanceof AppError) {
    return jsonError(error.message, error.statusCode);
  }
  console.error(error);
  return jsonError('Internal server error', 500);
}

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  response.cookies.set('accessToken', accessToken, accessTokenCookieOptions);
  response.cookies.set('refreshToken', refreshToken, refreshTokenCookieOptions);
  return response;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set('accessToken', '', clearCookieOptions);
  response.cookies.set('refreshToken', '', clearCookieOptions);
  return response;
}
