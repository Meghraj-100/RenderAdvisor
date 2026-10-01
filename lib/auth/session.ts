import { cookies } from 'next/headers';
import { verifyAccessToken, type JwtPayload } from './jwt';
import { refreshTokens } from './user.service';
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from './cookie';

export async function getAuthPayload(): Promise<JwtPayload | null> {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('accessToken')?.value;

  if (accessToken) {
    try {
      return verifyAccessToken(accessToken);
    } catch {
      // fall through to refresh
    }
  }

  const refreshToken = cookieStore.get('refreshToken')?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    const tokens = await refreshTokens(refreshToken);
    cookieStore.set('accessToken', tokens.accessToken, accessTokenCookieOptions);
    cookieStore.set('refreshToken', tokens.refreshToken, refreshTokenCookieOptions);
    return verifyAccessToken(tokens.accessToken);
  } catch {
    return null;
  }
}

export async function requireAuthPayload(): Promise<JwtPayload | null> {
  return getAuthPayload();
}
