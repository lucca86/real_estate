import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL || process.env.real_estate_DATABASE_URL,
      },
    },
  })

export const db = prisma

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

if (process.env.NODE_ENV === "production") {
  prisma
    .$connect()
    .then(() => console.log("[v0] Database connected successfully"))
    .catch((error) => console.error("[v0] Database connection failed:", error))
}
