import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if accessing admin path
    if (pathname.startsWith('/admin')) {
        // In Next.js middleware, check auth token cookie
        const token = request.cookies.get('sb-access-token')?.value || request.cookies.get('supabase-auth-token')?.value;

        // If no token cookie present in request, check authorization or redirect to login
        // For security, if token missing, redirect to /login with returnUrl
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
