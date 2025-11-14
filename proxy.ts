import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { updateSession } from "@/lib/supabase/middleware"

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
  return await updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
