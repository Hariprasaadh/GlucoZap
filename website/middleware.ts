import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',               // homepage
  '/sign-in(.*)',    // sign in page
  '/sign-up(.*)',    // sign up page
  '/manifest.json',  // manifest
]);


export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // 🔓 If route is public → allow
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    return NextResponse.redirect(signInUrl);
  }

  

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',

    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
