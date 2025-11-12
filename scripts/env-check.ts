import "dotenv/config"

console.log("\n🔍 Verificación de Variables de Entorno\n")
console.log("=".repeat(60))

const requiredVars = ["DATABASE_URL", "JWT_SECRET"]

const optionalVars = [
  "DATABASE_URL_UNPOOLED",
  "WORDPRESS_API_URL",
  "WORDPRESS_USERNAME",
  "WORDPRESS_APP_PASSWORD",
  "NEXT_PUBLIC_STACK_PROJECT_ID",
]

console.log("\n✅ Variables Requeridas:\n")
requiredVars.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    // Ocultar valores sensibles
    const maskedValue = value.length > 20 ? `${value.substring(0, 20)}...` : "***"
    console.log(`  ✓ ${varName}: ${maskedValue}`)
  } else {
    console.log(`  ✗ ${varName}: ❌ NO DEFINIDA`)
  }
})

console.log("\n📦 Variables Opcionales:\n")
optionalVars.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    const maskedValue = value.length > 20 ? `${value.substring(0, 20)}...` : "***"
    console.log(`  ✓ ${varName}: ${maskedValue}`)
  } else {
    console.log(`  ○ ${varName}: (no configurada)`)
  }
})

// Verificar conectividad con Neon
console.log("\n🗄️  Verificación de Conexión a Base de Datos:\n")

const dbUrl = process.env.DATABASE_URL
if (dbUrl) {
  try {
    const url = new URL(dbUrl)
    console.log(`  Host: ${url.hostname}`)
    console.log(`  Puerto: ${url.port || "5432"}`)
    console.log(`  Base de datos: ${url.pathname.substring(1)}`)
    console.log(`  SSL: ${url.searchParams.get("sslmode") || "no especificado"}`)
  } catch (error) {
    console.log(`  ❌ URL inválida: ${error instanceof Error ? error.message : "Error desconocido"}`)
  }
} else {
  console.log("  ❌ DATABASE_URL no está configurada")
}

console.log("\n" + "=".repeat(60))

// Resumen
const missingRequired = requiredVars.filter((v) => !process.env[v])
if (missingRequired.length > 0) {
  console.log("\n❌ FALTAN VARIABLES REQUERIDAS:")
  missingRequired.forEach((v) => console.log(`  - ${v}`))
  console.log("\n💡 Corre: npm run setup:local para configurarlas")
  process.exit(1)
} else {
  console.log("\n✅ Todas las variables requeridas están configuradas!")
  console.log("\n🚀 Siguiente paso: npm run dev")
}
