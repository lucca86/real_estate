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

  console.log("[v0] Found database URL, processing...")

  try {
    const urlObj = new URL(url)

    if (urlObj.searchParams.has("channel_binding")) {
      urlObj.searchParams.delete("channel_binding")
      console.log("[v0] Removed channel_binding parameter from database URL")
    }

    urlObj.searchParams.set("sslmode", "require")

    if (url.includes("-pooler")) {
      urlObj.searchParams.set("pgbouncer", "true")
      console.log("[v0] Added pgbouncer=true for pooled connection")
    }

    const finalUrl = urlObj.toString()
    console.log("[v0] Database URL configured successfully")
    return finalUrl
  } catch (error) {
    console.error("[v0] Error processing database URL:", error)
    // If URL parsing fails, use original URL without modifications
    return url
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
