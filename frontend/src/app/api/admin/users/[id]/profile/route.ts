import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminSession } from '@/lib/admin-auth-server';
import { fetchUserProfileDetailByUserId } from '@/lib/admin-verification-detail';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const db = getDb();
    const detail = await fetchUserProfileDetailByUserId(db, id);
    if (!detail) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (err) {
    console.error('[admin/users/profile GET]', err);
    const message =
      err instanceof Error ? err.message : 'Failed to load user profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
