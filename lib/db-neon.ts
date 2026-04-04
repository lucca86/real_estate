import { neon } from "@neondatabase/serverless"

// Create a direct Neon connection for critical operations
let sql: ReturnType<typeof neon> | null = null

export function getNeonSQL() {
  if (!sql) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error("DATABASE_URL is not configured")
    }


    sql = neon(url)
  }

  return sql
}

// Test connection helper
export async function testNeonConnection() {
  try {
    const sql = getNeonSQL()
    const result = await sql`SELECT NOW() as now, version() as version`
    const rows = result as Array<Record<string, any>>
    return { success: true, data: rows[0] }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
