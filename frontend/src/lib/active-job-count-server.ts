import { getDb } from '@/lib/db';

export async function getActiveJobPostingCount(): Promise<number> {
    const db = getDb();
    return db.jobPosting.count({
        where: { status: 'ACTIVE', isDeleted: false },
    });
}
