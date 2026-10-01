import { registerUserSchema } from '@/lib/auth/schemas';
import { registerUser } from '@/lib/auth/user.service';
import { handleAuthError, jsonSuccess } from '@/lib/auth/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerUserSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const user = await registerUser(name, email, password);
    return jsonSuccess(user, 201, 'User registered successfully');
  } catch (error) {
    return handleAuthError(error);
  }
}
