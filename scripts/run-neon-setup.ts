import { neon } from "@neondatabase/serverless"
import fs from "fs"
import path from "path"

async function runSetup() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log("🚀 Starting Neon database setup...\n")

  try {
    // Read and execute schema creation
    console.log("📋 Creating tables and types...")
    const schemaSQL = fs.readFileSync(path.join(process.cwd(), "scripts", "01-create-tables.sql"), "utf-8")

    // Split SQL into individual statements and execute them
    const schemaStatements = schemaSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of schemaStatements) {
      await sql([statement] as any)
    }
    console.log("✅ Tables created successfully!\n")

    console.log("🌱 Seeding initial data...")
    const seedSQL = fs.readFileSync(path.join(process.cwd(), "scripts", "02-seed-data.sql"), "utf-8")

    const seedStatements = seedSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of seedStatements) {
      await sql([statement] as any)
    }
    console.log("✅ Data seeded successfully!\n")

    // Verify setup
    console.log("🔍 Verifying setup...")
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `

    console.log("\n📊 Created tables:")
    tables.forEach((table: any) => {
      console.log(`   - ${table.table_name}`)
    })

    const userCount = await sql`SELECT COUNT(*) as count FROM "User"`
    const propertyTypeCount = await sql`SELECT COUNT(*) as count FROM "PropertyType"`
    const countryCount = await sql`SELECT COUNT(*) as count FROM "Country"`

    console.log("\n📈 Initial data:")
    console.log(`   - ${userCount[0].count} users`)
    console.log(`   - ${propertyTypeCount[0].count} property types`)
    console.log(`   - ${countryCount[0].count} countries`)

    console.log("\n✅ Neon database setup completed successfully!")
    console.log("\n📝 Admin credentials:")
    console.log("   Email: admin@mahler.com")
    console.log("   Password: admin123\n")
  } catch (error) {
    console.error("❌ Error during setup:", error)
    throw error
  }
}

runSetup()
