import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"
import readline from "readline"

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function resetAdminPassword() {
  console.log("🔐 Resetear Contraseña de Administrador\n")

  const databaseUrl = process.env.DATABASE_URL || process.env.real_estate_DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL no está configurada")
    console.log("Por favor, configura tu archivo .env con la URL de Neon")
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)

    // Solicitar email del administrador
    const email = (await question("Email del administrador a resetear (admin@mahler.com): ")) || "admin@mahler.com"

    // Verificar que el usuario existe
    console.log("\n🔍 Buscando usuario...")
    const users = await sql`
      SELECT id, email, name, role 
      FROM "User" 
      WHERE email = ${email}
    `

    if (users.length === 0) {
      console.error(`\n❌ No se encontró un usuario con el email: ${email}`)
      console.log("\n💡 Sugerencia: Ejecuta 'npm run admin:create' para crear un nuevo administrador")
      process.exit(1)
    }

    const user = users[0]
    console.log(`\n✓ Usuario encontrado: ${user.name} (${user.role})`)

    // Solicitar nueva contraseña
    const newPassword = (await question("\nNueva contraseña (Admin123!): ")) || "Admin123!"
    const confirmPassword = await question("Confirmar contraseña: ")

    if (newPassword !== confirmPassword) {
      console.error("\n❌ Las contraseñas no coinciden")
      process.exit(1)
    }

    console.log("\n🔒 Hasheando nueva contraseña...")
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    console.log("💾 Actualizando contraseña en la base de datos...")
    await sql`
      UPDATE "User"
      SET 
        password = ${hashedPassword},
        "updatedAt" = NOW(),
        "isActive" = true
      WHERE email = ${email}
    `

    console.log("\n✅ ¡Contraseña actualizada exitosamente!")
    console.log("\n📋 Nuevas credenciales:")
    console.log(`   Email: ${email}`)
    console.log(`   Contraseña: ${newPassword}`)
    console.log(`   Rol: ${user.role}`)
    console.log("\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro")
  } catch (error) {
    console.error("\n❌ Error al resetear contraseña:", error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

resetAdminPassword()
