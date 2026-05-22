import { getDb } from '@/lib/db';
import { signGcsPath } from '@/lib/gcs-sign-server';

const DEFAULT_LIMIT = 3;

function isImagePath(path: string): boolean {
    return /\.(jpe?g|png|webp|gif)$/i.test(path) || path.includes('/avatars/');
}

export async function getRecentHostAvatarUrls(limit = DEFAULT_LIMIT): Promise<{ avatars: string[] }> {
    const db = getDb();
    const hosts = await db.user.findMany({
        where: {
            role: 'HOST',
            status: { in: ['ACTIVE', 'PENDING'] },
            hostProfile: { isNot: null },
            OR: [
                { avatarStoragePath: { not: null } },
                { hostProfile: { photoIdFile: { not: null } } },
            ],
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
            id: true,
            avatarStoragePath: true,
            updatedAt: true,
            hostProfile: {
                select: {
                    photoIdFile: true,
                    updatedAt: true,
                },
            },
        },
    });

    type Candidate = { userId: string; path: string; at: number };
    const candidates: Candidate[] = [];
    for (const host of hosts) {
        const avatar = host.avatarStoragePath?.trim() ?? '';
        const photoId = host.hostProfile?.photoIdFile?.trim() ?? '';
        const profileAt = host.hostProfile?.updatedAt.getTime() ?? 0;
        const userAt = host.updatedAt.getTime();
        if (avatar) {
            candidates.push({
                userId: host.id,
                path: avatar,
                at: Math.max(userAt, profileAt),
            });
        } else if (photoId && isImagePath(photoId)) {
            candidates.push({
                userId: host.id,
                path: photoId,
                at: profileAt,
            });
        }
    }

    candidates.sort((a, b) => b.at - a.at);
    const seenUsers = new Set<string>();
    const seenPaths = new Set<string>();
    const paths: string[] = [];
    for (const c of candidates) {
        if (seenUsers.has(c.userId) || seenPaths.has(c.path)) continue;
        seenUsers.add(c.userId);
        seenPaths.add(c.path);
        paths.push(c.path);
        if (paths.length >= limit) break;
    }

    if (paths.length < limit) {
        const extra = await db.user.findMany({
            where: {
                role: 'HOST',
                status: { in: ['ACTIVE', 'PENDING'] },
                avatarStoragePath: { not: null },
                ...(seenUsers.size > 0 ? { id: { notIn: [...seenUsers] } } : {}),
            },
            orderBy: { updatedAt: 'desc' },
            take: limit * 2,
            select: { id: true, avatarStoragePath: true },
        });
        for (const row of extra) {
            const path = row.avatarStoragePath?.trim() ?? '';
            if (!path || seenPaths.has(path) || seenUsers.has(row.id)) continue;
            seenUsers.add(row.id);
            seenPaths.add(path);
            paths.push(path);
            if (paths.length >= limit) break;
        }
    }

    const avatars: string[] = [];
    for (const path of paths) {
        const url = await signGcsPath(path);
        if (url) avatars.push(url);
    }
    return { avatars };
}
