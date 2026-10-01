import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { refreshTokens } from '@/lib/db/schema';

export async function createRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
  deviceName?: string
) {
  const [token] = await getDb()
    .insert(refreshTokens)
    .values({
      userId,
      tokenHash,
      expiresAt,
      deviceName: deviceName ?? null,
    })
    .returning();
  return token;
}

export async function findRefreshTokenByHash(tokenHash: string) {
  const [token] = await getDb()
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash));
  return token ?? null;
}

export async function deleteRefreshTokenByHash(tokenHash: string): Promise<void> {
  await getDb().delete(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function deleteAllRefreshTokens(userId: string): Promise<void> {
  await getDb().delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}
