import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

async function quickCreateAdmin() {
  console.log("🔐 Creando Usuario Administrador por defecto\n")

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL no está configurada")
    process.exit(1)
  }

  try {
    const sql = neon(databaseUrl)

    // Credenciales por defecto
    const email = "admin@mahler.com"
    const name = "Administrador"
    const password = "Admin123!"
    const phone = "+54 9 379 1234567"

    console.log("🔒 Hasheando contraseña...")
    const hashedPassword = await bcrypt.hash(password, 10)

    console.log("💾 Creando usuario en la base de datos...")

    // Generar ID único
    const id = "admin_" + Math.random().toString(36).substring(2, 15)

    // Insertar o actualizar usuario administrador
    const result = await sql`
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
    console.log("\n📋 Credenciales por defecto:")
    console.log(`   Email: ${email}`)
    console.log(`   Contraseña: ${password}`)
    console.log(`   Rol: ADMIN`)
    console.log("\n⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión.")
  } catch (error) {
    console.error("\n❌ Error al crear usuario administrador:", error)
    process.exit(1)
  }
}

quickCreateAdmin()
