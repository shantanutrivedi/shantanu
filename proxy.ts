import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req;
  const isAuth = !!req.auth;
  const isPublic =
    nextUrl.pathname === '/' ||
    nextUrl.pathname === '/onboarding' ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/join');

  // Unauthenticated users can only access public routes
  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }
  // Authenticated users visiting sign-in page go to home
  if (isAuth && nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', nextUrl));
  }
  return NextResponse.next();
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
