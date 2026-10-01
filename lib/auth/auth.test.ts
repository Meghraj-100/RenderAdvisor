import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb, closeDb } from '@/lib/db';
import { users, refreshTokens } from '@/lib/db/schema';
import {
  registerUser,
  loginUser,
  refreshTokens as rotateRefreshTokens,
  logoutUser,
  getUserProfile,
} from '@/lib/auth/user.service';
import { hashToken } from '@/lib/auth/hash';
import { verifyAccessToken } from '@/lib/auth/jwt';

const TEST_EMAIL = `auth-test-${Date.now()}@renderadvisor.local`;
const TEST_PASSWORD = 'securepassword123';
const TEST_NAME = 'Auth Test User';

describe('auth (JWT + refresh token rotation)', () => {
  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required to run auth tests');
    }
  });

  beforeEach(async () => {
    await getDb().delete(refreshTokens);
    await getDb().delete(users).where(eq(users.email, TEST_EMAIL));
  });

  afterAll(async () => {
    await getDb().delete(refreshTokens);
    await getDb().delete(users).where(eq(users.email, TEST_EMAIL));
    await closeDb();
  });

  it('registers and logs in a user with valid tokens', async () => {
    const user = await registerUser(TEST_NAME, TEST_EMAIL, TEST_PASSWORD);
    expect(user.email).toBe(TEST_EMAIL);
    expect(user).not.toHaveProperty('password');

    const { accessToken, refreshToken, user: loggedIn } = await loginUser(
      TEST_EMAIL,
      TEST_PASSWORD,
      'vitest'
    );

    expect(loggedIn.id).toBe(user.id);
    const payload = verifyAccessToken(accessToken);
    expect(payload.userId).toBe(user.id);

    const stored = await getDb()
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, user.id));
    expect(stored.length).toBe(1);
    expect(stored[0]?.tokenHash).toBe(hashToken(refreshToken));
  });

  it('rotates refresh tokens and invalidates the old one', async () => {
    await registerUser(TEST_NAME, TEST_EMAIL, TEST_PASSWORD);
    const login = await loginUser(TEST_EMAIL, TEST_PASSWORD);
    const oldRefresh = login.refreshToken;

    const rotated = await rotateRefreshTokens(oldRefresh);
    verifyAccessToken(rotated.accessToken);

    await expect(rotateRefreshTokens(oldRefresh)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('logs out by revoking refresh token hash', async () => {
    await registerUser(TEST_NAME, TEST_EMAIL, TEST_PASSWORD);
    const login = await loginUser(TEST_EMAIL, TEST_PASSWORD);
    await logoutUser(login.refreshToken);

    const profile = await getUserProfile(login.user.id);
    expect(profile.email).toBe(TEST_EMAIL);

    await expect(rotateRefreshTokens(login.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
