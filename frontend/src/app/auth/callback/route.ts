import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error_description');

  if (error) {
    const signInUrl = new URL('/auth', request.url);
    signInUrl.searchParams.set('mode', 'signin');
    signInUrl.searchParams.set('error', error);
    return NextResponse.redirect(signInUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const signInUrl = new URL('/auth', request.url);
      signInUrl.searchParams.set('mode', 'signin');
      signInUrl.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.redirect(new URL('/auth/callback/complete', request.url));
}
