import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
});

export type AuthEnv = z.infer<typeof envSchema>;

let cached: AuthEnv | null = null;

export function getAuthEnv(): AuthEnv {
  if (!cached) {
    cached = envSchema.parse(process.env);
  }
  return cached;
}
