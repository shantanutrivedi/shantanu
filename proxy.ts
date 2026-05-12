import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req;
  const isAuth = !!req.auth;
  const isPublic =
    nextUrl.pathname === '/' ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/join');

  if (!isAuth && !isPublic) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }
  if (isAuth && nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }
  return NextResponse.next();
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
