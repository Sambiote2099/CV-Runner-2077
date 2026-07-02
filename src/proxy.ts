import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  if (req.nextUrl.pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/signin", req.url))
  }

  if (req.nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }
if (
    req.nextUrl.pathname.startsWith("/attributes") &&
    role !== "RECRUITER" &&
    role !== "ADMIN"
  ) {
    return NextResponse.redirect(new URL("/", req.url))
  }
  if (req.nextUrl.pathname.startsWith("/profile") && !isLoggedIn) {
  return NextResponse.redirect(new URL("/signin", req.url))
}
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/attributes/:path*", "/profile/:path*"],
}