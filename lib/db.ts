import { PrismaClient } from "@prisma/client"
import { neon } from "@neondatabase/serverless"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getDatabaseUrl = () => {
  const url =
    process.env.DATABASE_URL ||
    process.env.real_estate_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.real_estate_POSTGRES_URL

  if (!url) {
    console.error("[v0] ERROR: No database URL found in environment variables")
    console.error("[v0] Checked: DATABASE_URL, real_estate_DATABASE_URL, POSTGRES_URL, real_estate_POSTGRES_URL")
    throw new Error("Database URL not configured. Please set DATABASE_URL in your environment variables.")
  }

  if (process.env.NODE_ENV === "production") {
    console.log("[v0] Production mode: processing database URL")
    try {
      const urlObj = new URL(url)

      if (urlObj.searchParams.has("channel_binding")) {
        urlObj.searchParams.delete("channel_binding")
      }

      urlObj.searchParams.set("sslmode", "require")

      if (url.includes("-pooler")) {
        urlObj.searchParams.set("pgbouncer", "true")
        urlObj.searchParams.set("connect_timeout", "15")
      }

      return urlObj.toString()
    } catch (error) {
      console.error("[v0] Error processing database URL:", error)
      return url
    }
  }

  return url
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["warn"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    ...(process.env.NODE_ENV === "production" && {
      errorFormat: "minimal",
    }),
  })

export const db = prisma

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export async function safePrismaQuery<T>(
  operation: () => Promise<T>,
  fallbackSql?: () => Promise<T>,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    // Only use fallback in production
    if (process.env.NODE_ENV === "production" && fallbackSql) {
      console.log("[v0] Prisma query failed in production, using SQL fallback")
      try {
        return await fallbackSql()
      } catch (fallbackError) {
        console.error("[v0] SQL fallback also failed:", fallbackError)
        throw error // Throw original error
      }
    }
    throw error
  }
}

export function getSqlClient() {
  const url =
    process.env.DATABASE_URL ||
    process.env.real_estate_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.real_estate_POSTGRES_URL

  if (!url) {
    throw new Error("Database URL not configured")
  }

  return neon(url)
}

let isShuttingDown = false

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`[v0] ${signal} received, closing database connection...`)
  try {
    await prisma.$disconnect()
    console.log("[v0] Database disconnected successfully")
  } catch (error) {
    console.error("[v0] Error disconnecting database:", error)
  }
}

process.on("beforeExit", () => gracefulShutdown("beforeExit"))
process.on("SIGINT", async () => {
  await gracefulShutdown("SIGINT")
  process.exit(0)
})
process.on("SIGTERM", async () => {
  await gracefulShutdown("SIGTERM")
  process.exit(0)
})
