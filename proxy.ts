import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

const publicRoutes = ["/login", "/register"]
const authRoutes = ["/login", "/register"]

async function verifyTokenWithTimeout(token: string, timeout = 2000): Promise<boolean> {
  try {
    const verifyPromise = jwtVerify(token, JWT_SECRET)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("JWT verify timeout")), timeout),
    )

    await Promise.race([verifyPromise, timeoutPromise])
    return true
  } catch (error) {
    console.error("[v0] Token verification failed:", error)
    return false
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("session")?.value

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  let isValidToken = false
  if (token) {
    isValidToken = await verifyTokenWithTimeout(token)
  }

  // Redirect to login if accessing protected route without valid token
  if (!isPublicRoute && !isValidToken) {
    console.log("[v0] Redirecting to login - no valid token")
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if accessing auth routes with valid token
  if (isAuthRoute && isValidToken) {
    console.log("[v0] Redirecting to dashboard - already authenticated")
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
