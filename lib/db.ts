import { PrismaClient } from "@prisma/client"

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

  try {
    const urlObj = new URL(url)

    // Remove channel_binding parameter as it causes connection issues with Prisma
    if (urlObj.searchParams.has("channel_binding")) {
      urlObj.searchParams.delete("channel_binding")
      console.log("[v0] Removed channel_binding parameter from database URL")
    }

    // Ensure sslmode is set to require
    if (!urlObj.searchParams.has("sslmode")) {
      urlObj.searchParams.set("sslmode", "require")
    }

    // Add connection pool parameters for better performance
    if (!urlObj.searchParams.has("connection_limit")) {
      urlObj.searchParams.set("connection_limit", "20")
    }
    if (!urlObj.searchParams.has("pool_timeout")) {
      urlObj.searchParams.set("pool_timeout", "10")
    }

    console.log("[v0] Database URL configured for Neon with optimized parameters")
    return urlObj.toString()
  } catch (error) {
    console.error("[v0] Error processing database URL:", error)
    throw new Error("Invalid database URL format")
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  })

export const db = prisma

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

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
