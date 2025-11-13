console.log("🔍 Verificando Configuración de Variables de Entorno\n")

// Check DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || process.env.real_estate_DATABASE_URL

if (!databaseUrl) {
  console.error("❌ DATABASE_URL no está configurada")
  console.log("   Necesitas agregar DATABASE_URL a tu archivo .env")
} else if (databaseUrl.includes("user:password@host") || databaseUrl.includes("localhost")) {
  console.error("⚠️  DATABASE_URL contiene valores placeholder o localhost")
  console.log(`   URL actual: ${databaseUrl}`)
  console.log("   Obtén la URL real desde: https://console.neon.tech")
} else {
  console.log("✅ DATABASE_URL configurada correctamente")
  // Parse and show connection details
  try {
    const url = new URL(databaseUrl)
    console.log(`   Host: ${url.hostname}`)
    console.log(`   Database: ${url.pathname.slice(1)}`)
    console.log(`   SSL: ${url.searchParams.get("sslmode") || "no especificado"}`)
  } catch (e) {
    console.log(`   URL: ${databaseUrl.substring(0, 50)}...`)
  }
}

console.log("")

// Check JWT_SECRET
const jwtSecret = process.env.JWT_SECRET
if (!jwtSecret) {
  console.error("❌ JWT_SECRET no está configurada")
} else if (jwtSecret === "dev-secret-key-change-in-production-98765") {
  console.warn("⚠️  JWT_SECRET usando valor por defecto (INSEGURO)")
  console.log("   Cambia esto en producción")
} else {
  console.log("✅ JWT_SECRET configurada")
}

console.log("")

// Check WordPress variables (optional)
const wpUrl = process.env.WORDPRESS_API_URL
const wpUser = process.env.WORDPRESS_USERNAME
const wpPass = process.env.WORDPRESS_APP_PASSWORD

if (wpUrl && wpUser && wpPass) {
  if (wpUrl.includes("tu-sitio")) {
    console.warn("⚠️  WordPress API contiene valores placeholder")
  } else {
    console.log("✅ WordPress API configurada")
  }
} else {
  console.log("ℹ️  WordPress API no configurada (opcional)")
}

console.log("\n" + "=".repeat(60))
console.log("\n📋 Pasos para configurar DATABASE_URL:\n")
console.log("1. Ve a https://console.neon.tech")
console.log("2. Selecciona tu proyecto 'real_estate'")
console.log("3. Ve a 'Connection Details'")
console.log("4. Copia la 'Connection string'")
console.log("5. Pégala en tu archivo .env como DATABASE_URL")
console.log("6. Asegúrate de agregar '?sslmode=require' al final\n")
