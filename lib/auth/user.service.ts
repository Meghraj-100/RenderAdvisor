import bcrypt from 'bcryptjs';
import ms from 'ms';
import type { StringValue } from 'ms';
import { getAuthEnv } from './env';
import { ConflictError, UnauthorizedError } from './errors';
import { hashToken } from './hash';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './jwt';
import {
  createRefreshToken,
  deleteAllRefreshTokens,
  deleteRefreshTokenByHash,
  findRefreshTokenByHash,
} from './refresh-token.repository';
import type { SafeUser } from './user.types';
import { create, findByEmail, findById } from './user.repository';

const SALT_ROUNDS = 10;

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<SafeUser> {
  const existingUser = await findByEmail(email);
  if (existingUser) {
    throw new ConflictError('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await create(name, email, hashedPassword);
  if (!user) {
    throw new Error('Failed to create user');
  }
  return toSafeUser(user);
}

export async function loginUser(
  email: string,
  password: string,
  deviceName?: string
) {
  const user = await findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const jwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(jwtPayload);
  const refreshToken = signRefreshToken(jwtPayload);

  const tokenHash = hashToken(refreshToken);
  const env = getAuthEnv();
  const expiresAt = new Date(
    Date.now() + ms(env.REFRESH_TOKEN_EXPIRES_IN as StringValue)
  );

  await createRefreshToken(user.id, tokenHash, expiresAt, deviceName);

  return {
    user: toSafeUser(user),
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(oldRawToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(oldRawToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const oldTokenHash = hashToken(oldRawToken);
  const existingToken = await findRefreshTokenByHash(oldTokenHash);

  if (!existingToken) {
    await deleteAllRefreshTokens(payload.userId);
    throw new UnauthorizedError(
      'Refresh token reuse detected. All sessions have been revoked.'
    );
  }

  if (existingToken.expiresAt < new Date()) {
    await deleteRefreshTokenByHash(oldTokenHash);
    throw new UnauthorizedError('Refresh token has expired');
  }

  await deleteRefreshTokenByHash(oldTokenHash);

  const jwtPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  const newAccessToken = signAccessToken(jwtPayload);
  const newRefreshToken = signRefreshToken(jwtPayload);

  const env = getAuthEnv();
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(
    Date.now() + ms(env.REFRESH_TOKEN_EXPIRES_IN as StringValue)
  );

  await createRefreshToken(payload.userId, newTokenHash, expiresAt);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashToken(rawRefreshToken);
  await deleteRefreshTokenByHash(tokenHash);
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await deleteAllRefreshTokens(userId);
}

export async function getUserProfile(userId: string): Promise<SafeUser> {
  const user = await findById(userId);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }
  return toSafeUser(user);
}
