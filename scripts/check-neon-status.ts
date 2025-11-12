import { neon } from "@neondatabase/serverless"

async function checkStatus() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log("🔍 Checking Neon database status...\n")

  try {
    // Check connection
    const result = await sql`SELECT NOW() as current_time`
    console.log("✅ Database connection successful")
    console.log(`⏰ Current database time: ${result[0].current_time}\n`)

    // List all tables
    const tables = await sql`
      SELECT 
        table_name,
        (SELECT COUNT(*) 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `

    console.log("📊 Tables in database:")
    if (tables.length === 0) {
      console.log('   ⚠️  No tables found. Run "npm run db:setup" to initialize the database.\n')
    } else {
      for (const table of tables) {
        // Get row count for each table
        const tableName = table.table_name
        const countResult = await sql([`SELECT COUNT(*) as count FROM "${tableName}"`] as any)
        console.log(`   - ${table.table_name}: ${countResult[0].count} rows (${table.column_count} columns)`)
      }
      console.log("")
    }

    // Check for enums
    const enums = await sql`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      ORDER BY typname;
    `

    if (enums.length > 0) {
      console.log("📋 Enum types:")
      enums.forEach((enumType: any) => {
        console.log(`   - ${enumType.typname}`)
      })
      console.log("")
    }

    // Database size
    const dbSize = await sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size;
    `
    console.log(`💾 Database size: ${dbSize[0].size}\n`)

    console.log("✅ Status check completed successfully!")
  } catch (error) {
    console.error("❌ Error checking status:", error)
    console.log("\n💡 Make sure DATABASE_URL is set in your environment variables.")
  }
}

checkStatus()
