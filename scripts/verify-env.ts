// Script para verificar que todas las variables de entorno requeridas estén configuradas

const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"] as const

const optionalEnvVars = [
  "DATABASE_URL_UNPOOLED",
  "WORDPRESS_API_URL",
  "WORDPRESS_USERNAME",
  "WORDPRESS_APP_PASSWORD",
] as const

console.log("🔍 Verificando variables de entorno...\n")

let hasErrors = false

// Verificar variables requeridas
console.log("📋 Variables Requeridas:")
for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Configurada`)
  } else {
    console.log(`❌ ${envVar}: FALTANTE`)
    hasErrors = true
  }
}

console.log("\n📋 Variables Opcionales:")
// Verificar variables opcionales
for (const envVar of optionalEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Configurada`)
  } else {
    console.log(`⚠️  ${envVar}: No configurada (opcional)`)
  }
}

console.log("\n")

if (hasErrors) {
  console.log("❌ Faltan variables de entorno requeridas.")
  console.log("   Por favor, configura las variables faltantes en tu archivo .env")
  console.log("   o en la configuración de Vercel (Settings → Environment Variables)")
  process.exit(1)
} else {
  console.log("✅ Todas las variables de entorno requeridas están configuradas.")

  // Validar JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET
  if (jwtSecret && jwtSecret.length < 32) {
    console.log("\n⚠️  ADVERTENCIA: JWT_SECRET debería tener al menos 32 caracteres para mayor seguridad")
  }

  // Validar DATABASE_URL
  const dbUrl = process.env.DATABASE_URL
  if (dbUrl && !dbUrl.includes("sslmode=require") && dbUrl.includes("neon.tech")) {
    console.log('\n⚠️  ADVERTENCIA: DATABASE_URL de Neon debería incluir "?sslmode=require"')
  }
}

console.log("\n✅ Verificación completada.\n")
