import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { getAuthEnv } from './env';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const env = getAuthEnv();
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as StringValue,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  const env = getAuthEnv();
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function signRefreshToken(payload: JwtPayload): string {
  const env = getAuthEnv();
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as StringValue,
  });
}

export function verifyRefreshToken(token: string): JwtPayload {
  const env = getAuthEnv();
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
}
