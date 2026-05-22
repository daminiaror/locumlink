import { NextResponse } from 'next/server';
import { getActiveJobPostingCount } from '@/lib/active-job-count-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
    try {
        const count = await getActiveJobPostingCount();
        return NextResponse.json({ count });
    } catch (err) {
        console.error('[browse-count]', err);
        return NextResponse.json({ count: 0 });
    }
}
