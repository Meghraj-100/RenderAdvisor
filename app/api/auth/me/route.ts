import { getAuthPayload } from '@/lib/auth/session';
import { getUserProfile } from '@/lib/auth/user.service';
import { handleAuthError, jsonSuccess } from '@/lib/auth/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const payload = await getAuthPayload();
    if (!payload) {
      return Response.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await getUserProfile(payload.userId);
    return jsonSuccess(user);
  } catch (error) {
    return handleAuthError(error);
  }
}
