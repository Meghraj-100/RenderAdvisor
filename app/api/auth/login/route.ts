import { loginUserSchema } from '@/lib/auth/schemas';
import { loginUser } from '@/lib/auth/user.service';
import { handleAuthError, jsonSuccess, setAuthCookies } from '@/lib/auth/http';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const deviceName = req.headers.get('user-agent') ?? 'unknown';
    const { email, password } = parsed.data;
    const { user, accessToken, refreshToken } = await loginUser(
      email,
      password,
      deviceName
    );

    const response = jsonSuccess(user, 200, 'Login successful');
    return setAuthCookies(response as NextResponse, accessToken, refreshToken);
  } catch (error) {
    return handleAuthError(error);
  }
}
