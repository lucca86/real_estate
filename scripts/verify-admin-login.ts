import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

async function verifyAdminLogin() {
  console.log("🔍 Verificando Credenciales de Administrador\n")

  const databaseUrl = process.env.DATABASE_URL || process.env.real_estate_DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ Error: DATABASE_URL no está configurada")
    console.log("\n💡 Configura la variable DATABASE_URL en tu archivo .env")
    console.log("   Obtén la URL desde: https://console.neon.tech")
    process.exit(1)
  }

  // Check if it's a placeholder
  if (databaseUrl.includes("user:password@host") || databaseUrl.includes("tu-sitio")) {
    console.error("❌ Error: DATABASE_URL contiene valores placeholder")
    console.log("\n💡 Debes reemplazar los valores placeholder con tu URL real de Neon")
    console.log("   Obtén la URL desde: https://console.neon.tech")
    console.log(`   URL actual: ${databaseUrl}`)
    process.exit(1)
  }

  console.log("✓ DATABASE_URL configurada correctamente\n")

  // Credenciales por defecto
  const testEmail = "admin@mahler.com"
  const testPassword = "Admin123!"

  try {
    const sql = neon(databaseUrl)

    console.log(`📧 Buscando usuario: ${testEmail}`)
    const users = await sql`
      SELECT 
        id, 
        email, 
        name, 
        password, 
        role, 
        "isActive",
        "twoFactorEnabled",
        "createdAt"
      FROM "User" 
      WHERE email = ${testEmail}
    `

    if (users.length === 0) {
      console.error(`\n❌ No existe un usuario con el email: ${testEmail}`)
      console.log("\n💡 Solución: Ejecuta 'npm run admin:create' para crear el administrador")
      process.exit(1)
    }

    const user = users[0]
    console.log("\n✓ Usuario encontrado:")
    console.log(`   ID: ${user.id}`)
    console.log(`   Nombre: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Rol: ${user.role}`)
    console.log(`   Activo: ${user.isActive ? "Sí" : "No"}`)
    console.log(`   2FA: ${user.twoFactorEnabled ? "Habilitado" : "Deshabilitado"}`)
    console.log(`   Creado: ${user.createdAt}`)

    if (!user.isActive) {
      console.error("\n⚠️  El usuario está INACTIVO")
      console.log("💡 Solución: Ejecuta 'npm run admin:reset' para activar el usuario")
      process.exit(1)
    }

    // Verificar contraseña
    console.log(`\n🔐 Verificando contraseña: ${testPassword}`)
    const passwordHash = user.password
    const isValid = await bcrypt.compare(testPassword, passwordHash)

    if (isValid) {
      console.log("\n✅ ¡CONTRASEÑA VÁLIDA! Las credenciales funcionan correctamente")
      console.log("\n📋 Credenciales de prueba:")
      console.log(`   Email: ${testEmail}`)
      console.log(`   Contraseña: ${testPassword}`)
    } else {
      console.error("\n❌ CONTRASEÑA INVÁLIDA")
      console.log("\n💡 Solución: Ejecuta 'npm run admin:reset' para resetear la contraseña")
      console.log(`   Usa las credenciales por defecto: ${testEmail} / ${testPassword}`)
    }
  } catch (error) {
    console.error("\n❌ Error al verificar credenciales:", error)
    process.exit(1)
  }
}

verifyAdminLogin()
