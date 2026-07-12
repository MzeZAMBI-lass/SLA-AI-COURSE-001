import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  const isDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isLoginPage = req.nextUrl.pathname === '/login';

  if (isDashboard && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isLoginPage && session) {
    return NextResponse.redirect(new URL('/dashboard/pending', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
