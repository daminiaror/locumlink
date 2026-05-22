import { NextResponse } from 'next/server';
import { getRecentHostAvatarUrls } from '@/lib/recent-host-avatars-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        return NextResponse.json(await getRecentHostAvatarUrls());
    } catch (err) {
        console.error('[recent-host-avatars]', err);
        return NextResponse.json({ avatars: [] });
    }
}
