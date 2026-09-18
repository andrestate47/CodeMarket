import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if accessing admin path
    if (pathname.startsWith('/admin')) {
        // Sanitize path if it contains stray characters like closing braces '}' or '%7D'
        if (/[\}%7D]/.test(pathname)) {
            const cleanPath = pathname.replace(/[\}%7D]/g, '') || '/admin';
            return NextResponse.redirect(new URL(cleanPath, request.url));
        }

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
    matcher: ['/(admin.*)'],
};
