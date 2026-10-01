import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const isProduction = process.env.NODE_ENV === 'production';

export const accessTokenCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 15 * 60,
  path: '/',
};

export const refreshTokenCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
};

export const clearCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
  maxAge: 0,
};
