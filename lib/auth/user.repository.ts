import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function findByEmail(email: string) {
  const [user] = await getDb().select().from(users).where(eq(users.email, email));
  return user ?? null;
}

export async function findById(id: string) {
  const [user] = await getDb().select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function create(name: string, email: string, password: string) {
  const [user] = await getDb()
    .insert(users)
    .values({ name, email, password })
    .returning();
  return user;
}
