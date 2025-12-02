import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {getToken} from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
    const {pathname} = req.nextUrl;

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/analytics'];

    // Check if the current path is a protected route
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute) {
        // Get the token to check if user is authenticated
        const token = await getToken({
            req,
            secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
        });

        // If no token, redirect to login
        if (!token) {
            const url = new URL('/login', req.url);
            url.searchParams.set('callbackUrl', encodeURI(pathname));
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/analytics/:path*',
    ],
};
