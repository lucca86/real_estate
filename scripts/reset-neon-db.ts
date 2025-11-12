import { neon } from "@neondatabase/serverless"
import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

async function resetDatabase() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log("⚠️  WARNING: This will delete ALL data from your database!\n")

  rl.question('Are you sure you want to continue? Type "yes" to confirm: ', async (answer) => {
    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Operation cancelled")
      rl.close()
      return
    }

    try {
      console.log("\n🗑️  Dropping all tables...")

      // Drop tables in correct order (respecting foreign keys)
      await sql`DROP TABLE IF EXISTS "Appointment" CASCADE`
      await sql`DROP TABLE IF EXISTS "Property" CASCADE`
      await sql`DROP TABLE IF EXISTS "Client" CASCADE`
      await sql`DROP TABLE IF EXISTS "Owner" CASCADE`
      await sql`DROP TABLE IF EXISTS "Neighborhood" CASCADE`
      await sql`DROP TABLE IF EXISTS "City" CASCADE`
      await sql`DROP TABLE IF EXISTS "Province" CASCADE`
      await sql`DROP TABLE IF EXISTS "Country" CASCADE`
      await sql`DROP TABLE IF EXISTS "PropertyType" CASCADE`
      await sql`DROP TABLE IF EXISTS "Session" CASCADE`
      await sql`DROP TABLE IF EXISTS "User" CASCADE`

      // Drop enums
      await sql`DROP TYPE IF EXISTS "PropertyLabel" CASCADE`
      await sql`DROP TYPE IF EXISTS "RentalPeriod" CASCADE`
      await sql`DROP TYPE IF EXISTS "AppointmentStatus" CASCADE`
      await sql`DROP TYPE IF EXISTS "TransactionType" CASCADE`
      await sql`DROP TYPE IF EXISTS "PropertyStatus" CASCADE`
      await sql`DROP TYPE IF EXISTS "UserRole" CASCADE`

      console.log("✅ All tables dropped successfully!\n")
      console.log('ℹ️  Run "npm run db:setup" to recreate the database with initial data.')
    } catch (error) {
      console.error("❌ Error during reset:", error)
    } finally {
      rl.close()
    }
  })
}

resetDatabase()
