import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createClient } from '@supabase/supabase-js';
export interface SessionJwtPayload {
    sub: string;
    email: string;
    role: string;
}
async function getCookie(name: string): Promise<string | null> {
    return (await cookies()).get(name)?.value ?? null;
}
async function getAccessToken(request?: Request): Promise<string | null> {
    if (request) {
        const auth = request.headers.get('authorization');
        if (auth?.startsWith('Bearer ')) {
            const t = auth.slice(7).trim();
            if (t)
                return t;
        }
    }
    return getCookie('ll_access');
}
async function getSupabaseUserIdFromAccessToken(accessToken: string): Promise<string | null> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon)
        return null;
    try {
        const sb = createClient(url, anon, {
            auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await sb.auth.getUser(accessToken);
        if (error)
            return null;
        return data.user?.id ?? null;
    }
    catch {
        return null;
    }
}
export async function getAuthenticatedUserId(request?: Request): Promise<string | null> {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error('JWT_SECRET is not set');
        return null;
    }
    const token = await getAccessToken(request);
    if (!token)
        return null;
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        const sub = payload.sub;
        if (typeof sub !== 'string' || !sub)
            return null;
        return sub;
    }
    catch {
        return await getSupabaseUserIdFromAccessToken(token);
    }
}
export async function getAuthenticatedHostUserId(request?: Request): Promise<string | null> {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        return null;
    const token = await getAccessToken(request);
    if (!token)
        return null;
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        const sub = payload.sub;
        const role = payload.role;
        if (typeof sub !== 'string' || !sub)
            return null;
        if (role !== 'HOST')
            return null;
        return sub;
    }
    catch {
        const frontendRole = await getCookie('ll_role');
        if (frontendRole !== 'clinic')
            return null;
        return await getSupabaseUserIdFromAccessToken(token);
    }
}
