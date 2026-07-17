import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { prisma } from "./lib/prisma"

export default auth(async (req) => {
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role
  const userId = req.auth?.user?.id

  // If logged in, check if the user has been blocked since their last request.
  if (isLoggedIn && userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isBlocked: true },
    })
    if (dbUser?.isBlocked) {
      // Delete the cookie and redirect to the error page
      const response = NextResponse.redirect(new URL("/api/auth/error", req.url))
      response.cookies.delete("authjs.session-token")
      return response
    }
  }

  if (req.nextUrl.pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/signin", req.url))
  }

  if (req.nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }
  if (req.nextUrl.pathname.startsWith("/attributes") && role !== "RECRUITER" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }
  if (req.nextUrl.pathname.startsWith("/profile") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/signin", req.url))
  }
  if (req.nextUrl.pathname.startsWith("/signin") && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url))
  }
})

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/attributes/:path*", "/profile/:path*", "/signin"],
}