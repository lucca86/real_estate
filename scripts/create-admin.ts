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

async function createAdmin() {
  console.log("🔐 Creando Usuario Administrador\n")

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL no está configurada")
    console.log("Por favor, configura tu archivo .env con la URL de Neon")
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)

    // Solicitar datos del administrador
    const email = (await question("Email del administrador (admin@mahler.com): ")) || "admin@mahler.com"
    const name = (await question("Nombre del administrador (Administrador): ")) || "Administrador"
    const password = (await question("Contraseña (Admin123!): ")) || "Admin123!"
    const phone = (await question("Teléfono (+54 9 379 1234567): ")) || "+54 9 379 1234567"

    console.log("\n🔒 Hasheando contraseña...")
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log("💾 Creando usuario en la base de datos...")

    // Generar ID único
    const id = "admin_" + Math.random().toString(36).substring(2, 15)

    // Insertar o actualizar usuario administrador
    await sql`
      INSERT INTO "User" (
        id,
        email,
        name,
        password,
        role,
        phone,
        "twoFactorEnabled",
        "isActive",
        "createdAt",
        "updatedAt"
      ) VALUES (
        ${id},
        ${email},
        ${name},
        ${hashedPassword},
        'ADMIN',
        ${phone},
        false,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (email) 
      DO UPDATE SET
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = 'ADMIN',
        phone = EXCLUDED.phone,
        "isActive" = true,
        "updatedAt" = NOW()
      RETURNING id, email, name, role
    `

    console.log("\n✅ Usuario administrador creado exitosamente!")
    console.log("\n📋 Credenciales:")
    console.log(`   Email: ${email}`)
    console.log(`   Contraseña: ${password}`)
    console.log(`   Rol: ADMIN`)
    console.log("\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro")
    console.log("   y cambia la contraseña después del primer inicio de sesión.")
  } catch (error) {
    console.error("\n❌ Error al crear usuario administrador:", error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

createAdmin()
